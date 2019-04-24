pragma solidity ^0.4.24;
import 'owned.sol';
import 'attested.sol';

contract BloomioOwned is Owned {
    constructor (address _bloomioKey, address _trading) public {
        Change(_bloomioKey, _trading);
    }

    function Change(address _bloomioKey, address _trading) public onlyOwner {
        BloomioKey = _bloomioKey;
        Trading = _trading;
    }

    function IsAttestedAccount(address _account) public view  returns(bool) {
        Attested a = Attested(_account);
        uint8 v;
        bytes32 r;
        bytes32 s;
        (v, r, s) = a.GetSignature();
        bytes32 hash = keccak256(abi.encodePacked(address(_account)));
        return ecrecover(hash, v, r, s) == BloomioKey;
    }

    function IsStockExchange(address _account) public view returns(bool) {
        return Trading == _account || Trading == 0;
    }

    function AllowedForSpending(address _dest) public view returns(bool) {
        return IsStockExchange(_dest) || IsAttestedAccount(_dest);
    }

    modifier allowTransfer(address _dest) {
        if (AllowedForSpending(_dest)) {
            _;
        }
    }

    address BloomioKey;
    address Trading;
}
