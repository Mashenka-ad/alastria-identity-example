const { transactionFactory, UserIdentity } = require('alastria-identity-lib')
const Web3 = require('web3')
const fs = require('fs')
const keythereum = require('keythereum')

const rawdata = fs.readFileSync('../configuration.json')
const configData = JSON.parse(rawdata)

const keyDataEntity1 = fs.readFileSync('../keystores/entity1-a9728125c573924b2b1ad6a8a8cd9bf6858ced49.json')
const keystoreDataEntity1 = JSON.parse(keyDataEntity1)
const keyDataAdmin = fs.readFileSync('../keystores/admin-6e3976aeaa3a59e4af51783cc46ee0ffabc5dc11.json')
const keystoreDataAdmin = JSON.parse(keyDataAdmin)

// Init your blockchain provider
const myBlockchainServiceIp = configData.nodeURL
const web3 = new Web3(new Web3.providers.HttpProvider(myBlockchainServiceIp))

const adminKeyStore = keystoreDataAdmin

let adminPrivateKey
try {
	adminPrivateKey = keythereum.recover(configData.addressPassword, adminKeyStore)
} catch (error) {
	console.log("ERROR: ", error)
	process.exit(1);
}

const adminIdentity = new UserIdentity(web3, `0x${adminKeyStore.address}`, adminPrivateKey)

// Im not sure if this is needed
async function unlockAccount() {
	const unlockedAccount = await web3.eth.personal.unlockAccount(adminIdentity.address, configData.addressPassword, 500)
	console.log('Account unlocked:', unlockedAccount)
	return unlockedAccount
}

const entity1KeyStore = keystoreDataEntity1;

async function mainDel() {
	unlockAccount()
	console.log('\n ------ Example of deleting the entity1 like Issuer ------ \n')
	const transactionD = await transactionFactory.identityManager.deleteIdentityIssuer(web3, configData.didEntity1)
	console.log("transaction", transactionD)
	const getKnownTxD = await adminIdentity.getKnownTransaction(transactionD)
	console.log('The transaction bytes data is: ', getKnownTxD)
	web3.eth.sendSignedTransaction(getKnownTxD)
		.on('transactionHash', function (hashD) {
			console.log("HASH: ", hashD)
		})
		.on('receipt', function (receiptD) {
			console.log("RECEIPT: ", receiptD)
		})
		.on('error', function (error) {
			console.error(error)
			process.exit(1);
		});
}
mainDel()

