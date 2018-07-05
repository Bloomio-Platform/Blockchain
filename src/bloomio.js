const util = require('util');
const Q = require('q');
const BI = require('big-integer');
const Web3 = require('web3');

const accountProvider = require('./wallet.js');
const accountHookedProvider = require('./accounts-provider.js');
const promise_util = require("./promise_util.js");
const AccountLib = require("./account.js");
const TokenLib = require("./token.js");
const StockExchangeLib = require("./stock_exchange.js");

function Bloolio() {
  let __provider;
  Web3.call(this, __provider);

  const libSelf = this;

  function FactoryDeploy(class_, args, account, callback) {
    const caller = (account.execute !== undefined) ? account : libSelf.SimpleAccount.New(account);
    const contractFactory = libSelf.eth.contract(class_.Abi);
    function factoryCallback(error, contract) {
      if (contract !== undefined && contract.address !== undefined) {
        libSelf.Log(`${class_.Name}FactoryDeploy.callback [${contract.address}] ( error = ${error})`);
        if (callback !== undefined)
        {
          callback(error, class_.New(caller, contract.address));
        }
      } else {
        if (error !== null) {
          libSelf.Log(`${class_.Name}FactoryDeploy.callback  ( error = ${error})`);
          callback(error);
        }
      }
    }
    //caller.execute(contractFactory, contractFactory.new, value, { data: class_.Code, gas:  3482824}, factoryCallback);
    let valueCopy = [].concat(contractFactory)
                      .concat(contractFactory.new)
                      .concat(Array.prototype.slice.call(args))
                      .concat({ data: class_.Code, gas:  3482824})
                      .concat(factoryCallback);
    caller.execute.apply(caller, valueCopy);
  } //FactoryDeploy

  function RegisterClass(lib, class_, name, code, abi) {
    function factory_() {
      
      const args = Array.prototype.slice.call(arguments, 0, -2);
      const account = arguments[arguments.length - 2];
      const callback = arguments[arguments.length - 1];
      return FactoryDeploy(class_, args, account, callback);
    }
    class_.DeployP = promise_util.PromiseWrapperN.bind(lib, factory_, lib, `Bloolio.${name}.Deploy`);
    class_.Abi = abi;
    class_.Code = code;
    class_.Name = name;
    class_.prototype.Impersonate = function(account) { return class_.New(account, this.Address());};
    class_.New = function(account, address) {return new class_(account, address);};
    libSelf[name] = class_;
  }
  
  this.RegisterClass = RegisterClass;

  this.Accounts = new accountProvider(this);

  this.Log = function(text) {console.log(text);};
  this.Warn = function(text) {console.warn(text);};

  this.promise_util = promise_util;
  this.Q = Q;

  AccountLib(this);
  TokenLib(this);
  StockExchangeLib(this);
}

util.inherits(Bloolio, Web3);

Bloolio.prototype.Init = function(account, host, store) {
  var provider = new accountHookedProvider(this, host, account, store);
  Web3.prototype.setProvider.call(this, provider);
};

module.exports = Bloolio;
