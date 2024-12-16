const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { parseEther } = require("ethers");

describe("RepairRequestContract", function () {
  let RepairRequestContract;
  let contract;
  let admin, tenant, landlord, other;

  function parseEvent(receipt, contractInterface, eventName) {
    for (const log of receipt.logs) {
      try {
        const parsed = contractInterface.parseLog(log);
        if (parsed.name === eventName) {
          return parsed;
        }
      } catch (e) {
        // log not from this contract, ignore
      }
    }
    return null;
  }

  beforeEach(async function () {
    [admin, tenant, landlord, other] = await ethers.getSigners();
    RepairRequestContract = await ethers.getContractFactory("RepairRequestContract");
    contract = await upgrades.deployProxy(RepairRequestContract, [admin.address], { initializer: "initialize" });
  });

  describe("Deployment and Roles", function () {
    it("Should set the admin role correctly", async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      expect(await contract.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
    });
    
    it("Non-admin should not be able to pause the contract", async function () {
      await expect(contract.connect(tenant).pause()).to.be.revertedWithCustomError(contract, "CallerIsNotAdmin");
    });

    it("Non-admin should not be able to unpause the contract", async function () {
      await contract.connect(admin).pause();
      await expect(contract.connect(tenant).unpause()).to.be.revertedWithCustomError(contract, "CallerIsNotAdmin");
    });
  });
  
  describe("Pausing and Unpausing", function () {
    it("Admin can pause and unpause", async function () {
      await contract.connect(admin).pause();
      expect(await contract.paused()).to.be.true;

      await contract.connect(admin).unpause();
      expect(await contract.paused()).to.be.false;
    });
    
    it("No actions allowed when paused (create)", async function () {
      await contract.connect(admin).pause();
      await expect(
        contract.connect(tenant).createRepairRequest("Property1", "DescHash", landlord.address)
      ).to.be.revertedWithCustomError(contract, "EnforcedPause");
    });
  });
  
  describe("Upgrade Mechanism", function () {
    it("Non-admin cannot upgrade", async function () {
      const NewImplementation = await ethers.getContractFactory("RepairRequestContract", tenant);
      await expect(
        upgrades.upgradeProxy(await contract.getAddress(), NewImplementation)
      ).to.be.revertedWithCustomError(contract, "CallerIsNotAdmin");
    });

    it("Admin can upgrade", async function () {
      const NewImplementation = await ethers.getContractFactory("RepairRequestContract", admin);
      const upgraded = await upgrades.upgradeProxy(await contract.getAddress(), NewImplementation);
      expect(await upgraded.ADMIN_ROLE()).to.equal(await contract.ADMIN_ROLE());
    });
  });

  describe("Creating Repair Requests", function () {
    it("Tenant can create a repair request with valid data", async function () {
      const tx = await contract.connect(tenant).createRepairRequest("Property1", "DescHash", landlord.address);
      const receipt = await tx.wait();
      const event = parseEvent(receipt, contract.interface, "RepairRequestCreated");
      expect(event).to.not.be.null;
      expect(event.args.initiator).to.equal(tenant.address);
      expect(event.args.landlord).to.equal(landlord.address);
    });
    
    it("Should revert if landlord address is zero", async function () {
      await expect(
        contract.connect(tenant).createRepairRequest("Property1", "DescHash", ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(contract, "ZeroAddress");
    });

    it("Should revert if propertyId is empty", async function () {
      await expect(
        contract.connect(tenant).createRepairRequest("", "DescHash", landlord.address)
      ).to.be.revertedWithCustomError(contract, "InvalidPropertyId");
    });

    it("Should revert if descriptionHash is empty", async function () {
      await expect(
        contract.connect(tenant).createRepairRequest("Property1", "", landlord.address)
      ).to.be.revertedWithCustomError(contract, "InvalidDescriptionHash");
    });
    
    it("Should allow max length propertyId and descriptionHash", async function () {
      const maxString = "a".repeat(256);
      const tx = await contract.connect(tenant).createRepairRequest(maxString, maxString, landlord.address);
      const receipt = await tx.wait();
      const event = parseEvent(receipt, contract.interface, "RepairRequestCreated");
      expect(event.args.propertyId).to.equal(maxString);
      expect(event.args.descriptionHash).to.equal(maxString);
    });

    it("Should revert if propertyId exceeds max length", async function () {
      const longString = "a".repeat(257);
      await expect(
        contract.connect(tenant).createRepairRequest(longString, "DescHash", landlord.address)
      ).to.be.revertedWithCustomError(contract, "InvalidPropertyId");
    });

    it("Should revert if descriptionHash exceeds max length", async function () {
      const longString = "a".repeat(257);
      await expect(
        contract.connect(tenant).createRepairRequest("Property1", longString, landlord.address)
      ).to.be.revertedWithCustomError(contract, "InvalidDescriptionHash");
    });
  });
  
  describe("Non-Existent Requests", function () {
    it("Should revert if accessing a non-existent request", async function () {
      await expect(contract.getRepairRequest(999)).to.be.revertedWithCustomError(contract, "RepairRequestDoesNotExist");
    });
    
    it("Should revert if trying to update description on non-existent request", async function () {
      await expect(contract.connect(tenant).updateDescription(999, "NewDesc"))
        .to.be.revertedWithCustomError(contract, "RepairRequestDoesNotExist");
    });
  });

  describe("After Creation", function () {
    beforeEach(async function () {
      await contract.connect(tenant).createRepairRequest("Property1", "DescHash", landlord.address);
    });

    it("Tenant can update description if not cancelled", async function () {
      const tx = await contract.connect(tenant).updateDescription(1, "NewDescHash");
      const receipt = await tx.wait();
      const event = parseEvent(receipt, contract.interface, "DescriptionUpdated");
      expect(event.args.newHash).to.equal("NewDescHash");
    });

    it("Should revert if non-tenant tries to update description", async function () {
      await expect(
        contract.connect(landlord).updateDescription(1, "NewDescHash")
      ).to.be.revertedWithCustomError(contract, "CallerIsNotTenant");
    });

    it("Landlord can update work details if not cancelled", async function () {
      const tx = await contract.connect(landlord).updateWorkDetails(1, "WorkDetailsHash");
      const receipt = await tx.wait();
      const event = parseEvent(receipt, contract.interface, "WorkDetailsUpdated");
      expect(event.args.newHash).to.equal("WorkDetailsHash");
    });

    it("Should revert if tenant tries to update work details", async function () {
      await expect(
        contract.connect(tenant).updateWorkDetails(1, "WorkDetailsHash")
      ).to.be.revertedWithCustomError(contract, "CallerIsNotLandlord");
    });

    it("Should revert if workDetailsHash is empty or too long", async function () {
      await expect(
        contract.connect(landlord).updateWorkDetails(1, "")
      ).to.be.revertedWithCustomError(contract, "InvalidWorkDetailsHash");

      const longString = "a".repeat(257);
      await expect(
        contract.connect(landlord).updateWorkDetails(1, longString)
      ).to.be.revertedWithCustomError(contract, "InvalidWorkDetailsHash");
    });
  });
  
  describe("Status Transitions", function () {
    beforeEach(async function () {
      await contract.connect(tenant).createRepairRequest("Property1", "DescHash", landlord.address);
    });

    it("Tenant can cancel if pending", async function () {
      const tx = await contract.connect(tenant).withdrawRepairRequest(1);
      const receipt = await tx.wait();
      const event = parseEvent(receipt, contract.interface, "RepairRequestStatusChanged");
      expect(event.args.oldStatus).to.equal(0); // Pending
      expect(event.args.newStatus).to.equal(6); // Cancelled
    });

    it("Tenant cannot cancel if not pending", async function () {
      // landlord sets to InProgress
      await contract.connect(landlord).updateRepairRequestStatus(1, 1);
      await expect(
        contract.connect(tenant).withdrawRepairRequest(1)
      ).to.be.revertedWithCustomError(contract, "RequestIsNotPending");
    });

    it("Landlord can transition Pending -> InProgress -> Completed", async function () {
      await contract.connect(landlord).updateRepairRequestStatus(1, 1); // InProgress
      let req = await contract.getRepairRequest(1);
      expect(req.status).to.equal(1); // InProgress

      await contract.connect(landlord).updateRepairRequestStatus(1, 2); // Completed
      req = await contract.getRepairRequest(1);
      expect(req.status).to.equal(2); // Completed
    });

    it("Landlord can reject from Pending", async function () {
      await contract.connect(landlord).updateRepairRequestStatus(1, 5); // Rejected
      const req = await contract.getRepairRequest(1);
      expect(req.status).to.equal(5);
    });

    it("Invalid transitions revert", async function () {
      // Trying to go from Pending -> Completed directly
      await expect(
        contract.connect(landlord).updateRepairRequestStatus(1, 2)
      ).to.be.revertedWithCustomError(contract, "InvalidStatusTransition");
    });

    it("Tenant can approve or refuse after Completed", async function () {
      await contract.connect(landlord).updateRepairRequestStatus(1, 1); // InProgress
      await contract.connect(landlord).updateRepairRequestStatus(1, 2); // Completed

      // Tenant approves
      await contract.connect(tenant).approveWork(1, true);
      let req = await contract.getRepairRequest(1);
      expect(req.status).to.equal(3); // Accepted

      // Another request
      await contract.connect(tenant).createRepairRequest("Property2", "DescHash2", landlord.address);
      await contract.connect(landlord).updateRepairRequestStatus(2, 1); // InProgress
      await contract.connect(landlord).updateRepairRequestStatus(2, 2); // Completed

      await contract.connect(tenant).approveWork(2, false);
      req = await contract.getRepairRequest(2);
      expect(req.status).to.equal(4); // Refused
    });

    it("Tenant cannot approve if not completed", async function () {
      await expect(
        contract.connect(tenant).approveWork(1, true)
      ).to.be.revertedWithCustomError(contract, "RequestNotCompleted");
    });
  });

  describe("Actions on Cancelled Requests", function () {
    beforeEach(async function () {
      await contract.connect(tenant).createRepairRequest("Property1", "DescHash", landlord.address);
      await contract.connect(tenant).withdrawRepairRequest(1); // now cancelled
    });

    it("Should revert when trying to update description on cancelled request", async function () {
      await expect(
        contract.connect(tenant).updateDescription(1, "SomeDesc")
      ).to.be.revertedWithCustomError(contract, "RequestIsCancelled");
    });

    it("Should revert when trying to update work details on cancelled request", async function () {
      await expect(
        contract.connect(landlord).updateWorkDetails(1, "NewWork")
      ).to.be.revertedWithCustomError(contract, "RequestIsCancelled");
    });

    it("Should revert when trying to update status on cancelled request", async function () {
      await expect(
        contract.connect(landlord).updateRepairRequestStatus(1, 1)
      ).to.be.revertedWithCustomError(contract, "RequestIsCancelled");
    });

    it("Should revert when trying to approve work on cancelled request", async function () {
      await expect(
        contract.connect(tenant).approveWork(1, true)
      ).to.be.revertedWithCustomError(contract, "RequestIsCancelled");
    });
  });

  describe("Fallback and Receive", function () {
    it("Should revert if sending ETH directly to contract (fallback)", async function () {
      const value = parseEther("1.0");
      await expect(
        tenant.sendTransaction({ to: await contract.getAddress(), value })
      ).to.be.revertedWith("No direct payments accepted");
    });

    it("Should revert if sending ETH directly to contract (receive)", async function () {
      const value = parseEther("0.1");
      await expect(
        tenant.sendTransaction({ to: await contract.getAddress(), value })
      ).to.be.revertedWith("No direct payments accepted");
    });
  });

  describe("Access Control and Roles", function () {
    it("Non-admin cannot grant roles", async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      await expect(contract.connect(tenant).grantRole(ADMIN_ROLE, other.address)).to.be.reverted;
    });
    
    it("Admin can grant and revoke roles", async function () {
      const ADMIN_ROLE = await contract.ADMIN_ROLE();
      await contract.connect(admin).grantRole(ADMIN_ROLE, other.address);
      expect(await contract.hasRole(ADMIN_ROLE, other.address)).to.be.true;

      await contract.connect(admin).revokeRole(ADMIN_ROLE, other.address);
      expect(await contract.hasRole(ADMIN_ROLE, other.address)).to.be.false;
    });
  });
});
