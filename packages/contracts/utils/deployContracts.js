const hre = require("hardhat");

async function deployRepairRequest() {
    const RepairRequest = await hre.ethers.getContractFactory("RepairRequestContract");
    const contract = await RepairRequest.deploy();  
    console.log("RepairRequestContract deployed to:", contract.target);
    return contract.target;
}

async function deployWorkOrder() {
    const WorkOrder = await hre.ethers.getContractFactory("WorkOrderContract");
    const workOrder = await WorkOrder.deploy();    
    console.log("WorkOrderContract deployed to:", workOrder.target);
    return workOrder.target;
}

module.exports = {
    deployRepairRequest,
    deployWorkOrder
};
