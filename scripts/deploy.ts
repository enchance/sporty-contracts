// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";


export const INIT_GATEWAY = 'https://gateway.pinata.cloud/ipfs/QmX7LXP9KGnS2oNyhdpwXUosNQr3Mez1ETdKhZCvZfN9kD/{id}.json'
export const SUPPLY = 100000

async function main() {
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
