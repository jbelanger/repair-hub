const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RepairRequestContract", function () {
  let RepairRequestContract, contract, landlord, tenant, otherUser;

  beforeEach(async function () {
    // Deploy the contract and set up accounts
    [landlord, tenant, otherUser] = await ethers.getSigners();
    const Contract = await ethers.getContractFactory("RepairRequestContract");
    contract = await Contract.deploy();
  });

  describe("createRepairRequest", function () {
    it("Should allow a tenant to create a repair request", async function () {
      const propertyId = "property-123";
      const descriptionHash = "QmTestHash123";

      const tx = await contract
        .connect(tenant)
        .createRepairRequest(propertyId, descriptionHash, landlord.address);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => contract.interface.parseLog(log))
        .find((e) => e.name === "RepairRequestCreated");

      expect(event.args.id).to.equal(1);
      expect(event.args.initiator).to.equal(tenant.address);
      expect(event.args.propertyId).to.equal(propertyId);

      const repairRequest = await contract.getRepairRequest(1);
      expect(repairRequest.id).to.equal(1);
      expect(repairRequest.initiator).to.equal(tenant.address);
      expect(repairRequest.propertyId).to.equal(propertyId);
    });

    it("Should revert if propertyId or descriptionHash is empty", async function () {
      await expect(
        contract.connect(tenant).createRepairRequest("", "QmHash", landlord.address)
      ).to.be.revertedWith("Property ID cannot be empty");

      await expect(
        contract.connect(tenant).createRepairRequest("property-123", "", landlord.address)
      ).to.be.revertedWith("Description hash cannot be empty");
    });

    it("Should revert if landlord address is zero", async function () {
      await expect(
        contract.connect(tenant).createRepairRequest("property-123", "QmHash", ethers.ZeroAddress)
      ).to.be.revertedWith("Landlord address cannot be zero");
    });
  });

  describe("updateWorkDetails", function () {
    beforeEach(async function () {
      await contract
        .connect(tenant)
        .createRepairRequest("property-123", "QmTestHash123", landlord.address);
    });

    it("Should allow the landlord to update work details", async function () {
      const newWorkDetailsHash = "QmWorkDetailsHash";
      const tx = await contract.connect(landlord).updateWorkDetails(1, newWorkDetailsHash);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => contract.interface.parseLog(log))
        .find((e) => e.name === "WorkDetailsUpdated");

      expect(event.args.oldHash).to.equal("");
      expect(event.args.newHash).to.equal(newWorkDetailsHash);

      const repairRequest = await contract.getRepairRequest(1);
      expect(repairRequest.workDetailsHash).to.equal(newWorkDetailsHash);
    });

    it("Should revert if called by someone other than the landlord", async function () {
      await expect(
        contract.connect(tenant).updateWorkDetails(1, "QmWorkDetailsHash")
      ).to.be.revertedWith("Caller is not the landlord");

      await expect(
        contract.connect(otherUser).updateWorkDetails(1, "QmWorkDetailsHash")
      ).to.be.revertedWith("Caller is not the landlord");
    });

    it("Should revert if the work details hash is empty", async function () {
      await expect(
        contract.connect(landlord).updateWorkDetails(1, "")
      ).to.be.revertedWith("Work details hash cannot be empty");
    });
  });

  describe("updateRepairRequestStatus", function () {
    beforeEach(async function () {
      await contract
        .connect(tenant)
        .createRepairRequest("property-123", "QmTestHash123", landlord.address);
    });

    it("Should allow the landlord to update the status to InProgress", async function () {
      const tx = await contract.connect(landlord).updateRepairRequestStatus(1, 1); // Status.InProgress
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => contract.interface.parseLog(log))
        .find((e) => e.name === "RepairRequestUpdated");

      expect(event.args.status).to.equal(1);

      const repairRequest = await contract.getRepairRequest(1);
      expect(repairRequest.status).to.equal(1); // Status.InProgress
    });

    it("Should revert on invalid status transitions", async function () {
      // Call with an invalid status outside the defined enum range
      await expect(
        contract.connect(landlord).updateRepairRequestStatus(1,99) // Invalid status (not defined in the enum)
      ).to.be.revertedWith("Invalid status");
    });

    it("Should revert if called by someone other than the landlord", async function () {
      await expect(
        contract.connect(tenant).updateRepairRequestStatus(1, 1)
      ).to.be.revertedWith("Caller is not the landlord");

      await expect(
        contract.connect(otherUser).updateRepairRequestStatus(1, 1)
      ).to.be.revertedWith("Caller is not the landlord");
    });

    it("Should revert if updating an Accepted request", async function () {
      await contract.connect(landlord).updateRepairRequestStatus(1, 2); // Status.Completed
      await contract.connect(tenant).approveWork(1, true); // Accepted

      await expect(
        contract.connect(landlord).updateRepairRequestStatus(1, 1) // Status.InProgress
      ).to.be.revertedWith("Cannot update an accepted request");
    });

    it("Should update timestamps correctly", async function () {
      const initialRequest = await contract.getRepairRequest(1);
      const initialUpdatedAt = initialRequest.updatedAt;

      await contract.connect(landlord).updateRepairRequestStatus(1, 1); // Status.InProgress
      const updatedRequest = await contract.getRepairRequest(1);

      expect(updatedRequest.updatedAt).to.be.gt(initialUpdatedAt);
    });
  });

  describe("approveWork", function () {
    beforeEach(async function () {
      await contract
        .connect(tenant)
        .createRepairRequest("property-123", "QmTestHash123", landlord.address);
      await contract.connect(landlord).updateRepairRequestStatus(1, 2); // Status.Completed
    });

    it("Should allow the tenant to approve the work", async function () {
      const tx = await contract.connect(tenant).approveWork(1, true); // Accepted
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => contract.interface.parseLog(log))
        .find((e) => e.name === "RepairRequestUpdated");

      expect(event.args.status).to.equal(3); // Status.Accepted

      const repairRequest = await contract.getRepairRequest(1);
      expect(repairRequest.status).to.equal(3); // Status.Accepted
    });

    it("Should allow the tenant to refuse the work", async function () {
      const tx = await contract.connect(tenant).approveWork(1, false); // Refused
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log) => contract.interface.parseLog(log))
        .find((e) => e.name === "RepairRequestUpdated");

      expect(event.args.status).to.equal(4); // Status.Refused

      const repairRequest = await contract.getRepairRequest(1);
      expect(repairRequest.status).to.equal(4); // Status.Refused
    });

    it("Should revert if the work is not completed", async function () {
      await contract.connect(landlord).updateRepairRequestStatus(1, 1); // Status.InProgress

      await expect(contract.connect(tenant).approveWork(1, true)).to.be.revertedWith(
        "Work is not completed"
      );
    });

    it("Should revert if called by someone other than the tenant", async function () {
      await expect(
        contract.connect(otherUser).approveWork(1, true)
      ).to.be.revertedWith("Caller is not the tenant");
    });
  });

  describe("General validations", function () {
    it("Should revert when interacting with non-existent requests", async function () {
      await expect(
        contract.connect(landlord).updateRepairRequestStatus(999, 1)
      ).to.be.revertedWith("Repair request does not exist");

      await expect(
        contract.connect(tenant).approveWork(999, true)
      ).to.be.revertedWith("Repair request does not exist");
    });

    it("Should handle multiple repair requests independently", async function () {
      await contract
        .connect(tenant)
        .createRepairRequest("property-123", "QmHash1", landlord.address);
      await contract
        .connect(tenant)
        .createRepairRequest("property-456", "QmHash2", landlord.address);

      const request1 = await contract.getRepairRequest(1);
      const request2 = await contract.getRepairRequest(2);

      expect(request1.propertyId).to.equal("property-123");
      expect(request2.propertyId).to.equal("property-456");
    });
  });
});
