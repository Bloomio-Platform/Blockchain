const promise_util = require("./promise_util.js");
const contracts = require("./contracts.json");
const Q = require('q');
const util = require('util');

const _BloomioTokenContractCode        = "0x"+contracts.contracts.BloomioToken.bin;
const _BloomioTokenContractAbi        = JSON.parse(contracts.contracts.BloomioToken.abi);

const _BloomioCoinContractCode        = "0x"+contracts.contracts.BloomioCoin.bin;
const _BloomioCoinContractAbi        = JSON.parse(contracts.contracts.BloomioCoin.abi);

function TokenLib(bloomio)
{
  this.Bloomio = bloomio;
  this.Log = function(text) {bloomio.Log(text);};
  this.Warn = function(text) {bloomio.Warn(text);};
  const libSelf = this;

  function TokenBase(account, contractAddress, abi) {
    this.Contract = libSelf.Bloomio.eth.contract(abi).at(contractAddress);
    this.Account = account;
    const self = this;

    this.Address = function(callback) {
      if (callback)
        callback(null, self.Contract.address);
      return self.Contract.address;
    };

    function WaitForMoneyTransfer(contract, from, to, value) { //assume that contract contains StateChanged event. TODO: choose event name explicitly
        const def = Q.defer();
        libSelf.Log("Wait for transfer anounce");
        function Process(error, result) {
            if (error !== null) {
                libSelf.Warn(`Cathing Transfer failed. [${error}]`);
                event.stopWatching(()=>{});
                clearTimeout(timerId);
                def.reject(error);
            }
            else {
                libSelf.Log(`Catched [${from}, ${to}, ${value}] in contract. received state: ${JSON.stringify(result)}`);
                if (result === undefined || !(['args'] in result) || (result.args._from != from) || (result.args._to != to)|| (result.args._value != value))  //jshint ignore:line
                    return;
                event.stopWatching((e,s)=>{});
                clearTimeout(timerId);
                def.resolve(result.args);
            }
        }

        const event = contract.Transfer(Process);
        const timerId = setTimeout(
            function () {
                event.stopWatching(()=>{});
                def.resolve();
                libSelf.Log("Wait Transfer canceled by timeout");
            },
            2000);
        return def.promise;
    }

    function WaitForMoneyAllowance(contract, owner, spender, value) { //assume that contract contains StateChanged event. TODO: choose event name explicitly
        const def = Q.defer();
        libSelf.Log("Wait for Approve anounce");
        function Process(error, result) {
            if (error !== null) {
                libSelf.Warn(`Cathing Approve failed. [${error}]`);
                event.stopWatching(()=>{});
                clearTimeout(timerId);
                def.reject(error);
            }
            else {
                libSelf.Log(`Catched [${owner}, ${spender}, ${value}] in contract. received state: ${JSON.stringify(result)}`);
                if (result === undefined || !(['args'] in result) || (result.args._owner != owner) || (result.args._spender != spender)|| (result.args._value != value))  //jshint ignore:line
                    return;
                event.stopWatching(()=>{});
                clearTimeout(timerId);
                def.resolve(result.args);
            }
        }

        const event = contract.Approval(Process);
        const timerId = setTimeout(
            function () {
                event.stopWatching(()=>{});
                def.resolve();
                libSelf.Log("Wait Approve canceled by timeout");
            },
            2000);
        return def.promise;
    }


    this.WaitForMoneyTransferP = function(from, to, value) {
        return WaitForMoneyTransfer(self.Contract, from, to, value);//<param=from, param=to, param=value wait for money from to value transferred.
    };

    this.WaitForMoneyAllowanceP = function(owner, spender, value) {
        return WaitForMoneyAllowance(self.Contract, owner, spender, value);//<param=from, param=to, param=value wait for money from to value transferred.
    };
      //getters
    this.AddressP = promise_util.PromiseWrapper0.bind(self, self.Address, libSelf, "TokenLib.TokenBase.Address");
    this.TotalSupplyP = account.MakeGetPromise(self.Contract, self.Contract.totalSupply, "TokenLib.TokenBase.totalSupply"); ///< no params. returns total supply of token
    this.BalanceOfP = account.MakeGetPromise(self.Contract, self.Contract.balanceOf, "TokenLib.TokenBase.BalanceOf");  ///< param=account. returns balance of account
    this.AllowanceP = account.MakeGetPromise(self.Contract, self.Contract.allowance, "TokenLib.TokenBase.Allowance");  ///< param=owner, patam=spender. returns Amount of remaining tokens allowed to spent
    //modifiers
    this.TransferP = account.MakeExecutePromise(self.Contract, self.Contract.transfer, "TokenLib.TokenBase.Transfer"); ///< param=target, param=value. transfers value tokens from owner to target
    this.TransferFromP = account.MakeExecutePromise(self.Contract, self.Contract.transferFrom, "TokenLib.TokenBase.TransferFrom"); ///< param=source, param=target, param=value. transfers value tokens from source to target if its approved
    this.ApproveP = account.MakeExecutePromise(self.Contract, self.Contract.approve, "TokenLib.TokenBase.Approve"); ///< param=spender,  param=value. approve value tokens to transfer from owner to target
  }

  function Token(account, contractAddress) {
     Token.super_.call(this, account, contractAddress, Token.Abi);
  }

  function Coin(account, contractAddress) {
     Coin.super_.call(this, account, contractAddress, Coin.Abi);
     this.setFeeP = account.MakeExecutePromise(this.Contract, this.Contract.setFee, "TokenLib.Coin.setFee"); ///< param=target, param=value. transfers value tokens from owner to target
  }

  util.inherits(Token, TokenBase);
  util.inherits(Coin, TokenBase);
  
  bloomio.RegisterClass(libSelf, Token, "Token", _BloomioTokenContractCode, _BloomioTokenContractAbi);
  bloomio.RegisterClass(libSelf, Coin, "Coin", _BloomioCoinContractCode, _BloomioCoinContractAbi);  
}

module.exports = TokenLib;