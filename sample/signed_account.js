const Bloomio = require('../index.js');
const Q = require('q');
const bloomio = new Bloomio();
const promise_util = require("../src/promise_util.js");

const account = bloomio.Accounts.new();
const account2 = bloomio.Accounts.new();

console.log("===========account===========");
console.log(`account1 = ${account.address}`);
console.log(`account2 = ${account2.address}`);
console.log("===========/account===========");

bloomio.Init(bloomio.Accounts, 'http://127.0.0.1:8545');
bloomio.Account.DeployP(100, account.address)
  .then(function(account) {
    return account.SignP(account2.private)
      .delay(2000)
      .then(()=>account.GetSignerP())
  }).done(()=>console.log('finished'),(error)=>console.log(`error:${error}\n${error.stack}`));
