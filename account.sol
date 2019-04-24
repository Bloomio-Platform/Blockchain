pragma solidity ^0.4.24;
import 'attested.sol';

// assume that this contract used only directly from wallet. using custom wallet is not avaliable now. because of tx.origin
contract Account is Attested { //should do guarantee
  // string public Name;

  event SingleTransact(address owner, uint256 value, address to, address created, uint256 indexed id);

  // constructor (string name) public {
  //   Name = name;
  // }

  function execute(address to, uint256 value, bytes data, uint256 id) public onlyOwner {
    address created;
    if (to == 0) {
      created = createAddress(value, data);
      } else {
        require (to.call.value(value)(data));
      }
    emit SingleTransact(msg.sender, value, to, created, id);
  }

  function createAddress(uint256 value, bytes code) internal returns (address o_addr) {
    assembly {
      o_addr := create(value, add(code, 0x20), mload(code))
      if iszero(extcodesize(o_addr)) {
        revert(0,0)
      }
    }
  }
}
