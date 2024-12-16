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
| `address`   | String                             | Ethereum address for blockchain interactions.      | Off-Chain  |
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
| `createdAt` | DateTime       | Timestamp of when the property was added.          | Off-Chain  |
| `updatedAt` | DateTime       | Timestamp of the last update to the property.      | Off-Chain  |

---

## 3. PropertyTenant (Off-Chain)
Represents a tenant's lease for a specific property.

| Field       | Type           | Description                                          | Storage    |
|-------------|----------------|------------------------------------------------------|------------|
| `id`        | UUID           | Unique identifier for the property-tenant relation. | Off-Chain  |
| `propertyId`| UUID           | Reference to the property.                         | Off-Chain  |
| `tenantId`  | UUID           | Reference to the tenant user.                      | Off-Chain  |
| `startDate` | DateTime       | Start date of the lease.                           | Off-Chain  |
| `endDate`   | DateTime       | End date of the lease.                             | Off-Chain  |
| `status`    | Enum (`Active`, `Expired`, `Terminated`) | Current status of the lease.          | Off-Chain  |
| `createdAt` | DateTime       | Timestamp of when the relation was created.        | Off-Chain  |
| `updatedAt` | DateTime       | Timestamp of the last update to the relation.      | Off-Chain  |

---

## 4. TenantInvitation (Off-Chain)
Represents an invitation sent to a tenant for a property.

| Field       | Type           | Description                                          | Storage    |
|-------------|----------------|------------------------------------------------------|------------|
| `id`        | UUID           | Unique identifier for the invitation.              | Off-Chain  |
| `propertyId`| UUID           | Reference to the property.                         | Off-Chain  |
| `email`     | String         | Email address of the invited tenant.               | Off-Chain  |
| `startDate` | DateTime       | Proposed start date of the lease.                  | Off-Chain  |
| `endDate`   | DateTime       | Proposed end date of the lease.                    | Off-Chain  |
| `status`    | Enum (`Pending`, `Accepted`, `Expired`) | Current status of the invitation.     | Off-Chain  |
| `createdAt` | DateTime       | Timestamp of when the invitation was sent.         | Off-Chain  |
| `expiresAt` | DateTime       | Timestamp when the invitation expires.             | Off-Chain  |

---

## 5. RepairRequest (Hybrid)
Represents a request for a repair or maintenance task.

| Field           | Type                               | Description                                          | Storage    |
|------------------|------------------------------------|------------------------------------------------------|------------|
| `id`            | uint256                            | Unique identifier for the repair request.          | On-Chain   |
| `initiator`     | Address                            | Ethereum address of tenant who initiated request.  | On-Chain   |
| `landlord`      | Address                            | Ethereum address of landlord for the property.     | On-Chain   |
| `propertyId`    | String                             | Off-chain property reference.                      | On-Chain   |
| `description`   | String                             | Details of the issue reported.                     | Off-Chain  |
| `descriptionHash`| String                            | Hash of the repair description for verification.   | On-Chain   |
| `workDetails`   | String                             | Details of work to be done/completed.              | Off-Chain  |
| `workDetailsHash`| String                            | Hash of the work details for verification.         | On-Chain   |
| `status`        | Enum (`Pending`, `InProgress`, `Completed`, `Accepted`, `Refused`, `Rejected`, `Cancelled`) | Current status of the request. | On-Chain |
| `attachments`   | Array<String>                      | References to photos/videos (e.g., IPFS hashes).   | Off-Chain  |
| `urgency`       | Enum (`Low`, `Medium`, `High`)     | Urgency level of the request.                      | Off-Chain  |
| `createdAt`     | uint256                            | Timestamp of when the request was created.         | On-Chain   |
| `updatedAt`     | uint256                            | Timestamp of the last update to the request.       | On-Chain   |

---

## Relationships
1. **User (Landlord) ↔ Property**:  
   - A landlord can own multiple properties.
   - Each property has one landlord.

2. **Property ↔ PropertyTenant**:  
   - A property can have multiple tenant leases (current and historical).
   - Each lease is associated with one property.

3. **User (Tenant) ↔ PropertyTenant**:  
   - A tenant can have multiple property leases (current and historical).
   - Each lease is associated with one tenant.

4. **Property ↔ TenantInvitation**:  
   - A property can have multiple pending invitations.
   - Each invitation is for one property.

5. **PropertyTenant ↔ RepairRequest**:  
   - Only tenants with active leases can create repair requests.
   - Each repair request is associated with a property and its tenant.

---

## Storage Breakdown
### **On-Chain**:
- RepairRequest core data (IDs, addresses, status, timestamps)
- Cryptographic hashes for verifying off-chain data integrity
- Status transitions and event logs

### **Off-Chain**:
- User details and profiles
- Property information and lease management
- Tenant invitations and lease tracking
- Full descriptions and attachments for repair requests
- Additional metadata (urgency levels, notes, etc.)

---

## Next Steps
1. **Implement Storage Logic**:
   - Use IPFS or cloud storage for off-chain data (descriptions, attachments).
   - Implement hash verification system between on-chain and off-chain data.
   - Set up automated lease expiration checks.

2. **Build API**:
   - Create APIs to handle CRUD operations for off-chain data.
   - Implement blockchain interaction layer for on-chain operations.
   - Build invitation and lease management system.
   - Implement email notification system for invitations.

3. **Frontend Development**:
   - Create interfaces for property and lease management.
   - Build tenant invitation and registration flow.
   - Implement repair request lifecycle management.
   - Add role-based access control in UI.

4. **Testing and Security**:
   - Test all lease management flows.
   - Verify tenant authorization for repair requests.
   - Test automatic lease expiration.
   - Implement proper error handling for failed transactions.
   - Ensure data integrity between on-chain and off-chain components.
