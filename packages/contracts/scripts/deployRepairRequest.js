const hre = require("hardhat");
const { deployRepairRequest } = require("../utils/deployContracts");

async function main() {
  const repairRequestAddress = await deployRepairRequest2();
  console.log("RepairRequestContract deployed at:", repairRequestAddress);
}

// Run the script
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});
