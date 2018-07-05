const Bloomio = require('../index.js');
const Q = require('q');
const bloomio = new Bloomio();
const promise_util = require("../src/promise_util.js");

const account = bloomio.Accounts.new();

console.log("===========account===========");
console.log(JSON.stringify(account.address));
console.log("===========/account===========");

bloomio.Init(bloomio.Accounts, 'http://localhost:8545');
bloomio.Token.DeployP(account.address, 0, 100, account.address)
  .then(function(token) {
    console.log(`token.address=${token.Contract.address}`);
    return token.TotalSupplyP().then((supply)=>{console.log(`supply=${supply}`)})
  }).done(()=>{console.log("finished")}, function(error) {console.log(`error:${error}`)});
