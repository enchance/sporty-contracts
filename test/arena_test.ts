import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {parseEther} from "ethers/lib/utils";
import {BigNumber, BigNumberish, ContractFactory, PayableOverrides} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {INIT_GATEWAY, SUPPLY} from "../scripts/deploy-sporty";                                 // eslint-disable-line
import {
    INVALID_GATEWAY,
    ZERO_AMOUNT,
    INVALID_TOKEN,
    NO_ACCESS,
    NULL_ADDRESS,
    TXKEYS,
    EXACT_AMOUNT,
    TOKEN_LIMIT_REACHED,
    MAX_REACHED, EMPTY_ADDRESS
} from "./error_messages";          // eslint-disable-line
import {Gatekeeper, UtilsUint} from "../typechain";          // eslint-disable-line
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";
import {DeployProxyOptions} from "@openzeppelin/hardhat-upgrades/dist/utils";




let deployer: SignerWithAddress, adminuser: SignerWithAddress, staffuser: SignerWithAddress, owneruser: SignerWithAddress
let foouser: SignerWithAddress, baruser: SignerWithAddress
let factory: ContractFactory, contract: any
let Gate: ContractFactory, gate: any
let tokenId: number, tokenIds: number[], gatewayId: number
const random_addr = '0x3E034Dc9b877E103eB5E29102133503CdFdA60C5'

/*
* NOTES:
* https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-external-libraries
* https://ethereum.stackexchange.com/questions/85061/hardhat-error-unresolved-libraries-but-why
*  */

export const init_contract = async () => {
    [owneruser, adminuser, staffuser, foouser, baruser, deployer] = await ethers.getSigners()
    
    // Utils
    const Utils: ContractFactory = await ethers.getContractFactory('UtilsUint', deployer)
    const utils: any = await Utils.deploy()
    await utils.deployed()
    
    // Gatekeeper
    const admins = [adminuser.address]
    const staffs = [staffuser.address]
    
    Gate = await ethers.getContractFactory('Gatekeeper', deployer)
    gate = <Gatekeeper>await Gate.deploy(owneruser.address, admins, staffs)
    await gate.deployed()
    
    // V1
    let factoryOpts: FactoryOptions = {
        signer: owneruser,
        libraries: {'UtilsUint': utils.address}
    }
    const deploymentOpts: DeployProxyOptions = {kind: 'uups', unsafeAllowLinkedLibraries: true}
    factory = await ethers.getContractFactory('SportyArenaV1', factoryOpts)
    contract = await upgrades.deployProxy(factory, [INIT_GATEWAY, gate.address], deploymentOpts)
    // console.log('PROXY:', contract.address)
    
    return [factory, contract, owneruser, adminuser, staffuser, foouser, baruser, deployer, Gate, gate]
}

