# RepairHub Data Model: On-Chain and Off-Chain Storage

## 1. User (Off-Chain)
Represents tenants, landlords, and system administrators.

| Field       | Type                               | Description                                          | Storage    |
|-------------|------------------------------------|------------------------------------------------------|------------|
| `id`        | UUID                               | Unique identifier for each user.                   | Off-Chain  |
| `name`      | String                             | Full name of the user.                             | Off-Chain  |
| `email`     | String                             | Email address for communication.                   | Off-Chain  |
| `role`      | Enum (`Tenant`, `Landlord`, `Admin`) | Role of the user in the system.                    | Off-Chain  |
| `phone`     | String (Optional)                  | Contact number.                                    | Off-Chain  |
| `address`   | String                             | Address of the user.                               | Off-Chain  |
| `createdAt` | DateTime                           | Timestamp of when the user was created.            | Off-Chain  |
| `updatedAt` | DateTime                           | Timestamp of the last update to the user.          | Off-Chain  |

---

## 2. Property (Off-Chain)
Represents a rental property managed by a landlord.

| Field       | Type           | Description                                          | Storage    |
|-------------|----------------|------------------------------------------------------|------------|
| `id`        | UUID           | Unique identifier for the property.                | Off-Chain  |
| `landlordId`| UUID           | Reference to the landlord managing the property.   | Off-Chain  |
| `address`   | String         | Full address of the property.                      | Off-Chain  |
| `tenants`   | Array<UUID>    | List of tenant IDs residing in the property.        | Off-Chain  |
| `createdAt` | DateTime       | Timestamp of when the property was added.          | Off-Chain  |
| `updatedAt` | DateTime       | Timestamp of the last update to the property.      | Off-Chain  |

---

## 3. RepairRequest (Hybrid)
Represents a request for a repair or maintenance task.

| Field           | Type                               | Description                                          | Storage    |
|------------------|------------------------------------|------------------------------------------------------|------------|
| `id`            | UUID                               | Unique identifier for the repair request.          | On-Chain   |
| `initiatorId`   | UUID                               | Reference to the user who initiated the request.   | Off-Chain  |
| `propertyId`    | UUID                               | Reference to the associated property.              | Off-Chain  |
| `description`   | String                             | Details of the issue reported.                     | Off-Chain  |
| `urgency`       | Enum (`Low`, `Medium`, `High`)     | Urgency level of the request.                      | Off-Chain  |
| `status`        | Enum (`Pending`, `In Progress`, `Completed`, `Rejected`) | Status of the request. | On-Chain   |
| `attachments`   | Array<String>                      | References to photos/videos (e.g., IPFS hashes).   | Off-Chain  |
| `hash`          | String                             | Cryptographic hash of the description and attachments for verification. | On-Chain   |
| `createdAt`     | DateTime                           | Timestamp of when the request was created.         | On-Chain   |
| `updatedAt`     | DateTime                           | Timestamp of the last update to the request.       | On-Chain   |

---

## 4. Contractor (Off-Chain)
Represents a contractor or service provider.

| Field           | Type           | Description                                          | Storage    |
|------------------|----------------|------------------------------------------------------|------------|
| `id`            | UUID           | Unique identifier for the contractor.              | Off-Chain  |
| `name`          | String         | Full name or company name of the contractor.       | Off-Chain  |
| `specialization`| String         | Area of expertise (e.g., plumbing, electrical).    | Off-Chain  |
| `phone`         | String         | Contact number.                                     | Off-Chain  |
| `email`         | String (Optional) | Email address.                                   | Off-Chain  |
| `createdAt`     | DateTime       | Timestamp of when the contractor was added.        | Off-Chain  |
| `updatedAt`     | DateTime       | Timestamp of the last update to the contractor.    | Off-Chain  |

---

## 5. RepairContract (Hybrid)
Represents a contract for a repair task between the landlord and a contractor.

| Field           | Type                               | Description                                          | Storage    |
|------------------|------------------------------------|------------------------------------------------------|------------|
| `id`            | UUID                               | Unique identifier for the repair contract.         | On-Chain   |
| `repairRequestId`| UUID                              | Reference to the associated repair request.        | On-Chain   |
| `contractorId`   | UUID                              | Reference to the contractor handling the task.     | Off-Chain  |
| `agreedPrice`    | Decimal                           | Price agreed upon for the task.                    | On-Chain   |
| `status`         | Enum (`Draft`, `Signed`, `In Progress`, `Completed`, `Cancelled`) | Contract status. | On-Chain   |
| `startDate`      | DateTime                          | Scheduled start date of the work.                  | Off-Chain  |
| `completionDate` | DateTime (Optional)               | Date when the work was completed.                  | Off-Chain  |
| `hash`           | String                            | Cryptographic hash of the contract terms.          | On-Chain   |
| `createdAt`      | DateTime                          | Timestamp of when the contract was created.        | On-Chain   |
| `updatedAt`      | DateTime                          | Timestamp of the last update to the contract.      | On-Chain   |

---

## Relationships
1. **User ↔ RepairRequest**:  
   - A user (tenant or landlord) can initiate multiple repair requests.

2. **Property ↔ RepairRequest**:  
   - Each repair request is tied to a specific property.

3. **RepairRequest ↔ RepairContract**:  
   - A repair request can result in one or more repair contracts.

4. **RepairContract ↔ Contractor**:  
   - Each contract is assigned to a single contractor.

5. **User ↔ Property**:  
   - A landlord owns multiple properties, and a property can have multiple tenants.

---

## Storage Breakdown
### **On-Chain**:
- IDs, hashes, and key metadata for **RepairRequest** and **RepairContract**.
- Status changes and timestamps for critical actions.
- Immutable payment transactions via smart contracts.

### **Off-Chain**:
- User details, contractor profiles, and property data.
- Descriptions, attachments, and operational metadata for repair requests.
- Full contract details and non-critical timestamps (e.g., start/completion dates).

---

## Next Steps
1. **Implement Storage Logic**:
   - Use IPFS or cloud storage for off-chain data.
   - Design smart contracts for on-chain records and verification.

2. **Build API**:
   - Create APIs to handle CRUD operations for off-chain data and interact with on-chain smart contracts.

3. **Iterate and Test**:
   - Ensure data integrity between on-chain and off-chain components using hashes.
   - Validate workflows for repair requests and contracts.

