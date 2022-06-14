// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers, upgrades} from "hardhat";
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";
import {randomAddressString} from "hardhat/internal/hardhat-network/provider/fork/random";
import {keccak256, toUtf8Bytes} from "ethers/lib/utils";



export const CONTRACT_ACCOUNTS: any = {
    owner: '0xEC615ad1Be355D16163bc2dDCb359788Bc93ED44',        // indexOWNER
    admins: [
        // Recipient accounts
        '0xFF01E7B2329BBd74bb1d28B75164eB7DCAbDD8F3',           // JIM
        '0x1fd0515D45B2d1b8f12df35Eb3a16f3B95C1eCDf',           // PIERRE
        randomAddressString(),                                                     // MIKE
    ],
    shares: [2400, 3400, 3400],
    market: '0xD07A0C38C6c4485B97c53b883238ac05a14a85D6'        // indexMARKET
}
CONTRACT_ACCOUNTS.holders = CONTRACT_ACCOUNTS.admins

export const INIT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/QmQLLDpXH9DiVvjjzmfoyaM1bBrso6wheS57f67ubqw3C7/{id}.json'
export const MARKET_ACCOUNT = CONTRACT_ACCOUNTS.market

let owneruser: SignerWithAddress
let factory: ContractFactory, contract: any
let Gate: ContractFactory, gate: any
export const STAFF_ROLE = keccak256(toUtf8Bytes('ARENA_STAFF'))

async function main() {
    // Utils
    const Utils: ContractFactory = await ethers.getContractFactory('UtilsUint')
    const utils: any = await Utils.deploy()
    await utils.deployed()
    console.log('Utils:', utils.address)
    
    Gate = await ethers.getContractFactory('Gatekeeper')
    gate = await Gate.deploy(CONTRACT_ACCOUNTS.owner, CONTRACT_ACCOUNTS.admins)
    await gate.deployed()
    console.log('Gate:', gate.address)
    
    // V1
    factory = await ethers.getContractFactory('SportyArenaV1', {
        libraries: {'UtilsUint': utils.address}
    })
    const args = [INIT_GATEWAY, gate.address, CONTRACT_ACCOUNTS.holders, CONTRACT_ACCOUNTS.shares]
    contract = await upgrades.deployProxy(factory, args, {kind: 'uups'})
    await contract.deployed()
    console.log('PROXY:', contract.address)
    
    // // Add staffer: works but not needed right now
    // const adminuser = contract.provider.getSigner(CONTRACT_ACCOUNTS.admins[0])
    // const staffaddr = randomAddressString()
    // await gate.connect(adminuser).grantRole(STAFF_ROLE, staffaddr);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
