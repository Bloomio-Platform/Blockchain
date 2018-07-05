pragma solidity ^0.4.10;

import "token.sol";
import "bloomio_owned.sol";

contract BloomioCoin is Token, BloomioOwned {
   //add naming for coin
   function BloomioCoin(address _bloomioKey, address _trading, uint256 value, uint256 feeRateInternal, uint256 feeRateFromInternal2External, uint256 feeRateFromExternal2Internal, uint256 minimalFeeValue, uint256 feeDivisor) 
    BloomioOwned(_bloomioKey, _trading) {
        balances[msg.sender] = value;
        totalSupply = value;
        setFee(feeRateInternal, feeRateFromInternal2External, feeRateFromExternal2Internal, minimalFeeValue, feeDivisor);
   }
   
   function setFee(uint256 feeRateInternal, uint256 feeRateFromInternal2External, uint256 feeRateFromExternal2Internal, uint256 minimalFeeValue, uint256 feeDivisor) onlyOwner {
       require(feeDivisor > 0);
       FeeRateInternal = feeRateInternal;
       FeeRateFromInternal2External = feeRateFromInternal2External;
       FeeRateFromExternal2Internal = feeRateFromExternal2Internal;
       MinimalFeeValue = minimalFeeValue;
       FeeDivisor = feeDivisor;
   }

    function transfer(address _to, uint256 _value) returns (bool success) {
        require(balances[msg.sender] >= _value);
        uint fee = 0;
        if (!AllowedForSpending(_to)) {
          bool firstAttested = IsAttestedAccount(msg.sender);
          bool secondAttested = IsAttestedAccount(_to);
          if (firstAttested && secondAttested) {
            fee = FeeRateInternal;
          }
          else if (!firstAttested && secondAttested) {
            fee = FeeRateFromExternal2Internal;
          }
          else if (firstAttested && !secondAttested) {
            fee = FeeRateFromInternal2External;
          }
          fee = (fee * _value + FeeDivisor - 1) / FeeDivisor; //minimal fee. ceiling
          if (MinimalFeeValue > fee)
            fee = MinimalFeeValue;
        }
        balances[msg.sender] -= _value;
        balances[_to] += _value - fee;
        balances[BloomioKey] += fee;
        Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) returns (bool) {
        require(balances[_from] >= _value && allowed[_from][msg.sender] >= _value);
        balances[_to] += _value;
        balances[_from] -= _value;
        allowed[_from][msg.sender] -= _value;
        Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) constant returns (uint256 balance) {
        return balances[_owner];
    }

    function approve(address _spender, uint256 _value) allowTransfer(_spender) returns (bool) {
        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;
    }

    function allowance(address _owner, address _spender) constant returns (uint256) {
      return allowed[_owner][_spender];
    }

    mapping (address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;
    uint256 FeeRateInternal;
    uint256 FeeRateFromInternal2External;
    uint256 FeeRateFromExternal2Internal;
    uint256 MinimalFeeValue;
    uint256 FeeDivisor;
}