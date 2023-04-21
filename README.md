# Rocket Pool rETH Exchange Rate Oracle for ZkSync Era

This repository contains 2 main contracts. `RocketZkSyncPriceMessenger` which can be called by anyone to submit the current
rETH exchange rate (as reported by `RocketNetworkBalances`) to the `RocketZkSyncPriceOracle` contract which is deployed on
ZkSync Era.

## Notice

Rocket Pool provides this exchange rate oracle as-is for convenience and offers no guarantee about its accuracy or the
freshness of the data. These contracts have not been formally audited for security or correctness.

## Usage

Calling `rate()` on `RocketZkSyncPriceOracle` will return the latest rETH exchange rate reported. This value is in the form
of the ETH value of 1 rETH. e.g. If 1 rETH is worth 1.5 ETH `rate()` will return 1.5e18. `lastUpdated()` can be called to
retrieve the timestamp that the rate was last updated.

## Deployments

Rocket Pool maintains a Goerli testnet instance of the protocol alongside our mainnet deployment which can be used for 
integration testing before promotion to mainnet.

| Chain | RocketOvmPriceMessenger (EVM) | RocketOvmPriceOracle (ZkSync Era) | RocketBalancerRateProvider (ZkSync Era) |
| -- | -- | -- | -- |
| Mainnet | 0x6cf6CB29754aEBf88AF12089224429bD68b0b8c8 | 0x6aacD3ED8443A7F4CB19eB4f289A5829842DA2b1 | 0x6340be83f53410e2Ac7341EF0b39d47ab6c6654d |
| Goerli | 0x3fd49431bd05875aed449bc8c07352942a7fba75 | 0x79ba6c8E45E3911dEa6Ae7950A2CCb35F0Eb4A1E | tba |
