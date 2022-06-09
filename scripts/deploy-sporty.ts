// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers, upgrades} from "hardhat";
import {ContractFactory} from "ethers";
import {SportyChocolateV1} from "../typechain";



export const INIT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/QmX7LXP9KGnS2oNyhdpwXUosNQr3Mez1ETdKhZCvZfN9kD/{id}.json'
export const SUPPLY = 100000

async function main() {
  let factory: ContractFactory, contract: any
  
  // v1
  factory = await ethers.getContractFactory('SportyChocolateV1')
  contract = await upgrades.deployProxy(factory, [INIT_GATEWAY, SUPPLY], {kind: 'uups'})
  console.log('PROXY:', contract.address)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
