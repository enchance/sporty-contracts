import { expect } from "chai";
import {ethers, upgrades, testUtils} from "hardhat";
import {describe} from "mocha";                                                 // eslint-disable-line
import {keccak256, parseEther, toUtf8Bytes} from "ethers/lib/utils";
import {BigNumber, BigNumberish, ContractFactory, PayableOverrides} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {CONTRACT_ACCOUNTS, INIT_GATEWAY, MARKET_ACCOUNT} from "../scripts/deploy-sporty";                                 // eslint-disable-line
import {
    INVALID_GATEWAY,
    ZERO_AMOUNT,
    INVALID_TOKEN,
    NO_ACCESS,
    NULL_ADDRESS,
    TXKEYS,
    INSUFFICIENT_AMOUNT,
    TOKEN_LIMIT_REACHED,
    MAX_REACHED,
    EMPTY_ADDRESS,
    MINTABLE_EXCEEDED,
    INVALID_LENGTH,
    WINDOW_CLOSED,
    INACTIVE_HOLDER,
    INVALID_ARRAY_LENGTHS, DECREASING_LIMIT, DECREASING_MAX, LARGE_LIMIT
} from "./error_messages";          // eslint-disable-line
// import {Gatekeeper, UtilsUint} from "../typechain";          // eslint-disable-line
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";
import {DeployProxyOptions} from "@openzeppelin/hardhat-upgrades/dist/utils";
import {randomAddressString} from "hardhat/internal/hardhat-network/provider/fork/random";
import {STAFF_ROLE} from "../scripts/deploy-sporty";                // eslint-disable-line



let deployer: SignerWithAddress, owneruser: SignerWithAddress, adminuser: SignerWithAddress, staffuser: SignerWithAddress
let foouser: SignerWithAddress, baruser: SignerWithAddress
let factory: ContractFactory, contract: any
let Gate: ContractFactory, gate: any
let utilsaddr: string, PROXY: string

/*
* NOTES:
* https://docs.openzeppelin.com/upgrades-plugins/1.x/faq#why-cant-i-use-external-libraries
* https://ethereum.stackexchange.com/questions/85061/hardhat-error-unresolved-libraries-but-why
*  */

const init_contract = async () => {
    [owneruser, adminuser, staffuser, foouser, baruser] = await ethers.getSigners()
    
    // Utils
    const Utils: ContractFactory = await ethers.getContractFactory('UtilsUint')
    const utils: any = await Utils.deploy()
    await utils.deployed()
    utilsaddr = utils.address
    
    // Gatekeeper:
    Gate = await ethers.getContractFactory('Gatekeeper')
    gate = await Gate.deploy(owneruser.address, [adminuser.address])
    await gate.deployed()

    // V1
    const holders = [adminuser.address]
    factory = await ethers.getContractFactory('SportyArenaV1', {
        libraries: {'UtilsUint': utilsaddr}
    })
    const args = [INIT_GATEWAY, gate.address, holders, [3000]]
    contract = await upgrades.deployProxy(factory, args, {kind: 'uups'})
    await contract.deployed()
    PROXY = contract.address
}

const upgrade_contract = async () => {
    factory = await ethers.getContractFactory('SportyArenaV2', {
        libraries: {'UtilsUint': utilsaddr}
    })
    contract = await upgrades.upgradeProxy(PROXY, factory)
}

