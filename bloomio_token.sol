pragma solidity ^0.4.24;

import "token.sol";
import "bloomio_owned.sol";

contract BloomioToken is Token, BloomioOwned {
    constructor (address _bloomioKey, address _trading, uint256 _value, string _companyName) public BloomioOwned(_bloomioKey, _trading) {
        name = _companyName;
        totalSupply = _value;
        balances[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public allowTransfer(_to)  returns (bool success) {
        require(balances[msg.sender] >= _value);
        balances[msg.sender] -= _value;
        balances[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public allowTransfer(_to)  returns (bool success) {
        require(balances[_from] >= _value && allowed[_from][msg.sender] >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        allowed[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) view public returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) public allowTransfer(_spender)  returns (bool success) {
        allowed[msg.sender][_spender] += _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) view public returns (uint256 remaining) {
        return allowed[_owner][_spender];
    }

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;
}
