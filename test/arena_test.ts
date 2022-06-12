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
import {Gatekeeper, UtilsUint} from "../typechain";          // eslint-disable-line
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";                                     // eslint-disable-line



let factory: ContractFactory, contract: any
let Gate: ContractFactory, gate: Gatekeeper
let owneruser: SignerWithAddress, adminuser: SignerWithAddress, moduser: SignerWithAddress
let arenauser: SignerWithAddress, foouser: SignerWithAddress, baruser: SignerWithAddress
let tokenId: number, tokenIds: number[], gatewayId: number
export const MARKET_ACCOUNT = '0xD07A0C38C6c4485B97c53b883238ac05a14a85D6'
const admins = ['0x70997970C51812dc3A010C7d01b50e0d17dc79C8']
const mods = ['0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC']

export const init_contract = async () => {
    [owneruser, adminuser, moduser, arenauser, foouser, baruser] = await ethers.getSigners()
    
    // Utils
    const Utils: ContractFactory = await ethers.getContractFactory('UtilsUint', owneruser)
    const utils: any = await Utils.deploy()
    // console.log('UtilsUint:', utilsuint.address)
    
    // Gatkekeeper
    Gate = await ethers.getContractFactory('$Gatekeeper', owneruser)
    gate = <Gatekeeper>await Gate.deploy(admins, mods)
    // console.log('Gatekeeper:', gate.address)
    
    // V1
    // https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-external-libraries
    // https://ethereum.stackexchange.com/questions/85061/hardhat-error-unresolved-libraries-but-why
    const opts: FactoryOptions = {
        signer: owneruser,
        libraries: {'UtilsUint': utils.address}
    }
    factory = await ethers.getContractFactory('$SportyArenaV1', opts)
    contract = await upgrades.deployProxy(factory, [INIT_GATEWAY], {kind: 'uups', unsafeAllowLinkedLibraries: true})
    // console.log('PROXY:', contract.address)
    
    return [factory, contract, Gate, gate, owneruser, adminuser, moduser, arenauser, foouser, baruser]
}

describe('SportyChocolateV1', () => {
    
    beforeEach(async () => {
        await init_contract()
    })
    
    // it.only('Init', async () => {
    //     let token: any
    //
    //     // Gateway
    //     expect(await contract.gateways(0)).equals(INIT_GATEWAY)
    //
    //     // Token mapping
    //     {   // eslint-disable-line
    //         token = await contract.connect(foouser).tokenProps(1)
    //         expect(token.price).equals(parseEther('.1'))
    //         expect(token.limit).equals(15)
    //         expect(token.gatewayId).equals(0)
    //         expect(token.max).equals(45)
    //
    //         token = await contract.connect(foouser).tokenProps(2)
    //         expect(token.price).equals(parseEther('.15'))
    //         expect(token.limit).equals(15)
    //         expect(token.gatewayId).equals(0)
    //         expect(token.max).equals(100)
    //
    //         token = await contract.connect(foouser).tokenProps(3)
    //         expect(token.price).equals(parseEther('1'))
    //         expect(token.limit).equals(15)
    //         expect(token.gatewayId).equals(0)
    //         expect(token.max).equals(45)
    //
    //         token = await contract.connect(foouser).tokenProps(4)
    //         expect(token.price).equals(parseEther('1.3'))
    //         expect(token.limit).equals(15)
    //         expect(token.gatewayId).equals(0)
    //         expect(token.max).equals(45)
    //
    //         token = await contract.connect(foouser).tokenProps(5)
    //         expect(token.price).equals(0)
    //         expect(token.limit).equals(0)
    //         expect(token.gatewayId).equals(0)
    //         expect(token.max).equals(0)
    //     }
    //
    //     // Mint
    //     expect(await contract.connect(foouser).exists(1)).is.true
    //     expect(await contract.connect(foouser).exists(2)).is.true
    //     expect(await contract.connect(foouser).exists(3)).is.false
    //     expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 1)).equals(6)
    //     expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 2)).equals(9)
    //     expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 3)).equals(0)
    // })
    //
    // it('REQUIRE', async () => {
    //     // // OWNER
    //     // expect(await contract.connect(owneruser).access_owner()).equals(42)
    //     // for(let account of [adminuser, upgraderuser, foouser, baruser]) {
    //     //     await expect(contract.connect(account).access_owner()).is.revertedWith(NO_ACCESS)
    //     // }
    //
    //     // ADMIN
    //     await contract.connect(owneruser).addGateway("aaa")
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
    //     // for(let account of [upgraderuser, foouser, baruser]) {
    //     //     await expect(contract.connect(account).addGateway("abc")).is.revertedWith(NO_ACCESS)
    //     //     // await expect(contract.connect(account).setURI(1, 0)).is.revertedWith(NO_ACCESS)
    //     //     // await expect(contract.connect(account).setURIBatch([2, 3], 1)).is.revertedWith(NO_ACCESS)
    //     //     // await expect(contract.connect(account).mint(foouser.address, 110, 99, 0, 50, [])).is.revertedWith(NO_ACCESS)
    //     //     // await expect(contract.connect(account).mintBatch(foouser.address, [111, 112], [99, 50], 0, 50, [])).is.revertedWith(NO_ACCESS)
    //     // }
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
    // })
    
})