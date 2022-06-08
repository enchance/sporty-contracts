import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {INIT_GATEWAY, SUPPLY} from "../scripts/deploy";                                 // eslint-disable-line
import {EMPTY_STRING, INVALID_TOKEN, NO_ACCESS, TXKEYS} from "./error_messages";                                     // eslint-disable-line



describe('SportyChocolate', () => {
    let factory: ContractFactory, contract: any
    let owneruser: SignerWithAddress, adminuser: SignerWithAddress, upgraderuser: SignerWithAddress, minteruser: SignerWithAddress
    let foouser: SignerWithAddress, baruser: SignerWithAddress
    let tokenId: number, tokenIds: number[], gatewayId: number
    const OWNER = ethers.utils.formatBytes32String('OWNER')
    const ADMIN = ethers.utils.formatBytes32String('ADMIN')
    const MINTER = ethers.utils.formatBytes32String('MINTER')
    const UPGRADER = ethers.utils.formatBytes32String('UPGRADER')
    
    const init_contract = async () => {
        [owneruser, adminuser, minteruser, upgraderuser, foouser, baruser] = await ethers.getSigners()
        
        // V1
        factory = await ethers.getContractFactory('SportyChocolate')
        contract = await upgrades.deployProxy(factory, [INIT_GATEWAY, SUPPLY], {kind: 'uups'})
        // console.log('PROXY:', contract.address)
    }
    
    const upgrade_contract = async () => {}
    
    beforeEach(async () => {
        await init_contract()
        await upgrade_contract()
    })
    
    it('Init', async () => {
        expect(await contract.gateways(0)).equals(INIT_GATEWAY)
        for(let i = 1; i <= 100; i++) {
            expect(await contract.balanceOf(owneruser.address, i)).equals(100000)
        }
    })
    
    it('Access Control', async () => {
        // OWNER
        expect(await contract.connect(owneruser).access_owner()).equals(42)
        for(let account of [adminuser, upgraderuser, minteruser, foouser, baruser]) {
            await expect(contract.connect(account).access_owner()).is.revertedWith(NO_ACCESS)
        }
        
        // ADMIN
        // expect(await contract.connect(owneruser).access_admin()).equals(42)
        // expect(await contract.connect(adminuser).access_admin()).equals(42)
        expect(await contract.connect(owneruser).addGateway("aaa")).contains.keys(...TXKEYS)
        expect(await contract.connect(adminuser).addGateway("bbb")).contains.keys(...TXKEYS)
        for(let account of [upgraderuser, minteruser, foouser, baruser]) {
            // await expect(contract.connect(account).access_admin()).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).addGateway("abc")).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).setURI(1, 0)).is.revertedWith(NO_ACCESS)
        }
    
        // MINTER
        expect(await contract.connect(owneruser).access_minter()).equals(42)
        expect(await contract.connect(minteruser).access_minter()).equals(42)
        for(let account of [adminuser, upgraderuser, foouser, baruser]) {
            await expect(contract.connect(account).access_minter()).is.revertedWith(NO_ACCESS)
        }
    
        // UPGRADER
        expect(await contract.connect(owneruser).access_upgrader()).equals(42)
        expect(await contract.connect(upgraderuser).access_upgrader()).equals(42)
        for(let account of [adminuser, minteruser, foouser, baruser]) {
            await expect(contract.connect(account).access_upgrader()).is.revertedWith(NO_ACCESS)
        }
    })
    
    it('Gateway', async () => {
        expect(await contract.connect(foouser).gateways(0)).equals(INIT_GATEWAY)
        
        expect(!!(await contract.connect(foouser).gateways(1))).is.false
        await contract.connect(adminuser).addGateway("abc")
        expect(await contract.connect(foouser).gateways(1)).equals("abc")
        
        expect(!!(await contract.connect(foouser).gateways(2))).is.false
        await expect(contract.connect(adminuser).addGateway("")).is.revertedWith(EMPTY_STRING)
        expect(!!(await contract.connect(foouser).gateways(2))).is.false
    })
    
    it('Update single token URI', async () => {
        // Require
        await expect(contract.connect(adminuser).setURI(99, 1)).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(adminuser).setURI(99, 2)).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(adminuser).setURI(0, 0)).is.revertedWith(INVALID_TOKEN)
        
        // Add new gateways
        await contract.connect(adminuser).addGateway('abc')
        expect(await contract.connect(foouser).gateways(1)).equals('abc')
        await contract.connect(adminuser).addGateway('def')
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
    
    it('Update multiple token URI', async () => {
        // Require
        await expect(contract.connect(adminuser).setURI([2, 3], 1)).is.revertedWith(EMPTY_STRING)
        await expect(contract.connect(adminuser).setURI([2, 3], 2)).is.revertedWith(EMPTY_STRING)
        
        // Add new gateways
        await contract.connect(adminuser).addGateway('abc')
        expect(await contract.connect(foouser).gateways(1)).equals('abc')
        await contract.connect(adminuser).addGateway('def')
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
    
    it('Mint single token', async () => {
    
    })
})