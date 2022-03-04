//SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./interfaces/ILucidManager.sol";
import "./interfaces/ILucidTx.sol";
import "./libraries/ContextMixin.sol";
import "./libraries/NativeMetaTransaction.sol";

error ZeroAddress();
error PastDueDate();
error TokenIdNoExist();
error ClaimTokenNotContract();
error NotCreditor(address sender);
error NotDebtor(address sender);
error NotTokenOwner(address sender);
error NotCreditorOrDebtor(address sender);
error OwnerNotCreditor(address sender);
error ClaimCompleted();
error ClaimNotPending();
error IncorrectValue(uint256 value, uint256 expectedValue);
error InsufficientBalance(uint256 senderBalance);
error InsufficientAllowance(uint256 senderAllowance);
error RepayingTooMuch(uint256 amount, uint256 expectedAmount);
error ValueMustBeGreaterThanZero();

abstract contract LucidTxERC721URI is Ownable, ERC721URIStorage {
    string public baseURI;

    function setBaseURI(string memory baseURI_) public onlyOwner {
        baseURI = baseURI_;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
}

contract LucidTxERC721 is ILucidTx, LucidTxERC721URI, ContextMixin, NativeMetaTransaction {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;
    using Address for address;

    Counters.Counter private tokenIds;

    address public override lucidManager;
    mapping(uint256 => Claim) private claimTokens;

    modifier onlyTokenOwner(uint256 tokenId) {
        if (ownerOf(tokenId) != _msgSender()) revert NotCreditor(_msgSender());
        _;
    }
    
    modifier onlyDebtor(uint256 tokenId) {
        if (claimTokens[tokenId].debtor != _msgSender())
            revert NotDebtor(_msgSender());
        _;
    }

    modifier onlyIncompleteClaim(uint256 tokenId) {
        if (
            claimTokens[tokenId].status != Status.Pending &&
            claimTokens[tokenId].status != Status.Repaying
        ) revert ClaimCompleted();
        _;
    }

    modifier onlyPendingClaim(uint256 tokenId) {
        if (claimTokens[tokenId].status != Status.Pending)
            revert ClaimNotPending();
        _;
    }

    constructor(address lucidManager_, string memory baseURI_)
        ERC721("LucidTx721", "CLAIM")
    {
        setLucidManager(lucidManager_);
        setBaseURI(baseURI_);
    }

    function _msgSender()
        internal
        view
        override
        returns (address sender)
    {
        return ContextMixin.msgSender();
    }


    function setLucidManager(address _lucidManager) public onlyOwner {
        address prevLucidManager = lucidManager;
        lucidManager = _lucidManager;
        emit LucidManagerSet(prevLucidManager, lucidManager, block.timestamp);
    }

    function _createClaim(
        address creditor,
        address debtor,
        string memory description,
        uint256 claimAmount,
        uint256 dueBy,
        address claimToken,
        Multihash calldata attachment
    ) internal returns (uint256) {
        if (creditor == address(0) || debtor == address(0)) {
            revert ZeroAddress();
        }
        if (claimAmount == 0) {
            revert ValueMustBeGreaterThanZero();
        }
        if (dueBy < block.timestamp) {
            revert PastDueDate();
        }
        if (!claimToken.isContract()) {
            revert ClaimTokenNotContract();
        }

        tokenIds.increment();
        uint256 newTokenId = tokenIds.current();
        _safeMint(creditor, newTokenId);

        Claim memory newClaim;
        newClaim.debtor = debtor;
        newClaim.claimAmount = claimAmount;
        newClaim.dueBy = dueBy;
        newClaim.status = Status.Pending;
        newClaim.claimToken = claimToken;
        newClaim.attachment = attachment;
        claimTokens[newTokenId] = newClaim;

        emit ClaimCreated(
            lucidManager,
            newTokenId,
            _msgSender(),
            creditor,
            debtor,
            tx.origin,
            description,
            newClaim,
            block.timestamp
        );
        return newTokenId;
    }

    function createClaim(
        address creditor,
        address debtor,
        string memory description,
        uint256 claimAmount,
        uint256 dueBy,
        address claimToken,
        Multihash calldata attachment
    ) external override returns (uint256) {
        uint256 _tokenId = _createClaim(
            creditor,
            debtor,
            description,
            claimAmount,
            dueBy,
            claimToken,
            attachment
        );
        return _tokenId;
    }

    function createClaimWithURI(
        address creditor,
        address debtor,
        string memory description,
        uint256 claimAmount,
        uint256 dueBy,
        address claimToken,
        Multihash calldata attachment,
        string calldata _tokenUri
    ) external override returns (uint256) {
        uint256 _tokenId = _createClaim(
            creditor,
            debtor,
            description,
            claimAmount,
            dueBy,
            claimToken,
            attachment
        );
        _setTokenURI(_tokenId, _tokenUri);
        return _tokenId;
    }

    function payClaim(uint256 tokenId, uint256 paymentAmount)
        external
        override
        onlyIncompleteClaim(tokenId)
    {
        if (paymentAmount == 0) revert ValueMustBeGreaterThanZero();
        if (!_exists(tokenId)) revert TokenIdNoExist();

        Claim memory claim = getClaim(tokenId);
        address creditor = ownerOf(tokenId);

        uint256 amountToRepay = claim.claimAmount - claim.paidAmount;
        uint256 totalPayment = paymentAmount >= amountToRepay
            ? amountToRepay
            : paymentAmount;
        claim.paidAmount + totalPayment == claim.claimAmount
            ? claim.status = Status.Paid
            : claim.status = Status.Repaying;
        claimTokens[tokenId].paidAmount += totalPayment;
        claimTokens[tokenId].status = claim.status;

        (address collectionAddress, uint256 transactionFee) = ILucidManager(
            lucidManager
        ).getTransactionFee(_msgSender(), totalPayment);

        IERC20(claim.claimToken).safeTransferFrom(
            _msgSender(),
            creditor,
            totalPayment - transactionFee
        );

        if (transactionFee > 0) {
            IERC20(claim.claimToken).safeTransferFrom(
                _msgSender(),
                collectionAddress,
                transactionFee
            );
        }

        emit ClaimPayment(
            lucidManager,
            tokenId,
            claim.debtor,
            _msgSender(),
            tx.origin,
            paymentAmount,
            block.timestamp
        );
        emit FeePaid(
            lucidManager,
            tokenId,
            collectionAddress,
            paymentAmount,
            transactionFee,
            block.timestamp
        );
    }

    function rejectClaim(uint256 tokenId)
        external
        override
        onlyDebtor(tokenId)
        onlyPendingClaim(tokenId)
    {
        claimTokens[tokenId].status = Status.Rejected;
        emit ClaimRejected(lucidManager, tokenId, block.timestamp);
    }

    function rescindClaim(uint256 tokenId)
        external
        override
        onlyTokenOwner(tokenId)
        onlyPendingClaim(tokenId)
    {
        claimTokens[tokenId].status = Status.Rescinded;
        emit ClaimRescinded(lucidManager, tokenId, block.timestamp);
    }

    function burn(uint256 tokenId) external onlyTokenOwner(tokenId) {
        _burn(tokenId);
    }

    function nextClaimId() external view returns (uint256) {
        return tokenIds.current() + 1;
    }

    function getClaim(uint256 tokenId)
        public
        view
        override
        returns (Claim memory)
    {
        return claimTokens[tokenId];
    }
}
