pragma solidity ^0.4.10;
import 'attested.sol';

// assume that this contract used only directly from wallet. using custom wallet is not avaliable now. because of tx.origin
contract Account is Attested { //should do guarantee
  string Name;
 
  event SingleTransact(address owner, uint256 value, address to, address created, uint256 id);
  function Account(string name) {
    Name = name;
  }
  
  function execute(address to, uint256 value, bytes data, uint256 id) onlyOwner {
    address created;
    if (to == 0) {
      created = create(value, data);
      } else {
        if (!to.call.value(value)(data))
          throw;
      }
    SingleTransact(msg.sender, value, to, created, id);
  }

  function create(uint256 value, bytes code) internal returns (address o_addr) {
    assembly {
      o_addr := create(value, add(code, 0x20), mload(code))
      jumpi(invalidJumpLabel, iszero(extcodesize(o_addr)))
    }
  }
}
