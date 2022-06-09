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



describe('SportyChocolateV1', () => {
    let factory: ContractFactory, contract: any
    let owneruser: SignerWithAddress, adminuser: SignerWithAddress, upgraderuser: SignerWithAddress
    let foouser: SignerWithAddress, baruser: SignerWithAddress
    let tokenId: number, tokenIds: number[], gatewayId: number
    
    // const OWNER = ethers.utils.formatBytes32String('OWNER')
    // const ADMIN = ethers.utils.formatBytes32String('ADMIN')
    // const UPGRADER = ethers.utils.formatBytes32String('UPGRADER')
    const OWNER = '0x6270edb7c868f86fda4adedba75108201087268ea345934db8bad688e1feb91b'
    const ADMIN = '0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42'
    const UPGRADER = '0xa615a8afb6fffcb8c6809ac0997b5c9c12b8cc97651150f14c8f6203168cff4c'
    
    const init_contract = async () => {
        [owneruser, adminuser, upgraderuser, foouser, baruser] = await ethers.getSigners()
        
        // V1
        factory = await ethers.getContractFactory('$SportyChocolateV1', owneruser)
        contract = <SportyChocolateV1>await upgrades.deployProxy(factory, [INIT_GATEWAY], {kind: 'uups'})
        // console.log('PROXY:', contract.address)
    }
    
    const upgrade_contract = async () => {}
    
    beforeEach(async () => {
        await init_contract()
        await upgrade_contract()
    })
    
    it.only('Init', async () => {
        let token: any
        
        // Gateway
        expect(await contract.gateways(0)).equals(INIT_GATEWAY)
    
        // Roles
        {   // eslint-disable-line
            expect(await contract.hasRole(OWNER, owneruser.address)).is.true
            expect(await contract.hasRole(OWNER, adminuser.address)).is.false
            expect(await contract.hasRole(OWNER, upgraderuser.address)).is.false
            expect(await contract.hasRole(OWNER, foouser.address)).is.false
            expect(await contract.hasRole(OWNER, baruser.address)).is.false
        
            expect(await contract.hasRole(ADMIN, owneruser.address)).is.true
            expect(await contract.hasRole(ADMIN, adminuser.address)).is.true
            expect(await contract.hasRole(ADMIN, upgraderuser.address)).is.false
            expect(await contract.hasRole(ADMIN, foouser.address)).is.false
            expect(await contract.hasRole(ADMIN, baruser.address)).is.false
        
            expect(await contract.hasRole(UPGRADER, owneruser.address)).is.true
            expect(await contract.hasRole(UPGRADER, adminuser.address)).is.false
            expect(await contract.hasRole(UPGRADER, upgraderuser.address)).is.true
            expect(await contract.hasRole(UPGRADER, foouser.address)).is.false
            expect(await contract.hasRole(UPGRADER, baruser.address)).is.false
        }
    
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
    
        // Role admins
        expect(await contract.getRoleAdmin(OWNER)).equals(OWNER)
        expect(await contract.getRoleAdmin(ADMIN)).equals(OWNER)
        expect(await contract.getRoleAdmin(UPGRADER)).equals(OWNER)
    
        // Role creation
        {   // eslint-disable-line
            let user = owneruser
            expect(await contract.connect(user).grantRole(OWNER, baruser.address)).contains.keys(...TXKEYS)
            expect(await contract.connect(user).grantRole(ADMIN, baruser.address)).contains.keys(...TXKEYS)
            expect(await contract.connect(user).grantRole(UPGRADER, baruser.address)).contains.keys(...TXKEYS)
    
            // console.log(await contract.connect(baruser).grantRole(OWNER, foouser.address))
            // for(let account of [adminuser, upgraderuser, baruser]) {
            for(let account of [baruser]) {
                // await expect(contract.connect(account).grantRole(OWNER, foouser.address)).is.revertedWith(NO_ACCESS)
                // await expect(contract.connect(account).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
                // await expect(contract.connect(account).grantRole(UPGRADER, foouser.address)).is.revertedWith(NO_ACCESS)
            }
            // expect(await contract.connect(adminuser).grantRole(OWNER, foouser.address)).is.revertedWith(NO_ACCESS)
            // expect(await contract.connect(adminuser).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
            // expect(await contract.connect(adminuser).grantRole(UPGRADER, foouser.address)).is.revertedWith(NO_ACCESS)
            //
            // expect(await contract.connect(upgraderuser).grantRole(OWNER, foouser.address)).is.revertedWith(NO_ACCESS)
            // expect(await contract.connect(upgraderuser).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
            // expect(await contract.connect(upgraderuser).grantRole(UPGRADER, foouser.address)).is.revertedWith(NO_ACCESS)
    
            // expect(await contract.connect(foouser).grantRole(OWNER, foouser.address)).is.revertedWith(NO_ACCESS)
            // expect(await contract.connect(foouser).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
            // expect(await contract.connect(foouser).grantRole(UPGRADER, foouser.address)).is.revertedWith(NO_ACCESS)
    
            // expect(await contract.connect(baruser).grantRole(OWNER, foouser.address)).is.revertedWith(NO_ACCESS)
            // expect(await contract.connect(baruser).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
            // expect(await contract.connect(baruser).grantRole(UPGRADER, foouser.address)).is.revertedWith(NO_ACCESS)
        }
        // await contract.connect(owneruser).grantRole(OWNER, foouser.address)
        // await contract.connect(owneruser).grantRole(ADMIN, foouser.address)
        // await contract.connect(owneruser).grantRole(UPGRADER, foouser.address)
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
        expect(await contract.connect(owneruser).setURI(12, 1)).contains.keys(...TXKEYS)
        expect(await contract.connect(adminuser).setURI(13, 2)).contains.keys(...TXKEYS)
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
    
        // UPGRADER
        expect(await contract.connect(owneruser).access_upgrader()).equals(42)
        expect(await contract.connect(upgraderuser).access_upgrader()).equals(42)
        for(let account of [adminuser, foouser, baruser]) {
            await expect(contract.connect(account).access_upgrader()).is.revertedWith(NO_ACCESS)
        }
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
    
    it.skip('Update single token URI', async () => {
        // Require
        await expect(contract.connect(adminuser).setURI(99, 1)).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(adminuser).setURI(99, 2)).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(adminuser).setURI(0, 0)).is.revertedWith(INVALID_TOKEN)
        
        // Add new gateways
        await contract.connect(adminuser).addGateway('abc')
        await contract.connect(adminuser).addGateway('def')
        expect(await contract.connect(foouser).gateways(1)).equals('abc')
        expect(await contract.connect(foouser).gateways(2)).equals('def')
        
        tokenId = 2
        expect(await contract.connect(foouser).uri(tokenId)).equals(INIT_GATEWAY)
        await contract.connect(adminuser).setURI(tokenId, 1)
        expect(await contract.connect(foouser).uri(tokenId)).equals('abc')
    
        tokenId = 3
        expect(await contract.connect(foouser).uri(tokenId)).equals(INIT_GATEWAY)
        await contract.connect(adminuser).setURI(tokenId, 2)
        expect(await contract.connect(foouser).uri(tokenId)).equals('def')
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
    
    it('Token uri', async () => {
        await contract.connect(adminuser).addGateway("abc")
        await contract.connect(adminuser).addGateway("def")
        
        expect(await contract.connect(foouser).uri(1)).equals(INIT_GATEWAY)
        expect(await contract.connect(foouser).uri(2)).equals(INIT_GATEWAY)
    
        await contract.connect(adminuser).setURI(1, 2)
        await contract.connect(adminuser).setURI(2, 1)
        expect(await contract.connect(foouser).uri(1)).equals('def')
        expect(await contract.connect(foouser).uri(2)).equals('abc')
    
        // await contract.connect(foouser).mint(foouser.address, 101, 99, 1, 50, [])
        // expect(await contract.connect(foouser).uri(101)).equals('abc')
        //
        // await contract.connect(foouser).mint(foouser.address, 102, 99, 2, 50, [])
        // expect(await contract.connect(foouser).uri(102)).equals('def')
        //
        // await contract.connect(foouser).mint(foouser.address, 103, 99, 0, 50, [])
        // expect(await contract.connect(foouser).uri(103)).equals(INIT_GATEWAY)
        // await contract.connect(adminuser).setURI(103, 2)
        // expect(await contract.connect(foouser).uri(103)).equals('def')
    })
})