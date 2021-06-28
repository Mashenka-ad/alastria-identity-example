const { transactionFactory, UserIdentity } = require('alastria-identity-lib')
const Web3 = require('web3')
const fs = require('fs')
const keythereum = require('keythereum')
const ethers = require('ethers');
const rawdata = fs.readFileSync('../configuration-b.json')
const configData = JSON.parse(rawdata)


// Init your blockchain provider
const myBlockchainServiceIp = configData.nodeURL
const web3 = new Web3(new Web3.providers.HttpProvider(myBlockchainServiceIp))

const mnemonicfirstID = configData.mnemonicFirstID;
let firstIDPrivateKey
let firstIDPublicKey
let firstIDAddress
try {
  firstIDPrivateKey =  ethers.Wallet.fromMnemonic(mnemonicfirstID).privateKey.substr(2);
  firstIDPrivateKey0x =  ethers.Wallet.fromMnemonic(mnemonicfirstID).privateKey;
  firstIDPublicKey = ethers.utils.computePublicKey(ethers.Wallet.fromMnemonic(mnemonicfirstID).privateKey).substr(2);
  firstIDPublicKey0x = ethers.utils.computePublicKey(ethers.Wallet.fromMnemonic(mnemonicfirstID).privateKey);
  firstIDAddress = ethers.Wallet.fromMnemonic(mnemonicfirstID).address.substr(2);

} catch (error) {
  console.error('ERROR: ', error)
  process.exit(1)
}

const firstIdentityIdentity = new UserIdentity(web3, `0x${firstIDAddress}`, firstIDPrivateKey)


// Im not sure if this is needed
async function unlockAccount() {
  const unlockedAccount = true
  console.log('Account unlocked:', unlockedAccount)
  return unlockedAccount
}

async function mainAddEntity() {
  unlockAccount()
  console.log('\n ------ Example of adding the entity1 like a Entity ------ \n')
  const transactionAddEntity = await transactionFactory.identityManager.addEntity(
    web3,
    configData.didEntity1,
    configData.entityData1.name,
    configData.entityData1.cif,
    configData.entityData1.urlLogo,
    configData.entityData1.urlCreateAID,
    configData.entityData1.urlAOA
  )
  const getKnownTxAddEntity = await firstIdentityIdentity.getKnownTransaction(
    transactionAddEntity
  )
  console.log('The transaction bytes data is: ', getKnownTxAddEntity)
  web3.eth
    .sendSignedTransaction(getKnownTxAddEntity)
    .on('transactionHash', function (hashAddEntity) {
      console.log('HASH: ', hashAddEntity)
    })
    .on('receipt', function (receiptAddEntity) {
      console.log('RECEIPT: ', receiptAddEntity)
    })

    .on('error', function (error) {
      console.error(error)
      process.exit(1)
    }) // If this is a revert, probably this Subject (address) is already a SP
}

mainAddEntity()
