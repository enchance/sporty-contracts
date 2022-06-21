// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers, upgrades} from "hardhat";
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";
import {randomAddressString} from "hardhat/internal/hardhat-network/provider/fork/random";
import {keccak256, toUtf8Bytes} from "ethers/lib/utils";


/*
* 2 funded accounts:
* indexDEPLOYER:    Deploys all contracts
* arenaSERVER:      Creates the matches
*  */
export const CONTRACT_ACCOUNTS: any = {
    owner: '0xFF01E7B2329BBd74bb1d28B75164eB7DCAbDD8F3',        // enchance
    server: '0xFcC7815802A587E026B8F2F84485b12E1BD570D0',       // index SERVER (minting)
    admins: [
        '0xFF01E7B2329BBd74bb1d28B75164eB7DCAbDD8F3',           // enchance
        '0x1fd0515D45B2d1b8f12df35Eb3a16f3B95C1eCDf',           // PIERRE
        randomAddressString(),                                  // MIKE
    ],
    holders: [
        '0xEC615ad1Be355D16163bc2dDCb359788Bc93ED44',           // enchance VAULT
        '0x1fd0515D45B2d1b8f12df35Eb3a16f3B95C1eCDf',           // PIERRE
        randomAddressString()                                   // MIKE
    ],
    shares: [2400, 3400, 3400],
    market: '0xD07A0C38C6c4485B97c53b883238ac05a14a85D6',       // index MARKET (OpenSea)
    isvault: '0x9e0B1C81149F0Cb241a1e4aDA86B894960ECe577',      // index VAULT
}

export const INIT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/QmQLLDpXH9DiVvjjzmfoyaM1bBrso6wheS57f67ubqw3C7/{id}.json'
export const MARKET_ACCOUNT = CONTRACT_ACCOUNTS.market

let factory: ContractFactory, contract: any
let Gate: ContractFactory, gate: any
let utilsaddr: string, PROXY: string
export const STAFF_ROLE = keccak256(toUtf8Bytes('ARENA_STAFF'))

async function main() {
    // Utils
    const Utils: ContractFactory = await ethers.getContractFactory('UtilsUint')
    const utils: any = await Utils.deploy()
    await utils.deployed()
    utilsaddr = utils.address
    console.log('Utils:', utils.address)

    Gate = await ethers.getContractFactory('Gatekeeper')
    gate = await Gate.deploy(CONTRACT_ACCOUNTS.owner, CONTRACT_ACCOUNTS.server, CONTRACT_ACCOUNTS.admins)
    await gate.deployed()
    console.log('Gate:', gate.address)

    // V1
    factory = await ethers.getContractFactory('SportyArenaV1', {
        libraries: {'UtilsUint': utils.address}
        // libraries: {'UtilsUint': ''}   // Rinkeby
    })
    const args = [INIT_GATEWAY, gate.address, CONTRACT_ACCOUNTS.holders, CONTRACT_ACCOUNTS.shares]
    contract = await upgrades.deployProxy(factory, args, {kind: 'uups'})
    await contract.deployed()
    PROXY = contract.address
    console.log('PROXY:', contract.address)
    
    
    // // Add staffer
    // const adminuser = contract.provider.getSigner(CONTRACT_ACCOUNTS.admins[0])
    // const staffaddr = randomAddressString()
    // await gate.connect(adminuser).grantRole(STAFF_ROLE, staffaddr);
    
    
    // // V2
    // factory = await ethers.getContractFactory('SportyArenaV2', {
    //     // libraries: {'UtilsUint': utilsaddr}
    //     libraries: {'UtilsUint': '0x73511669fd4dE447feD18BB79bAFeAC93aB7F31f'}
    // })
    // // contract = await upgrades.upgradeProxy(PROXY, factory)
    // contract = await upgrades.upgradeProxy('0x43ca3D2C94be00692D207C6A1e60D8B325c6f12f', factory)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
