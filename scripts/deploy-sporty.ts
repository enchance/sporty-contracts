// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import {ethers, upgrades} from "hardhat";
import {ContractFactory} from "ethers";
import {SportyChocolateV1, UtilsUint} from "../typechain";  // eslint-disable-line
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {FactoryOptions} from "@nomiclabs/hardhat-ethers/types";                             // eslint-disable-line



export const INIT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/QmQLLDpXH9DiVvjjzmfoyaM1bBrso6wheS57f67ubqw3C7/{id}.json'
export const SUPPLY = 100000

let owneruser: SignerWithAddress

async function main() {
  [owneruser] = await ethers.getSigners()
  let factory: ContractFactory, contract: any
  
  // Lib
  const UtilsUint: ContractFactory = await ethers.getContractFactory('UtilsUint', owneruser)
  const utilsuint: any = await UtilsUint.deploy()
  // console.log('UtilsUint:', utilsuint.address)
  
  // v1
  let opts: FactoryOptions = {
    signer: owneruser,
    libraries: {'UtilsUint': utilsuint.address}
  }
  factory = await ethers.getContractFactory('SportyChocolateV1', opts)
  contract = await upgrades.deployProxy(factory, [INIT_GATEWAY], {kind: 'uups', unsafeAllowLinkedLibraries: true})
  // console.log('PROXY:', contract.address)
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
