# bloomio-contracts is a common library for client-server interaction

## Known issues
### MSBUILD : error MSB3428: Could not load the Visual C++ component "VCBuild.exe"
- Install Visual Studio 2015
- Run 
```
npm config set msvs_version 2015 --global
```

## samples
many samples you can found on the /sample directory

## How to run
- `cd <project dir>/docker`
- `docker build . -t blockchain`
- `docker run --name blockchain blockchain`
- `docker pull node`
- `cd ..`
- `docker run -v "$PWD":/app -w /app --link blockchain:parity node node sample/transfer.js`*

* on sample files change localhost to parity


source description:
threre are four directories
1. ./sample
2. ./contracts
3. ./src
4. ./

sample directory contains:
account.js - sample which demonstrate how to create account
account_coin.js - sample which demonstrate how to transfer coins through account contract
coin.js - sample demonstrate how to work with coins
multi_sig_account_coin.js sample of transfer coins using multisig contract with two owners
transfer.js - sample of transfer coins using stock exchange

src dir conttains:
account.js - account primitives, such as account, simple accout, multisig account
accounts-provider.js - code which allow to throw up using of built-in wallet 
wallet.js - code which allow to throw up using of built-in wallet
bloomio.js - entry point to all bloomio functions
promise_util.js - wrapper for all functions transofrm it into promises.
stock_exchange.js - wrapper around stockexchange.
token.js - provide tokens and coins manupulate functionality.
contracts.json - there are generated code and abi for all contracts

contracts contains:
prepare_contract.bat - generates contracts.json using below contracts
solc.exe - solidity windows compiler
prepare_contract.py - helps to generate contract.json in appropriate format
account.sol - simple implementation one owning account contract
bloomio.sol - consolidate all contract. simplify contract compilation
bloomio_coin.sol - implements bloomio coins
bloomio_token.sol - implements bloomio tokens
multi_sig_account.sol - implements multisig accout
owned.sol - provide base for owned contracts.
stock_exchange.sol - there are incapsulated stockexhange rules
token.sol - public ERC20 tokens interface

