const Bloomio = require('../index.js');
const bloomio = new Bloomio();
function GenTestRpcAccount(acc) {
   return {balance:"1606938044258990275541962092341162602522202993782792835301376", secretKey:acc.private};
}
const acc1 = bloomio.Accounts.new();
const acc2 = bloomio.Accounts.new();
const TestRPC = require("ethereumjs-testrpc");
bloomio.setProvider(TestRPC.provider({'accounts':[GenTestRpcAccount(acc1), GenTestRpcAccount(acc2)], "debug":1, 'unlocked_accounts':[acc1.address, acc2.address]}));

bloomio.Account.DeployP(100, acc1.address)
  .then(function(value) {

       console.log('finished');
       finish();
   }
   ,function(error) {
    console.log('failed:' + error);
   });
