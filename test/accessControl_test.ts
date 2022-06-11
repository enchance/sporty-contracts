import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {INIT_GATEWAY, SUPPLY} from "../scripts/deploy-sporty";                                 // eslint-disable-line
import {
    INVALID_GATEWAY,
    ZERO_AMOUNT,
    INVALID_TOKEN,
    NO_ACCESS,
    NULL_ADDRESS,
    TXKEYS
} from "./error_messages";          // eslint-disable-line
import {SportyChocolateV1} from "../typechain";                                     // eslint-disable-line
import {init_contract} from "./chocolate_test";   // eslint-disable-line

export const OWNER = '0x6270edb7c868f86fda4adedba75108201087268ea345934db8bad688e1feb91b'
export const ADMIN = '0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42'
export const UPGRADER = '0xa615a8afb6fffcb8c6809ac0997b5c9c12b8cc97651150f14c8f6203168cff4c'
export const MODERATOR = '0x58c8e11deab7910e89bf18a1168c6e6ef28748f00fd3094549459f01cec5e0aa'


describe('AccessControl', () => {
    let factory: ContractFactory, contract: any
    let owneruser: SignerWithAddress, adminuser: SignerWithAddress, upgraderuser: SignerWithAddress, moderatoruser: SignerWithAddress
    let foouser: SignerWithAddress, baruser: SignerWithAddress
    let tokenId: number, tokenIds: number[], gatewayId: number
    
    beforeEach(async () => {
        [factory, contract, owneruser, adminuser, upgraderuser, foouser, baruser, moderatoruser] = await init_contract()
    })
    
    it('Init', async () => {
        // Roles init
        expect(await contract.hasRole(OWNER, owneruser.address)).is.true
        expect(await contract.hasRole(OWNER, adminuser.address)).is.false
        expect(await contract.hasRole(OWNER, moderatoruser.address)).is.false
        expect(await contract.hasRole(OWNER, upgraderuser.address)).is.false
        expect(await contract.hasRole(OWNER, foouser.address)).is.false
        expect(await contract.hasRole(OWNER, baruser.address)).is.false
    
        expect(await contract.hasRole(ADMIN, owneruser.address)).is.true
        expect(await contract.hasRole(ADMIN, adminuser.address)).is.true
        expect(await contract.hasRole(ADMIN, moderatoruser.address)).is.false
        expect(await contract.hasRole(ADMIN, upgraderuser.address)).is.false
        expect(await contract.hasRole(ADMIN, foouser.address)).is.false
        expect(await contract.hasRole(ADMIN, baruser.address)).is.false

        expect(await contract.hasRole(MODERATOR, owneruser.address)).is.true
        expect(await contract.hasRole(MODERATOR, adminuser.address)).is.false
        expect(await contract.hasRole(MODERATOR, moderatoruser.address)).is.true
        expect(await contract.hasRole(MODERATOR, upgraderuser.address)).is.false
        expect(await contract.hasRole(MODERATOR, foouser.address)).is.false
        expect(await contract.hasRole(MODERATOR, baruser.address)).is.false
    
        expect(await contract.hasRole(UPGRADER, owneruser.address)).is.true
        expect(await contract.hasRole(UPGRADER, adminuser.address)).is.false
        expect(await contract.hasRole(UPGRADER, moderatoruser.address)).is.false
        expect(await contract.hasRole(UPGRADER, upgraderuser.address)).is.true
        expect(await contract.hasRole(UPGRADER, foouser.address)).is.false
        expect(await contract.hasRole(UPGRADER, baruser.address)).is.false
    })
    
    it('Access', async () => {
        const purge_roles = async (user: SignerWithAddress, role: any = null) => {
            if(role) await contract.connect(owneruser).revokeRole(role, user.address)
            
            expect(await contract.hasRole(OWNER, user.address)).is.false
            expect(await contract.hasRole(ADMIN, user.address)).is.false
            expect(await contract.hasRole(UPGRADER, user.address)).is.false
        }
        
        // Role admins
        expect(await contract.getRoleAdmin(OWNER)).equals(OWNER)
        expect(await contract.getRoleAdmin(ADMIN)).equals(OWNER)
        expect(await contract.getRoleAdmin(UPGRADER)).equals(OWNER)
        
        // Granting roles
        for(let account of [adminuser, upgraderuser, foouser, baruser]) {
            await expect(contract.connect(account).grantRole(OWNER, baruser.address)).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).grantRole(ADMIN, baruser.address)).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).grantRole(UPGRADER, baruser.address)).is.revertedWith(NO_ACCESS)
        }
        
        // Roles
        {   // eslint-disable-line
            await purge_roles(baruser)
            
            await contract.connect(owneruser).grantRole(OWNER, baruser.address)
            expect(await contract.connect(owneruser).hasRole(OWNER, baruser.address)).is.true
            expect(await contract.connect(owneruser).hasRole(ADMIN, baruser.address)).is.false
            expect(await contract.connect(owneruser).hasRole(UPGRADER, baruser.address)).is.false
            await purge_roles(baruser, OWNER)
            
            await contract.connect(owneruser).grantRole(ADMIN, baruser.address)
            expect(await contract.connect(owneruser).hasRole(OWNER, baruser.address)).is.false
            expect(await contract.connect(owneruser).hasRole(ADMIN, baruser.address)).is.true
            expect(await contract.connect(owneruser).hasRole(UPGRADER, baruser.address)).is.false
            await purge_roles(baruser, ADMIN)
            
            await contract.connect(owneruser).grantRole(UPGRADER, baruser.address)
            expect(await contract.connect(owneruser).hasRole(OWNER, baruser.address)).is.false
            expect(await contract.connect(owneruser).hasRole(ADMIN, baruser.address)).is.false
            expect(await contract.connect(owneruser).hasRole(UPGRADER, baruser.address)).is.true
            await purge_roles(baruser, UPGRADER)
            
            await contract.connect(owneruser).grantRole(OWNER, baruser.address)
            await contract.connect(owneruser).grantRole(ADMIN, baruser.address)
            await contract.connect(owneruser).grantRole(UPGRADER, baruser.address)
            expect(await contract.connect(owneruser).hasRole(OWNER, baruser.address)).is.true
            expect(await contract.connect(owneruser).hasRole(ADMIN, baruser.address)).is.true
            expect(await contract.connect(owneruser).hasRole(UPGRADER, baruser.address)).is.true
            
            await contract.connect(owneruser).revokeRole(OWNER, baruser.address)
            await contract.connect(owneruser).revokeRole(ADMIN, baruser.address)
            await contract.connect(owneruser).revokeRole(UPGRADER, baruser.address)
            await purge_roles(baruser)
        }
    })
})