const hre = require("hardhat");

async function deployRepairRequest() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying RepairRequestContract with account:", deployer.address);

    const RepairRequest = await hre.ethers.getContractFactory("RepairRequestContract");
    const contract = await hre.upgrades.deployProxy(RepairRequest, [deployer.address], {
        initializer: "initialize",
    });

    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log("RepairRequestContract deployed to:", address);
    return address;
}

module.exports = {
    deployRepairRequest
};
