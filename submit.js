require('dotenv').config();

const process = require('process');
const ethers = require('ethers');

const ZkSyncWeb3 = require('zksync-web3');

const RocketZkSyncPriceMessenger = require(
    './out/RocketZkSyncPriceMessenger.sol/RocketZkSyncPriceMessenger.json');
const RocketZkSyncPriceOracle = require('./out/RocketZkSyncPriceOracle.sol/RocketZkSyncPriceOracle.json');

const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC);
const ethereumWallet = ethers.Wallet.fromMnemonic(process.env.ETHEREUM_MNEMONIC).connect(ethereumProvider);

const zkSyncProvider = new ZkSyncWeb3.Provider(process.env.ZKSYNC_RPC);
let zkSyncWallet = ethers.Wallet.fromMnemonic(process.env.ZKSYNC_MNEMONIC).connect(zkSyncProvider);
zkSyncWallet = new ZkSyncWeb3.Wallet(zkSyncWallet.privateKey, zkSyncProvider, ethereumProvider)

function applyL1ToL2Alias(address) {
  const L1_TO_L2_ALIAS_OFFSET = ethers.BigNumber.from('0x1111000000000000000000000000000000001111')
  const ADDRESS_MODULO = ethers.BigNumber.from('0xffffffffffffffffffffffffffffffffffffffff')
  return ethers.utils.hexlify(ethers.BigNumber.from(address).add(L1_TO_L2_ALIAS_OFFSET).mod(ADDRESS_MODULO));
}

async function submit() {
  // Create the contract instances
  const messengerFactory = new ethers.ContractFactory(RocketZkSyncPriceMessenger.abi,
      RocketZkSyncPriceMessenger.bytecode.object).connect(ethereumWallet);
  const messenger = messengerFactory.attach(process.env.MESSENGER_ADDRESS);

  // Construct the calldata of the L2 transaction for the estimator
  const oracleIface = new ethers.utils.Interface(RocketZkSyncPriceOracle.abi);
  const data = oracleIface.encodeFunctionData('updateRate', [ethers.BigNumber.from('1')]);

  // Calculate the L2 cost
  // const gasPrice = await zkSyncWallet.providerL1.getGasPrice();
  const gasPrice = ethers.utils.parseUnits('100', 'gwei');
  const priorityFee = ethers.utils.parseUnits('1', 'gwei');
  const gasLimit = ethers.BigNumber.from('650000');
  const gasPerPubdataByte = ethers.BigNumber.from('800');
  const txCostPrice = await zkSyncWallet.getBaseCost({
    gasPrice,
    gasLimit,
    gasPerPubdataByte
  })

  console.log(`Calling submitRate with ${ethers.utils.formatEther(txCostPrice)} ETH callValue for L2 fees`);

  // Execute the submitRate transaction with calculated parameters and value
  const tx = await messenger.submitRate(gasLimit, gasPerPubdataByte, {
    value: txCostPrice,
    maxFeePerGas: gasPrice,
    maxPriorityFeePerGas: priorityFee,
    gasLimit: '267123'
  });
  const receipt = await tx.wait();

  console.log(`Transaction confirmed on L1: ${receipt.transactionHash}`);
  process.exit(0);
}

submit();
