import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {parseEther} from "ethers/lib/utils";
import {BigNumber, BigNumberish, ContractFactory, PayableOverrides} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CONTRACT_ACCOUNTS, INIT_GATEWAY, MARKET_ACCOUNT} from "../scripts/deploy-sporty";                                 // eslint-disable-line
import {
    INVALID_GATEWAY,
    ZERO_AMOUNT,
    INVALID_TOKEN,
    NO_ACCESS,
    NULL_ADDRESS,
    TXKEYS,
    INSUFFICIENT_AMOUNT,
    TOKEN_LIMIT_REACHED,
    MAX_REACHED, EMPTY_ADDRESS, MINTABLE_EXCEEDED
} from "./error_messages";          // eslint-disable-line
// import {Gatekeeper, UtilsUint} from "../typechain";          // eslint-disable-line
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

const init_contract = async () => {
    [owneruser, adminuser, staffuser, foouser, baruser, deployer] = await ethers.getSigners()
    
    // Utils
    const Utils: ContractFactory = await ethers.getContractFactory('UtilsUint', deployer)
    const utils: any = await Utils.deploy()
    await utils.deployed()
    
    // TODO: Replace with live addresses
    // Gatekeeper:
    const admins = [adminuser.address]
    const staffs = [staffuser.address]
    
    Gate = await ethers.getContractFactory('Gatekeeper', deployer)
    gate = await Gate.deploy(owneruser.address, admins, staffs)
    await gate.deployed()
    
    // V1
    let factoryOpts: FactoryOptions = {
        signer: owneruser,
        libraries: {'UtilsUint': utils.address}
    }
    // const deploymentOpts: DeployProxyOptions = {kind: 'uups'}
    const deploymentOpts: DeployProxyOptions = {kind: 'uups', unsafeAllowLinkedLibraries: true}
    const args = [INIT_GATEWAY, gate.address, [adminuser.address], [30000]]
    factory = await ethers.getContractFactory('SportyArenaV1', factoryOpts)
    contract = await upgrades.deployProxy(factory, args, deploymentOpts)
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
        await contract.connect(owneruser).tokenMapper(9, parseEther('1'), 12, 100, 0)
        await contract.connect(adminuser).tokenMapper(10, parseEther('1'), 12, 100, 0)
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
            await expect(contract.connect(account).tokenMapper(9, parseEther('1'), 12, 100, 0)).is.revertedWith(NO_ACCESS)
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
    
    it('Gateway', async () => {
        // Require
        await expect(contract.connect(adminuser).addGateway('')).is.revertedWith(INVALID_GATEWAY)
        
        expect(await contract.connect(foouser).gateways(0)).equals(INIT_GATEWAY)
        
        expect(!!(await contract.connect(foouser).gateways(1))).is.false
        await contract.connect(adminuser).addGateway('abc')
        expect(await contract.connect(foouser).gateways(1)).equals('abc')
        
        expect(!!(await contract.connect(foouser).gateways(2))).is.false
        await contract.connect(adminuser).addGateway('def')
        expect(await contract.connect(foouser).gateways(2)).equals('def')
    })
    
    it('Get token uri', async () => {
        await contract.connect(adminuser).addGateway("abc")
        await contract.connect(adminuser).addGateway("def")
        
        // // No access
        // for(let account of [upgraderuser, foouser, baruser]) {
        //     await expect(contract.connect(account).setURI(1, 2)).is.revertedWith(NO_ACCESS)
        // }
        
        expect(await contract.connect(foouser).uri(1)).equals(INIT_GATEWAY)
        expect(await contract.connect(foouser).uri(2)).equals(INIT_GATEWAY)
        
        // await contract.connect(adminuser).setURI(1, 2)
        // await contract.connect(adminuser).setURI(2, 1)
        // expect(await contract.connect(foouser).uri(1)).equals('def')
        // expect(await contract.connect(foouser).uri(2)).equals('abc')
    })
    
    it.only('Mint single token', async () => {
        // Require
        await expect(contract.connect(foouser).mint(1, 0, [])).is.revertedWith(ZERO_AMOUNT)
        await expect(contract.connect(foouser).mint(1, 16, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await expect(contract.connect(adminuser).mint(1, 46, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await expect(contract.connect(foouser).mint(1234543, 1, [])).is.revertedWith(INVALID_TOKEN)
        
        // Test _mintable here
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(15)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 2)).equals(15)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(39)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 2)).equals(91)

        await contract.connect(adminuser).addGateway('abc')
        await contract.connect(adminuser).addGateway('def')

        expect(await contract.connect(foouser).exists(1)).is.true
        expect(await contract.connect(foouser).exists(2)).is.true
        expect(await contract.connect(foouser).exists(3)).is.false

        // Insufficient value
        await expect(contract.connect(foouser).mint(1, 3, [], {value: parseEther('.29')})).is.revertedWith(INSUFFICIENT_AMOUNT)
        await expect(contract.connect(foouser).mint(2, 3, [], {value: parseEther('.44')})).is.revertedWith(INSUFFICIENT_AMOUNT)
    
        await contract.connect(foouser).mint(1, 3, [], {value: parseEther('.3')})
        await contract.connect(foouser).mint(2, 5, [], {value: parseEther('.75')})
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(12)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 2)).equals(10)

        await contract.connect(adminuser).mint(1, 1, [])
        await contract.connect(adminuser).mint(2, 5, [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(35)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 2)).equals(81)

        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(12)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 2)).equals(10)

        await contract.connect(foouser).mint(1, 2, [], {value: parseEther('.2')})
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(10)

        // Start minting so it's == limit (10 remaining)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(33)
        await contract.connect(adminuser).mint(1, 23, [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(10)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(10)

        // Start minting so it's < limit (10 remaining)
        await contract.connect(adminuser).mint(1, 2, [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(8)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(8)

        await expect(contract.connect(foouser).mint(1, 9, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await contract.connect(foouser).mint(1, 1, [], {value: parseEther('.1')})
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(7)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(7)

        await expect(contract.connect(adminuser).mint(1, 8, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await contract.connect(adminuser).mint(1, 7, [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(0)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(0)

        // Nothing left to mint
        await expect(contract.connect(adminuser).mint(1, 1, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await expect(contract.connect(foouser).mint(1, 1, [])).is.revertedWith(MINTABLE_EXCEEDED)
        
        // Mint paying higher than the total amount
        await contract.connect(foouser).mint(3, 1, [], {value: parseEther('1.000000000001')})
        await contract.connect(foouser).mint(4, 1, [], {value: parseEther('1.300000000001')})
    })
    
})