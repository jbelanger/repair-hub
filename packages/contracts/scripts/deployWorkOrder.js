const hre = require("hardhat");
const { deployWorkOrder } = require("../utils/deployContracts");

async function main() {
  const workOrderAddress = await deployWorkOrder();
  console.log("WorkOrderContract deployed at:", workOrderAddress);
}

// Run the script
main()
.then(() => process.exit(0))
.catch(error => {
    console.error(error);
    process.exit(1);
});
