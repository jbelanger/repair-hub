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
        uint256 agreedPrice; // Agreed payment for the repair
        string descriptionHash; // Hash of the detailed work order description (off-chain)
        Status status; // Status of the work order
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Mappings
    mapping(uint256 => WorkOrder) private workOrders; // Maps work order ID to WorkOrder struct
    mapping(uint256 => uint256[]) private repairRequestToWorkOrders; // Maps repair request ID to work order IDs

    // Counter for generating unique work order IDs
    uint256 private workOrderIdCounter;

    // Events for work order lifecycle
    event WorkOrderCreated(
        uint256 id,
        uint256 repairRequestId,
        address indexed landlord,
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

    // Modifier to check if the work order exists
    modifier workOrderExists(uint256 _id) {
        require(workOrders[_id].createdAt != 0, "Work order does not exist");
        _;
    }

    // Modifier to restrict access to the landlord of the work order
    modifier onlyLandlord(uint256 _id) {
        require(
            workOrders[_id].landlord == msg.sender,
            "Only the landlord can modify this work order"
        );
        _;
    }

    /**
     * @dev Create a new work order
     * @param _repairRequestId ID of the associated repair request
     * @param _landlord Address of the landlord
     * @param _agreedPrice Agreed price for the repair
     * @param _descriptionHash Hash of the detailed work order description
     */
    function createWorkOrder(
        uint256 _repairRequestId,
        address _landlord,
        uint256 _agreedPrice,
        string memory _descriptionHash
    ) external {
        uint256 newWorkOrderId = ++workOrderIdCounter;

        workOrders[newWorkOrderId] = WorkOrder({
            id: newWorkOrderId,
            repairRequestId: _repairRequestId,
            landlord: _landlord,
            agreedPrice: _agreedPrice,
            descriptionHash: _descriptionHash,
            status: Status.Draft,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        // Link the work order to the repair request
        repairRequestToWorkOrders[_repairRequestId].push(newWorkOrderId);

        emit WorkOrderCreated(
            newWorkOrderId,
            _repairRequestId,
            _landlord,
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
        onlyLandlord(_id)
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
        onlyLandlord(_id)
    {
        WorkOrder storage workOrder = workOrders[_id];
        string memory oldHash = workOrder.descriptionHash;
        workOrder.descriptionHash = _newDescriptionHash;
        workOrder.updatedAt = block.timestamp;

        emit DescriptionHashUpdated(_id, oldHash, _newDescriptionHash, block.timestamp);
    }

    /**
     * @dev Get a work order by ID
     * @param _workOrderId ID of the work order
     * @return WorkOrder struct
     */
    function getWorkOrderById(uint256 _workOrderId)
        external
        view
        returns (WorkOrder memory)
    {
        require(workOrders[_workOrderId].createdAt != 0, "Work order does not exist");
        return workOrders[_workOrderId];
    }

    /**
     * @dev Get all work order IDs associated with a repair request
     * @param _repairRequestId ID of the repair request
     * @return Array of work order IDs
     */
    function getWorkOrdersByRepairRequest(uint256 _repairRequestId)
        external
        view
        returns (uint256[] memory)
    {
        return repairRequestToWorkOrders[_repairRequestId];
    }
}
