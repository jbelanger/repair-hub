// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RepairRequestContract {
    // Enum for the repair request status
    enum Status {
        Pending,
        InProgress,
        Completed,
        Rejected
    }

    // Struct to represent a repair request
    struct RepairRequest {
        uint256 id;
        address initiator; // Address of the user who initiated the request
        string propertyId; // Reference to the property (off-chain ID)
        string descriptionHash; // Hash of the repair request description (off-chain)
        Status status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Mapping of repair request ID to RepairRequest struct
    mapping(uint256 => RepairRequest) repairRequests;

    // Events for repair request lifecycle
    event RepairRequestCreated(
        uint256 id,
        address initiator,
        string propertyId,
        string descriptionHash,
        uint256 createdAt
    );

    event RepairRequestUpdated(
        uint256 id,
        Status status,
        uint256 updatedAt
    );

    event DescriptionHashUpdated(
        uint256 id,
        string oldHash,
        string newHash,
        uint256 updatedAt
    );

    // Counter for generating unique repair request IDs
    uint256 private requestIdCounter;

    // Modifier to check if the repair request exists
    modifier requestExists(uint256 _id) {
        require(
            repairRequests[_id].createdAt != 0,
            "Repair request does not exist"
        );
        _;
    }

    /**
     * @dev Create a new repair request
     * @param _propertyId The ID of the associated property (off-chain)
     * @param _descriptionHash Hash of the repair request description
     */
    function createRepairRequest(
        string memory _propertyId,
        string memory _descriptionHash
    ) external {
        uint256 newRequestId = ++requestIdCounter;

        repairRequests[newRequestId] = RepairRequest({
            id: newRequestId,
            initiator: msg.sender,
            propertyId: _propertyId,
            descriptionHash: _descriptionHash,
            status: Status.Pending,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit RepairRequestCreated(
            newRequestId,
            msg.sender,
            _propertyId,
            _descriptionHash,
            block.timestamp
        );
    }

    /**
     * @dev Update the status of a repair request
     * @param _id The ID of the repair request
     * @param _status The new status of the repair request
     */
    function updateRepairRequestStatus(uint256 _id, Status _status)
        external
        requestExists(_id)
    {
        RepairRequest storage request = repairRequests[_id];
        request.status = _status;
        request.updatedAt = block.timestamp;

        emit RepairRequestUpdated(_id, _status, block.timestamp);
    }

    /**
     * @dev Update the description hash of a repair request
     * @param _id The ID of the repair request
     * @param _newDescriptionHash The new hash of the repair request description
     */
    function updateDescriptionHash(uint256 _id, string memory _newDescriptionHash)
        external
        requestExists(_id)
    {
        RepairRequest storage request = repairRequests[_id];
        string memory oldHash = request.descriptionHash;
        request.descriptionHash = _newDescriptionHash;
        request.updatedAt = block.timestamp;

        emit DescriptionHashUpdated(_id, oldHash, _newDescriptionHash, block.timestamp);
    }

    /**
     * @dev Get the details of a repair request
     * @param _id The ID of the repair request
     * @return RepairRequest details
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
