import chai, { expect } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import LucidTxERC721Mock from "../../artifacts/contracts/LucidTxERC721.sol/LucidTxERC721.json";
import LucidManagerMock from "../../artifacts/contracts/LucidManager.sol/LucidManager.json";
import ERC20Mock from "../../artifacts/contracts/mocks/LucidToken.sol/LucidToken.json";
import { LucidTxERC721 } from "typechain-types/LucidTxERC721";
import { LucidManager } from "typechain-types/LucidManager";
import { ERC20 } from "typechain-types/ERC20";
import { declareSignerWithAddress } from "../test-utils";

chai.use(solidity);

describe("Lucid Claim ERC721", function () {
    let [collector, owner, notOwner, creditor, debtor] = declareSignerWithAddress();
    let lucidManager: LucidManager;
    let erc20Contract: ERC20;
    let lucidTxERC721: LucidTxERC721;
    let claim: any;

    const claimAmount = 100;
    const transferPrice = 500;
    const feeBasisPoint = 1000;
    let dueBy: number;
    const someMultihash = {
        hash: ethers.utils.formatBytes32String("some hash"),
        hashFunction: 0,
        size: 0,
    };

    async function createClaim(creditor: string, debtor: string, description: string, claimAmount: any, erc20Contract: any) {
        dueBy = (await (await ethers.provider.getBlock('latest')).timestamp) + 100;

        // Check Unhappy State
        await expect(lucidTxERC721.createClaim(
            ethers.constants.AddressZero,
            debtor,
            description,
            claimAmount,
            dueBy,
            erc20Contract.address,
            someMultihash
        )).to.be.revertedWith('ZeroAddress')

        await expect(lucidTxERC721.createClaim(
            creditor,
            ethers.constants.AddressZero,
            description,
            claimAmount,
            dueBy,
            erc20Contract.address,
            someMultihash
        )).to.be.revertedWith('ZeroAddress')

        await expect(lucidTxERC721.createClaim(
            creditor,
            debtor,
            description,
            0,
            dueBy,
            erc20Contract.address,
            someMultihash
        )).to.be.revertedWith('ValueMustBeGreaterThanZero')

        await expect(lucidTxERC721.createClaim(
            creditor,
            debtor,
            description,
            claimAmount,
            dueBy - 100,
            erc20Contract.address,
            someMultihash
        )).to.be.revertedWith('PastDueDate')

        await expect(lucidTxERC721.createClaim(
            creditor,
            debtor,
            description,
            claimAmount,
            dueBy,
            creditor,
            someMultihash
        )).to.be.revertedWith('ClaimTokenNotContract')

        let tx = await lucidTxERC721.createClaim(
            creditor,
            debtor,
            description,
            claimAmount,
            dueBy,
            erc20Contract.address,
            someMultihash
        );
        let receipt = await tx.wait();
        let tokenId;
        if (receipt && receipt.events && receipt.events[0].args) {
            tokenId = receipt.events[0].args[2].toString()
        }

        // Check Claim's State
        const claim = await lucidTxERC721.getClaim(tokenId);
        expect(await lucidTxERC721.ownerOf(tokenId)).to.equal(creditor);
        expect(claim.debtor).to.equal(debtor);
        expect(claim.claimAmount).to.equal(claimAmount);
        expect(claim.dueBy).to.equal(dueBy);
        expect(claim.status).to.equal(0);
        expect(claim.claimToken).to.equal(erc20Contract.address);

        return tokenId;
    }

    this.beforeEach(async function () {
        [collector, owner, notOwner, creditor, debtor] = await ethers.getSigners();
        erc20Contract = (await deployContract(debtor, ERC20Mock)) as ERC20;

        lucidManager = (await deployContract(owner, LucidManagerMock, [
            ethers.utils.formatBytes32String("Lucid Manager Test"),
            collector.address,
            0,
        ])) as LucidManager;

        lucidTxERC721 = (await deployContract(owner, LucidTxERC721Mock, [
            lucidManager.address, "ipfs.io/ipfs/"
        ])) as LucidTxERC721;
    });

    describe("Initialize", function () {
        it("should set lucid manager address for erc721", async function () {
            expect(await lucidTxERC721.lucidManager()).to.equal(lucidManager.address);
        });
    });

    describe("pay claim in full", function () {
        this.beforeEach(async () => {
            await erc20Contract.connect(debtor).approve(lucidTxERC721.address, claimAmount);
            await erc20Contract.connect(debtor).transfer(notOwner.address, 1000);
            await erc20Contract.connect(notOwner).approve(lucidTxERC721.address, transferPrice);
        })

        it("Should be able to create multiple claims with different inputs", async () => {
            await createClaim(
                creditor.address,
                debtor.address,
                'Something New',
                1,
                erc20Contract);
            await createClaim(
                debtor.address,
                creditor.address,
                'Something Borrowed',
                100,
                erc20Contract);
            await createClaim(
                creditor.address,
                debtor.address,
                'Something Old',
                10000,
                erc20Contract);
        })

        it("Debtor should be able to pay claim", async () => {
            let tokenId = await createClaim(
                creditor.address,
                debtor.address,
                'my Claim',
                100,
                erc20Contract);

            await expect(lucidTxERC721.connect(debtor).payClaim(tokenId, 0))
                .to.be.revertedWith(`ValueMustBeGreaterThanZero()`);

            let randomID = 12;
            await expect(lucidTxERC721.connect(debtor).payClaim(randomID, 100))
                .to.be.revertedWith(`TokenIdNoExist()`);

            await expect(lucidTxERC721.connect(debtor).payClaim(tokenId, 100))
                .to.emit(lucidTxERC721, "ClaimPayment");

            claim = await lucidTxERC721.getClaim(tokenId);
            expect(claim.status).to.equal(2);
            await expect(lucidTxERC721.connect(debtor).payClaim(tokenId, 100))
                .to.be.revertedWith(`ClaimCompleted()`);
        })

        it("Debtor should be able to pay by increment", async () => {
            let tokenId = await createClaim(
                creditor.address,
                debtor.address,
                'my Claim',
                100,
                erc20Contract);

            await expect(lucidTxERC721.connect(debtor).payClaim(tokenId, 20))
                .to.emit(lucidTxERC721, "ClaimPayment");

            claim = await lucidTxERC721.getClaim(tokenId);
            expect(claim.status).to.equal(1);

            await expect(lucidTxERC721.connect(debtor).payClaim(tokenId, 60))
                .to.emit(lucidTxERC721, "ClaimPayment");

            await expect(lucidTxERC721.connect(debtor).payClaim(tokenId, 30))
                .to.emit(lucidTxERC721, "ClaimPayment");

            claim = await lucidTxERC721.getClaim(tokenId);
            expect(claim.status).to.equal(2)
            expect(await erc20Contract.balanceOf(creditor.address)).to.equal('100')

            await expect(lucidTxERC721.connect(debtor).payClaim(tokenId, 100))
                .to.be.revertedWith(`ClaimCompleted()`);
        })
    })

    describe("reject claim", function () {
        it("should only allow debtor to reject claim", async function () {
            let tokenId = await createClaim(
                creditor.address,
                debtor.address,
                'my Claim',
                100,
                erc20Contract);

            await expect(lucidTxERC721.connect(creditor).rejectClaim(tokenId))
                .to.be.revertedWith('NotDebtor');
            await expect(lucidTxERC721.connect(debtor).rejectClaim(tokenId))
                .to.emit(lucidTxERC721, "ClaimRejected");
            await expect(lucidTxERC721.connect(debtor).rejectClaim(tokenId))
                .to.be.revertedWith("ClaimNotPending()");
            await expect(lucidTxERC721.connect(creditor).rescindClaim(tokenId))
                .to.be.revertedWith("ClaimNotPending()");

            let claim = await lucidTxERC721.getClaim(tokenId);
            expect(claim.status).to.equal(3);
        });
    });

    describe("rescind claim", function () {
        it("should only allow creditor to rescind claim", async function () {
            let tokenId = await createClaim(
                creditor.address,
                debtor.address,
                'my Claim',
                100,
                erc20Contract);

            await expect(lucidTxERC721.connect(debtor).rescindClaim(tokenId))
                .to.be.revertedWith('NotCreditor');
            await expect(lucidTxERC721.connect(creditor).rescindClaim(tokenId))
                .to.emit(lucidTxERC721, "ClaimRescinded");
            await expect(lucidTxERC721.connect(creditor).rescindClaim(tokenId))
                .to.be.revertedWith("ClaimNotPending()");
            await expect(lucidTxERC721.connect(debtor).rejectClaim(tokenId))
                .to.be.revertedWith("ClaimNotPending()");

            let claim = await lucidTxERC721.getClaim(tokenId);
            expect(claim.status).to.equal(4);
        });
    });
});
