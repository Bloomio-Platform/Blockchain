solc.exe  --optimize --combined-json abi,bin bloomio.sol  >..\src\contracts.json
python prepare_contract.py