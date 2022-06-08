import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {INIT_GATEWAY} from "../scripts/deploy";                                 // eslint-disable-line
import {NO_ACCESS} from "./error_messages";                                     // eslint-disable-line



describe('SportyChocolate', () => {
    let factory: ContractFactory, contract: any
    let owneruser: SignerWithAddress, adminuser: SignerWithAddress, upgraderuser: SignerWithAddress, minteruser: SignerWithAddress
    let foouser: SignerWithAddress, baruser: SignerWithAddress
    const OWNER = ethers.utils.formatBytes32String('OWNER')
    const ADMIN = ethers.utils.formatBytes32String('ADMIN')
    const MINTER = ethers.utils.formatBytes32String('MINTER')
    const UPGRADER = ethers.utils.formatBytes32String('UPGRADER')
    
    const init_contract = async () => {
        [owneruser, adminuser, minteruser, upgraderuser, foouser, baruser] = await ethers.getSigners()
        
        // V1
        factory = await ethers.getContractFactory('SportyChocolate')
        contract = await upgrades.deployProxy(factory, [INIT_GATEWAY], {kind: 'uups'})
        // console.log('PROXY:', contract.address)
        
        // // Roles
        // await contract.grantRole(OWNER, owneruser.address)
        // await contract.grantRole(ADMIN, adminuser.address)
        // await contract.grantRole(MINTER, minteruser.address)
        // await contract.grantRole(UPGRADER, upgraderuser.address)
    }
    
    const upgrade_contract = async () => {}
    
    beforeEach(async () => {
        await init_contract()
        await upgrade_contract()
    })
    
    it.only('Init', async () => {
        console.log(owneruser.address)
        console.log(await contract.hasRole(OWNER, owneruser.address))
        // expect(await contract.connect(owneruser).hasRole(OWNER, owneruser.address)).is.true
        
        expect(await contract.gateways(0)).equals(INIT_GATEWAY)
        for(let i = 0; i < 21; i++) {
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
        expect(await contract.connect(owneruser).access_admin()).equals(42)
        expect(await contract.connect(adminuser).access_admin()).equals(42)
        for(let account of [upgraderuser, minteruser, foouser, baruser]) {
            await expect(contract.connect(account).access_admin()).is.revertedWith(NO_ACCESS)
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
})