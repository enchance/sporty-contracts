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
    MAX_REACHED
} from "./error_messages";          // eslint-disable-line
import {Gatekeeper} from "../typechain";          // eslint-disable-line
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";
import {deploy, DeployProxyOptions} from "@openzeppelin/hardhat-upgrades/dist/utils";




let Gate: ContractFactory, gate: Gatekeeper
let deployer: SignerWithAddress, adminuser: SignerWithAddress, moduser: SignerWithAddress
let foouser: SignerWithAddress, baruser: SignerWithAddress

// keccack256 encoded from contract
const GATEKEEPER = '0x20162831d2f54c3e11eebafebfeda495d4c52c67b1708251179ec91fb76dd3b2'
const CONTRACT = '0xa89e6fb581bf21fa2623f4ddc917bd8cec5dc18f1960a95bf5bede67bf5192ca'
const ADMIN = '0x13973373a9af5722b10f2b3042b579b88ed0bb52a97cedfe3f04194bd4f49d37'
const MODERATOR = '0xf7117ee2abd32176c8fdc9b1f9bef1f4d6f55a8ec1811118629d0df76287625a'

export const init_contract = async () => {
    [deployer, adminuser, moduser, foouser, baruser] = await ethers.getSigners()
    
    Gate = await ethers.getContractFactory('$Gatekeeper', deployer)
    gate = <Gatekeeper>await Gate.deploy([adminuser.address], [moduser.address])
    await gate.deployed()
}

describe('Gatekeeper', () => {
    
    beforeEach(async () => {
        await init_contract()
    })
    
    it('Init', async () => {
        {   // eslint-disable-line
            // Roles init
            expect(await gate.hasRole(GATEKEEPER, deployer.address)).is.true
            expect(await gate.hasRole(GATEKEEPER, adminuser.address)).is.false
            expect(await gate.hasRole(GATEKEEPER, moduser.address)).is.false
            expect(await gate.hasRole(GATEKEEPER, foouser.address)).is.false
            expect(await gate.hasRole(GATEKEEPER, baruser.address)).is.false
            
            expect(await gate.hasRole(ADMIN, deployer.address)).is.true
            expect(await gate.hasRole(ADMIN, adminuser.address)).is.true
            expect(await gate.hasRole(ADMIN, moduser.address)).is.false
            expect(await gate.hasRole(ADMIN, foouser.address)).is.false
            expect(await gate.hasRole(ADMIN, baruser.address)).is.false

            expect(await gate.hasRole(MODERATOR, deployer.address)).is.true
            expect(await gate.hasRole(MODERATOR, adminuser.address)).is.false
            expect(await gate.hasRole(MODERATOR, moduser.address)).is.true
            expect(await gate.hasRole(MODERATOR, foouser.address)).is.false
            expect(await gate.hasRole(MODERATOR, baruser.address)).is.false
            
            expect(await gate.hasRole(CONTRACT, deployer.address)).is.true
            expect(await gate.hasRole(CONTRACT, adminuser.address)).is.false
            expect(await gate.hasRole(CONTRACT, moduser.address)).is.false
            expect(await gate.hasRole(CONTRACT, foouser.address)).is.false
            expect(await gate.hasRole(CONTRACT, baruser.address)).is.false
        }
    })
    
    it('Access', async () => {
        const purge_roles = async (user: SignerWithAddress, role: any = null) => {
            if(role) await gate.connect(deployer).revokeRole(role, user.address)
        
            expect(await gate.hasRole(GATEKEEPER, user.address)).is.false
            expect(await gate.hasRole(ADMIN, user.address)).is.false
            expect(await gate.hasRole(MODERATOR, user.address)).is.false
            expect(await gate.hasRole(CONTRACT, user.address)).is.false
        }
        
        // Role admins
        expect(await gate.getRoleAdmin(GATEKEEPER)).equals(GATEKEEPER)
        expect(await gate.getRoleAdmin(ADMIN)).equals(GATEKEEPER)
        expect(await gate.getRoleAdmin(MODERATOR)).equals(ADMIN)
        expect(await gate.getRoleAdmin(CONTRACT)).equals(GATEKEEPER)
        
        // Granting roles
        for(let account of [adminuser, moduser, foouser, baruser]) {
            await expect(gate.connect(account).grantRole(GATEKEEPER, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(ADMIN, foouser.address)).is.revertedWith(NO_ACCESS)
            await expect(gate.connect(account).grantRole(CONTRACT, foouser.address)).is.revertedWith(NO_ACCESS)
            
            if(account.address !== adminuser.address) {
                await expect(gate.connect(account).grantRole(MODERATOR, foouser.address)).is.revertedWith(NO_ACCESS)
            }
        }

        // Roles
        {   // eslint-disable-line
            await purge_roles(baruser)

            await gate.connect(deployer).grantRole(GATEKEEPER, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(MODERATOR, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            await purge_roles(baruser, GATEKEEPER)

            await gate.connect(deployer).grantRole(ADMIN, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(MODERATOR, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(MODERATOR, baruser.address)).is.false
            await purge_roles(baruser, ADMIN)

            await gate.connect(deployer).grantRole(MODERATOR, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.false
            expect(await gate.connect(foouser).hasRole(MODERATOR, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.false
            await purge_roles(baruser, MODERATOR)

            await gate.connect(deployer).grantRole(GATEKEEPER, baruser.address)
            await gate.connect(deployer).grantRole(ADMIN, baruser.address)
            await gate.connect(deployer).grantRole(MODERATOR, baruser.address)
            await gate.connect(deployer).grantRole(CONTRACT, baruser.address)
            expect(await gate.connect(foouser).hasRole(GATEKEEPER, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(ADMIN, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(MODERATOR, baruser.address)).is.true
            expect(await gate.connect(foouser).hasRole(CONTRACT, baruser.address)).is.true

            // Manual revoking
            await gate.connect(deployer).revokeRole(GATEKEEPER, baruser.address)
            await gate.connect(deployer).revokeRole(ADMIN, baruser.address)
            await gate.connect(deployer).revokeRole(MODERATOR, baruser.address)
            await gate.connect(deployer).revokeRole(CONTRACT, baruser.address)
            await purge_roles(baruser)
        }
    })
})