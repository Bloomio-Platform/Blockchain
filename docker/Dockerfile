FROM parity/parity:v1.7.4
COPY paritydb /parity/paritydb
COPY pp /parity/pp
COPY morden2.json /parity/morden2.json
EXPOSE 8545:8545

CMD ["--chain","/parity/morden2.json", "--jsonrpc-interface", "all", "--jsonrpc-hosts", "all", "--rpccorsdomain", "*", "--engine-signer", "0x793d97d8a06cd220fe07cf4816802523c2d90159", "--password", "/parity/pp", "--usd-per-tx", "0", "--keys-path", "/parity/paritydb/keys", "--db-path", "/parity/paritydb"]
#ENTRYPOINT ["/bin/bash"]