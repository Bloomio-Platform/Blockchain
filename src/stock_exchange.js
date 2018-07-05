const promise_util = require("./promise_util.js");
const contracts = require("./contracts.json");
const Q = require('q');
const util = require('util');

const _TradingContractCode        = "0x"+contracts.contracts.Trading.bin;
const _TradingContractAbi        = JSON.parse(contracts.contracts.Trading.abi);

function TradingLib(bloomio)
{
  this.Bloomio = bloomio;
  this.Log = function(text) { bloomio.Log(text);};
  this.Warn = function(text) { bloomio.Warn(text);};
  const libSelf = this;

  function Trading(account, contractAddress) {
    this.Contract = libSelf.Bloomio.eth.contract(Trading.Abi).at(contractAddress);
    this.Account = account;
    const self = this;

    this.Address = function(callback) {
      if (callback)
        callback(null, self.Contract.address);
      return self.Contract.address;
    };

    this.AddressP = promise_util.PromiseWrapper0.bind(self, self.Address, libSelf, "TradingLib.Trading.Address");
    //modifiers
    this.TransferP = account.MakeExecutePromise(self.Contract, self.Contract.transfer, "TradingLib.Trading.Transfer"); ///< param=Token _token, param=uint _tokens, param=uint _price, param=address _seller, param=address _buyer.
       // transfers value tokens from _seller to _buyer. paid fees.
  }

  bloomio.RegisterClass(libSelf, Trading, "Trading", _TradingContractCode, _TradingContractAbi);
}

module.exports = TradingLib;