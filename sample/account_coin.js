const Bloomio = require('../index.js');
const Q = require('q');
const bloomio = new Bloomio();
const promise_util = require("../src/promise_util.js");

const account = bloomio.Accounts.new();

console.log("===========account===========");
console.log(JSON.stringify(account.address));
console.log("===========/account===========");



let gasPrice = 100000000000;
let arr = [];
function InspectGas()
{
  let sum = 0;
  for (let i =0; i < arr.length;++i) {
          const receipt = bloomio.Receipts[i];
          var used = bloomio.eth.getTransactionReceipt(receipt).gasUsed;
          const ethers = bloomio.fromWei(used*gasPrice);
          console.log("Spending ethers ["+receipt+"]: " + ethers + " ["+used+"]");
          sum+=used;
  }
  const ethers = bloomio.fromWei(sum*gasPrice);
  console.log("Total spent: "+ ethers + " ["+sum + "]");
}
bloomio.Init(bloomio.Accounts, 'http://localhost:8545', arr);

Q.all([bloomio.Account.DeployP('fred', account.address), bloomio.Account.DeployP('edd', account.address)])
  .spread(
    function(first, second) {
     console.log(`first.address=${first.Contract.address} second.address=${second.Contract.address}`);
     return TokenTest(first, second);
  }).done(()=>{InspectGas();console.log("finished")}, function(error) {console.log(`error:${error}`)});

function TokenTest(first, second) {
 return bloomio.Token.DeployP(account.address, 0, 100, first)
    .then(function(token) {
      console.log(`token.address=${token.Contract.address}`);
      return token.TransferP(second.Address(), 30)
          .then(()=>token.WaitForMoneyTransferP(first.Address(), second.Address(), 30))
          .then(()=>Q.all([token.TotalSupplyP(), token.BalanceOfP(first.Address()), token.BalanceOfP(second.Address())]))
          .spread((supply, balanceof1, balanceof2)=>{console.log(`supply=${supply} balanceof[${first.Address()}]=${balanceof1} balanceof[${second.Address()}]=${balanceof2}`);return Q();});
    });
}