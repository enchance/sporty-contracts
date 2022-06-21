import { expect } from "chai";
import {ethers, upgrades} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {INVALID_ADMIN, INVALID_ROLE, NO_ACCESS} from "./error_messages";          // eslint-disable-line
import {keccak256, toUtf8Bytes} from "ethers/lib/utils";            // eslint-disable-line



let gkuser: SignerWithAddress, adminuser: SignerWithAddress, staffuser: SignerWithAddress, owneruser: SignerWithAddress
let foouser: SignerWithAddress, baruser: SignerWithAddress, serveruser: SignerWithAddress
let Gate: ContractFactory, gate: any

// keccack256 encoded from contract
const GKOWNER = keccak256(toUtf8Bytes('OWNER'))
const CONTRACT = keccak256(toUtf8Bytes('CONTRACT'))
const OWNER = keccak256(toUtf8Bytes('ARENA_OWNER'))
const ADMIN = keccak256(toUtf8Bytes('ARENA_ADMIN'))
const STAFF = keccak256(toUtf8Bytes('ARENA_STAFF'))
const SERVER = keccak256(toUtf8Bytes('ARENA_SERVER'))

const init_contract = async () => {
    [owneruser, adminuser, staffuser, foouser, baruser, gkuser, serveruser] = await ethers.getSigners()
    
    const admins = [adminuser.address]
    // const staffs = [staffuser.address]
    
    Gate = await ethers.getContractFactory('Gatekeeper', gkuser)
    gate = await Gate.deploy(owneruser.address, serveruser.address, admins)
    await gate.deployed()
}

