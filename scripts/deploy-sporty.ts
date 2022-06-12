// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers, upgrades} from "hardhat";
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";                             // eslint-disable-line


export const INIT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/QmQLLDpXH9DiVvjjzmfoyaM1bBrso6wheS57f67ubqw3C7/{id}.json'
export const SUPPLY = 100000
export const MARKET_ACCOUNT = '0xD07A0C38C6c4485B97c53b883238ac05a14a85D6'

let owneruser: SignerWithAddress

async function main() {
    /*
      * ACTUAL USERS
      *  */
    const LIVEACCOUNTS = {
        owner: '0xEC615ad1Be355D16163bc2dDCb359788Bc93ED44',        // indexOWNER
        jim: '0xFF01E7B2329BBd74bb1d28B75164eB7DCAbDD8F3',          // enchance
        pierre: '',
        mike: '',
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
