const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("WorkOrderContract", function () {
  let WorkOrder, workOrderContract, owner, landlord, contractor;

  beforeEach(async function () {
    [owner, landlord, contractor] = await ethers.getSigners();
    WorkOrder = await ethers.getContractFactory("WorkOrderContract");
    workOrderContract = await WorkOrder.deploy();    

    // Create a default work order for consistency
    const repairRequestId = 1;
    const agreedPrice = ethers.parseEther("1.0"); // 1 ETH
    const descriptionHash = "QmInitialHash123";

    await workOrderContract
      .connect(landlord)
      .createWorkOrder(repairRequestId, landlord.address, contractor.address, agreedPrice, descriptionHash);
  });

  it("Should create a new work order", async function () {
    const repairRequestId = 2;
    const agreedPrice = ethers.parseEther("2.0"); // 2 ETH
    const descriptionHash = "QmTestHash456";

    const tx = await workOrderContract
      .connect(landlord)
      .createWorkOrder(repairRequestId, landlord.address, contractor.address, agreedPrice, descriptionHash);
    await tx.wait();

    const workOrder = await workOrderContract.workOrders(2);

    expect(workOrder.id).to.equal(2);
    expect(workOrder.repairRequestId).to.equal(repairRequestId);
    expect(workOrder.landlord).to.equal(landlord.address);
    expect(workOrder.contractor).to.equal(contractor.address);
    expect(workOrder.agreedPrice).to.equal(agreedPrice);
    expect(workOrder.descriptionHash).to.equal(descriptionHash);
    expect(workOrder.status).to.equal(0); // Status.Draft
    expect(workOrder.createdAt).to.be.gt(0);
    expect(workOrder.updatedAt).to.be.gt(0);
  });

  it("Should update the status of a work order", async function () {
    const newStatus = 1; // Status.Signed

    const tx = await workOrderContract
      .connect(landlord)
      .updateWorkOrderStatus(1, newStatus);
    await tx.wait();

    const workOrder = await workOrderContract.workOrders(1);

    expect(workOrder.status).to.equal(newStatus);
    expect(workOrder.updatedAt).to.be.gt(workOrder.createdAt);
  });

  it("Should emit the DescriptionHashUpdated event with correct data", async function () {
    const newDescriptionHash = "QmUpdatedHash456";

    const tx = await workOrderContract
      .connect(landlord)
      .updateDescriptionHash(1, newDescriptionHash);
    const block = await ethers.provider.getBlock(tx.blockHash);

    await expect(tx)
      .to.emit(workOrderContract, "DescriptionHashUpdated")
      .withArgs(1, "QmInitialHash123", newDescriptionHash, block.timestamp);

    const workOrder = await workOrderContract.workOrders(1);

    expect(workOrder.descriptionHash).to.equal(newDescriptionHash);
    expect(workOrder.updatedAt).to.equal(block.timestamp);
  });

  it("Should revert when updating the description hash of a non-existent work order", async function () {
    const invalidWorkOrderId = 999;
    const newDescriptionHash = "QmInvalidHash";

    await expect(
      workOrderContract
        .connect(landlord)
        .updateDescriptionHash(invalidWorkOrderId, newDescriptionHash)
    ).to.be.revertedWith("Work order does not exist");
  });

  it("Should fetch a work order by ID", async function () {
    const workOrder = await workOrderContract.workOrders(1);

    expect(workOrder.id).to.equal(1);
    expect(workOrder.landlord).to.equal(landlord.address);
    expect(workOrder.contractor).to.equal(contractor.address);
    expect(workOrder.descriptionHash).to.equal("QmInitialHash123");
  });

  it("Should revert when fetching a non-existent work order", async function () {
    const invalidWorkOrderId = 999;

    await expect(
      workOrderContract.getWorkOrder(invalidWorkOrderId)
    ).to.be.revertedWith("Work order does not exist");
  });

  it("Should handle multiple work orders independently", async function () {
    const repairRequestId1 = 2;
    const descriptionHash1 = "QmHash789";
    const agreedPrice1 = ethers.parseEther("1.5"); // 1.5 ETH

    const repairRequestId2 = 3;
    const descriptionHash2 = "QmHash101112";
    const agreedPrice2 = ethers.parseEther("3.0"); // 3 ETH

    // Create first work order
    await workOrderContract
      .connect(landlord)
      .createWorkOrder(repairRequestId1, landlord.address, contractor.address, agreedPrice1, descriptionHash1);

    // Create second work order
    await workOrderContract
      .connect(landlord)
      .createWorkOrder(repairRequestId2, landlord.address, contractor.address, agreedPrice2, descriptionHash2);

    const workOrder1 = await workOrderContract.workOrders(2);
    const workOrder2 = await workOrderContract.workOrders(3);

    expect(workOrder1.repairRequestId).to.equal(repairRequestId1);
    expect(workOrder1.descriptionHash).to.equal(descriptionHash1);
    expect(workOrder1.agreedPrice).to.equal(agreedPrice1);

    expect(workOrder2.repairRequestId).to.equal(repairRequestId2);
    expect(workOrder2.descriptionHash).to.equal(descriptionHash2);
    expect(workOrder2.agreedPrice).to.equal(agreedPrice2);
  });
});
