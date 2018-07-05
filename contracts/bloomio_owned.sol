pragma solidity ^0.4.10;
import 'owned.sol';
import 'attested.sol';

contract BloomioOwned is Owned {
    function BloomioOwned(address _bloomioKey, address _trading) {
      Change(_bloomioKey, _trading);
    }
    
   function Change(address _bloomioKey, address _trading) onlyOwner {
      BloomioKey = _bloomioKey;
      Trading = _trading;
    }

    function IsAttestedAccount(address _account) constant returns(bool) {
       Attested a = Attested(_account);
       var (v, r, s) = a.GetSignature();
       bytes32 hash = keccak256(address(_account));
       return ecrecover(hash, v, r, s) == BloomioKey;
    }

    function IsStockExchange(address _account) constant returns(bool) {
      return Trading == _account || Trading == 0;
    }

    function AllowedForSpending(address _dest) constant returns(bool) {
      return IsStockExchange(_dest) || !(IsAttestedAccount(_dest) && IsAttestedAccount(msg.sender)) || IsOwner();
    }

    modifier allowTransfer(address _dest) {
        if (AllowedForSpending(_dest)) {
            _;
        }
    }
 
    address BloomioKey;
    address Trading;
}
