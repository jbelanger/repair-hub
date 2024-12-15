const hre = require("hardhat");

async function deployRepairRequest() {
    const RepairRequest = await hre.ethers.getContractFactory("RepairRequestContract");
    const contract = await RepairRequest.deploy();  
    console.log("RepairRequestContract deployed to:", contract.target);
    return contract.target;
}

module.exports = {
    deployRepairRequest
};
