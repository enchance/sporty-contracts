import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {NO_ACCESS} from "./error_messages";          // eslint-disable-line
import {Gatekeeper} from "../typechain";            // eslint-disable-line



let deployer: SignerWithAddress, adminuser: SignerWithAddress, staffuser: SignerWithAddress, owneruser: SignerWithAddress
let foouser: SignerWithAddress, baruser: SignerWithAddress
let Gate: ContractFactory, gate: Gatekeeper
const placeholder_pierre = '0x3E034Dc9b877E103eB5E29102133503CdFdA60C5'
const placeholder_mike = '0x56309A15842aF14Ef52082310D26E4517D861aCB'

// keccack256 encoded from contract
const GATEKEEPER = '0x20162831d2f54c3e11eebafebfeda495d4c52c67b1708251179ec91fb76dd3b2'
const OWNER = '0x454a3a013ea9e0b2d5e1451792f05ce025fa8ba403b44105a1b4cb941455ea51'
const ADMIN = '0x13973373a9af5722b10f2b3042b579b88ed0bb52a97cedfe3f04194bd4f49d37'
const STAFF = '0xe8a5916b3844fbeb4da4e395e80063c5f78b2b5014688c8d370cb7e4499a6e1d'
const CONTRACT = '0xa89e6fb581bf21fa2623f4ddc917bd8cec5dc18f1960a95bf5bede67bf5192ca'

const init_contract = async () => {
    [owneruser, adminuser, staffuser, foouser, baruser, deployer] = await ethers.getSigners()
    
    const admins = [adminuser.address]
    const staffs = [staffuser.address]
    
    Gate = await ethers.getContractFactory('Gatekeeper', deployer)
    gate = <Gatekeeper>await Gate.deploy(owneruser.address, admins, staffs)
    await gate.deployed()
}

