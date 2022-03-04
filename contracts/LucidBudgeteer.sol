//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./interfaces/ILucidTx.sol";
import "./LucidTxERC721.sol";
import "./libraries/ContextMixin.sol";
import "./libraries/NativeMetaTransaction.sol";

contract LucidBudgeteer is ContextMixin, NativeMetaTransaction {
    address public lucidTxERC721;

    event LucidTagUpdated(
        address indexed lucidManager,
        uint256 indexed tokenId,
        address indexed updatedBy,
        bytes32 tag,
        uint256 blocktime
    );

    event LucidBudgeteerCreated(
        address indexed lucidManager,
        address indexed lucidTxERC721,
        address lucidBudgeteer,
        uint256 blocktime
    );
    
    struct ClaimParams {
        uint256 claimAmount;
        address creditor;
        address debtor;
        string description;
        uint256 dueBy;
        address claimToken;
        Multihash attachment;
    }

    constructor(address _lucidTxERC721) {
        lucidTxERC721 = _lucidTxERC721;
        emit LucidBudgeteerCreated(
            ILucidTx(_lucidTxERC721).lucidManager(),
            lucidTxERC721,
            address(this),
            block.timestamp
        );
    }

    function _msgSender()
        internal
        view
        returns (address sender)
    {
        return ContextMixin.msgSender();
    }

    function createLucidTx(
        ClaimParams calldata claim,
        bytes32 lucidTag,
        string calldata _tokenUri
    ) public returns (uint256) {
        if (_msgSender() != claim.creditor && _msgSender() != claim.debtor)
            revert NotCreditorOrDebtor(_msgSender());

        address _lucidTxERC721Address = lucidTxERC721;
        uint256 newTokenId = LucidTxERC721(_lucidTxERC721Address)
            .createClaimWithURI(
                claim.creditor,
                claim.debtor,
                claim.description,
                claim.claimAmount,
                claim.dueBy,
                claim.claimToken,
                claim.attachment,
                _tokenUri
            );

        emit LucidTagUpdated(
            ILucidTx(_lucidTxERC721Address).lucidManager(),
            newTokenId,
            _msgSender(),
            lucidTag,
            block.timestamp
        );
        return newTokenId;
    }

    function updateLucidTag(uint256 tokenId, bytes32 newTag) public {
        address _lucidTxERC721Address = lucidTxERC721;
        LucidTxERC721 _lucidTxERC721 = LucidTxERC721(
            _lucidTxERC721Address
        );

        address claimOwner = _lucidTxERC721.ownerOf(tokenId);
        Claim memory lucidTx = _lucidTxERC721.getClaim(tokenId);
        if (_msgSender() != claimOwner && _msgSender() != lucidTx.debtor)
            revert NotCreditorOrDebtor(_msgSender());

        emit LucidTagUpdated(
            ILucidTx(_lucidTxERC721Address).lucidManager(),
            tokenId,
            _msgSender(),
            newTag,
            block.timestamp
        );
    }
}
