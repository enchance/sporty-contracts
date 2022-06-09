// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers, upgrades} from "hardhat";
import {ContractFactory} from "ethers";
import {SportyChocolateV1} from "../typechain";                             // eslint-disable-line



export const INIT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/QmQLLDpXH9DiVvjjzmfoyaM1bBrso6wheS57f67ubqw3C7/{id}.json'
export const SUPPLY = 100000

async function main() {
  let factory: ContractFactory, contract: any
  
  // v1
  factory = await ethers.getContractFactory('SportyChocolateV1')
  contract = await upgrades.deployProxy(factory, [INIT_GATEWAY, SUPPLY], {kind: 'uups'})
  // console.log('PROXY:', contract.address)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
