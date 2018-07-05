describe('server', function() {
  const chai = require('chai');
  const assert = chai.assert;
  const expect = chai.expect;
  const should = chai.should(); // all w/o braces but should with braces

  const Bloomio = require('../index.js');
  const bloomio = new Bloomio();
  bloomio.Log = function(text) {}
  bloomio.Warn = function(text) {}
  function GenTestRpcAccount(acc) {
     return {balance:"1606938044258990275541962092341162602522202993782792835301376", secretKey:acc.private};
  }
  const acc1 = bloomio.Accounts.new();
  const acc2 = bloomio.Accounts.new();
  const acc3 = bloomio.Accounts.new();
  const TestRPC = require("ethereumjs-testrpc");
  bloomio.setProvider(TestRPC.provider({'accounts':[GenTestRpcAccount(acc1), GenTestRpcAccount(acc2), GenTestRpcAccount(acc3)], "debug":1, 'unlocked_accounts':[acc1.address, acc2.address]}));

  it ('check_simple_account_creation', function (finish) {
    this.timeout(20000);
    this.slow(10000);
    bloomio.Account.DeployP("fred", acc1.address)
      .done(function(value) {
           assert(typeof value === 'object', "error on deploy!");
           finish();
       }
       ,function(error) {
            assert(error == null, "error on deploy!");finish();
       });
  });

  it ('check_token_creation', function (finish) {
    this.timeout(20000);
    this.slow(10000);
    bloomio.Token.DeployP(100, acc1.address)
      .done(function(value) {
           assert(typeof value === 'object', "error on deploy!");
           finish();
       }
       ,function(error) {
            assert(error == null, "error on deploy!");finish();
       });
  });


  it ('check_transfer_w/o_approve', function (finish) {
    this.timeout(20000);
    this.slow(10000);
    bloomio.Q.all([bloomio.Account.DeployP('fred', acc1.address), bloomio.Account.DeployP('edd', acc2.address)])
      .spread(
        function(first, second) {
         return TokenTest(first, second);
      }).done(function() {
           finish();
       }
       ,function(error) {
            assert(error == null, "error on deploy!");
            finish();
       });


    function TokenTest(first, second) {
     return bloomio.Token.DeployP(100, first)
        .then(function(token) {
 
          return token.TransferP(second.Address(), 30)
              .then(()=>token.WaitForMoneyTransferP(first.Address(), second.Address(), 30))
              .then(()=>bloomio.Q.all([token.TotalSupplyP(), token.BalanceOfP(first.Address()), token.BalanceOfP(second.Address())]))
              .spread(
                 function(supply, balanceof1, balanceof2) {
                   assert(supply==100, "invalid supply");
                   assert(balanceof1==70, "invalid balanceof1");
                   assert(balanceof2==30, "invalid balanceof2");
		   return bloomio.Q();
                });
        });
    }
  });

  it ('check_transfer_w/o_approve_negative_out_of_balance', function (finish) {
    this.timeout(20000);
    this.slow(10000);
    bloomio.Q.all([bloomio.Account.DeployP('fred', acc1.address), bloomio.Account.DeployP('edd', acc2.address)])
      .spread(
        function(first, second) {
         return TokenTest(first, second);
      }).done(function() {
           finish();
       }
       , function(error) {
            // in case if vm throw exception follow to this way. otherwise (and in real ethereum transfer nothing to change)
            assert(error.toString().includes('revert'), "error on deploy!: " +error);
            finish();
       });


    function TokenTest(first, second) {
     return bloomio.Token.DeployP(100, first)
        .then(function(token) {
 
          return token.TransferP(second.Address(), 120)
              .then(()=>token.WaitForMoneyTransferP(first.Address(), second.Address(), 120))
              .then(()=>bloomio.Q.all([token.TotalSupplyP(), token.BalanceOfP(first.Address()), token.BalanceOfP(second.Address())]))
              .spread(
                 function(supply, balanceof1, balanceof2) {
                   assert(supply==100, "invalid supply");
                   assert(balanceof1==100, "invalid balanceof1");
                   assert(balanceof2==0, "invalid balanceof2");
		   return bloomio.Q();
                });
        });
    }
  });

  it ('Multisig account deploy test', function (finish) {
    this.timeout(20000);
    this.slow(10000);
    bloomio.MultiSigAccount.DeployP([acc2.address], 2, 'edd', acc1.address)
      .done(function() {
           finish();
       }
       , function(error) {
            // in case if vm throw exception follow to this way. otherwise (and in real ethereum transfer nothing to change)
            assert(error == null, "error on deploy!");
            finish();
       });
   });

  it ('Multisig account deploy full test path', function (finish) {
    this.timeout(20000);
    this.slow(10000);

    bloomio.Q.all([bloomio.Account.DeployP('fred', acc1.address), bloomio.MultiSigAccount.DeployP([acc2.address], 2, 'edd', acc1.address), bloomio.Account.DeployP('leo', acc1.address)])
      .spread(
        function(first, second, third) {
         return TokenTest(first, second, third);
      }).done(function() {
           finish();
       }
       , function(error) {
            // in case if vm throw exception follow to this way. otherwise (and in real ethereum transfer nothing to change)
            assert(error == null, "error on deploy!");
            finish();
       });


    function TokenTest(first, second, third) {
     return bloomio.Token.DeployP(100, first)
        .then(function(token) {
          const token2 = token.Impersonate(second);
          const second2 = bloomio.MultiSigAccount.New(acc2.address, second.Address());
          return token.TransferP(second.Address(), 30)
              .then(()=>token.WaitForMoneyTransferP(first.Address(), second.Address(), 30))
              .then(()=>token2.TransferP(third.Address(), 10))  
              .then((id)=>second.WaitForConfirmationCodeP(id))
              .then((operation)=>second2.ConfirmP(operation))
              .then(()=>token.WaitForMoneyTransferP(second.Address(), third.Address(), 10))
              .then(()=>bloomio.Q.all([token.TotalSupplyP(), token.BalanceOfP(first.Address()), token.BalanceOfP(second.Address()), token.BalanceOfP(third.Address())]))
              .spread((supply, balanceof1, balanceof2, balanceof3)=>
                {
                   assert(supply==100, "invalid supply");
                   assert(balanceof1==70, "invalid balanceof1");
                   assert(balanceof2==20, "invalid balanceof2");
                   assert(balanceof3==10, "invalid balanceof3");
                   return bloomio.Q();
                });
        });
    }
   });

});//server