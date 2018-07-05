const Bloomio = require('../index.js');
const Q = require('q');
const bloomio = new Bloomio();
const promise_util = require("../src/promise_util.js");

const account = bloomio.Accounts.new();
const account2 = bloomio.Accounts.new();

console.log("===========account===========");
console.log(JSON.stringify(account.address));
console.log("===========/account===========");
let arr = [];
let gasPrice = 1000000000;
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

Q.all([bloomio.Account.DeployP('fred', account.address), bloomio.MultiSigAccount.DeployP([account2.address], 2, 'edd', account.address), bloomio.Account.DeployP('leo', account.address)])
  .spread(
    function(first, second, third) {
     console.log(`first.address=${first.Contract.address} second.address=${second.Contract.address}`);
     return TokenTest(first, second, third);
  }).done(()=>{InspectGas();console.log("finished")}
    , function(error) {console.log(`error:${error}`)});

function TokenTest(first, second, third) {
 return bloomio.Token.DeployP(account.address, 0, 100, first)
    .then(function(token) {
      console.log(`token.address=${token.Contract.address}`);
      const token2 = token.Impersonate(second);
      const second2 = bloomio.MultiSigAccount.New(account2.address, second.Address());
      return token.TransferP(second.Address(), 30)
          .then(()=>token.WaitForMoneyTransferP(first.Address(), second.Address(), 30))
          .then(()=>token2.TransferP(third.Address(), 10))  
          .then((id)=>second.WaitForConfirmationCodeP(id))
          .then((operation)=>second2.ConfirmP(operation))
          .then(()=>token.WaitForMoneyTransferP(second.Address(), third.Address(), 10))
          .then(()=>Q.all([token.TotalSupplyP(), token.BalanceOfP(first.Address()), token.BalanceOfP(second.Address()), token.BalanceOfP(third.Address())]))
          .spread((supply, balanceof1, balanceof2, balanceof3)=>{console.log(`supply=${supply} balanceof[${first.Address()}]=${balanceof1} balanceof[${second.Address()}]=${balanceof2} balanceof[${third.Address()}]=${balanceof3}`);return Q();});
    });
}
