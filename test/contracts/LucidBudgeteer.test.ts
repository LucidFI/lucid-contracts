import chai, { expect } from "chai";
import { deployContract, solidity } from "ethereum-waffle";
import { utils } from "ethers";
import { ethers } from "hardhat";
import LucidBudgeteerMock from "../../artifacts/contracts/LucidBudgeteer.sol/LucidBudgeteer.json";
import LucidTxERC721Mock from "../../artifacts/contracts/LucidTxERC721.sol/LucidTxERC721.json";
import LucidManagerMock from "../../artifacts/contracts/LucidManager.sol/LucidManager.json";
import ERC20Mock from "../../artifacts/contracts/mocks/LucidToken.sol/LucidToken.json";
import { LucidBudgeteer } from "typechain-types/LucidBudgeteer";
import { LucidTxERC721 } from "typechain-types/LucidTxERC721";
import { LucidManager } from "typechain-types/LucidManager";
import { ERC20 } from "typechain-types/ERC20";
import { declareSignerWithAddress } from "../test-utils";

chai.use(solidity);

describe("Lucid Budgeteer", function () {
    let [collector, owner, notOwner, creditor, debtor] = declareSignerWithAddress();
    let lucidManager: LucidManager;
    let lucidBudgeteer: LucidBudgeteer;
    let erc20Contract: ERC20;
    let lucidTxERC721: LucidTxERC721;

    let claimAmount = ethers.utils.parseEther("100.0");
    let feeBasisPoint = 1000;
    this.beforeEach(async function () {
        [collector, owner, notOwner, creditor, debtor] = await ethers.getSigners();
        erc20Contract = (await deployContract(debtor, ERC20Mock)) as ERC20;

        lucidManager = (await deployContract(owner, LucidManagerMock, [
            ethers.utils.formatBytes32String("Lucid Manager Test"),
            collector.address,
            feeBasisPoint,
        ])) as LucidManager;

        lucidTxERC721 = (await deployContract(owner, LucidTxERC721Mock, [
            lucidManager.address, "ipfs.io/ipfs/"
        ])) as LucidTxERC721;

        lucidBudgeteer = (await deployContract(owner, LucidBudgeteerMock, [
            lucidTxERC721.address,
        ])) as LucidBudgeteer;
    });
    describe("Assigning Tags", function () {
        const creditorTag = utils.formatBytes32String("creditor tag");
        const debtorTag = utils.formatBytes32String("debtor tag");
        const someMultihash = {
            hash: ethers.utils.formatBytes32String("some hash"),
            hashFunction: 0,
            size: 0,
        };

        it("should emit update tag when creating a claim", async function () {
            let dueBy = (await (await ethers.provider.getBlock('latest')).timestamp) + 100;
            await expect(lucidBudgeteer
                .connect(notOwner)
                .createLucidTx(
                    {
                        claimAmount,
                        creditor: creditor.address,
                        debtor:debtor.address,
                        attachment: someMultihash,
                        claimToken: erc20Contract.address,
                        dueBy,
                        description: "test"
                    },
                    creditorTag,
                    'testURI'
                )).to.be.revertedWith(`NotCreditorOrDebtor("${notOwner.address}")`);

            await expect(await lucidBudgeteer
                .connect(creditor)
                .createLucidTx(
                    {
                        claimAmount,
                        creditor: creditor.address,
                        debtor:debtor.address,
                        attachment: someMultihash,
                        claimToken: erc20Contract.address,
                        dueBy,
                        description: "test"
                    },
                    creditorTag,
                    'testURI'
                )).to.emit(lucidBudgeteer, "LucidTagUpdated")
                .withArgs(
                    lucidManager.address,
                    1,
                    creditor.address,
                    creditorTag,
                    (await (await ethers.provider.getBlock('latest')).timestamp)
                );

            const owner = await lucidTxERC721.ownerOf(1);
            expect(owner).to.equal(creditor.address);
        });

        it("should emit update tag when updating a tag", async function () {
            const randomId = 12;
            await expect(lucidBudgeteer.connect(notOwner).updateLucidTag(randomId, creditorTag))
                .to.be.revertedWith(
                    "ERC721: owner query for nonexistent token"
                );

            let dueBy = (await (await ethers.provider.getBlock('latest')).timestamp) + 100;
            await expect(await lucidBudgeteer
                .connect(creditor)
                .createLucidTx(
                    {
                        claimAmount,
                        creditor: creditor.address,
                        debtor:debtor.address,
                        attachment: someMultihash,
                        claimToken: erc20Contract.address,
                        dueBy,
                        description: "test"
                    },
                    creditorTag,
                    'testURI'
                )).to.emit(lucidBudgeteer, "LucidTagUpdated")

            await expect(lucidBudgeteer.connect(notOwner).updateLucidTag(1, creditorTag))
                .to.be.revertedWith(
                    `NotCreditorOrDebtor("${notOwner.address}")`
                );

            await expect(await lucidBudgeteer.connect(creditor).updateLucidTag(1, creditorTag))
                .to.emit(lucidBudgeteer, "LucidTagUpdated")
                .withArgs(
                    lucidManager.address,
                    1,
                    creditor.address,
                    creditorTag,
                    (await (await ethers.provider.getBlock('latest')).timestamp)
                );

            await expect(await lucidBudgeteer.connect(debtor).updateLucidTag(1, debtorTag))
                .to.emit(lucidBudgeteer, "LucidTagUpdated")
                .withArgs(
                    lucidManager.address,
                    1,
                    debtor.address,
                    debtorTag,
                    (await (await ethers.provider.getBlock('latest')).timestamp)
                );
        });
    });
});
