const { mine } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  // instantly mine 1000 blocks
  await mine(1000);
}