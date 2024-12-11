const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RepairRequestContract", function () {
  let RepairRequest, repairRequestContract, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    RepairRequest = await ethers.getContractFactory("RepairRequestContract");
    repairRequestContract = await RepairRequest.deploy();

    // Create a default repair request for consistency
    const propertyId = "property-123";
    const descriptionHash = "QmInitialHash123";
    await repairRequestContract.connect(user1).createRepairRequest(propertyId, descriptionHash);
  });

  it("Should create a new repair request", async function () {
    const propertyId = "property-456";
    const descriptionHash = "QmTestHash456";

    const tx = await repairRequestContract
      .connect(user2)
      .createRepairRequest(propertyId, descriptionHash);
    await tx.wait();

    const repairRequest = await repairRequestContract.getRepairRequest(2); // ID starts from 2

    expect(repairRequest.id).to.equal(2);
    expect(repairRequest.initiator).to.equal(user2.address);
    expect(repairRequest.propertyId).to.equal(propertyId);
    expect(repairRequest.descriptionHash).to.equal(descriptionHash);
    expect(repairRequest.status).to.equal(0); // Status.Pending
    expect(repairRequest.createdAt).to.be.gt(0);
    expect(repairRequest.updatedAt).to.be.gt(0);
  });

  it("Should update the status of a repair request", async function () {
    const newStatus = 1; // Status.InProgress

    const tx = await repairRequestContract
      .connect(user1)
      .updateRepairRequestStatus(1, newStatus);
    await tx.wait();

    const repairRequest = await repairRequestContract.getRepairRequest(1);

    expect(repairRequest.status).to.equal(newStatus);
    expect(repairRequest.updatedAt).to.be.gt(repairRequest.createdAt);
  });

  it("Should emit events for creation and updates", async function () {
    const propertyId = "property-456";
    const descriptionHash = "QmTestHash456";

    // Test for the creation event
    let tx = await repairRequestContract
      .connect(user1)
      .createRepairRequest(propertyId, descriptionHash);
    let block = await ethers.provider.getBlock(tx.blockHash);

    await expect(tx)
      .to.emit(repairRequestContract, "RepairRequestCreated")
      .withArgs(
        2, // ID of the new request
        user1.address,
        propertyId,
        descriptionHash,
        block.timestamp
      );

    // Test for the update event
    tx = await repairRequestContract.connect(user1).updateRepairRequestStatus(2, 1);
    block = await ethers.provider.getBlock(tx.blockHash);

    await expect(tx)
      .to.emit(repairRequestContract, "RepairRequestUpdated")
      .withArgs(2, 1, block.timestamp);
  });

  it("Should update the description hash of a repair request", async function () {
    const newDescriptionHash = "QmUpdatedHash456";

    const tx = await repairRequestContract
      .connect(user1)
      .updateDescriptionHash(1, newDescriptionHash);
    const block = await ethers.provider.getBlock(tx.blockHash);

    await expect(tx)
      .to.emit(repairRequestContract, "DescriptionHashUpdated")
      .withArgs(1, "QmInitialHash123", newDescriptionHash, block.timestamp);

    const repairRequest = await repairRequestContract.getRepairRequest(1);

    expect(repairRequest.descriptionHash).to.equal(newDescriptionHash);
    expect(repairRequest.updatedAt).to.equal(block.timestamp);
  });

  it("Should revert when updating the description hash of a non-existent repair request", async function () {
    const invalidRequestId = 999;
    const newDescriptionHash = "QmInvalidHash";

    await expect(
      repairRequestContract
        .connect(user1)
        .updateDescriptionHash(invalidRequestId, newDescriptionHash)
    ).to.be.revertedWith("Repair request does not exist");
  });

  it("Should fetch a repair request by ID", async function () {
    const repairRequest = await repairRequestContract.getRepairRequest(1);

    expect(repairRequest.id).to.equal(1);
    expect(repairRequest.initiator).to.equal(user1.address);
    expect(repairRequest.propertyId).to.equal("property-123");
    expect(repairRequest.descriptionHash).to.equal("QmInitialHash123");
  });

  it("Should revert when fetching a non-existent repair request", async function () {
    const invalidRequestId = 999;

    await expect(
      repairRequestContract.getRepairRequest(invalidRequestId)
    ).to.be.revertedWith("Repair request does not exist");
  });

  it("Should handle multiple repair requests independently", async function () {
    const propertyId1 = "property-789";
    const descriptionHash1 = "QmHash789";
    const propertyId2 = "property-101112";
    const descriptionHash2 = "QmHash101112";

    // Create first repair request
    await repairRequestContract.connect(user2).createRepairRequest(propertyId1, descriptionHash1);

    // Create second repair request
    await repairRequestContract.connect(user2).createRepairRequest(propertyId2, descriptionHash2);

    const request1 = await repairRequestContract.getRepairRequest(2);
    const request2 = await repairRequestContract.getRepairRequest(3);

    expect(request1.initiator).to.equal(user2.address);
    expect(request1.propertyId).to.equal(propertyId1);
    expect(request1.descriptionHash).to.equal(descriptionHash1);

    expect(request2.initiator).to.equal(user2.address);
    expect(request2.propertyId).to.equal(propertyId2);
    expect(request2.descriptionHash).to.equal(descriptionHash2);
  });
});
