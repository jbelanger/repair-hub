// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

/**
 * @title RepairRequestContract
 * @dev Upgradeable contract for managing repair requests between tenants and landlords.
 * @notice 
 * This contract allows tenants to submit repair requests and landlords to manage them.
 * Tenants can:
 * - Create requests
 * - Update the request description
 * - Approve or refuse completed work
 * - Cancel a request that is still pending
 * 
 * Landlords can:
 * - Update work details
 * - Transition the request through various statuses (e.g., from Pending to InProgress)
 * 
 * Admins (with ADMIN_ROLE) can:
 * - Upgrade the contract implementation
 * - Pause and unpause the contract in case of emergencies
 * 
 * The contract uses a single event for status changes and separate events for creation, 
 * work details updates, and description updates.
 * 
 * Custom errors are used for gas efficiency and clearer revert reasons.
 * 
 * Additionally, we ensure that the `whenNotPaused` modifier is applied directly on state-changing functions
 * so that if the contract is paused, it fails fast with the "Pausable: paused" error before hitting any 
 * custom logic or errors.
 */
contract RepairRequestContract is 
    Initializable, 
    UUPSUpgradeable, 
    ReentrancyGuardUpgradeable, 
    AccessControlUpgradeable, 
    PausableUpgradeable 
{
    /// @notice The status of a repair request
    enum Status {
        Pending,    // Request created but not yet acted upon by the landlord
        InProgress, // Landlord has started the work
        Completed,  // Landlord completed the work
        Accepted,   // Tenant accepted the completed work
        Refused,    // Tenant refused the completed work
        Rejected,   // Landlord rejected the initial request
        Cancelled   // Tenant cancelled the request
    }

    // Custom errors for gas-efficient reverts
    error RepairRequestDoesNotExist();
    error CallerIsNotLandlord();
    error CallerIsNotTenant();
    error CallerIsNotAdmin();
    error RequestIsCancelled();
    error InvalidPropertyId();
    error InvalidDescriptionHash();
    error InvalidWorkDetailsHash();
    error ZeroAddress();
    error RequestIsNotPending();
    error InvalidStatusTransition(Status oldStatus, Status newStatus);
    error RequestNotCompleted();

    /// @notice Represents a repair request and its associated metadata
    struct RepairRequest {
        uint256 id;
        address initiator;      // Tenant who initiated the request
        address landlord;       // Landlord responsible for the property
        string propertyId;      // Off-chain property reference (e.g., a unique ID in a database)
        string descriptionHash; // Hash of the repair description stored off-chain
        string workDetailsHash; // Hash of work details stored off-chain
        Status status;          // Current status of the request
        uint256 createdAt;
        uint256 updatedAt;
    }

    /// @notice Mapping from request ID to the corresponding RepairRequest struct
    mapping(uint256 => RepairRequest) private repairRequests;

    /// @notice Counter for generating unique request IDs
    uint256 private requestIdCounter;

    /// @notice Access control role for admin
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Emitted when a repair request is created
    event RepairRequestCreated(
        uint256 indexed id,
        address indexed initiator,
        address indexed landlord,
        string propertyId,
        string descriptionHash,
        uint256 createdAt
    );

    /// @notice Emitted when work details are updated by the landlord
    event WorkDetailsUpdated(
        uint256 indexed id,
        address indexed initiator,
        address indexed landlord,
        string oldHash,
        string newHash,
        uint256 updatedAt
    );

    /// @notice Emitted when the description is updated by the tenant
    event DescriptionUpdated(
        uint256 indexed id,
        address indexed initiator,
        address indexed landlord,
        string oldHash,
        string newHash,
        uint256 updatedAt
    );

    /// @notice Emitted when a repair request status changes
    event RepairRequestStatusChanged(
        uint256 indexed id,
        address indexed initiator,
        address indexed landlord,
        Status oldStatus,
        Status newStatus,
        uint256 updatedAt
    );

    /// @dev Ensures the repair request exists
    modifier requestExists(uint256 _id) {
        if (repairRequests[_id].createdAt == 0) revert RepairRequestDoesNotExist();
        _;
    }

    /// @dev Ensures the caller is the landlord of the request
    modifier onlyLandlord(uint256 _id) {
        if (repairRequests[_id].landlord != msg.sender) revert CallerIsNotLandlord();
        _;
    }

    /// @dev Ensures the caller is the tenant who initiated the request
    modifier onlyTenant(uint256 _id) {
        if (repairRequests[_id].initiator != msg.sender) revert CallerIsNotTenant();
        _;
    }

    /// @dev Ensures the caller has the admin role
    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert CallerIsNotAdmin();
        _;
    }

    /// @dev Ensures the request is not cancelled
    modifier notCancelled(uint256 _id) {
        if (repairRequests[_id].status == Status.Cancelled) revert RequestIsCancelled();
        _;
    }

    /**
     * @notice Initializes the contract with the given admin
     * @dev Called once during proxy deployment (instead of a constructor).
     * @param _admin The address of the initial admin
     */
    function initialize(address _admin) external initializer {
        if (_admin == address(0)) revert ZeroAddress();

        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(ADMIN_ROLE, _admin);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
    }

    /**
     * @dev Authorize contract upgrades
     * Only an admin can authorize an upgrade.
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyAdmin {}

    /**
     * @notice Pauses the contract
     * @dev Only callable by an admin
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @notice Unpauses the contract
     * @dev Only callable by an admin
     */
    function unpause() external onlyAdmin {
        _unpause();
    }

    /**
     * @notice Create a new repair request by a tenant
     * @dev whenNotPaused modifier ensures that if the contract is paused, it will revert 
     * with "Pausable: paused" before any other checks or errors.
     * @param _propertyId The off-chain property identifier
     * @param _descriptionHash The hash of the repair description details stored off-chain
     * @param _landlord The landlord's address responsible for the property
     */
    function createRepairRequest(
        string memory _propertyId,
        string memory _descriptionHash,
        address _landlord
    ) external whenNotPaused {
        if (_landlord == address(0)) revert ZeroAddress();
        if (bytes(_propertyId).length == 0 || bytes(_propertyId).length > 256) revert InvalidPropertyId();
        if (bytes(_descriptionHash).length == 0 || bytes(_descriptionHash).length > 256) revert InvalidDescriptionHash();

        uint256 newRequestId = requestIdCounter + 1; 
        requestIdCounter = newRequestId;

        uint256 timestamp = block.timestamp;

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

        emit RepairRequestCreated(
            newRequestId,
            msg.sender,
            _landlord,
            _propertyId,
            _descriptionHash,
            timestamp
        );
    }

    /**
     * @notice Tenant withdraws (cancels) a pending repair request
     * @dev Allowed only if the request is still Pending.
     *      The whenNotPaused modifier ensures if paused, "Pausable: paused" reverts first.
     * @param _id The ID of the repair request
     */
    function withdrawRepairRequest(uint256 _id)
        external
        requestExists(_id)
        onlyTenant(_id)
        nonReentrant
        notCancelled(_id)
        whenNotPaused
    {
        RepairRequest storage request = repairRequests[_id];
        if (request.status != Status.Pending) revert RequestIsNotPending();

        Status oldStatus = request.status;
        request.status = Status.Cancelled;
        request.updatedAt = block.timestamp;

        emit RepairRequestStatusChanged(
            _id,
            request.initiator,
            request.landlord,
            oldStatus,
            request.status,
            request.updatedAt
        );
    }

    /**
     * @notice Landlord updates the work details of a request
     * @param _id The ID of the repair request
     * @param _workDetailsHash The new hash of the work details
     */
    function updateWorkDetails(uint256 _id, string memory _workDetailsHash)
        external
        requestExists(_id)
        onlyLandlord(_id)
        notCancelled(_id)
        whenNotPaused
    {
        if (bytes(_workDetailsHash).length == 0 || bytes(_workDetailsHash).length > 256) revert InvalidWorkDetailsHash();

        RepairRequest storage request = repairRequests[_id];
        string memory oldHash = request.workDetailsHash;
        request.workDetailsHash = _workDetailsHash;
        request.updatedAt = block.timestamp;

        emit WorkDetailsUpdated(
            _id,
            request.initiator,
            request.landlord,
            oldHash,
            _workDetailsHash,
            request.updatedAt
        );
    }

    /**
     * @notice Tenant updates the description of a request
     * @param _id The ID of the repair request
     * @param _descriptionHash The new hash of the repair description
     */
    function updateDescription(uint256 _id, string memory _descriptionHash)
        external
        requestExists(_id)
        onlyTenant(_id)
        notCancelled(_id)
        whenNotPaused
    {
        if (bytes(_descriptionHash).length == 0 || bytes(_descriptionHash).length > 256) revert InvalidDescriptionHash();

        RepairRequest storage request = repairRequests[_id];
        string memory oldHash = request.descriptionHash;
        request.descriptionHash = _descriptionHash;
        request.updatedAt = block.timestamp;

        emit DescriptionUpdated(
            _id,
            request.initiator,
            request.landlord,
            oldHash,
            _descriptionHash,
            request.updatedAt
        );
    }

    /**
     * @notice Landlord updates the status of the repair request
     * @dev Valid transitions:
     *  - Pending -> InProgress
     *  - InProgress -> Completed
     *  - Completed -> Accepted or Refused
     *  - Pending -> Rejected
     * Any other transition reverts.
     * @param _id The ID of the repair request
     * @param _status The new status (as an integer cast to Status enum)
     */
    function updateRepairRequestStatus(uint256 _id, uint256 _status)
        external
        requestExists(_id)
        onlyLandlord(_id)
        notCancelled(_id)
        whenNotPaused
    {
        if (_status > uint256(Status.Rejected)) revert InvalidStatusTransition(repairRequests[_id].status, Status(_status));

        RepairRequest storage request = repairRequests[_id];
        Status oldStatus = request.status;
        Status newStatus = Status(_status);

        // Validate allowed transitions
        bool validTransition = (
            (oldStatus == Status.Pending && newStatus == Status.InProgress) ||
            (oldStatus == Status.InProgress && newStatus == Status.Completed) ||
            (oldStatus == Status.Completed && (newStatus == Status.Accepted || newStatus == Status.Refused)) ||
            (oldStatus == Status.Pending && newStatus == Status.Rejected)
        );

        if (!validTransition) revert InvalidStatusTransition(oldStatus, newStatus);

        request.status = newStatus;
        request.updatedAt = block.timestamp;

        emit RepairRequestStatusChanged(
            _id,
            request.initiator,
            request.landlord,
            oldStatus,
            request.status,
            request.updatedAt
        );
    }

    /**
     * @notice Tenant approves or rejects completed work
     * @dev The request must be in Completed status. Tenant sets it to either Accepted or Refused.
     * @param _id The ID of the repair request
     * @param _isAccepted True if accepted, false if refused
     */
    function approveWork(uint256 _id, bool _isAccepted)
        external
        requestExists(_id)
        onlyTenant(_id)
        nonReentrant
        notCancelled(_id)
        whenNotPaused
    {
        RepairRequest storage request = repairRequests[_id];
        if (request.status != Status.Completed) revert RequestNotCompleted();

        Status oldStatus = request.status;
        request.status = _isAccepted ? Status.Accepted : Status.Refused;
        request.updatedAt = block.timestamp;

        emit RepairRequestStatusChanged(
            _id,
            request.initiator,
            request.landlord,
            oldStatus,
            request.status,
            request.updatedAt
        );
    }

    /**
     * @notice View details of a given repair request
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

    /**
     * @dev Reject any direct ETH transfers since this contract does not handle funds.
     * Fallback is called when no other function matches the call.
     */
    fallback() external payable {
        revert("No direct payments accepted");
    }

    /**
     * @dev Reject any direct ETH transfers.
     * Receive is called when the call data is empty and ETH is sent.
     */
    receive() external payable {
        revert("No direct payments accepted");
    }
}