describe('Gatekeeper', () => {
    
    beforeEach(async () => {
        await init_contract()
        
        // Add a staff
        await gate.connect(adminuser).grantRole(STAFF, staffuser.address);
    })
    
    // it('Test', async () => {
    //     // console.log('OWNER', await gate.OWNER())
    //     // console.log('ARENA_OWNER', await gate.gkroles('ARENA_OWNER'))
    //     // console.log('ARENA_ADMIN', await gate.gkroles('ARENA_ADMIN'))
    //     // console.log('ARENA_STAFF', await gate.gkroles('ARENA_STAFF'))
    //     // console.log('CONTRACT', await gate.gkroles('CONTRACT'))
    //     // console.log(await gate.getKeccak256('ARENA_STAFF'))
    // })
    
    it('Init', async () => {
        {   // eslint-disable-line
            // Roles init
            expect(await gate.connect(foouser).hasRole(GKOWNER, gkuser.address)).is.true
            expect(await gate.connect(foouser).hasRole(GKOWNER, owneruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(GKOWNER, adminuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(GKOWNER, staffuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(GKOWNER, foouser.address)).is.false
            expect(await gate.connect(foouser).hasRole(GKOWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(GKOWNER, serveruser.address)).is.false
            
            expect(await gate.connect(foouser).hasRole(CONTRACT, gkuser.address)).is.true
            expect(await gate.connect(foouser).hasRole(CONTRACT, owneruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, adminuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, staffuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, foouser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, serveruser.address)).is.false

            expect(await gate.connect(foouser).hasRole(OWNER, gkuser.address)).is.true
            expect(await gate.connect(foouser).hasRole(OWNER, owneruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(OWNER, adminuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, staffuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, foouser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, serveruser.address)).is.false

            expect(await gate.connect(foouser).hasRole(ADMIN, gkuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, owneruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(ADMIN, adminuser.address)).is.true
            expect(await gate.connect(foouser).hasRole(ADMIN, staffuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, foouser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, serveruser.address)).is.false
    
            expect(await gate.connect(foouser).hasRole(STAFF, gkuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, owneruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(STAFF, adminuser.address)).is.true
            expect(await gate.connect(foouser).hasRole(STAFF, staffuser.address)).is.true
            expect(await gate.connect(foouser).hasRole(STAFF, foouser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, serveruser.address)).is.false
    
            expect(await gate.connect(foouser).hasRole(SERVER, gkuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, owneruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(SERVER, adminuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, staffuser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, foouser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, serveruser.address)).is.true
        }
    })
    
    it('Access', async () => {
        const purge_roles = async (user: SignerWithAddress, role: any = null, acct: any = owneruser) => {
            if(role) await gate.connect(acct).revokeRole(role, user.address)

            expect(await gate.connect(foouser).hasRole(GKOWNER, user.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, user.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, user.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, user.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, user.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, user.address)).is.false
        }

        // Role admins
        expect(await gate.getRoleAdmin(GKOWNER)).equals(GKOWNER)
        expect(await gate.getRoleAdmin(CONTRACT)).equals(GKOWNER)
        expect(await gate.getRoleAdmin(OWNER)).equals(GKOWNER)
        expect(await gate.getRoleAdmin(ADMIN)).equals(OWNER)
        expect(await gate.getRoleAdmin(STAFF)).equals(ADMIN)
        expect(await gate.getRoleAdmin(SERVER)).equals(OWNER)

        // Granting roles
        for(let account of [adminuser, staffuser, foouser, baruser, serveruser]) {
            await expect(gate.connect(account).grantRole(GKOWNER, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(CONTRACT, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(OWNER, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(SERVER, foouser.address)).is.revertedWith(NO_ACCESS)
            
            if(account.address !== adminuser.address) {
                await expect(gate.connect(account).grantRole(STAFF, foouser.address)).is.revertedWith(NO_ACCESS)
            }
    
            if(account.address !== serveruser.address || account.address !== owneruser.address) {
                await expect(gate.connect(account).grantRole(SERVER, foouser.address)).is.revertedWith(NO_ACCESS)
            }
        }
        await expect(gate.connect(owneruser).grantRole(GKOWNER, foouser.address)).is.revertedWith(NO_ACCESS)
        await expect(gate.connect(owneruser).grantRole(CONTRACT, foouser.address)).is.revertedWith(NO_ACCESS)

            // Roles
        {   // eslint-disable-line
            await purge_roles(baruser)

            await gate.connect(gkuser).grantRole(GKOWNER, baruser.address)
            expect(await gate.connect(foouser).hasRole(GKOWNER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, baruser.address)).is.false
            await purge_roles(baruser, GKOWNER, gkuser)

            await gate.connect(gkuser).grantRole(CONTRACT, baruser.address)
            expect(await gate.connect(foouser).hasRole(GKOWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, baruser.address)).is.false
            await purge_roles(baruser, CONTRACT, gkuser)

            await gate.connect(gkuser).grantRole(OWNER, baruser.address)
            expect(await gate.connect(foouser).hasRole(GKOWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, baruser.address)).is.false
            await purge_roles(baruser, OWNER, gkuser)

            await gate.connect(owneruser).grantRole(ADMIN, baruser.address)
            expect(await gate.connect(foouser).hasRole(GKOWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, baruser.address)).is.false
            await purge_roles(baruser, ADMIN)

            await gate.connect(adminuser).grantRole(STAFF, baruser.address)
            expect(await gate.connect(foouser).hasRole(GKOWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(SERVER, baruser.address)).is.false
            await purge_roles(baruser, STAFF)
    
            await gate.connect(owneruser).grantRole(SERVER, baruser.address)
            expect(await gate.connect(foouser).hasRole(GKOWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(SERVER, baruser.address)).is.true
            await purge_roles(baruser, SERVER)

            await gate.connect(gkuser).grantRole(GKOWNER, baruser.address)
            await gate.connect(gkuser).grantRole(CONTRACT, baruser.address)
            await gate.connect(gkuser).grantRole(OWNER, baruser.address)
            await gate.connect(owneruser).grantRole(ADMIN, baruser.address)
            await gate.connect(adminuser).grantRole(STAFF, baruser.address)
            await gate.connect(owneruser).grantRole(SERVER, baruser.address)
            expect(await gate.connect(foouser).hasRole(GKOWNER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(OWNER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(STAFF, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(SERVER, baruser.address)).is.true

            // Manual revoking
            await gate.connect(gkuser).revokeRole(GKOWNER, baruser.address)
            await gate.connect(gkuser).revokeRole(CONTRACT, baruser.address)
            await gate.connect(gkuser).revokeRole(OWNER, baruser.address)
            await gate.connect(owneruser).revokeRole(ADMIN, baruser.address)
            await gate.connect(adminuser).revokeRole(STAFF, baruser.address)
            await gate.connect(owneruser).revokeRole(SERVER, baruser.address)
            await purge_roles(baruser)
        }
    })
    
    it('Role Management', async () => {
        // Reequire
        await expect(gate.connect(gkuser).addRole('', 'ARENA_STAFF', [])).is.revertedWith(INVALID_ROLE)
        await expect(gate.connect(gkuser).addRole('OWNER', 'ARENA_STAFF', [])).is.revertedWith(INVALID_ROLE)
        await expect(gate.connect(gkuser).addRole('CONTRACT', 'ARENA_STAFF', [])).is.revertedWith(INVALID_ROLE)
        await expect(gate.connect(gkuser).addRole('ARENA_OWNER', 'ARENA_STAFF', [])).is.revertedWith(INVALID_ROLE)
        await expect(gate.connect(gkuser).addRole('ARENA_ADMIN', 'ARENA_STAFF', [])).is.revertedWith(INVALID_ROLE)
        await expect(gate.connect(gkuser).addRole('ARENA_STAFF', 'ARENA_STAFF', [])).is.revertedWith(INVALID_ROLE)
        await expect(gate.connect(gkuser).addRole('ARENA_SERVER', 'ARENA_STAFF', [])).is.revertedWith(INVALID_ROLE)

        await expect(gate.connect(gkuser).addRole('AAA', 'XXX', [])).is.revertedWith(INVALID_ADMIN)

        for(let account of [adminuser, staffuser, owneruser, serveruser]) {
            await expect(gate.connect(account).addRole('AAA', 'XXX', [])).is.revertedWith(NO_ACCESS)
        }

        const FOO = keccak256(toUtf8Bytes('FOO'))
        await gate.connect(gkuser).addRole('FOO', 'ARENA_STAFF', [foouser.address])
        expect(await gate.connect(foouser).hasRole(FOO, foouser.address)).is.true
        expect(await gate.connect(foouser).hasRole(FOO, baruser.address)).is.false

        await gate.connect(staffuser).grantRole(FOO, baruser.address)
        expect(await gate.connect(foouser).hasRole(FOO, baruser.address)).is.true
        expect(await gate.connect(foouser).hasRole(FOO, foouser.address)).is.true

        for(let account of [foouser, baruser]) {
            await expect(gate.connect(account).revokeRole(FOO, baruser.address)).is.revertedWith(NO_ACCESS)
        }

        await gate.connect(staffuser).revokeRole(FOO, baruser.address)
        expect(await gate.connect(foouser).hasRole(FOO, owneruser.address)).is.false
        expect(await gate.connect(foouser).hasRole(FOO, adminuser.address)).is.false
        expect(await gate.connect(foouser).hasRole(FOO, staffuser.address)).is.false
        expect(await gate.connect(foouser).hasRole(FOO, foouser.address)).is.true
        expect(await gate.connect(foouser).hasRole(FOO, baruser.address)).is.false
        expect(await gate.connect(foouser).hasRole(FOO, serveruser.address)).is.false
    })
})