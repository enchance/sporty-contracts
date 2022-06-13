// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers, upgrades} from "hardhat";
import {ContractFactory} from "ethers";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";                             // eslint-disable-line



export const CONTRACT_ACCOUNTS = {
    deployer: '0x6b98Dbc656F07C82a99817d5778a691a8Da733f1',     // indexDEPLOYER
    owner: '0xEC615ad1Be355D16163bc2dDCb359788Bc93ED44',        // indexOWNER
    admins: [
        // Recipient accounts
        '0xFF01E7B2329BBd74bb1d28B75164eB7DCAbDD8F3',           // JIM
        '0x1fd0515D45B2d1b8f12df35Eb3a16f3B95C1eCDf',           // PIERRE
        // '',                                                     // MIKE
    ],
    shares: [3400, 3400, 2400],
    market: '0xD07A0C38C6c4485B97c53b883238ac05a14a85D6'        // indexMARKET
}
export const INIT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/QmQLLDpXH9DiVvjjzmfoyaM1bBrso6wheS57f67ubqw3C7/{id}.json'
export const MARKET_ACCOUNT = CONTRACT_ACCOUNTS.market

let owneruser: SignerWithAddress

async function main() {
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
