const Bloomio = require('../index.js');
var ethUtil = require('ethereumjs-util');
const Q = require('q');
const bloomio = new Bloomio();

const account = bloomio.Accounts.new();
console.log(account);
const data = Buffer.from(ethUtil.stripHexPrefix(account.address), 'hex');
const hash = ethUtil.sha3(data);
console.log(hash, data);
const sig = ethUtil.ecsign(hash, Buffer.from(ethUtil.stripHexPrefix(account.private), 'hex'));


console.log(sig);

const publicKey = ethUtil.ecrecover(hash, sig.v, sig.r, sig.s);
const address = ethUtil.publicToAddress(publicKey).toString('hex');

console.log('0x'+publicKey.toString("hex"));
console.log('0x'+address.toString('hex'));
