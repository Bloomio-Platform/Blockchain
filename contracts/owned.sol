pragma solidity ^0.4.10;

contract Owned {
  function Owned() { Owner = msg.sender; }
  function GetOwner() constant returns (address) {
    return Owner;
  }

  function IsOwner() constant returns (bool) {
    return Owner == msg.sender;
  }

  modifier onlyOwner {
      if (IsOwner())
        _;
  }
  function ChangeOwner(address _newOwner) onlyOwner {
    Owner = _newOwner;
  }
  address Owner;
}
