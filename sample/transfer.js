const Bloomio = require('../index.js');
const Q = require('q');
const bloomio = new Bloomio();
const promise_util = require("../src/promise_util.js");

const account = bloomio.Accounts.new(); //bloomio

console.log("===========account===========");
console.log(JSON.stringify(account.address));
console.log("===========/account===========");

bloomio.Init(bloomio.Accounts, 'http://localhost:8545');
Q.all([bloomio.Account.DeployP('fred', account.address),
       bloomio.Account.DeployP('edd', account.address), 
       bloomio.Account.DeployP('bank1', account.address),
       bloomio.Account.DeployP('bank2', account.address)])
  .spread((first, second, bank1, bank2)=>Q.all([Q(first), Q(second), Q(bank1), Q(bank2), bloomio.Trading.DeployP(bank2)]))
  .spread((first, second, bank1, bank2, trading)=>Q.all([
       Q(first), Q(second),
       bloomio.Token.DeployP(account.address, trading.Address(), 10000, bank1),
       bloomio.Coin.DeployP(account.address, trading.Address(), 20000, 1, 1, 1, 0, 100, bank1),
       Q(trading),
       Q(bank1), Q(bank2)
   ]))
  .spread(
    function(first, second, token, coin, trading, bank1, bank2) {
     console.log(`first.address=${first.Contract.address} second.address=${second.Contract.address}`);
     console.log(`bank1.address=${bank1.Contract.address} bank2.address=${bank2.Contract.address}`);
     console.log(`token.address=${token.Contract.address} coin.address=${coin.Contract.address}`);
     console.log(`trading.address=${trading.Contract.address}`);
     return DumplAllResources(token, coin, bank1, bank2, first, second)
         .then(()=>SpreadResources(bank1, token, coin, first, second))
         .then(()=>DumplAllResources(token, coin, bank1, bank2, first, second))
         .then(()=>DoTransfer(token, coin, first, second, trading, bank1))
         .then(()=>DumplAllResources(token, coin, bank1, bank2, first, second));
  }).done(()=>{console.log("finished")}, function(error) {console.log(`error:${error}`)});

function SpreadResources(bank, token, coin, first, second) {
    console.log("Spread resources...");
    return Q.all([SpreadResources2(bank, token, first), SpreadResources2(bank, coin, second)]);
}

function SpreadResources2(bank, token, first) {
    return token.TransferP(first.Address(), 1000)
        .then(()=>token.WaitForMoneyTransferP(bank.Address(), first.Address(), 1000));
}

function DumplAllResources(token, coin, bank1, bank2, first, second){
    return Q.all([DumpResouces(token, "token", bank1, bank2, first, second),
        DumpResouces(coin, "coin", bank1, bank2, first, second)]);
}

function DumpResouces(token, name, bank1, bank2, first, second) {
    console.log("====== Dump estates =======");
    const agents = [bank1, bank2, first, second];

    return Q.all(agents.map((agent)=>token.BalanceOfP(agent.Address())))
            .spread(function(bank1Balance, bank2Balance, firstBalance, secondBalance) {
                console.log(`${name} [${token.Address()}] balances...`);
                console.log(`bank1 [${bank1.Address()}] balance = ${bank1Balance}`);
                console.log(`bank2 [${bank2.Address()}] balance = ${bank2Balance}`);
                console.log(`first [${first.Address()}] balance = ${firstBalance}`);
                console.log(`second [${second.Address()}] balance = ${secondBalance}`);
                return Q(0);
            });
}

function DoTransfer(token, coin, first, second, trading, bank) {
  const tokenFirst = token.Impersonate(first);
  const coinSecond = coin.Impersonate(second);
  console.log("will Approve coins and tokens for trading...");
  return Q.all([tokenFirst.ApproveP(trading.Address(), 300), coinSecond.ApproveP(trading.Address(), 1000)])
          .then(()=>Q.all([token.WaitForMoneyAllowanceP(first.Address(), trading.Address(), 300), 
                           coin.WaitForMoneyAllowanceP(second.Address(), trading.Address(), 1000)]))
//  function transfer(Token _coins, Token _tokens, address _seller, address _buyer, address _bloomio, uint256 _tokensMoved, uint256 _price, uint256 _feeValue) onlyOwner returns (bool) {
          .then(()=>trading.TransferP(coin.Address(), token.Address(), first.Address(), second.Address(), bank.Address(), 200, 500, 100))
          .then((id)=>trading.Account.WaitForTransactionP(id));
}
