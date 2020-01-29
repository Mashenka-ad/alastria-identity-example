const { transactionFactory, UserIdentity, config, tokensFactory } = require('alastria-identity-lib')
const fs = require('fs')
const Web3 = require('web3')
const keythereum = require('keythereum')

let rawdata = fs.readFileSync('../configuration.json')
let configData = JSON.parse(rawdata)

// Init your blockchain provider
let myBlockchainServiceIp = configData.nodeURL
const web3 = new Web3(new Web3.providers.HttpProvider(myBlockchainServiceIp))

console.log('\n ------ Example of creating an Alastria ID for a Subject with Entity1 ------ \n')

// We have Entity1 which is an entity with both roles: Service Provider and Issuer. You get its private key and instantiate its UserIdentity
let keyDataEntity1 = fs.readFileSync('../keystores/entity1-a9728125c573924b2b1ad6a8a8cd9bf6858ced49.json')
let entity1KeyStore = JSON.parse(keyDataEntity1)
let entity1PrivateKey
try {
	entity1PrivateKey = keythereum.recover(configData.addressPassword, entity1KeyStore)
} catch (error) {
	console.log("ERROR: ", error)
	process.exit(1);
}
let entity1Identity = new UserIdentity(web3, `0x${entity1KeyStore.address}`, entity1PrivateKey)

// We have Subject1 which is a person with an identity wallet. You get its private key and instantiate its UserIdentity
let keyDataSubject1 = fs.readFileSync('../keystores/subject1-806bc0d7a47b890383a831634bcb92dd4030b092.json')
let subject1Keystore = JSON.parse(keyDataSubject1)
let subject1PrivateKey
try {
	subject1PrivateKey = keythereum.recover(configData.addressPassword, subject1Keystore)
} catch (error) {
	console.log("ERROR: ", error)
	process.exit(1);
}
let subject1Identity = new UserIdentity(web3, `0x${subject1Keystore.address}`, subject1PrivateKey)

function prepareAlastriaId() {
	let preparedId = transactionFactory.identityManager.prepareAlastriaID(web3, subject1Keystore.address)
	return preparedId
}

function createAlastriaId() {
	let txCreateAlastriaID = transactionFactory.identityManager.createAlastriaIdentity(web3, configData.subject1Pubk.substr(2))
	return txCreateAlastriaID
}

console.log('\n ------  A promise all where prepareAlastriaID and createAlsatriaID transactions are signed and sent ------ \n')
async function main() {
	
	//At the beggining, the Entity1 should create an AT, sign it and send it to the wallet
	let at = tokensFactory.tokens.createAlastriaToken(config.didEntity1, config.providerURL, config.callbackURL, config.alastriaNetId, config.tokenExpTime, config.tokenActivationDate, config.jsonTokenId)
	let signedAT = tokensFactory.tokens.signJWT(at, entity1PrivateKey)
	console.log('\tsignedAT: \n', signedAT)
	
	// The subject, from the wallet, should build the tx createAlastriaId and sign it
	let createResult = await createAlastriaId()
	let signedCreateTransaction = await subject1Identity.getKnownTransaction(createResult)
	// Then, the subject, also from the wallet should build an AIC wich contains the signed AT, the signedTx and the Subject Public Key
	let subjectSignedAT = tokensFactory.tokens.signJWT(signedAT, subject1PrivateKey)
	let aic = tokensFactory.tokens.createAIC(signedCreateTransaction,subjectSignedAT,config.subject1Pubk);
	let signedAIC = tokensFactory.tokens.signJWT(aic, subject1PrivateKey)
	console.log("\tsignedAIC: \n", signedAIC)
	
	// Then, Entity1 receive the AIC. It should decode it and verify the sign with the public key. 
	// It can extract from the AIC all the necessary data for the next steps: wallet address, subject public key, the tx which is signed by the subject and the signed AT 
	
	//Below, it should build the tx prepareAlastriaId and sign it
	let prepareResult = await prepareAlastriaId()
	let signedPreparedTransaction = await entity1Identity.getKnownTransaction(prepareResult)
	
	// At the end, Entity1 should send both tx to the blockchain as it follows:
	web3.eth.sendSignedTransaction(signedPreparedTransaction)
		.on('transactionHash', function (hash) {
			console.log("HASH: ", hash)
		})
		.on('receipt', function (receipt) {
			console.log("RECEIPT: ", receipt)
			web3.eth.sendSignedTransaction(signedCreateTransaction)
				.on('transactionHash', function (hash) {
					console.log("HASH: ", hash)
				})
				.on('receipt', function (receipt) {
					console.log("RECEIPT: ", receipt)
					web3.eth.call({
						to: config.alastriaIdentityManager,
						data: web3.eth.abi.encodeFunctionCall(config.contractsAbi['AlastriaIdentityManager']['identityKeys'], [subject1Keystore.address])
					})
						.then(AlastriaIdentity => {
							console.log(`alastriaProxyAddress: 0x${AlastriaIdentity.slice(26)}`)
							configData.subject1 = `0x${AlastriaIdentity.slice(26)}`
							fs.writeFileSync('../configuration.json', JSON.stringify(configData))
							let alastriaDID = tokensFactory.tokens.createDID('quor', AlastriaIdentity.slice(26));
							configData.didSubject1 = alastriaDID
							fs.writeFileSync('../configuration.json', JSON.stringify(configData))
							console.log('the alastria DID is:', alastriaDID)
						})
				})

				.on('error', function (error) {
					console.error(error)
					process.exit(1);
				}); // If a out of gas error, the second parameter is the receipt.
		})

		.on('error', function (error) {
			console.error(error)
			process.exit(1);
		}); // If a out of gas error, the second parameter is the receipt.
}
main()

