require('dotenv').config();

require('@nomicfoundation/hardhat-foundry');

require('@matterlabs/hardhat-zksync-deploy');
require('@matterlabs/hardhat-zksync-solc');

const {subtask} = require('hardhat/config');
const {TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS} = require('hardhat/builtin-tasks/task-names');

subtask(TASK_COMPILE_SOLIDITY_GET_SOURCE_PATHS).setAction(async (_, __, runSuper) => {
  return [
    'src/RocketZKSyncPriceOracle.sol',
    'src/RocketBalancerRateProvider.sol',
  ];
});

module.exports = {
  zksolc: {
    version: '1.3.1',
    compilerSource: 'binary',
  },
  defaultNetwork: 'zkSyncTestnet',

  networks: {
    hardhat: {
      zksync: true,
    },
    zkSyncTestnet: {
      url: process.env.ZKSYNC_RPC,
      ethNetwork: 'goerli',
      zksync: true,
    },
  },
  solidity: {
    version: '0.8.16',
  },
};