describe('Gatekeeper', () => {
    
    beforeEach(async () => {
        await init_contract()
    })
    
    it('Init', async () => {
        // console.log('GATEKEEPER', await gate.GATEKEEPER())
        // console.log('ARENA_OWNER', await gate.gkroles('ARENA_OWNER'))
        // console.log('ARENA_ADMIN', await gate.gkroles('ARENA_ADMIN'))
        // console.log('ARENA_STAFF', await gate.gkroles('ARENA_STAFF'))
        // console.log('ARENA_CONTRACT', await gate.gkroles('ARENA_CONTRACT'))
        
        {   // eslint-disable-line
            // Roles init
            expect(await gate.hasRole(GATEKEEPER, deployer.address)).is.true
            expect(await gate.hasRole(GATEKEEPER, owneruser.address)).is.false
            expect(await gate.hasRole(GATEKEEPER, adminuser.address)).is.false
            expect(await gate.hasRole(GATEKEEPER, staffuser.address)).is.false
            expect(await gate.hasRole(GATEKEEPER, foouser.address)).is.false
            expect(await gate.hasRole(GATEKEEPER, baruser.address)).is.false

            expect(await gate.hasRole(OWNER, deployer.address)).is.false
            expect(await gate.hasRole(OWNER, owneruser.address)).is.true
            expect(await gate.hasRole(OWNER, adminuser.address)).is.false
            expect(await gate.hasRole(OWNER, staffuser.address)).is.false
            expect(await gate.hasRole(OWNER, foouser.address)).is.false
            expect(await gate.hasRole(OWNER, baruser.address)).is.false

            expect(await gate.hasRole(ADMIN, deployer.address)).is.false
            expect(await gate.hasRole(ADMIN, owneruser.address)).is.true
            expect(await gate.hasRole(ADMIN, adminuser.address)).is.true
            expect(await gate.hasRole(ADMIN, staffuser.address)).is.false
            expect(await gate.hasRole(ADMIN, foouser.address)).is.false
            expect(await gate.hasRole(ADMIN, baruser.address)).is.false

            expect(await gate.hasRole(STAFF, deployer.address)).is.false
            expect(await gate.hasRole(STAFF, owneruser.address)).is.true
            expect(await gate.hasRole(STAFF, adminuser.address)).is.false
            expect(await gate.hasRole(STAFF, staffuser.address)).is.true
            expect(await gate.hasRole(STAFF, foouser.address)).is.false
            expect(await gate.hasRole(STAFF, baruser.address)).is.false

            expect(await gate.hasRole(CONTRACT, deployer.address)).is.false
            expect(await gate.hasRole(CONTRACT, owneruser.address)).is.true
            expect(await gate.hasRole(CONTRACT, adminuser.address)).is.false
            expect(await gate.hasRole(CONTRACT, staffuser.address)).is.false
            expect(await gate.hasRole(CONTRACT, foouser.address)).is.false
            expect(await gate.hasRole(CONTRACT, baruser.address)).is.false
        }
    })
    
    it('Access', async () => {
        const purge_roles = async (user: SignerWithAddress, role: any = null, acct: any = owneruser) => {
            if(role) await gate.connect(acct).revokeRole(role, user.address)
        
            expect(await gate.hasRole(GATEKEEPER, user.address)).is.false
            expect(await gate.hasRole(OWNER, user.address)).is.false
            expect(await gate.hasRole(ADMIN, user.address)).is.false
            expect(await gate.hasRole(STAFF, user.address)).is.false
            expect(await gate.hasRole(CONTRACT, user.address)).is.false
        }
        
        // Role admins
        expect(await gate.getRoleAdmin(GATEKEEPER)).equals(GATEKEEPER)
        expect(await gate.getRoleAdmin(OWNER)).equals(GATEKEEPER)
        expect(await gate.getRoleAdmin(ADMIN)).equals(OWNER)
        expect(await gate.getRoleAdmin(STAFF)).equals(ADMIN)
        expect(await gate.getRoleAdmin(CONTRACT)).equals(OWNER)
        
        // Granting roles
        for(let account of [adminuser, staffuser, foouser, baruser]) {
            await expect(gate.connect(account).grantRole(GATEKEEPER, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(OWNER, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(CONTRACT, foouser.address)).is.revertedWith(NO_ACCESS)
            
            if(account.address !== adminuser.address) {
                await expect(gate.connect(account).grantRole(STAFF, foouser.address)).is.revertedWith(NO_ACCESS)
            }
        }
        for(let account of [deployer, owneruser]) {
            if(account.address !== deployer.address) {
                await expect(gate.connect(account).grantRole(GATEKEEPER, foouser.address)).is.revertedWith(NO_ACCESS)
                await expect(gate.connect(account).grantRole(OWNER, foouser.address)).is.revertedWith(NO_ACCESS)
            }
            if(account.address !== owneruser.address) {
                await expect(gate.connect(account).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
                await expect(gate.connect(account).grantRole(CONTRACT, foouser.address)).is.revertedWith(NO_ACCESS)
                await expect(gate.connect(account).grantRole(STAFF, foouser.address)).is.revertedWith(NO_ACCESS)
            }
        }
        
            // Roles
        {   // eslint-disable-line
            await purge_roles(baruser)

            await gate.connect(deployer).grantRole(GATEKEEPER, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            await purge_roles(baruser, GATEKEEPER, deployer)
    
            await gate.connect(deployer).grantRole(OWNER, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            await purge_roles(baruser, OWNER, deployer)

            await gate.connect(owneruser).grantRole(ADMIN, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            await purge_roles(baruser, ADMIN)

            await gate.connect(adminuser).grantRole(STAFF, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            await purge_roles(baruser, STAFF, adminuser)

            await gate.connect(deployer).grantRole(GATEKEEPER, baruser.address)
            await gate.connect(deployer).grantRole(OWNER, baruser.address)
            await gate.connect(owneruser).grantRole(ADMIN, baruser.address)
            await gate.connect(adminuser).grantRole(STAFF, baruser.address)
            await gate.connect(owneruser).grantRole(CONTRACT, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.true

            // Manual revoking
            await gate.connect(deployer).revokeRole(GATEKEEPER, baruser.address)
            await gate.connect(deployer).revokeRole(OWNER, baruser.address)
            await gate.connect(owneruser).revokeRole(ADMIN, baruser.address)
            await gate.connect(adminuser).revokeRole(STAFF, baruser.address)
            await gate.connect(owneruser).revokeRole(CONTRACT, baruser.address)
            await purge_roles(baruser)
        }
    })
})