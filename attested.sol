pragma solidity ^0.4.24;

import './owned.sol';

contract Attested is Owned {
  uint8 V;
  bytes32 R;
  bytes32 S;

  function GetSigner() public view returns(address) {
    bytes32 hash = keccak256(abi.encodePacked(address(this)));
    return ecrecover(hash, V, R, S);
  }

  function Sign(uint8 v, bytes32 r, bytes32 s) public onlyOwner {
    V = v;
    R = r;
    S = s;
  }

  function GetSignature() public view returns (uint8, bytes32, bytes32) {
    return (V, R, S);
  }
}
