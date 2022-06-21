import { expect } from "chai";
import {ethers, upgrades, testUtils} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {keccak256, parseEther, toUtf8Bytes} from "ethers/lib/utils";
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CONTRACT_ACCOUNTS, INIT_GATEWAY, MARKET_ACCOUNT} from "../scripts/deploy-sporty";                                 // eslint-disable-line
import {NO_ACCESS, NULL_ADDRESS, EMPTY_ADDRESS} from "./error_messages";          // eslint-disable-line
import {randomAddressString} from "hardhat/internal/hardhat-network/provider/fork/random";



let deployer: SignerWithAddress, owneruser: SignerWithAddress, adminuser: SignerWithAddress, staffuser: SignerWithAddress
let foouser: SignerWithAddress, baruser: SignerWithAddress, serveruser: SignerWithAddress
let factory: ContractFactory, contract: any
let Gate: ContractFactory, gate: any
let utilsaddr: string, PROXY: string

/*
* NOTES:
* https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-external-libraries
* https://ethereum.stackexchange.com/questions/85061/hardhat-error-unresolved-libraries-but-why
*  */
const init_contract = async () => {
    [owneruser, adminuser, staffuser, foouser, baruser, serveruser] = await ethers.getSigners()
    
    // Utils
    const Utils: ContractFactory = await ethers.getContractFactory('UtilsUint')
    const utils: any = await Utils.deploy()
    await utils.deployed()
    utilsaddr = utils.address

    // Gatekeeper:
    Gate = await ethers.getContractFactory('Gatekeeper')
    gate = await Gate.deploy(owneruser.address, serveruser.address, [adminuser.address])
    await gate.deployed()

    // V1
    factory = await ethers.getContractFactory('PunchOutV1')
    let args = [gate.address]
    contract = await upgrades.deployProxy(factory, args, {kind: 'uups'})
    await contract.deployed()
    PROXY = contract.address
}

const upgrade_contract = async () => {}

describe('PunchOut', () => {
    
    beforeEach(async () => {
        await init_contract()
        await upgrade_contract()
    })

    it('Init', async () => {
        // Gatekeeper
        expect(await contract.gk()).equals(gate.address)
    })

    it('REVERT', async () => {
        // ADMIN
        await contract.connect(owneruser).setGatekeeper(gate.address)
        for(let account of [staffuser, foouser, baruser, serveruser]) {
            await expect(contract.connect(account).setGatekeeper(gate.address)).is.revertedWith(NO_ACCESS)
        }
    })
    
    it('Gatekeeeper', async () => {
        // Require
        await expect(contract.connect(owneruser).setGatekeeper(NULL_ADDRESS)).is.revertedWith(EMPTY_ADDRESS)

        expect(await contract.connect(foouser).gk()).equals(gate.address)

        let addr = randomAddressString()
        await contract.connect(owneruser).setGatekeeper(addr)
        expect((await contract.connect(foouser).gk()).toLowerCase()).equals(addr)
    })
})