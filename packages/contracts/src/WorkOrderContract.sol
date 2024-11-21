// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WorkOrderContract {
    // Enum for the work order status
    enum Status {
        Draft,
        Signed,
        InProgress,
        Completed,
        Cancelled
    }

    // Struct to represent a work order
    struct WorkOrder {
        uint256 id;
        uint256 repairRequestId; // Reference to the repair request
        address landlord; // Landlord's address
        address contractor; // Contractor's address
        uint256 agreedPrice; // Agreed payment for the repair
        string descriptionHash; // Hash of the detailed work order description (off-chain)
        Status status; // Status of the work order
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Mapping of work order ID to WorkOrder struct
    mapping(uint256 => WorkOrder) public workOrders;

    // Events for work order lifecycle
    event WorkOrderCreated(
        uint256 id,
        uint256 repairRequestId,
        address indexed landlord,
        address indexed contractor,
        uint256 agreedPrice,
        string descriptionHash,
        uint256 createdAt
    );

    event WorkOrderUpdated(
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

    // Counter for generating unique work order IDs
    uint256 private workOrderIdCounter;

    // Modifier to check if the work order exists
    modifier workOrderExists(uint256 _id) {
        require(workOrders[_id].createdAt != 0, "Work order does not exist");
        _;
    }

    /**
     * @dev Create a new work order
     * @param _repairRequestId ID of the associated repair request
     * @param _landlord Address of the landlord
     * @param _contractor Address of the contractor
     * @param _agreedPrice Agreed price for the repair
     * @param _descriptionHash Hash of the detailed work order description
     */
    function createWorkOrder(
        uint256 _repairRequestId,
        address _landlord,
        address _contractor,
        uint256 _agreedPrice,
        string memory _descriptionHash
    ) external {
        uint256 newWorkOrderId = ++workOrderIdCounter;

        workOrders[newWorkOrderId] = WorkOrder({
            id: newWorkOrderId,
            repairRequestId: _repairRequestId,
            landlord: _landlord,
            contractor: _contractor,
            agreedPrice: _agreedPrice,
            descriptionHash: _descriptionHash,
            status: Status.Draft,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit WorkOrderCreated(
            newWorkOrderId,
            _repairRequestId,
            _landlord,
            _contractor,
            _agreedPrice,
            _descriptionHash,
            block.timestamp
        );
    }

    /**
     * @dev Update the status of a work order
     * @param _id ID of the work order
     * @param _status New status of the work order
     */
    function updateWorkOrderStatus(uint256 _id, Status _status)
        external
        workOrderExists(_id)
    {
        WorkOrder storage workOrder = workOrders[_id];
        workOrder.status = _status;
        workOrder.updatedAt = block.timestamp;

        emit WorkOrderUpdated(_id, _status, block.timestamp);
    }

    /**
     * @dev Update the description hash of a work order
     * @param _id ID of the work order
     * @param _newDescriptionHash New hash of the detailed work order description
     */
    function updateDescriptionHash(uint256 _id, string memory _newDescriptionHash)
        external
        workOrderExists(_id)
    {
        WorkOrder storage workOrder = workOrders[_id];
        string memory oldHash = workOrder.descriptionHash;
        workOrder.descriptionHash = _newDescriptionHash;
        workOrder.updatedAt = block.timestamp;

        emit DescriptionHashUpdated(_id, oldHash, _newDescriptionHash, block.timestamp);
    }

    /**
     * @dev Get details of a work order
     * @param _id ID of the work order
     * @return WorkOrder details
     */
    function getWorkOrder(uint256 _id)
        external
        view
        workOrderExists(_id)
        returns (WorkOrder memory)
    {
        return workOrders[_id];
    }
}
