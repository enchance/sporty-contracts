import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {INIT_GATEWAY, SUPPLY} from "../scripts/deploy-sporty";                                 // eslint-disable-line
import {
    EMPTY_STRING,
    INVALID_MINT_AMOUNT,
    INVALID_TOKEN,
    NO_ACCESS,
    NULL_ADDRESS,
    TXKEYS
} from "./error_messages";          // eslint-disable-line
import {SportyChocolateV1} from "../typechain";                                     // eslint-disable-line



let factory: ContractFactory, contract: any
let owneruser: SignerWithAddress, adminuser: SignerWithAddress, upgraderuser: SignerWithAddress
let foouser: SignerWithAddress, baruser: SignerWithAddress
let tokenId: number, tokenIds: number[], gatewayId: number

export const init_contract = async () => {
    [owneruser, adminuser, upgraderuser, foouser, baruser] = await ethers.getSigners()
    
    // V1
    factory = await ethers.getContractFactory('$SportyChocolateV1', owneruser)
    contract = <SportyChocolateV1>await upgrades.deployProxy(factory, [INIT_GATEWAY], {kind: 'uups'})
    // console.log('PROXY:', contract.address)
    
    return [factory, contract, owneruser, adminuser, upgraderuser, foouser, baruser]
}

describe('SportyChocolateV1', () => {
    
    beforeEach(async () => {
        await init_contract()
    })
    
    it('Init', async () => {
        let token: any
    
        // Gateway
        expect(await contract.gateways(0)).equals(INIT_GATEWAY)
    
        // Token mapping
        for(let i = 1; i <= 2; i++) {
            token = await contract.connect(foouser).tokenProps(1)
            expect(token.price).equals(ethers.utils.parseEther('.1'))
            expect(token.limit).equals(50)
            expect(token.gatewayId).equals(0)
    
            token = await contract.connect(foouser).tokenProps(2)
            expect(token.price).equals(ethers.utils.parseEther('.15'))
            expect(token.limit).equals(50)
            expect(token.gatewayId).equals(0)
        }
        
        // Mint
        expect(await contract.exists(1)).is.true
        expect(await contract.exists(2)).is.true
        expect(await contract.exists(3)).is.false
    })
    
    it('ACCESS CONTROL', async () => {
        // OWNER
        expect(await contract.connect(owneruser).access_owner()).equals(42)
        for(let account of [adminuser, upgraderuser, foouser, baruser]) {
            await expect(contract.connect(account).access_owner()).is.revertedWith(NO_ACCESS)
        }
        
        // ADMIN
        expect(await contract.connect(owneruser).addGateway("aaa")).contains.keys(...TXKEYS)
        expect(await contract.connect(adminuser).addGateway("bbb")).contains.keys(...TXKEYS)
        expect(await contract.connect(owneruser).setURI(2, 1)).contains.keys(...TXKEYS)
        expect(await contract.connect(adminuser).setURI(3, 2)).contains.keys(...TXKEYS)
        expect(await contract.connect(owneruser).setURIBatch([14, 15], 2)).contains.keys(...TXKEYS)
        expect(await contract.connect(adminuser).setURIBatch([14, 15], 2)).contains.keys(...TXKEYS)
        // expect(await contract.connect(owneruser).mint(foouser.address, 101, 99, 0, 50, [])).contains.keys(...TXKEYS)
        //     .to.emit(contract, 'TransferSingle').withArgs(owneruser, NULL_ADDRESS, foouser.address, 99, [])
        // expect(await contract.connect(foouser).mint(foouser.address, 102, 99, 0, 50,
        // [])).contains.keys(...TXKEYS)
        //     .to.emit(contract, 'TransferSingle').withArgs(adminuser, NULL_ADDRESS, foouser.address, 99, [])
        // expect(await contract.connect(owneruser).mintBatch(foouser.address, [103, 104], [99, 50], 0, 50, [])).contains.keys(...TXKEYS)
        //     .to.emit(contract, 'TransferBatch').withArgs(owneruser, NULL_ADDRESS, foouser.address, [103, 104], [99, 50], [])
        // expect(await contract.connect(foouser).mintBatch(foouser.address, [105, 106], [99, 50], 0,
        // 50, [])).contains.keys(...TXKEYS)
        //     .to.emit(contract, 'TransferBatch').withArgs(adminuser, NULL_ADDRESS, foouser.address, [105, 106], [99, 50], [])
        
        for(let account of [upgraderuser, foouser, baruser]) {
            await expect(contract.connect(account).addGateway("abc")).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).setURI(1, 0)).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).setURIBatch([2, 3], 1)).is.revertedWith(NO_ACCESS)
            // await expect(contract.connect(account).mint(foouser.address, 110, 99, 0, 50, [])).is.revertedWith(NO_ACCESS)
            // await expect(contract.connect(account).mintBatch(foouser.address, [111, 112], [99, 50], 0, 50, [])).is.revertedWith(NO_ACCESS)
        }
    
        // // UPGRADER
        // expect(await contract.connect(owneruser).access_upgrader()).equals(42)
        // expect(await contract.connect(upgraderuser).access_upgrader()).equals(42)
        // for(let account of [adminuser, foouser, baruser]) {
        //     await expect(contract.connect(account).access_upgrader()).is.revertedWith(NO_ACCESS)
        // }
    })
    
    it('Gateway', async () => {
        // Require
        await expect(contract.connect(adminuser).addGateway("")).is.revertedWith(EMPTY_STRING)
        
        expect(await contract.connect(foouser).gateways(0)).equals(INIT_GATEWAY)
        
        expect(!!(await contract.connect(foouser).gateways(1))).is.false
        await contract.connect(adminuser).addGateway("abc")
        expect(await contract.connect(foouser).gateways(1)).equals("abc")

        expect(!!(await contract.connect(foouser).gateways(2))).is.false
        await contract.connect(adminuser).addGateway("def")
        expect(await contract.connect(foouser).gateways(2)).equals("def")
    })
    
    it('Token uri', async () => {
        await contract.connect(adminuser).addGateway("abc")
        await contract.connect(adminuser).addGateway("def")
        
        // No access
        for(let account of [upgraderuser, foouser, baruser]) {
            await expect(contract.connect(account).setURI(1, 2)).is.revertedWith(NO_ACCESS)
        }
        
        expect(await contract.connect(foouser).uri(1)).equals(INIT_GATEWAY)
        expect(await contract.connect(foouser).uri(2)).equals(INIT_GATEWAY)
        
        await contract.connect(adminuser).setURI(1, 2)
        await contract.connect(adminuser).setURI(2, 1)
        expect(await contract.connect(foouser).uri(1)).equals('def')
        expect(await contract.connect(foouser).uri(2)).equals('abc')
    })
    
    it('Update single token URI', async () => {
        // Require
        await expect(contract.connect(adminuser).setURI(99, 1)).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(adminuser).setURI(99, 2)).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(adminuser).setURI(0, 0)).is.revertedWith(INVALID_TOKEN)
        
        // Add new gateways
        await contract.connect(adminuser).addGateway('abc')
        await contract.connect(adminuser).addGateway('def')
        expect(await contract.connect(foouser).gateways(1)).equals('abc')
        expect(await contract.connect(foouser).gateways(2)).equals('def')
        
        tokenId = 1
        expect(await contract.connect(foouser).uri(tokenId)).equals(INIT_GATEWAY)
        await contract.connect(adminuser).setURI(tokenId, 2)
        expect(await contract.connect(foouser).uri(tokenId)).equals('def')

        tokenId = 2
        expect(await contract.connect(foouser).uri(tokenId)).equals(INIT_GATEWAY)
        await contract.connect(adminuser).setURI(tokenId, 1)
        expect(await contract.connect(foouser).uri(tokenId)).equals('abc')
        await contract.connect(adminuser).setURI(tokenId, 0)
        expect(await contract.connect(foouser).uri(tokenId)).equals(INIT_GATEWAY)
    })
    
    it.skip('Update multiple token URI', async () => {
        // Require
        await expect(contract.connect(adminuser).setURI([2, 3], 1)).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(adminuser).setURI([2, 3], 2)).is.revertedWith(EMPTY_STRING)
        
        // Add new gateways
        await contract.connect(adminuser).addGateway('abc')
        await contract.connect(adminuser).addGateway('def')
        expect(await contract.connect(foouser).gateways(1)).equals('abc')
        expect(await contract.connect(foouser).gateways(2)).equals('def')
        
        tokenIds = [2, 3]
        expect(await contract.connect(foouser).uri(tokenIds[0])).equals(INIT_GATEWAY)
        expect(await contract.connect(foouser).uri(tokenIds[1])).equals(INIT_GATEWAY)
        
        await contract.connect(adminuser).setURIBatch(tokenIds, 1)
        expect(await contract.connect(foouser).uri(tokenIds[0])).equals('abc')
        expect(await contract.connect(foouser).uri(tokenIds[1])).equals('abc')

        await contract.connect(adminuser).setURIBatch(tokenIds, 2)
        expect(await contract.connect(foouser).uri(tokenIds[0])).equals('def')
        expect(await contract.connect(foouser).uri(tokenIds[1])).equals('def')
    })
    
    it.skip('Mint single token', async () => {
        // Require
        await expect(contract.connect(foouser).mint(foouser.address, 101, 0, 0, 50, [])).is.revertedWith(INVALID_MINT_AMOUNT)
        await expect(contract.connect(foouser).mint(foouser.address, 101, 99, 1, 50, [])).is.revertedWith(EMPTY_STRING)
    
        await contract.connect(adminuser).addGateway('abc')
        expect(await contract.connect(adminuser).exists(1)).is.true
        
        expect(await contract.connect(adminuser).exists(101)).is.false
        expect(await contract.connect(foouser).mint(foouser.address, 101, 99, 1, 50, [])).contains.keys(...TXKEYS)
            .to.emit(contract, 'TransferSingle').withArgs(adminuser, NULL_ADDRESS, foouser.address, 99, [])
        expect(await contract.connect(adminuser).exists(101)).is.true
        
        expect(await contract.connect(foouser).uri(101)).equals('abc')
        expect(await contract.connect(foouser).totalSupply(101)).equals(99)
    
        expect(await contract.connect(adminuser).exists(200)).is.false
        expect(await contract.connect(foouser).mint(foouser.address, 200, 99, 1, 50, [])).contains.keys(...TXKEYS)
            .to.emit(contract, 'TransferSingle').withArgs(adminuser, NULL_ADDRESS, foouser.address, 99, [])
        expect(await contract.connect(adminuser).exists(200)).is.true
        
        expect(await contract.connect(foouser).uri(200)).equals('abc')
        expect(await contract.connect(foouser).totalSupply(200)).equals(99)
    })
    
    it.skip('Mint batch tokens', async () => {
        // Require
        await expect(contract.connect(foouser).mintBatch(foouser.address, [101, 102], [99, 50], 1, 50, [])).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(foouser).mintBatch(foouser.address, [101, 102], [99, 50], 2, 50, [])).is.revertedWith(EMPTY_STRING)
    
        await contract.connect(adminuser).addGateway('abc')
        await contract.connect(adminuser).addGateway('def')
    
        expect(await contract.connect(adminuser).exists(101)).is.false
        expect(await contract.connect(adminuser).exists(102)).is.false
        expect(await contract.connect(foouser).mintBatch(foouser.address, [101, 102], [99, 50], 0, 50, [])).contains.keys(...TXKEYS)
            .to.emit(contract, 'TransferBatch').withArgs(owneruser, NULL_ADDRESS, foouser.address, [101, 102], [99, 50], [])
        
        expect(await contract.connect(foouser).exists(101)).is.true
        expect(await contract.connect(foouser).exists(102)).is.true
        expect(await contract.connect(foouser).totalSupply(101)).equals(99)
        expect(await contract.connect(foouser).totalSupply(102)).equals(50)
        
        expect(await contract.connect(foouser).exists(200)).is.false
        expect(await contract.connect(foouser).exists(300)).is.false
        expect(await contract.connect(foouser).mintBatch(foouser.address, [200, 300], [99, 50], 0, 50, [])).contains.keys(...TXKEYS)
            .to.emit(contract, 'TransferBatch').withArgs(owneruser, NULL_ADDRESS, foouser.address, [200, 300], [99, 50], [])
    
        expect(await contract.connect(foouser).exists(200)).is.true
        expect(await contract.connect(foouser).exists(300)).is.true
        expect(await contract.connect(foouser).totalSupply(200)).equals(99)
        expect(await contract.connect(foouser).totalSupply(300)).equals(50)
    })
    
})