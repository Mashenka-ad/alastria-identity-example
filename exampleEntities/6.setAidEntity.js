const {transactionFactory, UserIdentity} = require('alastria-identity-lib')
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

// ------------------------------------------------------------------------------
console.log('\n ------ Setting entity Aid ------ \n')

	if(configData.subject1 === undefined) {
		console.error('You must create an Alastria ID')
		process.exit(1)
    }
    
    async function mainSetAidEntity(){
        console.log('\n ------ Example of setting AID of entity1 like a Entity ------ \n')
        const transactionEntityAid = await transactionFactory.identityManager.setUrlCreateAID(
            web3, 
            configData.didEntity1, 
            "www.NombreEntidad.com/AID"
        )
        const getKnownTxEntityAid = await firstIdentityIdentity.getKnownTransaction(
            transactionEntityAid
        )
        web3.eth
            .sendSignedTransaction(getKnownTxEntityAid)
            .on('transactionHash', function (hashSetAidEntity) {
                console.log("HASH: ", hashSetAidEntity)
            })
            .on('receipt', function (receiptSetAidEntity) {
                console.log("RECEIPT: ", receiptSetAidEntity)
            })
            .on('error', function (error) {
                console.error(error)
                process.exit(1);
            });// If this is a revert, probably this Subject (address) is already a SP
    }
    
    mainSetAidEntity()
