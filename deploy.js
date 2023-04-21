require('dotenv').config();

const hre = require('hardhat');
const process = require('process');
const ethers = require('ethers');
const ZkSyncWeb3 = require('zksync-web3');
const ZkSyncDeploy = require('@matterlabs/hardhat-zksync-deploy');

const RocketZkSyncPriceMessenger = require('./out/RocketZkSyncPriceMessenger.sol/RocketZkSyncPriceMessenger.json');
const RocketZkSyncPriceOracle = require('./out/RocketZkSyncPriceOracle.sol/RocketZkSyncPriceOracle.json');
const RocketBalancerRateProvider = require('./out/RocketBalancerRateProvider.sol/RocketBalancerRateProvider.json');

const zkSyncProvider = new ethers.providers.JsonRpcProvider(process.env.ZKSYNC_RPC);
const zkSyncWallet = ethers.Wallet.fromMnemonic(process.env.ZKSYNC_MNEMONIC).connect(zkSyncProvider);

const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC);
const ethereumWallet = ethers.Wallet.fromMnemonic(process.env.ETHEREUM_MNEMONIC).connect(ethereumProvider);

function applyL1ToL2Alias(address) {
  const L1_TO_L2_ALIAS_OFFSET = ethers.BigNumber.from('0x1111000000000000000000000000000000001111')
  const ADDRESS_MODULO = ethers.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffff')
  return ethers.utils.hexlify(ethers.BigNumber.from(address).add(L1_TO_L2_ALIAS_OFFSET).mod(ADDRESS_MODULO));
}

async function deploy() {
  console.log(`Ethereum deployer address: ${ethereumWallet.address}`);
  console.log(`ZkSync deployer address: ${zkSyncWallet.address}`);

  // Create factories
  const messengerFactory = new ethers.ContractFactory(RocketZkSyncPriceMessenger.abi,
      RocketZkSyncPriceMessenger.bytecode.object).connect(ethereumWallet);

  const wallet = new ZkSyncWeb3.Wallet(zkSyncWallet.privateKey);
  const deployer = new ZkSyncDeploy.Deployer(hre, wallet);
  const RocketZkSyncOracleArtifact = await deployer.loadArtifact("RocketZkSyncPriceOracle");
  const RocketBalancerRateProviderArtifact = await deployer.loadArtifact("RocketBalancerRateProvider");

  // Deploy
  console.log('Deploying messenger');
  const messenger = await messengerFactory.deploy(process.env.ROCKET_STORAGE, process.env.ZKSYNC_ADDRESS);
  console.log(`Messenger address: ${messenger.address}`);

  console.log('Deploying oracle');
  const oracle = await deployer.deploy(RocketZkSyncOracleArtifact, []);
  console.log(`Oracle address: ${oracle.address}`);

  // Setup tunnel
  console.log('Setting up permission');
  await messenger.updateL2Target(oracle.address);
  await oracle.setOwner(applyL1ToL2Alias(messenger.address));
  console.log('Permissions set.');

  // Deploy balancer rate provider wrapper
  console.log('Deploying balancer wrapper');
  const balancerWrapper = await deployer.deploy(RocketBalancerRateProviderArtifact, [oracle.address]);
  console.log(`Balancer wrapper address: ${balancerWrapper.address}`);

  process.exit(0);
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});