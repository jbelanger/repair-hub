const hre = require("hardhat");
const { deployRepairRequest } = require("../utils/deployContracts");

async function main() {
  console.log("Starting deployment of all contracts...");  
  await deployRepairRequest();
  console.log("All contracts deployed successfully!");
}

// Run the script
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});
