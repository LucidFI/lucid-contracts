import { Wallet } from "@ethersproject/wallet";
import chai, { expect } from "chai";
import { deployContract, MockProvider, solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import LucidManagerMock from "../../artifacts/contracts/LucidManager.sol/LucidManager.json";
import { LucidManager } from "typechain-types/LucidManager";
import { declareSignerWithAddress } from "../test-utils";

chai.use(solidity);

describe("Lucid Manager", function () {
    let [collector, newOwner, signer] = declareSignerWithAddress();
    let lucidManagerToken: LucidManager;

    beforeEach(async function () {
        [collector, newOwner, signer] = await ethers.getSigners();
        lucidManagerToken = (await deployContract(signer, LucidManagerMock, [
            ethers.utils.formatBytes32String("Lucid Manager Test"),
            collector.address,
            100,
        ])) as LucidManager;
    });
    describe("Deployment", function () {
        it("should set owner as signer", async function () {
            expect(await lucidManagerToken.owner()).to.equal(signer.address);
        });
        it("should set collection address", async function () {
            let [_, collectionAddress] = await lucidManagerToken.getFeeInfo(newOwner.address);
            expect(collectionAddress).to.equal(collector.address);
        });

        it("should set fee basis point", async function () {
            let { feeBasisPoints } = await lucidManagerToken.feeInfo();
            expect(feeBasisPoints).to.equal(100);
        });

        it("should set description", async function () {
            expect(await lucidManagerToken.description()).to.equal(
                ethers.utils.formatBytes32String("Lucid Manager Test")
            );
        });

        it("should emit FeeChanged event", async function () {
            await expect(lucidManagerToken.deployTransaction).to.emit(lucidManagerToken, "FeeChanged");
        });

        it("should emit CollectorChanged event", async function () {
            await expect(lucidManagerToken.deployTransaction).to.emit(lucidManagerToken, "CollectorChanged");
        });
        it("should emit OwnerChanged event", async function () {
            await expect(lucidManagerToken.deployTransaction).to.emit(lucidManagerToken, "OwnerChanged");
        });
    });

    describe("setOwner", function () {
        it("should set new owner", async function () {
            await lucidManagerToken.setOwner(newOwner.address);
            expect(await lucidManagerToken.owner()).to.equal(newOwner.address);
        });
        it("should emit OwnerChanged event", async function () {
            expect(await lucidManagerToken.setOwner(newOwner.address)).to.emit(lucidManagerToken, "OwnerChanged");
        });
        it("should raise error when non-owner invokes the call", async function () {
            await expect(
                lucidManagerToken
                    .connect(newOwner)
                    .setOwner(newOwner.address)
                    .then(tx => tx.wait())
            ).to.be.reverted;
        });
    });

    describe("setFee", function () {
        it("should set new fee", async function () {
            await lucidManagerToken.setFee(400);
            let { feeBasisPoints } = await lucidManagerToken.feeInfo();
            expect(feeBasisPoints).to.equal(400);
        });
        it("should emit FeeChanged event", async function () {
            expect(await lucidManagerToken.setFee(400)).to.emit(lucidManagerToken, "FeeChanged");
        });
        it("should raise error when non-owner invokes the call", async function () {
            await expect(
                lucidManagerToken
                    .connect(newOwner)
                    .setFee(400)
                    .then(tx => tx.wait())
            ).to.be.revertedWith("NotContractOwner");
        });
    });

    describe("setCollectionAddress", function () {
        let [newCollector] = new MockProvider().getWallets();

        it("should set new collection address", async function () {
            await lucidManagerToken.setCollectionAddress(newCollector.address);
            let { collectionAddress } = await lucidManagerToken.feeInfo();
            expect(collectionAddress).to.equal(newCollector.address);
        });
        it("should emit CollectorChanged event", async function () {
            expect(await lucidManagerToken.setCollectionAddress(newCollector.address)).to.emit(
                lucidManagerToken,
                "CollectorChanged"
            );
        });
        it("should raise error when non-owner invokes the call", async function () {
            await expect(
                lucidManagerToken
                    .connect(newOwner)
                    .setCollectionAddress(newCollector.address)
                    .then(tx => tx.wait())
            ).to.be.reverted;
        });
    });
    describe("setlucidThreshold", function () {
        it("should set new lucid threshold", async function () {
            await lucidManagerToken.setlucidThreshold(10);
            let { lucidTokenThreshold } = await lucidManagerToken.feeInfo();
            expect(lucidTokenThreshold).to.equal(10);
        });
        it("should emit FeeThresholdChanged event", async function () {
            expect(await lucidManagerToken.setlucidThreshold(10)).to.emit(lucidManagerToken, "FeeThresholdChanged");
        });
        it("should raise error when non-owner invokes the call", async function () {
            await expect(
                lucidManagerToken
                    .connect(newOwner)
                    .setlucidThreshold(10)
                    .then(tx => tx.wait())
            ).to.be.reverted;
        });
    });

    describe("setReducedFee", function () {
        it("should set new reduced fee", async function () {
            await lucidManagerToken.setReducedFee(10);
            let { reducedFeeBasisPoints } = await lucidManagerToken.feeInfo();
            expect(reducedFeeBasisPoints).to.equal(10);
        });
        it("should emit FeeChanged event", async function () {
            expect(await lucidManagerToken.setReducedFee(10)).to.emit(lucidManagerToken, "FeeChanged");
        });
        it("should raise error when non-owner invokes the call", async function () {
            await expect(
                lucidManagerToken
                    .connect(newOwner)
                    .setReducedFee(10)
                    .then(tx => tx.wait())
            ).to.be.reverted;
        });
    });
    describe("setLucidTokenAddress", function () {
        let wallet = Wallet.createRandom();

        it("should set new token address", async function () {
            await lucidManagerToken.setLucidTokenAddress(wallet.address);
            expect(await lucidManagerToken.lucidToken()).to.equal(wallet.address);
        });
        it("should emit LucidTokenChanged event", async function () {
            expect(await lucidManagerToken.setLucidTokenAddress(wallet.address)).to.emit(
                lucidManagerToken,
                "LucidTokenChanged"
            );
        });
        it("should raise error when non-owner invokes the call", async function () {
            await expect(
                lucidManagerToken
                    .connect(newOwner)
                    .setLucidTokenAddress(wallet.address)
                    .then(tx => tx.wait())
            ).to.be.reverted;
        });
    });
    describe("getLucidBalance", function () {
        let wallet = Wallet.createRandom();

        it("should get balance of new address as zero", async function () {
            let balance = await lucidManagerToken.getLucidBalance(wallet.address);
            expect(balance).to.equal(0);
        });
    });
});