describe('SportyArenaV1', () => {
    
    beforeEach(async () => {
        await init_contract()
    })
    
    it('Init', async () => {
        let token: any
    
        // Gatekeeper
        expect(await contract.gk()).equals(gate.address)
        
        // Gateway
        expect(await contract.connect(foouser).gateways(0)).equals(INIT_GATEWAY)
        
        // Token mapping
        {   // eslint-disable-line
            token = await contract.connect(foouser).tokenProps(1)
            expect(token.price).equals(parseEther('.1'))
            expect(token.limit).equals(15)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(45)

            token = await contract.connect(foouser).tokenProps(2)
            expect(token.price).equals(parseEther('.15'))
            expect(token.limit).equals(15)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(100)

            token = await contract.connect(foouser).tokenProps(3)
            expect(token.price).equals(parseEther('1'))
            expect(token.limit).equals(15)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(45)

            token = await contract.connect(foouser).tokenProps(4)
            expect(token.price).equals(parseEther('1.3'))
            expect(token.limit).equals(15)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(45)

            token = await contract.connect(foouser).tokenProps(5)
            expect(token.price).equals(0)
            expect(token.limit).equals(0)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(0)
        }

        // // Mint
        // expect(await contract.connect(foouser).exists(1)).is.true
        // expect(await contract.connect(foouser).exists(2)).is.true
        // expect(await contract.connect(foouser).exists(3)).is.false
        // expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 1)).equals(6)
        // expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 2)).equals(9)
        // expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 3)).equals(0)
    })
    
    it('REQUIRE', async () => {
    //     // // OWNER
    //     // expect(await contract.connect(owneruser).access_owner()).equals(42)
    //     // for(let account of [adminuser, upgraderuser, foouser, baruser]) {
    //     //     await expect(contract.connect(account).access_owner()).is.revertedWith(NO_ACCESS)
    //     // }
    //
        // ADMIN
        await contract.connect(owneruser).setGatekeeper(gate.address)
        await contract.connect(adminuser).setGatekeeper(gate.address)
        await contract.connect(owneruser).addGateway("aaa")
        await contract.connect(adminuser).addGateway("aaa")
    //     // expect(await contract.connect(adminuser).addGateway("bbb")).contains.keys(...TXKEYS)
    //     // expect(await contract.connect(owneruser).setURI(1, 1)).contains.keys(...TXKEYS)
    //     // expect(await contract.connect(adminuser).setURI(2, 2)).contains.keys(...TXKEYS)
    //     // expect(await contract.connect(owneruser).setURIBatch([1, 2], 1)).contains.keys(...TXKEYS)
    //     // expect(await contract.connect(adminuser).setURIBatch([2, 1], 2)).contains.keys(...TXKEYS)
    //     // expect(await contract.connect(owneruser).mint(foouser.address, 101, 99, 0, 50, [])).contains.keys(...TXKEYS)
    //     //     .to.emit(contract, 'TransferSingle').withArgs(owneruser, NULL_ADDRESS, foouser.address, 99, [])
    //     // expect(await contract.connect(foouser).mint(102, 99, 0, 50,
    //     // [])).contains.keys(...TXKEYS)
    //     //     .to.emit(contract, 'TransferSingle').withArgs(adminuser, NULL_ADDRESS, foouser.address, 99, [])
    //     // expect(await contract.connect(owneruser).mintBatch(foouser.address, [103, 104], [99, 50], 0, 50, [])).contains.keys(...TXKEYS)
    //     //     .to.emit(contract, 'TransferBatch').withArgs(owneruser, NULL_ADDRESS, foouser.address, [103, 104], [99, 50], [])
    //     // expect(await contract.connect(foouser).mintBatch(foouser.address, [105, 106], [99, 50], 0,
    //     // 50, [])).contains.keys(...TXKEYS)
    //     //     .to.emit(contract, 'TransferBatch').withArgs(adminuser, NULL_ADDRESS, foouser.address, [105, 106], [99, 50], [])
    //
        for(let account of [foouser, baruser, deployer]) {
            await expect(contract.connect(account).setGatekeeper(gate.address)).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).addGateway("abc")).is.revertedWith(NO_ACCESS)
            // await expect(contract.connect(account).setURI(1, 0)).is.revertedWith(NO_ACCESS)
            // await expect(contract.connect(account).setURIBatch([2, 3], 1)).is.revertedWith(NO_ACCESS)
            // await expect(contract.connect(account).mint(foouser.address, 110, 99, 0, 50, [])).is.revertedWith(NO_ACCESS)
            // await expect(contract.connect(account).mintBatch(foouser.address, [111, 112], [99, 50], 0, 50, [])).is.revertedWith(NO_ACCESS)
        }
    //
    //     // // UPGRADER
    //     // expect(await contract.connect(owneruser).access_upgrader()).equals(42)
    //     // expect(await contract.connect(upgraderuser).access_upgrader()).equals(42)
    //     // for(let account of [adminuser, foouser, baruser]) {
    //     //     await expect(contract.connect(account).access_upgrader()).is.revertedWith(NO_ACCESS)
    //     // }
    // })
    //
    // it('Gateway', async () => {
    //     // Require
    //     await expect(contract.connect(adminuser).addGateway('')).is.revertedWith(INVALID_GATEWAY)
    //
    //     expect(await contract.connect(foouser).gateways(0)).equals(INIT_GATEWAY)
    //
    //     expect(!!(await contract.connect(foouser).gateways(1))).is.false
    //     await contract.connect(adminuser).addGateway('abc')
    //     expect(await contract.connect(foouser).gateways(1)).equals('abc')
    //
    //     expect(!!(await contract.connect(foouser).gateways(2))).is.false
    //     await contract.connect(adminuser).addGateway('def')
    //     expect(await contract.connect(foouser).gateways(2)).equals('def')
    // })
    //
    // it('Get token uri', async () => {
    //     await contract.connect(adminuser).addGateway("abc")
    //     await contract.connect(adminuser).addGateway("def")
    //
    //     // // No access
    //     // for(let account of [upgraderuser, foouser, baruser]) {
    //     //     await expect(contract.connect(account).setURI(1, 2)).is.revertedWith(NO_ACCESS)
    //     // }
    //
    //     expect(await contract.connect(foouser).uri(1)).equals(INIT_GATEWAY)
    //     expect(await contract.connect(foouser).uri(2)).equals(INIT_GATEWAY)
    //
    //     // await contract.connect(adminuser).setURI(1, 2)
    //     // await contract.connect(adminuser).setURI(2, 1)
    //     // expect(await contract.connect(foouser).uri(1)).equals('def')
    //     // expect(await contract.connect(foouser).uri(2)).equals('abc')
    })
    
    it('Gatekeeeper', async () => {
        expect(await contract.connect(foouser).gk()).equals(gate.address)
        
        await contract.connect(adminuser).setGatekeeper(random_addr)
        expect(await contract.connect(foouser).gk()).equals(random_addr)
    })
    
})