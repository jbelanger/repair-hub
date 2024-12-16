# **RepairHub: Decentralized Repair Request Management**

## **Overview**
RepairHub is a blockchain-based platform designed to streamline the management of repair requests between **tenants** and **landlords**. It ensures transparency, accountability, and immutability by leveraging smart contracts for key workflows.

---

## **Key Features**
- **Repair Request Lifecycle**:
  - Tenants can submit repair requests tied to a specific property.
  - Landlords manage work details, update statuses, and complete repairs.
  - Tenants approve or refuse completed work, ensuring quality assurance.

- **Blockchain Transparency**:
  - Immutable record of repair requests and their status changes.
  - Cryptographic hashes for off-chain data, such as descriptions and work details.

- **Role-Based Access Control**:
  - Tenants and landlords have distinct roles and permissions.
  - Only authorized users can modify or approve requests.

- **Status Lifecycle**:
  - Requests move through statuses: `Pending` → `In Progress` → `Completed` → `Accepted` or `Refused`.
  - Rejected requests and refused work remain auditable.

---

## **Smart Contract Highlights**
- **RepairRequestContract**:
  - Tracks all repair requests on-chain with unique IDs.
  - Stores metadata such as timestamps, status, and user roles.
  - Emits events for key actions, enabling transparency and off-chain integration.

---

## **Core Workflows**

### **1. Tenant Workflow**
1. **Create Repair Request**:
   - Submit a request for a property with a description and landlord details.
2. **Approve/Refuse Work**:
   - Approve or refuse the completed work after the landlord marks it as completed.

### **2. Landlord Workflow**
1. **Manage Requests**:
   - Update work details, status, or reject invalid requests.
2. **Complete Repairs**:
   - Mark the request as completed once the work is done.
3. **Track Statuses**:
   - Monitor requests through the lifecycle for accountability.

---

## **System Architecture**
RepairHub uses a hybrid on-chain/off-chain model:
- **On-Chain**:
  - Smart contracts manage repair requests, statuses, and critical metadata.
- **Off-Chain**:
  - Stores detailed descriptions, attachments, and work details linked by cryptographic hashes.

---

## **Getting Started**

### **Prerequisites**
1. Node.js and npm/pnpm installed on your machine.
2. Hardhat development environment for smart contract deployment.
3. A blockchain wallet (e.g., MetaMask) for testing.

### **Setup**
1. Clone the repository:

    ```bash
    git clone https://github.com/your-repo/repairhub.git
    cd repairhub
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Compile the smart contracts:

    ```bash
    npx hardhat compile
    ```

4. Deploy to a local blockchain (Hardhat network):

    ```bash
    npx hardhat node
    npx hardhat run scripts/deploy.js --network localhost
    ```

5. Run tests:

    ```bash
    npx hardhat test
    ```

## Future Enhancements
- Support for multiple work orders per repair request.
- Integration with IPFS for decentralized storage of descriptions and attachments.
- Advanced tenant/landlord dashboards for better UX.
- Mediation tools for dispute resolution between tenants and landlords.

## Contributing
We welcome contributions! Please:

1. Fork the repository.
2. Create a feature branch.
3. Submit a pull request with a detailed description of your changes.

## License
This project is licensed under the MIT License.

Let me know if you need further refinements! 😊





