var util = require('util');
var Web3 = require('web3');

var HookedWeb3Provider = function(vote, host, signer, store) {
  this.vote = vote;
  this.host = host;
  this.signer = signer;
  this.global_nonces = {};
  vote.Receipts = store;
  vote.providers.HttpProvider.call(this, host);
};

util.inherits(HookedWeb3Provider, Web3.providers.HttpProvider);

HookedWeb3Provider.prototype.send = function(payload, callback) {
  var _this = this;
  var requests = (requests instanceof Array) ? payload : [payload];

  for (var request in requests) {
      if (request.method == "eth_sendTransaction")
        throw new Error("HookedWeb3Provider does not support synchronous transactions. Please provide a callback.");   
  }

  var finishedWithRewrite = function finishedWithRewrite() {
    return _this.vote.providers.HttpProvider.prototype.send.call(_this, payload, callback);
  };

  return this.rewritePayloads(0, requests, {}, finishedWithRewrite);
};

HookedWeb3Provider.prototype.sendAsync = function(payload, callback) {
  var _this2 = this;
  var requests = payload;

  if (!(payload instanceof Array)) {
    requests = [payload];
  }

  var finishedWithRewrite = function finishedWithRewrite() {
    function callbackwrapper(error, success)
    {
      if (requests[0].method == "eth_sendRawTransaction" && success != undefined) 
      {
        //console.log("Transaction: " + success.result); //todo: parametrise provider
        if (_this2.vote.Receipts instanceof Array)
          _this2.vote.Receipts.push(success.result);
      }
      callback(error, success); 
    }
    return _this2.vote.providers.HttpProvider.prototype.sendAsync.call(_this2, payload, callbackwrapper);
  };


  this.rewritePayloads(0, requests, {}, finishedWithRewrite);
};

HookedWeb3Provider.prototype.rewritePayloads = function (index, requests, session_nonces, finished) {
  var _this3 = this;

  if (index >= requests.length) {
    return finished();
  }

  var payload = requests[index];

  // Function to remove code duplication for going to the next payload
  var next = function(err) {
    if (err != null) { //jshint ignore:line
      return finished(err);
    }
    return _this3.rewritePayloads(index + 1, requests, session_nonces, finished);
  };
  // If this isn't a transaction we can modify, ignore it.
  if (payload.method != "eth_sendTransaction") {
    return next();
  }

  var getNonce = function getNonce(done) {
    var nonce = session_nonces[sender];
    if (nonce != null) { //jshint ignore:line
      done(null, nonce);
    } else {
      _this3.sendAsync({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [sender, "pending"],
        id: new Date().getTime()
      }, function (err, result) {
        if (err != null) { //jshint ignore:line
          done(err);
        } else {
          var new_nonce = result.result;
          done(null, _this3.vote.toDecimal(new_nonce));
        }
      });
    }
  };

  var tx_params = payload.params[0];
  var sender = tx_params.from;

  this.signer.async_has(sender, function(key, has_address) {
    if (!has_address) {
      var err;
      return next(err);
    }
    getNonce(function (err, nonce) {
      if (err != null) //jshint ignore:line
        return finished(err);

      var final_nonce = Math.max(nonce, _this3.global_nonces[sender] || 0);
      tx_params.nonce = _this3.vote.toHex(final_nonce);

      session_nonces[sender] = final_nonce + 1;
      _this3.global_nonces[sender] = final_nonce + 1;

      _this3.signer.signTransaction(tx_params, function (err, raw_tx) {
        if (err != null) //jshint ignore:line
          return next(err);

        payload.method = "eth_sendRawTransaction";
        payload.params = [raw_tx];
        return next();
      });
    });
  });
};

module.exports = HookedWeb3Provider;
