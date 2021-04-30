const { transactionFactory, UserIdentity } = require('alastria-identity-lib')
const Web3 = require('web3')
const fs = require('fs')
const keythereum = require('keythereum')

const rawdata = fs.readFileSync('../configuration.json')
const configData = JSON.parse(rawdata)

const keyDataFirstIdentity = fs.readFileSync(
  '../keystores/firstIdentity-643266eb3105f4bf8b4f4fec50886e453f0da9ad.json'
)
const keystoreDataFirstIdentity = JSON.parse(keyDataFirstIdentity)

// Init your blockchain provider
const myBlockchainServiceIp = configData.nodeURL
const web3 = new Web3(new Web3.providers.HttpProvider(myBlockchainServiceIp))

const firstIdentityKeyStore = keystoreDataFirstIdentity

let firstIdentityPrivateKey
try {
  firstIdentityPrivateKey = keythereum.recover(
    configData.addressPassword,
    firstIdentityKeyStore
  )
} catch (error) {
  console.log('ERROR: ', error)
  process.exit(1)
}

const firstIdentityIdentity = new UserIdentity(
  web3,
  `0x${firstIdentityKeyStore.address}`,
  firstIdentityPrivateKey
)

// Im not sure if this is needed
async function unlockAccount() {
  const unlockedAccount = await web3.eth.personal.unlockAccount(
    firstIdentityIdentity.address,
    configData.addressPassword,
    500
  )
  console.log('Account unlocked:', unlockedAccount)
  return unlockedAccount
}

async function mainDel() {
  unlockAccount()
  console.log('\n ------ Example of deleting the entity1 like Issuer ------ \n')
  const transactionD = await transactionFactory.identityManager.deleteIdentityIssuer(
    web3,
    configData.didEntity1
  )
  console.log('transaction', transactionD)
  const getKnownTxD = await firstIdentityIdentity.getKnownTransaction(transactionD)
  console.log('The transaction bytes data is: ', getKnownTxD)
  web3.eth
    .sendSignedTransaction(getKnownTxD)
    .on('transactionHash', function (hashD) {
      console.log('HASH: ', hashD)
    })
    .on('receipt', function (receiptD) {
      console.log('RECEIPT: ', receiptD)
    })
    .on('error', function (error) {
      console.error(error)
      process.exit(1)
    })
}
mainDel()