describe('SportyArena', () => {
    
    beforeEach(async () => {
        await init_contract()
        await upgrade_contract()
    
        // Add staffer
        await gate.connect(adminuser).grantRole(STAFF_ROLE, staffuser.address);
    })
    
    it('Upgrades', async () => {
        expect(await contract.connect(foouser).foo()).equals(789)
    })
    
    it('Init', async () => {
        let token: any
    
        // Gatekeeper
        expect(await contract.gk()).equals(gate.address)
        
        // Gateway
        expect(await contract.connect(foouser).gateways(0)).equals(INIT_GATEWAY)
        
        // Token mapping
        {   // eslint-disable-line
            token = await contract.connect(foouser).tokenProps(1)
            expect(token.price).equals(parseEther('.1'))
            expect(token.limit).equals(15)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(45)

            token = await contract.connect(foouser).tokenProps(2)
            expect(token.price).equals(parseEther('.15'))
            expect(token.limit).equals(15)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(100)

            token = await contract.connect(foouser).tokenProps(3)
            expect(token.price).equals(parseEther('1'))
            expect(token.limit).equals(15)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(45)

            token = await contract.connect(foouser).tokenProps(4)
            expect(token.price).equals(parseEther('1.3'))
            expect(token.limit).equals(15)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(45)

            token = await contract.connect(foouser).tokenProps(5)
            expect(token.price).equals(0)
            expect(token.limit).equals(0)
            expect(token.gatewayId).equals(0)
            expect(token.max).equals(0)
        }

        // // Mint
        // expect(await contract.connect(foouser).exists(1)).is.true
        // expect(await contract.connect(foouser).exists(2)).is.true
        // expect(await contract.connect(foouser).exists(3)).is.false
        // expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 1)).equals(6)
        // expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 2)).equals(9)
        // expect(await contract.connect(foouser).balanceOf(MARKET_ACCOUNT, 3)).equals(0)
    })
    
    it('REVERT', async () => {
        // ADMIN
        await contract.connect(owneruser).setGatekeeper(gate.address)
        await contract.connect(owneruser).addGateway("aaa")
        await contract.connect(adminuser).addGateway("aaa")
        await contract.connect(owneruser).tokenMapper(9, parseEther('1'), 12, 100, 0)
        await contract.connect(adminuser).tokenMapper(10, parseEther('1'), 12, 100, 0)
        for(let account of [adminuser, staffuser, foouser, baruser]) {
            await expect(contract.connect(account).setGatekeeper(gate.address)).is.revertedWith(NO_ACCESS)
            if(account.address !== adminuser.address){
                await expect(contract.connect(account).addGateway("abc")).is.revertedWith(NO_ACCESS)
                await expect(contract.connect(account).tokenMapper(9, parseEther('1'), 12, 100, 0)).is.revertedWith(NO_ACCESS)
            }
        }
        
        // STAFF
        await contract.connect(owneruser).updateTokenMaps([1, 2], [16, 16], [46, 101])
        await contract.connect(adminuser).updateTokenMaps([1, 2], [17, 17], [47, 102])
        await contract.connect(staffuser).updateTokenMaps([1, 2], [18, 18], [48, 103])
        await contract.connect(owneruser).updateTokenGateway(1, 0)
        await contract.connect(adminuser).updateTokenGateway(1, 0)
        await contract.connect(staffuser).updateTokenGateway(1, 0)
        await contract.connect(owneruser).updateTokenGatewayBatch([1, 2], 0)
        await contract.connect(adminuser).updateTokenGatewayBatch([1, 2], 0)
        await contract.connect(staffuser).updateTokenGatewayBatch([1, 2], 0)
        for(let account of [foouser, baruser]) {
            await expect(contract.connect(account).updateTokenMaps([1, 2], [19, 19], [49, 104])).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).updateTokenGateway(1, 0)).is.revertedWith(NO_ACCESS)
            await expect(contract.connect(account).updateTokenGatewayBatch([1, 2], 0)).is.revertedWith(NO_ACCESS)
        }
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
    })
    
    it('Gatekeeeper', async () => {
        // Require
        await expect(contract.connect(owneruser).setGatekeeper(NULL_ADDRESS)).is.revertedWith(EMPTY_ADDRESS)
        
        expect(await contract.connect(foouser).gk()).equals(gate.address)
        
        let addr = randomAddressString()
        await contract.connect(owneruser).setGatekeeper(addr)
        expect((await contract.connect(foouser).gk()).toLowerCase()).equals(addr)
    })
    
    it('Gateway', async () => {
        // Require
        await expect(contract.connect(adminuser).addGateway('')).is.revertedWith(INVALID_GATEWAY)
        
        expect(await contract.connect(foouser).gateways(0)).equals(INIT_GATEWAY)
        
        expect(!!(await contract.connect(foouser).gateways(1))).is.false
        await contract.connect(adminuser).addGateway('abc')
        expect(await contract.connect(foouser).gateways(1)).equals('abc')
        
        expect(!!(await contract.connect(foouser).gateways(2))).is.false
        await contract.connect(adminuser).addGateway('def')
        expect(await contract.connect(foouser).gateways(2)).equals('def')
    })
    
    it('Token gateway', async () => {
        let token: any
        await contract.connect(adminuser).addGateway('abc')
        await contract.connect(adminuser).addGateway('def')
    
        await contract.connect(staffuser).updateTokenGateway(1, 1)
        token = await contract.connect(foouser).tokenProps(1)
        expect(token.gatewayId).equals(1)
    
        await contract.connect(staffuser).updateTokenGateway(1, 2)
        token = await contract.connect(foouser).tokenProps(1)
        expect(token.gatewayId).equals(2)
    
        await contract.connect(staffuser).updateTokenGateway(1, 0)
        token = await contract.connect(foouser).tokenProps(1)
        expect(token.gatewayId).equals(0)
    
        await contract.connect(staffuser).updateTokenGatewayBatch([1, 2], 1)
        token = await contract.connect(foouser).tokenProps(1)
        expect(token.gatewayId).equals(1)
        token = await contract.connect(foouser).tokenProps(2)
        expect(token.gatewayId).equals(1)
    
        await contract.connect(staffuser).updateTokenGatewayBatch([1, 2], 2)
        token = await contract.connect(foouser).tokenProps(1)
        expect(token.gatewayId).equals(2)
        token = await contract.connect(foouser).tokenProps(2)
        expect(token.gatewayId).equals(2)
    })
    
    it('Get token uri', async () => {
        await contract.connect(adminuser).addGateway("abc")
        await contract.connect(adminuser).addGateway("def")
        
        // // No access
        // for(let account of [upgraderuser, foouser, baruser]) {
        //     await expect(contract.connect(account).setURI(1, 2)).is.revertedWith(NO_ACCESS)
        // }
        
        expect(await contract.connect(foouser).uri(1)).equals(INIT_GATEWAY)
        expect(await contract.connect(foouser).uri(2)).equals(INIT_GATEWAY)
        
        // await contract.connect(adminuser).setURI(1, 2)
        // await contract.connect(adminuser).setURI(2, 1)
        // expect(await contract.connect(foouser).uri(1)).equals('def')
        // expect(await contract.connect(foouser).uri(2)).equals('abc')
    })
    
    it('Mint single token', async () => {
        // Require
        await expect(contract.connect(foouser).mint(1, 0, [])).is.revertedWith(ZERO_AMOUNT)
        await expect(contract.connect(foouser).mint(1, 16, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await expect(contract.connect(adminuser).mint(1, 46, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await expect(contract.connect(foouser).mint(1234543, 1, [])).is.revertedWith(INVALID_TOKEN)

        // Test _mintable here
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(15)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 2)).equals(15)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(39)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 2)).equals(91)

        await contract.connect(adminuser).addGateway('abc')
        await contract.connect(adminuser).addGateway('def')

        expect(await contract.connect(foouser).exists(1)).is.true
        expect(await contract.connect(foouser).exists(2)).is.true
        expect(await contract.connect(foouser).exists(3)).is.false

        // Insufficient value
        await expect(contract.connect(foouser).mint(1, 3, [], {value: parseEther('.29')})).is.revertedWith(INSUFFICIENT_AMOUNT)
        await expect(contract.connect(foouser).mint(2, 3, [], {value: parseEther('.44')})).is.revertedWith(INSUFFICIENT_AMOUNT)

        await contract.connect(foouser).mint(1, 3, [], {value: parseEther('.3')})
        await contract.connect(foouser).mint(2, 5, [], {value: parseEther('.75')})
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(12)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 2)).equals(10)

        await contract.connect(adminuser).mint(1, 1, [])
        await contract.connect(adminuser).mint(2, 5, [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(35)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 2)).equals(81)

        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(12)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 2)).equals(10)

        await contract.connect(foouser).mint(1, 2, [], {value: parseEther('.2')})
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(10)

        // Start minting so it's == limit (10 remaining)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(33)
        await contract.connect(adminuser).mint(1, 23, [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(10)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(10)

        // Start minting so it's < limit (10 remaining)
        await contract.connect(adminuser).mint(1, 2, [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(8)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(8)

        await expect(contract.connect(foouser).mint(1, 9, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await contract.connect(foouser).mint(1, 1, [], {value: parseEther('.1')})
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(7)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(7)

        await expect(contract.connect(adminuser).mint(1, 8, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await contract.connect(adminuser).mint(1, 7, [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 1)).equals(0)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 1)).equals(0)

        // Nothing left to mint
        await expect(contract.connect(adminuser).mint(1, 1, [])).is.revertedWith(MINTABLE_EXCEEDED)
        await expect(contract.connect(foouser).mint(1, 1, [])).is.revertedWith(MINTABLE_EXCEEDED)

        // Mint paying higher than the total amount
        await contract.connect(foouser).mint(3, 1, [], {value: parseEther('1.000000000001')})
        await contract.connect(foouser).mint(4, 1, [], {value: parseEther('1.300000000001')})
    })
    
    it('Mint batch tokens', async () => {
        // Require
        await expect(contract.connect(foouser).mintBatch([1, 2], [1], [])).is.revertedWith(INVALID_ARRAY_LENGTHS)
        await expect(contract.connect(foouser).mintBatch([1, 2], [0, 1], [])).is.revertedWith(ZERO_AMOUNT)
        await expect(contract.connect(foouser).mintBatch([1, 9999], [1, 1], [], {value: parseEther('1')})).is.revertedWith(INVALID_TOKEN)
        await expect(contract.connect(foouser).mintBatch([1, 2], [16, 1], [])).is.revertedWith(MINTABLE_EXCEEDED)
        await expect(contract.connect(adminuser).mintBatch([1, 2], [46, 1], [])).is.revertedWith(MINTABLE_EXCEEDED)
        
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 3)).equals(15)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 4)).equals(15)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 3)).equals(45)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 4)).equals(45)

        await contract.connect(foouser).mintBatch([3, 4], [1, 3], [], {value: parseEther('4.9')})
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 3)).equals(14)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 4)).equals(12)

        await contract.connect(foouser).mintBatch([3, 4], [1, 1], [], {value: parseEther('2.3')})
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 3)).equals(13)
        expect(await contract.connect(foouser).mintableAmount(foouser.address, 4)).equals(11)

        await contract.connect(adminuser).mintBatch([3, 4], [5, 9], [])
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 3)).equals(38)
        expect(await contract.connect(adminuser).mintableAmount(MARKET_ACCOUNT, 4)).equals(32)
    })
    
    it('Payment and Withdrawals from single and batch minting', async () => {
        const {time} = testUtils
        let bal: any
        
        // Single
        await contract.connect(foouser).mint(3, 1, [], {value: parseEther('1')})
        expect(await contract.payments(adminuser.address)).equals(parseEther('.24'))
        
        await contract.connect(foouser).mint(3, 3, [], {value: parseEther('3')})
        expect(await contract.payments(adminuser.address)).equals(parseEther('.96'))
    
        bal = await adminuser.getBalance()
        await contract.connect(foouser).withdrawPayments(adminuser.address)
        expect(await contract.payments(adminuser.address)).equals(0)
        expect(await adminuser.getBalance()).equals(bal.add(parseEther('.96')))
    
        bal = await adminuser.getBalance()
        await contract.connect(foouser).mint(4, 2, [], {value: parseEther('2.6')})
        expect(await contract.payments(adminuser.address)).equals(parseEther('.624'))
        
        // Disable holder
        await contract.connect(owneruser).toggleHolder(adminuser.address, false)
        await expect(contract.connect(foouser).withdrawPayments(adminuser.address)).is.revertedWith(INACTIVE_HOLDER)
        await contract.connect(owneruser).toggleHolder(adminuser.address, true)
        
        // Delay
        await expect(contract.connect(foouser).withdrawPayments(adminuser.address)).is.revertedWith(WINDOW_CLOSED)
        for(let i of [1, 1, 1, 1, 1, 1]) {
            await time.increase(time.duration.days(i))
            await expect(contract.connect(foouser).withdrawPayments(adminuser.address)).is.revertedWith(WINDOW_CLOSED)
        }
        await time.increase(time.duration.days(1))
        await contract.connect(foouser).withdrawPayments(adminuser.address)
        
        expect(await contract.payments(adminuser.address)).equals(0)
        expect(await adminuser.getBalance()).equals(bal.add(parseEther('.624')))

        // Batch
        bal = await adminuser.getBalance()
        await contract.connect(foouser).mintBatch([3, 3], [2, 3], [], {value: parseEther('5')})
        expect(await contract.payments(adminuser.address)).equals(parseEther('1.2'))
    
        // Delay
        await expect(contract.connect(foouser).withdrawPayments(adminuser.address)).is.revertedWith(WINDOW_CLOSED)
        for(let i of [1, 1, 1, 1, 1, 1]) {
            await time.increase(time.duration.days(i))
            await expect(contract.connect(foouser).withdrawPayments(adminuser.address)).is.revertedWith(WINDOW_CLOSED)
        }
        
        // Disable holder
        await contract.connect(owneruser).toggleHolder(adminuser.address, false)
        await expect(contract.connect(foouser).withdrawPayments(adminuser.address)).is.revertedWith(INACTIVE_HOLDER)
        await contract.connect(owneruser).toggleHolder(adminuser.address, true)
        
        await time.increase(time.duration.days(1))
        await contract.connect(foouser).withdrawPayments(adminuser.address)
        
        expect(await contract.payments(adminuser.address)).equals(0)
        expect(await adminuser.getBalance()).equals(bal.add(parseEther('1.2')))
    })
    
    it('Window', async () => {
        const {time} = testUtils
        
        expect(await contract.connect(foouser).window(adminuser.address)).equals(0)
        
        await contract.connect(foouser).mint(3, 1, [], {value: parseEther('1')})
        await contract.connect(foouser).mint(3, 1, [], {value: parseEther('1')})
        await contract.connect(foouser).mint(3, 1, [], {value: parseEther('2')})
        expect(await contract.payments(adminuser.address)).equals(parseEther('.96'))
        
        await contract.connect(foouser).withdrawPayments(adminuser.address)
        expect(await contract.connect(foouser).window(adminuser.address)).gt(0)
    
        // Mint again
        await contract.connect(foouser).mintBatch([3, 3, 3], [1, 2, 3], [], {value: parseEther('7.8')})
        expect(await contract.payments(adminuser.address)).equals(parseEther('1.872'))
        expect(await contract.connect(foouser).window(adminuser.address)).gt(0)
        
        // Delay
        for(let i of [1, 1, 1, 1, 1, 1]) {
            await time.increase(time.duration.days(i))
            await expect(contract.connect(foouser).withdrawPayments(adminuser.address)).is.revertedWith(WINDOW_CLOSED)
            expect(await contract.connect(foouser).window(adminuser.address)).gt(0)
        }
        await time.increase(time.duration.days(1))
        expect(await contract.connect(foouser).window(adminuser.address)).equals(0)
        await contract.connect(foouser).withdrawPayments(adminuser.address)
    })
    
    it('Token mapping', async () => {
        let mapping: any
        
        // Revert
        await expect(contract.connect(staffuser).updateTokenMaps([1, 2], [15, 14], [45, 100])).is.revertedWith(DECREASING_LIMIT)
        await expect(contract.connect(staffuser).updateTokenMaps([1, 2], [15, 15], [45, 99])).is.revertedWith(DECREASING_MAX)
        await expect(contract.connect(staffuser).updateTokenMaps([1, 2], [15, 100], [45, 100])).is.revertedWith(LARGE_LIMIT)
        await expect(contract.connect(staffuser).updateTokenMaps([1, 2], [15, 101], [45, 100])).is.revertedWith(LARGE_LIMIT)
    
        mapping = await contract.connect(foouser).tokenProps(1)
        expect(mapping.price).equals(parseEther('.1'))
        expect(mapping.limit).equals(15)
        expect(mapping.gatewayId).equals(0)
        expect(mapping.circulation).equals(6)
        expect(mapping.max).equals(45)
    
        mapping = await contract.connect(foouser).tokenProps(2)
        expect(mapping.price).equals(parseEther('.15'))
        expect(mapping.limit).equals(15)
        expect(mapping.gatewayId).equals(0)
        expect(mapping.circulation).equals(9)
        expect(mapping.max).equals(100)
        
        // Increasing values are ok
        await contract.connect(staffuser).updateTokenMaps([1, 2], [20, 30], [300, 400])
        mapping = await contract.connect(foouser).tokenProps(1)
        expect(mapping.price).equals(parseEther('.1'))
        expect(mapping.limit).equals(20)
        expect(mapping.gatewayId).equals(0)
        expect(mapping.circulation).equals(6)
        expect(mapping.max).equals(300)

        mapping = await contract.connect(foouser).tokenProps(2)
        expect(mapping.price).equals(parseEther('.15'))
        expect(mapping.limit).equals(30)
        expect(mapping.gatewayId).equals(0)
        expect(mapping.circulation).equals(9)
        expect(mapping.max).equals(400)
    
        // Decreasing limits are ok
        
        // mapping = await contract.connect(foouser).tokenProps(1)
        // expect(mapping.price).equals(parseEther('.1'))
        // expect(mapping.limit).equals(19)
        // expect(mapping.gatewayId).equals(0)
        // expect(mapping.circulation).equals(6)
        // expect(mapping.max).equals(300)
        //
        // mapping = await contract.connect(foouser).tokenProps(2)
        // expect(mapping.price).equals(parseEther('.15'))
        // expect(mapping.limit).equals(29)
        // expect(mapping.gatewayId).equals(0)
        // expect(mapping.circulation).equals(9)
        // expect(mapping.max).equals(400)
    })
})