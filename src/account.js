const promise_util = require("./promise_util.js");
const contracts = require("./contracts.json");
const Q = require('q');
const util = require('util');
const bi = require('big-integer');
const ethUtil = require('ethereumjs-util');

const _AccountContractCode        = "0x"+contracts.contracts.Account.bin;
const _AccountContractAbi        = JSON.parse(contracts.contracts.Account.abi);

const _WalletContractCode        = "0x"+contracts.contracts.Wallet.bin;
const _WalletContractAbi        = JSON.parse(contracts.contracts.Wallet.abi);

function AccountLib(bloomio) {
  this.Bloomio = bloomio;
  this.Log = function(text) {bloomio.Log(text);};
  this.Warn = function(text) {bloomio.Warn(text);};
  const libSelf = this;

  function AcountBase() {
    const self = this;
    function getproxy() {
      return self.get.apply(self, arguments);
    }

    function executeproxy() {
      return self.execute.apply(self, arguments);
    }

    this.MakeGetPromise = function(contract, func, logstr) {      
       return promise_util.PromiseWrapperN.bind(self, getproxy.bind(self, contract, func), libSelf, logstr);
    };

    this.MakeExecutePromise = function(contract, func, logstr) {      
       return promise_util.PromiseWrapperN.bind(self, executeproxy.bind(self, contract, func), libSelf, logstr);
    };
  }
  
  function SimpleAccount(account) {
    SimpleAccount.super_.call(this);
    const self = this;
    this.Account = account;

    this.Address = function(callback) {
      if (callback)
        callback(null, self.Account.address);
      return self.Account;
    };

    //contract, method, params..., callback
    this.get = this.execute = function() {
        const contract = arguments[0];
        const method = arguments[1];
        const containsParam =  arguments.length > 3 && typeof arguments[arguments.length-2] === 'object';
        const args = Array.prototype.slice.call(arguments, 2, -(containsParam?2:1))
            .concat(containsParam? arguments[arguments.length - 2]:{},arguments[arguments.length - 1]);
        const param = args[args.length-2];
        param['from'] = self.Account; //jshint ignore:line
        method.apply(contract, args);    };
  }

  function Account(account, contractAddress) {
    Account.super_.call(this);
    this.Contract = libSelf.Bloomio.eth.contract(Account.Abi).at(contractAddress);
    this.Account = (account.Address == undefined) ? account : account.Address();
    
    const self = this;

    this.Address = function(callback) {
      if (callback)
        callback(null, self.Contract.address);
      return self.Contract.address;
    };

    function WaitForTransaction(id, callback) {
      const account =self.Account;
      libSelf.Log(`Wait for [${account}, ${id.toString()}] in contract.`);
      function Process(error, result) {
        if (error !== null) {
          libSelf.Warn(`Cathing contract failed. [${error}]`);
          event.stopWatching(()=>{});
          clearTimeout(timerId);
          callback(error);
        }
        else {
          libSelf.Log(`Catched [${account}, ${id.toString()}] in contract. ${JSON.stringify(result.args)}`);
          if (result === undefined || !(['args'] in result) || (result.args.owner != account) || !id.eq(result.args.id.toString()))
            return;
          event.stopWatching(()=>{});
          clearTimeout(timerId);
          callback(undefined, result.args.created);
        }
      }
  
      const event = self.Contract.SingleTransact(Process);
      const timerId = setTimeout(
        function () {
          event.stopWatching((e,s)=>{});
          libSelf.Warn("timeout!");
          callback(1);
        },
        5000);
    }

    this.WaitForTransaction = WaitForTransaction;
    
    //contract, method, params..., callback
    this.get = function() {
      const contract = arguments[0];
      const method = arguments[1];
      const containsParam =  arguments.length > 3 && typeof arguments[arguments.length-2] === 'object';
      const args = Array.prototype.slice.call(arguments, 2, -(containsParam?2:1))
          .concat(containsParam? arguments[arguments.length - 2]:{},arguments[arguments.length - 1]);
      const param = args[args.length-2];
      param['from'] = self.Contract.address; //jshint ignore:line
      method.apply(contract, args);
    };

    //contract, method, params..., callback
    this.execute = function() {
      const contract = arguments[0];
      const method = arguments[1];
      const callback = arguments[arguments.length - 1];
      const containsParam =  arguments.length > 3 && typeof arguments[arguments.length-2] === 'object';
      const args = Array.prototype.slice.call(arguments, 2, -(containsParam?2:1))
          .concat(containsParam? arguments[arguments.length - 2]:{} );
      const param = args[args.length-1];
      param['from'] = self.Account; //jshint ignore:line
      if (!('gas' in param))
        param.gas = 3482824;

      const data = method.getData.apply(method, args);
      const id = bi.randBetween(0, new bi("2").pow(52));
      let contractAddress = contract.address;
      if (contractAddress == undefined || contractAddress == 0) { //jshint ignore:line
        WaitForTransaction(id, function(error, success) { callback(error, {address:success}); });
        contractAddress = 0;
      }
      self.Contract.execute(contractAddress, 0, data, "0x"+id.toString(16), param, function(error, success) {
        if (success !== undefined) {
          if (callback !== undefined) {
            if (contractAddress != 0) //jshint ignore:line
              callback(error, id);
          }
        } else {
          if (error !== null) {
            callback(error);
          }
        }
      });
    };

    this.Sign = function(privateKey, callback) {
      const data = Buffer.from(ethUtil.stripHexPrefix(self.Contract.address), 'hex');
      const hash = ethUtil.sha3(data);
      const sig = ethUtil.ecsign(hash, Buffer.from(ethUtil.stripHexPrefix(privateKey), 'hex'));
      libSelf.Log(`sig: ${sig.v} 0x${sig.r.toString("hex")} 0x${sig.s.toString("hex")}`);
      self.Contract.Sign(sig.v, "0x"+sig.r.toString('hex'), "0x"+sig.s.toString('hex'), {gas: 200000, from:self.Account}, function(error, success) {
          if (callback !== undefined)
            callback(error, success);
        }
      );
    };
     
    this.SignP = promise_util.PromiseWrapperN.bind(self, self.Sign, libSelf, "Account.Account.Sign");
    this.GetSignerP = promise_util.PromiseWrapper0.bind(self.Contract, self.Contract.GetSigner, libSelf, "Account.Account.GetSigner");
    this.GetSignatureP = promise_util.PromiseWrapper0.bind(self.Contract, self.Contract.GetSignature, libSelf, "Account.Account.GetSignature");
    this.GetP = promise_util.PromiseWrapper0.bind(self.Contract, self.Contract.get, libSelf, "Account.Account.Get");
    this.GetSignatureP = promise_util.PromiseWrapper0.bind(self.Contract, self.Contract.GetSignature, libSelf, "Account.Account.GetSignature");
    this.WaitForTransactionP = promise_util.PromiseWrapperN.bind(self, self.WaitForTransaction, libSelf, "Account.Account.WaitForTransaction");
    this.AddressP = promise_util.PromiseWrapper0.bind(self, self.Address, libSelf, "Account.Account.Address");
  } //Alias


  function MultiSigAccount(account, contractAddress) {
    MultiSigAccount.super_.call(this);
    this.Contract = libSelf.Bloomio.eth.contract(MultiSigAccount.Abi).at(contractAddress);
    this.Account = (account.Address == undefined) ? account : account.Address();
    
    const self = this;

    this.Address = function(callback) {
      if (callback)
        callback(null, self.Contract.address);
      return self.Contract.address;
    };

    
    //contract, method, params..., callback
    this.get = function() {
      const contract = arguments[0];
      const method = arguments[1];
      const containsParam =  arguments.length > 3 && typeof arguments[arguments.length-2] === 'object';
      const args = Array.prototype.slice.call(arguments, 2, -(containsParam?2:1))
          .concat(containsParam? arguments[arguments.length - 2]:{},arguments[arguments.length - 1]);
      const param = args[args.length-2];
      param['from'] = self.Contract.address; //jshint ignore:line
      method.apply(contract, args);
    };

    function WaitForConfirmationCode(id, callback) {
      const account = self.Account;
      libSelf.Log(`Wait for confirmation code [${account}, ${id.toString()}] in contract.`);
      function Process(error, result) {
        if (error !== null) {
          libSelf.Warn(`Cathing contract failed. [${error}]`);
          event.stopWatching((e,s)=>{});
          clearTimeout(timerId);
          callback(error);
        }
        else {
          libSelf.Log(`Catched confirmation code [${account}, ${id.toString()}] in contract. ${JSON.stringify(result.args)}`);
          if (result === undefined || !(['args'] in result) || (result.args.initiator != account) || !id.eq(result.args.id.toString()))
            return;
          event.stopWatching((e,s)=>{});
          clearTimeout(timerId);
          callback(undefined, result.args.operation);
        }
      }
  
      const event = self.Contract.ConfirmationNeeded(Process);
      const timerId = setTimeout(
        function () {
          event.stopWatching((e,s)=>{});
          libSelf.Warn("timeout!");
          callback(1);
        },
        5000);
    }

    function WaitForChangeOwning(from, to, callback) {
      const account = self.Account;
      libSelf.Log(`Wait for change owning [${account}, from: ${from}, to: ${to}] in contract.`);
      function Process(error, result) {
        if (error !== null) {
          libSelf.Warn(`Catching contract failed. [${error}]`);
          event.stopWatching((e,s)=>{});
          clearTimeout(timerId);
          callback(error);
        }
        else {
          libSelf.Log(`Catched change owning [${account}, from: ${from}, to: ${to}] in contract. ${JSON.stringify(result.args)}`);
          if (result === undefined || !(['args'] in result) || (from.toString() != result.args.oldOwner) || (to.toString() != result.args.newOwner))
            return;
          event.stopWatching((e,s)=>{});
          clearTimeout(timerId);
          callback(undefined, result.args.operation);
        }
      }
  
      const event = self.Contract.OwnerChanged(Process);
      const timerId = setTimeout(
        function () {
          event.stopWatching((e,s)=>{});
          libSelf.Warn("timeout!");
          callback(1);
        },
        5000);
    }

    this.WaitForConfirmationCode = WaitForConfirmationCode;
    this.WaitForChangeOwning = WaitForChangeOwning;

    //contract, method, params..., callback
    this.execute = function() {
      const contract = arguments[0];
      const method = arguments[1];
      const callback = arguments[arguments.length - 1];
      const containsParam =  arguments.length > 3 && typeof arguments[arguments.length-2] === 'object';
      const args = Array.prototype.slice.call(arguments, 2, -(containsParam?2:1))
          .concat(containsParam? arguments[arguments.length - 2]:{} );
      const param = {};
      Object.assign(param, args[args.length-1]);
      param.from = self.Account; //jshint ignore:line
      if (!('gas' in param))
        param.gas = 1000000;

      const data = method.getData.apply(method, args);
      const id = bi.randBetween(0, new bi("2").pow(52));
      let contractAddress = contract.address;
      if (contractAddress == undefined || contractAddress == 0) { //jshint ignore:line
        WaitForTransaction(id, function(error, success) { callback(error, {address:success}); });
        contractAddress = 0;
      }
      self.Contract.execute(contractAddress, 0, data, "0x"+id.toString(16), param, function(error, success) {
        if (success !== undefined) {
          if (callback !== undefined) {
            if (contractAddress != 0) //jshint ignore:line
              callback(error, id);
          }
        } else {
          if (error !== null) {
            callback(error);
          }
        }
      });
    };

    this.ChangeOwner = function (from, to, callback) {
      const params = {gas:1000000, from:self.Account};
      self.Contract.changeOwner(from, to, params, function(error, success) {
          if (callback !== undefined) {
            callback(error, success);   
          }
      });
    };

    this.IsOwner = function(from, callback) {
      return self.Contract.isOwner(from, {from:self.Account}, callback);
    };

    this.Confirm = function(operation, callback) {
      self.Contract.confirm2(operation, {from: self.Account, gas: 159200}, function(error, success) {
        if (success !== undefined) {
          if (callback !== undefined) {
              callback(error, 0);
          }
        } else {
          if (error !== null) {
            callback(error);
          }
        }
      });
    };


    this.Sign = function(privateKey, callback) {
      const data = Buffer.from(ethUtil.stripHexPrefix(self.Contract.address), 'hex');
      const hash = ethUtil.sha3(data);
      const sig = ethUtil.ecsign(hash, Buffer.from(ethUtil.stripHexPrefix(privateKey), 'hex'));
      libSelf.Log(`sig: ${sig.v} 0x${sig.r.toString("hex")} 0x${sig.s.toString("hex")}`);
      self.Contract.Sign(sig.v, "0x"+sig.r.toString('hex'), "0x"+sig.s.toString('hex'), {gas: 200000, from:self.Account}, function(error, success) {
          if (callback !== undefined)
            callback(error, success);
        }
      );
    };
     
    this.SignP = promise_util.PromiseWrapperN.bind(self, self.Sign, libSelf, "Account.MultiSigAccount.Sign");
    this.GetSignerP = promise_util.PromiseWrapper0.bind(self.Contract, self.Contract.GetSigner, libSelf, "Account.MultiSigAccount.GetSigner");
    this.GetSignatureP = promise_util.PromiseWrapper0.bind(self.Contract, self.Contract.GetSignature, libSelf, "Account.MultiSigAccount.GetSignature");

    this.GetP = promise_util.PromiseWrapper0.bind(self.Contract, self.Contract.get, libSelf, "Account.MultiSigAccount.Get");
    this.IsOwnerP = promise_util.PromiseWrapperN.bind(self, self.IsOwner, libSelf, "Account.MultiSigAccount.isOwner");
    this.ChangeOwnerP = promise_util.PromiseWrapperN.bind(self, self.ChangeOwner, libSelf, "Account.MultiSigAccount.ChangeOwner");
    this.WaitForConfirmationCodeP = promise_util.PromiseWrapperN.bind(self, self.WaitForConfirmationCode, libSelf, "Account.Account.WaitForConfirmationCode");
    this.WaitForChangeOwningP = promise_util.PromiseWrapperN.bind(self, self.WaitForChangeOwning, libSelf, "Account.Account.WaitForChangeOwning");
    this.ConfirmP = promise_util.PromiseWrapperN.bind(self, self.Confirm, libSelf, "Account.Account.Confirm");
    this.AddressP = promise_util.PromiseWrapper0.bind(self, self.Address, libSelf, "Account.MultiSigAccount.Address");
  } //Alias


  util.inherits(Account, AcountBase);
  util.inherits(SimpleAccount, AcountBase);
  util.inherits(MultiSigAccount, AcountBase);

  bloomio.RegisterClass(libSelf, Account, "Account", _AccountContractCode, _AccountContractAbi);
  bloomio.RegisterClass(libSelf, MultiSigAccount, "MultiSigAccount", _WalletContractCode, _WalletContractAbi);

  SimpleAccount.New = function(account) { return new SimpleAccount(account); };
  bloomio.SimpleAccount = SimpleAccount;
}

module.exports = AccountLib;