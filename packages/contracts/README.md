# **RepairHub Smart Contract: RepairRequestContract**

## **Overview**
The **RepairRequestContract** is a Solidity smart contract designed to facilitate and manage repair requests between tenants and landlords on the blockchain. The contract ensures role-based access control, transparency, and immutability.

---

## **Key Features**
1. **Repair Request Lifecycle**:
   - Tenants can create repair requests tied to a property.
   - Landlords manage the requests by updating work details and statuses.
   - Tenants approve or reject the completed work.

2. **Role-Based Access Control**:
   - **Tenant**:
     - Creates repair requests.
     - Approves or rejects completed work.
   - **Landlord**:
     - Updates work details and status.
     - Rejects invalid requests.

3. **Status Management**:
   - Repair requests follow these statuses:
     - **Pending**: Initial state after creation.
     - **InProgress**: Work has started.
     - **Completed**: Work is marked as completed by the landlord.
     - **Accepted**: Work is approved by the tenant.
     - **Refused**: Work is rejected by the tenant.
     - **Rejected**: Request is rejected by the landlord.

4. **Security Features**:
   - Input validation for critical data.
   - Role-based access modifiers (`onlyTenant`, `onlyLandlord`).
   - Reentrancy protection using OpenZeppelin’s `ReentrancyGuard`.

---

## **Contract Details**

### **Enums**
```solidity
enum Status {
    Pending,        // Request created but not yet acted upon
    InProgress,     // Work has started
    Completed,      // Work completed by the landlord
    Accepted,       // Work approved by the tenant
    Refused,        // Work rejected by the tenant
    Rejected        // Request rejected by the landlord
}
```

### **Structs**

```solidity
struct RepairRequest {
    uint256 id;                 // Unique identifier
    address initiator;          // Tenant address
    address landlord;           // Landlord address
    string propertyId;          // Reference to property (off-chain)
    string descriptionHash;     // Hash of the repair description (off-chain)
    string workDetailsHash;     // Hash of the work details (off-chain)
    Status status;              // Current status
    uint256 createdAt;          // Creation timestamp
    uint256 updatedAt;          // Last update timestamp
}
```

### **Mappings**

```solidity
mapping(uint256 => RepairRequest) private repairRequests;
uint256 private requestIdCounter; // Counter for unique request IDs
```

### **Modifiers**
**requestExists(uint256 _id)**: Ensures the repair request exists.
**onlyLandlord(uint256 _id)**: Restricts function calls to the landlord of the request.
**onlyTenant(uint256 _id)**: Restricts function calls to the tenant (initiator) of the request.

### **Events**
**RepairRequestCreated**: Emitted when a repair request is created.
**WorkDetailsUpdated**: Emitted when the landlord updates work details.
**RepairRequestUpdated**: Emitted when the status of a request is updated.

### **Functions**

1. **Create Repair Request**

    ```solidity
    function createRepairRequest(
        string memory _propertyId,
        string memory _descriptionHash,
        address _landlord
    ) external;
    ```
* **Purpose**: Allows tenants to create repair requests.
* **Access**: Any tenant.
* **Emits**: RepairRequestCreated.

---

2. **Update Work Details**

    ```solidity
    function updateWorkDetails(uint256 _id, string memory _workDetailsHash) 
        external;
    ```

* **Purpose**: Allows landlords to add or update work details.
* **Access**: Only landlords.
* **Emits**: WorkDetailsUpdated.

--- 

3. **Update Request Status** 

    ```solidity
    function updateRepairRequestStatus(uint256 _id, Status _status) 
        external;
    ```

* **Purpose**: Allows landlords to update the status of a repair request.
* **Access**: Only landlords.
* **Emits**: RepairRequestUpdated.

---

4. **Approve or Reject Work**

    ```solidity
    function approveWork(uint256 _id, bool _isAccepted) 
        external;
    ```
* **Purpose**: Allows tenants to approve (Accepted) or reject (Refused) the completed work.
* **Access**: Only tenants.
* **Emits**: RepairRequestUpdated.

--- 

5. **Get Repair Request**

    ```solidity
    function getRepairRequest(uint256 _id) 
        external view returns (RepairRequest memory);
    ```

* **Purpose**: Fetches details of a specific repair request.
* **Access**: Public.

## Deployment Information
### Deployment Checklist
1. Use Hardhat or Truffle for deployment.
2. Verify the contract using Etherscan or a similar service.
3. Ensure roles and permissions are set up properly.
4. Test on a testnet (e.g., Goerli or Mumbai).

### Deployment Script Example

```javascript
const hre = require("hardhat");

async function main() {
    const RepairRequestContract = await hre.ethers.getContractFactory("RepairRequestContract");
    const contract = await RepairRequestContract.deploy();

    await contract.deployed();
    console.log("RepairRequestContract deployed to:", contract.address);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

## Testing
### Unit Tests
Ensure the following scenarios are tested:

1. Creating a repair request with valid inputs.
2. Role-based access restrictions (onlyTenant, onlyLandlord).
3. Valid and invalid status transitions.
4. Handling non-existent repair requests.

### Sample Test Setup

```javascript
describe("RepairRequestContract", function () {
    it("Should allow a tenant to create a repair request", async function () {
        const tx = await contract.createRepairRequest(
            "property123",
            "QmHash",
            landlord.address
        );
        await tx.wait();

        const request = await contract.getRepairRequest(1);
        expect(request.propertyId).to.equal("property123");
    });
});

```

## Project Files

### Directory Structure
```bash
/contracts
  - RepairRequestContract.sol
/scripts
  - deploy.js
/test
  - RepairRequestContract.test.js
```

## README Links
- Testing: See test/RepairRequestContract.test.js.
- Deployment: See scripts/deploy.js.
- Smart Contract: See contracts/RepairRequestContract.sol.