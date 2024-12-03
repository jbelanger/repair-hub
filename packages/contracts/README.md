# Work Order and Repair Request Smart Contracts

## Overview

This repository contains smart contracts for managing **repair requests** and **work orders** on the blockchain. These contracts provide a decentralized, transparent, and immutable way to handle service agreements between landlords and contractors, initiated through repair requests.

### Features
- **Repair Request Contract**:
  - Create repair requests with metadata (property ID, description hash).
  - Update repair request status (Pending, In Progress, Completed, Rejected).
  - Modify description hashes to reflect changes in repair scope.
  - Full audit trail with event emissions for every state change.

- **Work Order Contract**:
  - Create work orders tied to repair requests.
  - Update work order status (Draft, Signed, In Progress, Completed, Cancelled).
  - Modify work order description hashes as scope changes.
  - Event tracking for all updates.

---

## Prerequisites

### Tools Required
- **Node.js**: Ensure you have Node.js installed. [Download here](https://nodejs.org).
- **npm/pnpm/yarn**: Package manager for installing dependencies.
- **Hardhat**: Ethereum development environment.
- **Ethers.js**: Library for interacting with the blockchain.
- **Mocha** and **Chai**: Testing frameworks.

### Blockchain Environment
- **Local Development**: Use Hardhat’s built-in local Ethereum network.
- **Testnet Deployment**: Supports Goerli or Polygon Mumbai.
- **Mainnet Deployment**: Deploy to Ethereum or other EVM-compatible networks.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo-name.git
   cd your-repo-name

2. Install dependencies:

    ```bash
    npm install

3. Set up a .env file for deployment (optional for testnets):

    ```env
    INFURA_PROJECT_ID=your_infura_project_id
    PRIVATE_KEY=your_private_key
    Replace placeholders with your Infura/Alchemy project ID and private key.

## Usage

### Compile the Smart Contracts

    ```bash
    npx hardhat compile

### Deploy to Local Network
1. Start Hardhat’s local Ethereum node:

    ```bash
    npx hardhat node

2. Deploy the contracts:

    ```bash
    npx hardhat run scripts/deploy.js --network localhost

3. Deploy to Testnet
Specify the network (e.g., Goerli) in the command:

    ```bash
    npx hardhat run scripts/deploy.js --network goerli

## Testing
Run the full test suite using Hardhat:

    ```bash
    npx hardhat test

### Key Tests
RepairRequestContract:

- Create and update repair requests.
- Validate event emissions.
- Handle edge cases like non-existent repair requests.

WorkOrderContract:

- Create and update work orders.
- Update description hashes and statuses.
- Verify independent management of multiple work orders.

## Contract Details
### RepairRequestContract

| Function                   | Description                                          |
|----------------------------|------------------------------------------------------|
| `createRepairRequest`      | Creates a new repair request with metadata.          |
| `updateRepairRequestStatus`| Updates the status of an existing repair request.    |
| `updateDescriptionHash`    | Updates the description hash for a repair request.   |
| `getRepairRequest`         | Fetches details of a specific repair request by ID.  |

### WorkOrderContract

| Function                   | Description                                         |
|----------------------------|-----------------------------------------------------|
| `createWorkOrder`          | Creates a new work order tied to a repair request.  |
| `updateWorkOrderStatus`    | Updates the status of an existing work order.       |
| `updateDescriptionHash`    | Updates the description hash for a work order.      |
| `getWorkOrder`             | Fetches details of a specific work order by ID.     |


File Structure

```bash
├── contracts
│   ├── RepairRequestContract.sol   # Smart contract for repair requests
│   ├── WorkOrderContract.sol       # Smart contract for work orders
├── scripts
│   ├── deploy.js                   # Deployment script
│   ├── interact.js                 # Script to interact with the contracts
├── test
│   ├── RepairRequestContract.test.js # Tests for RepairRequestContract
│   ├── WorkOrderContract.test.js     # Tests for WorkOrderContract
├── hardhat.config.js               # Hardhat configuration file
├── package.json                    # Node.js dependencies
```

## Contribution Guidelines
### How to Contribute
1. Fork the repository.

2. Create a new branch for your feature/bugfix:
    ```bash
    git checkout -b feature-name
    ```
3. Make your changes and add tests where necessary.

4. Commit your changes:

    ```bash
    git commit -m "Add feature-name"
    ```

5. Push to your fork and create a pull request.

## Code Style
* Follow Solidity’s best practices.
* Use Prettier or ESLint for formatting (if applicable).

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgements
Special thanks to the Ethereum and Hardhat communities for their tools and resources.