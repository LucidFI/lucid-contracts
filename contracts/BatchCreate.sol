// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "./interfaces/ILucidTx.sol";
import "./LucidBudgeteer.sol";
import "./libraries/ContextMixin.sol";
import "./libraries/NativeMetaTransaction.sol";
import "./libraries/ContextMixin.sol";
import "./libraries/NativeMetaTransaction.sol";

error NotOwner();
error BatchTooLarge();
error ZeroLength();
error BatchFailed();

/// @title BatchCreate
/// @author @sherodtaylor
/// @notice A contract to allow for the creation of multiple claims in a single transaction.
/// @dev Uses delegatecall to forward the value of msg.sender to LucidBudgeteer.
/// @dev Max operations should be wary of the block gas limit on a certain network
contract BatchCreate is ContextMixin, NativeMetaTransaction {
    address public lucidTxERC721;
    address public lucidBudgeteer;
    uint8 public maxOperations;
    address public owner;

    struct CreateClaimParams {
        string description;
        string tokenURI;
        address creditor;
        address debtor;
        uint256 claimAmount;
        uint256 dueBy;
        address claimToken;
        bytes32 tag;
        Multihash attachment;
    }

    modifier batchGuard(uint256 length) {
        if (length > maxOperations) revert BatchTooLarge();
        if (length == 0) revert ZeroLength();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _lucidBudgeteer,
        address _lucidTx,
        uint8 _maxOperations
    ) {
        lucidTxERC721 = _lucidTx;
        lucidBudgeteer = _lucidBudgeteer;
        maxOperations = _maxOperations;
        owner = msg.sender;
    }

    function _msgSender()
        internal
        view
        returns (address sender)
    {
        return ContextMixin.msgSender();
    }

    function transferOwnership(address newOwner) public onlyOwner {
        owner = newOwner;
    }

    function updateMaxOperations(uint8 _maxOperations) external onlyOwner {
        maxOperations = _maxOperations;
    }

    function batchCreate(CreateClaimParams[] calldata claims)
        external
        batchGuard(claims.length)
    {
        for (uint256 i = 0; i < claims.length; i++) {
            (bool success, ) = lucidBudgeteer.delegatecall(
                abi.encodeWithSelector(
                    LucidBudgeteer.createLucidTx.selector,
                    LucidBudgeteer.ClaimParams(
                        claims[i].claimAmount,
                        claims[i].creditor,
                        claims[i].debtor,
                        claims[i].description,
                        claims[i].dueBy,
                        claims[i].claimToken,
                        claims[i].attachment
                    ),
                    claims[i].tag,
                    claims[i].tokenURI
                )
            );
            if (!success) revert BatchFailed();
        }
    }
}
