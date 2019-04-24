pragma solidity ^0.4.24;

contract Owned {

  address public Owner;

  constructor () public {
    Owner = msg.sender;
  }

  function GetOwner() public view returns (address) {
    return Owner;
  }

  function IsOwner() public view returns (bool) {
    return Owner == msg.sender;
  }

  modifier onlyOwner {
      if (IsOwner())
        _;
  }

  function ChangeOwner(address _newOwner) public onlyOwner {
    Owner = _newOwner;
  }

}
