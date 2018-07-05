pragma solidity ^0.4.10;
import 'token.sol';
import 'owned.sol';

//alias approves his tokens and propose them. 

contract Trading is Owned {
  //rename coinsToTokens
  function transfer(Token _coins, Token _tokens, address _seller, address _buyer, address _bloomio, uint256 _tokensMoved, uint256 _price, uint256 _feeValue) onlyOwner returns (bool) {
    require(_tokens.transferFrom(_seller, _buyer, _tokensMoved));
    require(_coins.transferFrom(_buyer, _seller, _price - _feeValue));
    require(_coins.transferFrom(_buyer, _bloomio, _feeValue));
    return true;
  }
  
  function transferCoins(Token _coins, address _seller, address _buyer, address _bloomio, uint256 _price, uint256 _feeValue) onlyOwner returns (bool) {
    require(_coins.transferFrom(_buyer, _seller, _price - _feeValue));
    require(_coins.transferFrom(_buyer, _bloomio, _feeValue));
    return true;
  }
}