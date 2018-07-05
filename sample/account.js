const Bloomio = require('../index.js');
const Q = require('q');
const bloomio = new Bloomio();
const promise_util = require("../src/promise_util.js");

const account = bloomio.Accounts.new();

console.log("===========account===========");
console.log(JSON.stringify(account.address));
console.log("===========/account===========");

bloomio.Init(bloomio.Accounts, 'http://127.0.0.1:8545');
bloomio.Account.DeployP(100, account.address)
  .then((value)=>(console.log(value.Contract.address)));
