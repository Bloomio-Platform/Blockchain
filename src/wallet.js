var Tx = require('ethereumjs-tx');
var BigNumber = require('bignumber.js');
var ethUtil = require("ethereumjs-util");

function DictStorage() {
  this.Storage = {};
  var self = this;
  this.set = function(key, value) {
    self.Storage[key] = value;
  };
  this.get = function(key) {
    return self.Storage[key];
  };
  
  this.async_get = function(key, callback) {
    callback(key, self.Storage[key]);
  };

  this.has = function(key) {
    return self.Storage[key] !== undefined;
  };

  this.async_has = function(key, callback) {
    callback(key, self.Storage[key] !== undefined);
  };

}

var Accounts = module.exports = function(web3) {
  var self = this;
  this.Storage = new DictStorage();
  this.web3 = web3;
};

function formatHex(str){
    return String(str).length % 2 ? '0' + String(str) : String(str);
}

function formatAddress(addr){
    if(addr.substr(0, 2) != '0x')
        addr = '0x' + addr;
    return addr;
}

var randomBytes = function(length) {
    var charset = "abcdef0123456789";
    var result = "";
    for(var i=0; i<length; i++) {
          result += charset[Math.floor(Math.random()*charset.length)];
    }
    return result;
};

Accounts.prototype.setStorage = function(objectstorage){
  this.Storage = objectstorage;
};

Accounts.prototype.new = function(_private){
    var __private = (_private === undefined) ? ("0x"+(new Buffer(randomBytes(64), 'hex')).toString('hex')) : _private;
    var _public = ethUtil.privateToPublic(__private);
    var address = formatAddress(ethUtil.publicToAddress(_public).toString('hex'));
    var accountObject = {
        address: address,
        hash: ethUtil.sha3(_public.toString('hex') + __private.toString('hex')).toString('hex'),
        private: __private,
        public: _public.toString('hex')
    };
    this.Storage.set(address, accountObject);
    return accountObject;
};

Accounts.prototype.get = function(address) {
    return this.Storage.get(address);
};

Accounts.prototype.get = function(address) {
    return this.Storage.get(address);
};

Accounts.prototype.has = function(address) {
    return this.Storage.has(address);
};

Accounts.prototype.async_get = function(address, callback) {
    this.Storage.async_get(address, callback);
};

Accounts.prototype.async_has = function(address, callback) {
    this.Storage.async_has(address, callback);
};

Accounts.prototype.signTransaction = function(tx_params, callback) {
    // Accounts instance
    var accounts = this;
    accounts.async_get(tx_params.from, function(key, account) {
      if (account === undefined)
      {
        throw new Error("Cannot sign transaction; from address not found in accounts list.");
      }

      var rawTx = {
        nonce: +tx_params.nonce,
        gasLimit: 3482824,
        value: 0,
        data: '',
        gasPrice: 0
      };

      if(tx_params.gas !== null)
        rawTx.gasLimit = (+tx_params.gas);

      if(tx_params.to !== undefined)
          rawTx.to = tx_params.to;

      if(tx_params.value !== undefined)
          rawTx.value = tx_params.value;

      if(tx_params.data !== null)
          rawTx.data = tx_params.data;

      var privateKey = new Buffer(ethUtil.stripHexPrefix(account.private), 'hex');

      function signTx(err) {
          var tx = new Tx(rawTx);
          tx.sign(privateKey);
          var serializedTx = '0x' + tx.serialize().toString('hex');
          callback(err, serializedTx);
      }

      signTx(null);
 });
};
