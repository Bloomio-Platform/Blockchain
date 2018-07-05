const Bloomio = require('../index.js');
const Q = require('q');
const bloomio = new Bloomio();
const promise_util = require("../src/promise_util.js");

const account = bloomio.Accounts.new();
const account2 = bloomio.Accounts.new();
const account3 = bloomio.Accounts.new();
const account4 = bloomio.Accounts.new();

console.log("===========account===========");
console.log(JSON.stringify(account.address));
console.log("===========/account===========");
bloomio.Init(bloomio.Accounts, 'http://localhost:8545');

bloomio.MultiSigAccount.DeployP([account2.address, account3.address], 2, 'edd', account.address)
  .then(
    function(acc) {
     console.log(`acc.address=${acc.Contract.address}`);
     return ChangeOwnerSample(acc);
  }).done(
      ()=>{
          console.log("finished")},
          function(error) {
            console.log(`error:${error}\n${error.stack}`
          )});

function ChangeOwnerSample(acc) {
 return Q.all([acc.IsOwnerP(account.address), acc.IsOwnerP(account2.address), acc.IsOwnerP(account3.address), acc.IsOwnerP(account4.address)])
    .spread(function(r1, r2, r3, r4) {
      console.log(`${account.address}: ${r1}| ${account2.address}: ${r2}| ${account3.address}: ${r3}| ${account4.address}: ${r4}`);
      const acc2 = acc.Impersonate(account2.address);
      const acc3 = acc.Impersonate(account3.address);
      return Q.all([acc.ChangeOwnerP(account2.address, account4.address), acc2.ChangeOwnerP(account2.address, account4.address), acc3.ChangeOwnerP(account2.address, account4.address)])
    })
    .then(()=>acc.WaitForChangeOwningP(account2.address, account4.address))
    .then(function(){
      return Q.all([acc.IsOwnerP(account.address), acc.IsOwnerP(account2.address), acc.IsOwnerP(account3.address), acc.IsOwnerP(account4.address)])
    })
    .spread(function(r1, r2, r3, r4) {
      console.log(`${account.address}: ${r1}| ${account2.address}: ${r2}| ${account3.address}: ${r3}| ${account4.address}: ${r4}`);
      const acc2 = acc.Impersonate(account2);
      return Q();
    })
}
