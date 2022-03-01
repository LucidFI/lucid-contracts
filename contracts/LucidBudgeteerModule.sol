// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;
import "@gnosis.pm/zodiac/contracts/core/Module.sol";
import "@gnosis.pm/safe-contracts/contracts/base/OwnerManager.sol";
import "./LucidBudgeteer.sol";
import "./BatchCreate.sol";
import "./interfaces/ILucidTx.sol";

/// @title LucidBudgeteerModule
/// @author @sherodtaylor
/// @notice A gnosis module for LucidBudgeteer allowing permissionless use of basic LucidTx and LucidBudgeteer
///     functions (e.g. createClaim, payClaim, updateTag, rejectClaim, rescindClaim) for the signers of a safe.

contract LucidBudgeteerModule is Module {
    string public constant VERSION = "0.0.9";
    address public lucidBudgeteerAddress;
    address public lucidTxAddress;
    address public batchCreateAddress;

    event LucidBudgeteerModuleDeploy(
        string version,
        address indexed safe,
        address indexed moduleAddress,
        address indexed initiator
    );

    /// checks the avatar of the module (will be the gnosis safe) and ensures the EOA is a signer on the safe.
    modifier onlySafeOwner() {
        require(
            OwnerManager(avatar).isOwner(msg.sender),
            "LUCIDMODULE: Not safe owner"
        );
        _;
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param _safe Address of the safe
    /// @param _lucidBudgeteer Address of the avatar in this case, a gnosis safe
    /// @param _lucidTx Address of the avatar in this case, a gnosis safe
    /// @notice Designated token address can not be zero
    constructor(
        address _safe,
        address _lucidBudgeteer,
        address _lucidTx,
        address _batchCreate
    ) {
        bytes memory initParams = abi.encode(
            _safe,
            _lucidBudgeteer,
            _lucidTx,
            _batchCreate
        );
        setUp(initParams);
    }

    function setUp(bytes memory initParams) public override initializer {
        (
            address _safe,
            address _lucidBudgeteer,
            address _lucidTx,
            address _batchCreate
        ) = abi.decode(initParams, (address, address, address, address));
        require(_safe != address(0), "LUCIDMODULE: Zero safe address");
        __Ownable_init();
        setAvatar(_safe);
        setTarget(_safe);
        transferOwnership(_safe);
        lucidBudgeteerAddress = _lucidBudgeteer;
        lucidTxAddress = _lucidTx;
        batchCreateAddress = _batchCreate;

        emit LucidBudgeteerModuleDeploy(VERSION, _safe, address(this), msg.sender);
    }

    function createLucidTx(
        LucidBudgeteer.ClaimParams calldata _claim,
        bytes32 _lucidTag,
        string calldata _tokenUri
    ) external onlySafeOwner {
        bytes memory data = abi.encodeWithSelector(
            LucidBudgeteer.createLucidTx.selector,
            _claim,
            _lucidTag,
            _tokenUri
        );
        require(
            exec(lucidBudgeteerAddress, 0, data, Enum.Operation.Call),
            "LUCIDMODULE: Create claim failed"
        );
    }

    function batchCreate(BatchCreate.CreateClaimParams[] calldata claims)
        external
        onlySafeOwner
    {
        bytes memory data = abi.encodeWithSelector(
            BatchCreate.batchCreate.selector,
            claims
        );
        require(
            exec(batchCreateAddress, 0, data, Enum.Operation.Call),
            "LUCIDMODULE: Batch create failed"
        );
    }

    function updateLucidTag(uint256 _tokenId, bytes32 _lucidTag)
        external
        onlySafeOwner
    {
        bytes memory data = abi.encodeWithSelector(
            LucidBudgeteer.updateLucidTag.selector,
            _tokenId,
            _lucidTag
        );
        require(
            exec(lucidBudgeteerAddress, 0, data, Enum.Operation.Call),
            "LUCIDMODULE: Tag update failed"
        );
    }

    function rejectClaim(uint256 _tokenId) external onlySafeOwner {
        bytes memory data = abi.encodeWithSelector(
            ILucidTx.rejectClaim.selector,
            _tokenId
        );
        require(
            exec(lucidTxAddress, 0, data, Enum.Operation.Call),
            "LUCIDMODULE: Reject failed"
        );
    }

    function rescindClaim(uint256 _tokenId) external onlySafeOwner {
        bytes memory data = abi.encodeWithSelector(
            ILucidTx.rescindClaim.selector,
            _tokenId
        );
        require(
            exec(lucidTxAddress, 0, data, Enum.Operation.Call),
            "LUCIDMODULE: Rescind failed"
        );
    }
}
