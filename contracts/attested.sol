pragma solidity ^0.4.10;
import 'owned.sol';
contract Attested is Owned {
  uint8 V;
  bytes32 R;
  bytes32 S;
  
  function GetSigner() constant returns(address) {
    bytes32 hash = keccak256(address(this));
    return ecrecover(hash, V, R, S); 
  }
 
  function Sign(uint8 v, bytes32 r, bytes32 s) onlyOwner {
    V = v;
    R = r;
    S = s;
  }

  function GetSignature() constant returns (uint8, bytes32, bytes32) {
    return (V, R, S);
  }
}
