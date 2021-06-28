const {
  transactionFactory,
  UserIdentity,
  tokensFactory
} = require('alastria-identity-lib')
const Web3 = require('web3')
const fs = require('fs')
const keythereum = require('keythereum')
const ethers = require('ethers');

const rawdata = fs.readFileSync('../configuration-b.json')
const configData = JSON.parse(rawdata)

// Init your blockchain provider
const myBlockchainServiceIp = configData.nodeURL
const web3 = new Web3(new Web3.providers.HttpProvider(myBlockchainServiceIp))

// ------------------------------------------------------------------------------
console.log('\n ------ Preparing Entity1 identity ------ \n')

// Some fake data to test
const mnemonicE1 = configData.mnemonicE1;
let entity1PrivateKey
let entity1PublicKey
let entity1Address
try {
  entity1PrivateKey =  ethers.Wallet.fromMnemonic(mnemonicE1).privateKey.substr(2);
  entity1PrivateKey0x =  ethers.Wallet.fromMnemonic(mnemonicE1).privateKey;
  entity1PublicKey = ethers.utils.computePublicKey(ethers.Wallet.fromMnemonic(mnemonicE1).privateKey).substr(2);
  entity1PublicKey0x = ethers.utils.computePublicKey(ethers.Wallet.fromMnemonic(mnemonicE1).privateKey);
  entity1Address = ethers.Wallet.fromMnemonic(mnemonicE1).address.substr(2);

} catch (error) {
  console.error('ERROR: ', error)
}

const entity1Identity = new UserIdentity(
  web3,
  `0x${entity1Address}`,
  entity1PrivateKey
)

console.log('\n ------ Creating credential ------ \n')

const jti = configData.jti
const kidCredential = configData.kidCredential
const subjectAlastriaID = configData.subjectAlastriaID
const didEntity1 = configData.didEntity1
const context = configData.context
const tokenExpTime = configData.tokenExpTime
const tokenActivationDate = configData.tokenActivationDate

// Credential Map (key-->value)
const credentialSubject = {}
const credentialKey = configData.credentialKey
const credentialValue = configData.credentialValue
credentialSubject[credentialKey] = credentialValue
credentialSubject.levelOfAssurance = 'basic'

// End fake data to test

const credential = tokensFactory.tokens.createCredential(
  didEntity1,
  context,
  credentialSubject,
  kidCredential,
  subjectAlastriaID,
  tokenExpTime,
  tokenActivationDate,
  jti
)
console.log('The credential1 is: ', credential)

const signedJWTCredential = tokensFactory.tokens.signJWT(
  credential,
  entity1PrivateKey
)
console.log('The signed token is: ', signedJWTCredential)

const credentialHash = tokensFactory.tokens.PSMHash(
  web3,
  signedJWTCredential,
  didEntity1
)
console.log('The Entity1 PSMHash is:', credentialHash)
fs.writeFileSync(
  `./PSMHashEntity1.json`,
  JSON.stringify({ psmhash: credentialHash, jwt: signedJWTCredential })
)

function addIssuerCredential() {
  const issuerCredential =
    transactionFactory.credentialRegistry.addIssuerCredential(
      web3,
      credentialHash
    )
  console.log('(addIssuerCredential)The transaction is: ', issuerCredential)
  return issuerCredential
}

function sendSigned(issuerCredentialSigned) {
  return new Promise((resolve, reject) => {
    web3.eth
      .sendSignedTransaction(issuerCredentialSigned)
      .on('transactionHash', function (hash) {
        console.log('HASH: ', hash)
      })
      .on('receipt', (receipt) => {
        resolve(receipt)
      })
      .on('error', (error) => {
        console.error('Error------>', error)
        reject(error)
        process.exit(1)
      })
  })
}

async function main() {
  const resultIssuerCredential = await addIssuerCredential()

  const issuerCredentialSigned = await entity1Identity.getKnownTransaction(
    resultIssuerCredential
  )
  console.log(
    '(addIssuerCredential)The transaction bytes data is: ',
    issuerCredentialSigned
  )
  sendSigned(issuerCredentialSigned).then((receipt) => {
    console.log('RECEIPT:', receipt)
    const issuerCredentialTransaction =
      transactionFactory.credentialRegistry.getIssuerCredentialStatus(
        web3,
        configData.didEntity1,
        credentialHash
      )
    web3.eth
      .call(issuerCredentialTransaction)
      .then((IssuerCredentialStatus) => {
        const result = web3.eth.abi.decodeParameters(
          ['bool', 'uint8'],
          IssuerCredentialStatus
        )
        const credentialStatus = {
          exists: result[0],
          status: result[1]
        }
        console.log('(IssuerCredentialStatus) -----> ', credentialStatus)
      })
  })
}
main()
