const {transactionFactory, UserIdentity} = require('alastria-identity-lib')
const Web3 = require('web3')
const fs = require('fs')
const keythereum = require('keythereum')

const rawdata = fs.readFileSync('../configuration.json')
const configData = JSON.parse(rawdata)

const keyDataEntity1 = fs.readFileSync('../keystores/entity1-a9728125c573924b2b1ad6a8a8cd9bf6858ced49.json')
const keystoreDataEntity1 = JSON.parse(keyDataEntity1)
const keyDataEntity3 = fs.readFileSync('../keystores/entity3-de7ab34219563ac50ccc7b51d23b9a61d22a383e.json')
const keystoreDataEntity3 = JSON.parse(keyDataEntity3)

// Init your blockchain provider
const myBlockchainServiceIp = configData.nodeURL
const web3 = new Web3(new Web3.providers.HttpProvider(myBlockchainServiceIp))

const entity1Keystore = keystoreDataEntity1

let entity1PrivateKey
try{
	entity1PrivateKey = keythereum.recover(configData.addressPassword, entity1Keystore)
}catch(error){
	console.log("ERROR: ", error)
	process.exit(1);
}

const entity1Identity = new UserIdentity(web3, `0x${entity1Keystore.address}`, entity1PrivateKey)

// Im not sure if this is needed
async function unlockAccount() {
	const unlockedAccount = await web3.eth.personal.unlockAccount(entity1Identity.address, configData.addressPassword, 500)
	console.log('Account unlocked:', unlockedAccount)
	return unlockedAccount
}

const entity3KeyStore = keystoreDataEntity3;

async function mainDel() {
	unlockAccount()
	console.log('\n ------ Example of deleting entity3 like Issuer ------ \n')
	const transaction = await transactionFactory.identityManager.deleteIdentityIssuer(web3, configData.didEntity3)
	console.log("transaction", transaction)
	const getKnownTx = await entity1Identity.getKnownTransaction(transaction)
	console.log('The transaction bytes data is: ', getKnownTx)
	web3.eth.sendSignedTransaction(getKnownTx)
	.on('transactionHash', function (hash) {
		console.log("HASH: ", hash)
	})
	.on('receipt', function (receipt) {
		console.log("RECEIPT: ", receipt)
	})
	.on('error', function (error) {
		console.error(error)
		process.exit(1);
	}); 
}
mainDel()

