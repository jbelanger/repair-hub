// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RepairRequestContract
 * @dev Manages repair requests between tenants and landlords.
 * @notice This contract allows tenants to submit repair requests, and landlords to manage them.
 */
contract RepairRequestContract is ReentrancyGuard {
    /// @notice The status of a repair request
    enum Status {
        Pending,        // Request has been created but not yet acted upon
        InProgress,     // Work has been started
        Completed,      // Work has been completed by the landlord
        Accepted,       // Tenant has approved the completed work
        Refused,        // Tenant has rejected the completed work
        Rejected        // Landlord has rejected the repair request
    }

    /// @notice Represents a repair request
    struct RepairRequest {
        uint256 id;                 // Unique ID for the repair request
        address initiator;          // Address of the tenant who initiated the request
        address landlord;           // Address of the landlord
        string propertyId;          // Off-chain property reference
        string descriptionHash;     // Cryptographic hash of the repair description (off-chain)
        string workDetailsHash;     // Cryptographic hash of the work details (off-chain)
        Status status;              // Current status of the repair request
        uint256 createdAt;          // Timestamp when the request was created
        uint256 updatedAt;          // Timestamp of the last update to the request
    }

    /// @notice Mapping of repair request IDs to repair request data
    mapping(uint256 => RepairRequest) private repairRequests;

    /// @notice Counter for generating unique repair request IDs
    uint256 private requestIdCounter;

    /// @notice Emitted when a repair request is created
    event RepairRequestCreated(
        uint256 id,
        address initiator,
        string propertyId,
        string descriptionHash,
        uint256 createdAt
    );

    /// @notice Emitted when work details are updated
    event WorkDetailsUpdated(
        uint256 id,
        string oldHash,
        string newHash,
        uint256 updatedAt
    );

    /// @notice Emitted when a repair request is updated
    event RepairRequestUpdated(
        uint256 id,
        Status oldStatus,
        Status newStatus,
        uint256 updatedAt
    );

    /// @notice Emitted when a new contract version is deployed
    event ContractVersion(string version);

    /// @dev Ensures the repair request exists before performing actions
    modifier requestExists(uint256 _id) {
        require(repairRequests[_id].createdAt != 0, "Repair request does not exist");
        _;
    }

    /// @dev Restricts actions to the landlord of the request
    modifier onlyLandlord(uint256 _id) {
        require(repairRequests[_id].landlord == msg.sender, "Caller is not the landlord");
        _;
    }

    /// @dev Restricts actions to the tenant who initiated the request
    modifier onlyTenant(uint256 _id) {
        require(repairRequests[_id].initiator == msg.sender, "Caller is not the tenant");
        _;
    }

    constructor() {
        emit ContractVersion("1.0.0"); // Initial contract version
    }

    /**
     * @notice Create a new repair request
     * @param _propertyId The ID of the associated property (off-chain reference)
     * @param _descriptionHash Cryptographic hash of the repair description
     * @param _landlord Address of the landlord responsible for the property
     */
    function createRepairRequest(
        string memory _propertyId,
        string memory _descriptionHash,
        address _landlord
    ) external {
        require(bytes(_propertyId).length > 0, "Property ID cannot be empty");
        require(bytes(_descriptionHash).length > 0, "Description hash cannot be empty");
        require(_landlord != address(0), "Landlord address cannot be zero");

        uint256 newRequestId = requestIdCounter + 1; // Increment locally
        requestIdCounter = newRequestId; // Update the counter

        uint256 timestamp = block.timestamp; // Cache block.timestamp

        repairRequests[newRequestId] = RepairRequest({
            id: newRequestId,
            initiator: msg.sender,
            landlord: _landlord,
            propertyId: _propertyId,
            descriptionHash: _descriptionHash,
            workDetailsHash: "",
            status: Status.Pending,
            createdAt: timestamp,
            updatedAt: timestamp
        });

        emit RepairRequestCreated(newRequestId, msg.sender, _propertyId, _descriptionHash, timestamp);
    }

    /**
     * @notice Update the status of a repair request
     * @param _id The ID of the repair request
     * @param _status The new status value (will be converted to Status enum if valid)
     */
    function updateRepairRequestStatus(uint256 _id, uint256 _status)
        external
        requestExists(_id)
        onlyLandlord(_id)
    {
        require(_status <= uint256(Status.Rejected), "Invalid status");

        RepairRequest storage request = repairRequests[_id];
        Status oldStatus = request.status; // Cache old status
        uint256 timestamp = block.timestamp; // Cache block.timestamp

        // Restrict invalid transitions
        require(
            (oldStatus == Status.Pending && _status == uint256(Status.InProgress)) ||
            (oldStatus == Status.InProgress && _status == uint256(Status.Completed)) ||
            (oldStatus == Status.Completed && (_status == uint256(Status.Accepted) || _status == uint256(Status.Refused))) ||
            (oldStatus == Status.Pending && _status == uint256(Status.Rejected)), // Allow rejection from Pending
            "Invalid status transition"
        );

        request.status = Status(_status);
        request.updatedAt = timestamp;

        emit RepairRequestUpdated(_id, oldStatus, request.status, timestamp);
    }

    /**
     * @notice Approve or reject the completed work
     * @param _id The ID of the repair request
     * @param _isAccepted Boolean indicating whether the work is accepted
     */
    function approveWork(uint256 _id, bool _isAccepted)
        external
        requestExists(_id)
        onlyTenant(_id)
        nonReentrant
    {
        RepairRequest storage request = repairRequests[_id];
        require(request.status == Status.Completed, "Work is not completed");

        uint256 timestamp = block.timestamp; // Cache block.timestamp
        Status oldStatus = request.status;

        request.status = _isAccepted ? Status.Accepted : Status.Refused;
        request.updatedAt = timestamp;

        emit RepairRequestUpdated(_id, oldStatus, request.status, timestamp);
    }

    /**
     * @notice Get the details of a repair request
     * @param _id The ID of the repair request
     * @return The repair request details
     */
    function getRepairRequest(uint256 _id)
        external
        view
        requestExists(_id)
        returns (RepairRequest memory)
    {
        return repairRequests[_id];
    }
}
