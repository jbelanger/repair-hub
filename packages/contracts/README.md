# RepairHub Smart Contract: RepairRequestContract

## Overview

The RepairRequestContract is a Solidity upgradeable smart contract designed to facilitate and manage repair requests between tenants and landlords on the blockchain. It leverages OpenZeppelin's upgradeable contracts, role-based access control, pausing functionality, and custom errors for gas efficiency and clearer revert reasons.

## Key Features

### Repair Request Lifecycle:
- Tenants can create new repair requests for a given property.
- Landlords can manage these requests by updating work details and changing statuses.
- Tenants approve or refuse completed work.

### Role-Based Access Control (RBAC):

#### Tenant (Initiator of the request):
- Creates repair requests.
- Updates the repair request description.
- Approves or rejects completed work.
- Cancels requests that are still pending.

#### Landlord (Assigned to a request):
- Updates work details (e.g., off-chain work description hash).
- Transitions the request through its defined lifecycle statuses (e.g., from Pending to InProgress).
- Can reject requests in the Pending state.

#### Admin (Holds ADMIN_ROLE):
- Upgrades the contract implementation (UUPS).
- Pauses and unpauses the contract for emergency stops.

### Request Status Lifecycle:
Repair requests move through several predefined statuses:
- **Pending**: Initial state after creation.
- **InProgress**: Work started by the landlord.
- **Completed**: Landlord marks work as completed.
- **Accepted**: Tenant approves the completed work.
- **Refused**: Tenant rejects the completed work.
- **Rejected**: Landlord rejects the request (when it's still pending).
- **Cancelled**: Tenant cancels the request (while it's still pending).

### Security and Reliability:
- **Custom Errors**: More gas-efficient than string revert reasons.
- **Pausable**: The contract can be paused by the admin in case of emergencies, halting state-changing actions.
- **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuardUpgradeable to prevent reentrant calls.
- **Input Validation**: Checks property IDs, description hashes, and roles to avoid invalid inputs.

## Contract Details

### Enums

```solidity
enum Status {
    Pending,
    InProgress,
    Completed,
    Accepted,
    Refused,
    Rejected,
    Cancelled
}
```

### Structs

```solidity
struct RepairRequest {
    uint256 id;
    address initiator;      // Tenant who created the request
    address landlord;       // Landlord responsible for the property
    string propertyId;      // Off-chain property reference (e.g., DB key or property identifier)
    string descriptionHash; // Hash of the repair description stored off-chain
    string workDetailsHash; // Hash of the work details stored off-chain
    Status status;          // Current status of the repair request
    uint256 createdAt;      // Timestamp when created
    uint256 updatedAt;      // Timestamp of last update
}
```

### Mappings and State

```solidity
mapping(uint256 => RepairRequest) private repairRequests;
uint256 private requestIdCounter; // Incremental counter for assigning unique request IDs
```

### Access Control
- `ADMIN_ROLE`: Granted to the contract admin who can pause, unpause, and authorize upgrades.
- Functions use `onlyTenant(_id)`, `onlyLandlord(_id)`, and `onlyAdmin` modifiers to ensure that only the authorized roles can perform certain actions.

### Pausable
- The `pause()` and `unpause()` functions (restricted to ADMIN_ROLE) can suspend and resume contract operations.
- Most state-changing functions are gated by `whenNotPaused`.

### Events
- `RepairRequestCreated`: Emitted when a tenant creates a new request.
- `WorkDetailsUpdated`: Emitted when the landlord updates the off-chain work details.
- `DescriptionUpdated`: Emitted when the tenant updates the request's description.
- `RepairRequestStatusChanged`: Emitted whenever the status of a request changes (e.g., Pending -> InProgress, Completed -> Accepted).

### Custom Errors
- `RepairRequestDoesNotExist()`: The specified request ID does not exist.
- `CallerIsNotLandlord()`: Action restricted to the landlord of the request.
- `CallerIsNotTenant()`: Action restricted to the initiating tenant.
- `CallerIsNotAdmin()`: Action restricted to an admin.
- `RequestIsCancelled()`: Action not allowed on a cancelled request.
- `InvalidPropertyId()`, `InvalidDescriptionHash()`, `InvalidWorkDetailsHash()`: Input validation failures.
- `ZeroAddress()`: Address input must not be zero.
- `RequestIsNotPending()`: Action requires the request to be in Pending status.
- `InvalidStatusTransition(Status oldStatus, Status newStatus)`: Invalid status transition attempted.
- `RequestNotCompleted()`: Action requires the request to be in Completed status.

## Key Functions

### createRepairRequest
Tenant creates a repair request.

```solidity
function createRepairRequest(
    string memory _propertyId,
    string memory _descriptionHash,
    address _landlord
) external whenNotPaused;
```
- Emitted: `RepairRequestCreated`

### updateDescription
Tenant updates the description hash of a request.

```solidity
function updateDescription(uint256 _id, string memory _descriptionHash) 
    external whenNotPaused;
```
- Requires: `onlyTenant(_id)`
- Emitted: `DescriptionUpdated`

### updateWorkDetails
Landlord updates the work details hash of a request.

```solidity
function updateWorkDetails(uint256 _id, string memory _workDetailsHash) 
    external whenNotPaused;
```
- Requires: `onlyLandlord(_id)`
- Emitted: `WorkDetailsUpdated`

### updateRepairRequestStatus
Landlord updates the status of a request.

```solidity
function updateRepairRequestStatus(uint256 _id, uint256 _status) 
    external whenNotPaused;
```
- Requires: `onlyLandlord(_id)`
- Emitted: `RepairRequestStatusChanged`

### approveWork
Tenant approves or rejects completed work.

```solidity
function approveWork(uint256 _id, bool _isAccepted) 
    external whenNotPaused;
```
- Requires: `onlyTenant(_id)`
- Emitted: `RepairRequestStatusChanged`

### withdrawRepairRequest
Tenant cancels a pending request.

```solidity
function withdrawRepairRequest(uint256 _id) 
    external whenNotPaused;
```
- Requires: `onlyTenant(_id)`
- Emitted: `RepairRequestStatusChanged`

### getRepairRequest
View details of a repair request.

```solidity
function getRepairRequest(uint256 _id)
    external view returns (RepairRequest memory);
```

### pause and unpause

```solidity
function pause() external onlyAdmin;
function unpause() external onlyAdmin;
```
These functions allow the admin to temporarily disable state-changing functions (except for `pause()` and `unpause()` themselves).

## Deployment and Upgradeability

The contract uses the UUPS upgradeable pattern.
- Admin Role: Only an address with the ADMIN_ROLE can call `_authorizeUpgrade`.

### Deployment Checklist:
1. Deploy using a script (e.g., Hardhat).
2. Initialize the contract with an admin address.
3. Assign roles as needed.
4. Test upgrade paths on a test network before mainnet deployment.

## Testing

### Recommended Tests:
- Role Enforcement: Verify that only tenants can create requests, only landlords can update work details, etc.
- Status Transitions: Check all valid and invalid transitions.
- Pausable Behavior: Ensure actions fail when contract is paused.
- Error Handling: Confirm custom errors trigger correctly on invalid inputs or unauthorized actions.

## Conclusion

The RepairRequestContract provides a secure, upgradeable, and transparent way to manage repair requests in a landlord-tenant context. With controlled status transitions, robust access control, pausing functionality, and custom errors for clarity and efficiency, it is well-suited for decentralized property management systems.
