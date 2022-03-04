import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { utils } from "ethers";
import hre, { deployments, ethers } from "hardhat";
import { LucidBudgeteer } from "typechain-types/LucidBudgeteer";
import { LucidBudgeteerModule } from "typechain-types/LucidBudgeteerModule";
import { BatchCreate__factory } from "typechain-types/factories/BatchCreate__factory";
import { LucidBudgeteerModule__factory } from "typechain-types/factories/LucidBudgeteerModule__factory";
import { LucidBudgeteer__factory } from "typechain-types/factories/LucidBudgeteer__factory";
import { LucidTxERC721__factory } from "typechain-types/factories/LucidTxERC721__factory";
import { LucidManager__factory } from "typechain-types/factories/LucidManager__factory";
import { LucidToken__factory } from "typechain-types/factories/LucidToken__factory";
import { TestSafe__factory } from "typechain-types/factories/TestSafe__factory";
import { declareSignerWithAddress } from "../test-utils";

chai.use(solidity);

describe("test module", async () => {
  let [safeOwner1, safeOwner2, outsider, collector, creditor] =
    declareSignerWithAddress();
  let feeBasisPoint = 1000;
  const proposal = ethers.utils.formatBytes32String("0x157019768a338f666dc543734358987d992ff6feb4c68e21ec6d46c6c7906db9"),

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture();
    [safeOwner1, safeOwner2, outsider, collector, creditor] =
      await ethers.getSigners();
    const ERC20 = (await hre.ethers.getContractFactory(
      "LucidToken"
    )) as LucidToken__factory;
    const LucidManager = (await hre.ethers.getContractFactory(
      "LucidManager"
    )) as LucidManager__factory;
    const LucidTxERC721 = (await hre.ethers.getContractFactory(
      "LucidTxERC721"
    )) as LucidTxERC721__factory;
    const LucidBudgeteer = (await hre.ethers.getContractFactory(
      "LucidBudgeteer"
    )) as LucidBudgeteer__factory;
    const BatchLucid = (await hre.ethers.getContractFactory(
      "BatchCreate"
    )) as BatchCreate__factory;
    const Safe = (await hre.ethers.getContractFactory(
      "TestSafe"
    )) as TestSafe__factory;
    const LucidBudgeteerModule = (await hre.ethers.getContractFactory(
      "LucidBudgeteerModule"
    )) as LucidBudgeteerModule__factory;

    const lucidToken = await ERC20.deploy();
    const lucidManager = await LucidManager.deploy(
      ethers.utils.formatBytes32String("Lucid Manager Test"),
      proposal,
      collector.address,
      feeBasisPoint
    );
    const lucidTx = await LucidTxERC721.deploy(
      lucidManager.address,
      "ipfs.io/ipfs/"
    );
    const lucidBudgeteer = await LucidBudgeteer.deploy(lucidTx.address);
    const batchCreate = await BatchLucid.deploy(
      lucidBudgeteer.address,
      lucidTx.address,
      20
    );
    const safe = await Safe.deploy([safeOwner1.address, safeOwner2.address], 1);
    const lucidBudgeteerModule = await LucidBudgeteerModule.deploy(
      safe.address,
      lucidBudgeteer.address,
      lucidTx.address,
      batchCreate.address
    );

    await safe.enableModule(lucidBudgeteerModule.address);

    return {
      lucidBudgeteerModule,
      lucidManager,
      lucidBudgeteer,
      lucidToken,
      lucidTx,
      safe,
    };
  });

  const dueBy = (await ethers.provider.getBlock("latest")).timestamp + 100;
  const getCreateClaimTx = (
    contract: LucidBudgeteerModule | LucidBudgeteer,
    {
      debtorAddress,
      tokenAddress,
      creditorAddress,
      user,
    }: {
      debtorAddress: string;
      tokenAddress: string;
      creditorAddress: string;
      user?: SignerWithAddress;
    }
  ) =>
    contract.connect(user ?? safeOwner1).createLucidTx(
      {
        creditor: creditorAddress,
        debtor: debtorAddress,
        description: "claim!",
        proposal,
        claimAmount: utils.parseEther("1"),
        claimToken: tokenAddress,
        dueBy,
        attachment: {
          hash: utils.formatBytes32String("some hash"),
          hashFunction: 0,
          size: 0,
        },
      },
      utils.formatBytes32String("some tag"),
      "notARealURI"
    );

  describe("Lucid Budgeteer - Gnosis Safe Module", async () => {
    describe("createClaim", async () => {
      it("should create a claim via module", async () => {
        const { lucidBudgeteerModule, lucidToken, lucidTx, safe } =
          await setupTests();
        const tokenId = "1";

        await expect(
          getCreateClaimTx(lucidBudgeteerModule, {
            creditorAddress: creditor.address,
            debtorAddress: safe.address,
            tokenAddress: lucidToken.address,
          })
        ).to.emit(lucidTx, "ClaimCreated");

        const claim = await lucidTx.getClaim(tokenId);
        expect(await lucidTx.ownerOf(tokenId)).to.equal(creditor.address);
        expect(claim.debtor).to.equal(safe.address);
      });

      it("should revert if params are incorrect", async () => {
        const { lucidBudgeteerModule, lucidToken } = await setupTests();

        await expect(
          getCreateClaimTx(lucidBudgeteerModule, {
            creditorAddress: creditor.address,
            debtorAddress: safeOwner1.address, //incorrect debtor address, perhaps a UI error or input error where the debtor is the EOA, not the safe.
            tokenAddress: lucidToken.address,
          })
        ).to.be.revertedWith("LUCIDMODULE: Create claim failed");
      });

      it("should revert if sender != safe owner", async () => {
        const { lucidBudgeteerModule, lucidToken, safe } = await setupTests();

        await expect(
          getCreateClaimTx(lucidBudgeteerModule, {
            creditorAddress: creditor.address,
            debtorAddress: safe.address,
            tokenAddress: lucidToken.address,
            user: outsider,
          })
        ).to.be.revertedWith("LUCIDMODULE: Not safe owner");
      });
    });

    describe("batchCreate", async () => {
      it("should create a batchClaim via module", async () => {
        const { lucidBudgeteerModule, lucidToken, lucidTx, safe } =
          await setupTests();
        const tokenId = "1";

        const batchPayment = [...Array(20)].map(() => ({
          claimAmount: utils.parseEther("1"),
          parties: [creditor.address, safe.address],
          creditor: creditor.address,
          debtor: safe.address,
          claimToken: lucidToken.address,
          dueBy,
          tag: ethers.utils.formatBytes32String("test"),
          description: `claim! ${Math.random()}`,
          proposal,
          tokenURI: `ipfs.io/ipfs/${Math.random()}`,
          attachment: {
            hash: utils.formatBytes32String("some hash"),
            hashFunction: 0,
            size: 0,
          },
        }));

        await expect(lucidBudgeteerModule.batchCreate(batchPayment)).to.emit(
          lucidTx,
          "ClaimCreated"
        );

        const claim = await lucidTx.getClaim(tokenId);
        expect(await lucidTx.ownerOf(tokenId)).to.equal(creditor.address);
        expect(claim.debtor).to.equal(safe.address);
      });

      it("should revert if params are incorrect", async () => {
        const { lucidBudgeteerModule, lucidToken } = await setupTests();

        const batchPayment = [...Array(20)].map(() => ({
          claimAmount: utils.parseEther("1"),
          parties: [creditor.address, safeOwner1],
          debtor: safeOwner1.address,
          creditor: creditor.address,
          claimToken: lucidToken.address,
          dueBy,
          tag: ethers.utils.formatBytes32String("test"),
          proposal,
          description: `claim! ${Math.random()}`,
          tokenURI: `ipfs.io/ipfs/${Math.random()}`,
          attachment: {
            hash: utils.formatBytes32String("some hash"),
            hashFunction: 0,
            size: 0,
          },
        }));

        await expect(
          lucidBudgeteerModule.batchCreate(batchPayment)
        ).to.be.revertedWith("LUCIDMODULE: Batch create failed");
      });

      it("should revert if sender != safe owner", async () => {
        const { lucidBudgeteerModule, lucidToken, safe } = await setupTests();
        const batchPayment = [...Array(20)].map(() => ({
          claimAmount: utils.parseEther("1"),
          parties: [creditor.address, safe.address],
          creditor: creditor.address,
          debtor: safe.address,
          claimToken: lucidToken.address,
          dueBy,
          tag: ethers.utils.formatBytes32String("test"),
          description: `developer_dao sponsorship! ${Math.random()}`,
          proposal,
          tokenURI: `ipfs.io/ipfs/${Math.random()}`,
          attachment: {
            hash: utils.formatBytes32String("some hash"),
            hashFunction: 0,
            size: 0,
          },
        }));

        await expect(
          lucidBudgeteerModule.connect(outsider).batchCreate(batchPayment)
        ).to.be.revertedWith("LUCIDMODULE: Not safe owner");
      });
    });

    describe("updateTag", async () => {
      it("should update a lucidTag via the safe", async () => {
        const {
          lucidBudgeteerModule,
          lucidToken,
          safe,
          lucidBudgeteer,
          lucidManager,
        } = await setupTests();
        const tokenId = "1";

        const createClaimTx = await getCreateClaimTx(lucidBudgeteerModule, {
          creditorAddress: creditor.address,
          debtorAddress: safe.address,
          tokenAddress: lucidToken.address,
        });
        await createClaimTx.wait();

        const tag = utils.formatBytes32String("account tag");
        await expect(
          lucidBudgeteerModule.connect(safeOwner1).updateLucidTag(tokenId, tag)
        )
          .to.emit(lucidBudgeteer, "LucidTagUpdated")
          .withArgs(
            lucidManager.address,
            tokenId,
            safe.address,
            tag,
            (
              await ethers.provider.getBlock("latest")
            ).timestamp
          );
      });

      it("should revert if sender != safe owner", async () => {
        const { lucidBudgeteerModule } = await setupTests();
        const tokenId = "1";

        await expect(
          lucidBudgeteerModule
            .connect(outsider)
            .updateLucidTag(
              tokenId,
              utils.formatBytes32String("outsider tag 😈")
            )
        ).to.be.revertedWith("LUCIDMODULE: Not safe owner");
      });
    });

    describe("rejectClaim", async () => {
      it("reject inbound claims", async () => {
        const { lucidBudgeteerModule, lucidToken, safe, lucidTx, lucidBudgeteer } =
          await setupTests();
        const tokenId = "1";

        // invoice the safe from outsider's account
        const createClaimTx = await getCreateClaimTx(lucidBudgeteer, {
          creditorAddress: outsider.address,
          debtorAddress: safe.address,
          tokenAddress: lucidToken.address,
          user: outsider,
        });
        await createClaimTx.wait();

        await expect(
          lucidBudgeteerModule.connect(safeOwner1).rejectClaim(tokenId)
        ).to.emit(lucidTx, "ClaimRejected");
      });

      it("should revert if sender != safe owner", async () => {
        const { lucidBudgeteerModule, lucidToken, safe, lucidBudgeteer } =
          await setupTests();
        const tokenId = "1";

        const createClaimTx = await getCreateClaimTx(lucidBudgeteer, {
          creditorAddress: outsider.address,
          debtorAddress: safe.address,
          tokenAddress: lucidToken.address,
          user: outsider,
        });
        await createClaimTx.wait();

        await expect(
          lucidBudgeteerModule.connect(outsider).rejectClaim(tokenId)
        ).to.be.revertedWith("LUCIDMODULE: Not safe owner");
      });
    });

    describe("rescind claim", async () => {
      it("should rescind a outbound claim", async () => {
        const { lucidBudgeteerModule, lucidToken, lucidTx, safe } =
          await setupTests();
        const tokenId = "1";

        const createClaimTx = await getCreateClaimTx(lucidBudgeteerModule, {
          creditorAddress: safe.address,
          debtorAddress: outsider.address,
          tokenAddress: lucidToken.address,
        });
        await createClaimTx.wait();

        expect(lucidBudgeteerModule.rescindClaim(tokenId)).to.emit(
          lucidTx,
          "ClaimRescinded"
        );
      });

      it("should revert if sender != safe owner", async () => {
        const { lucidBudgeteerModule, lucidToken, safe } = await setupTests();
        const tokenId = "1";

        const createClaimTx = await getCreateClaimTx(lucidBudgeteerModule, {
          creditorAddress: safe.address,
          debtorAddress: outsider.address,
          tokenAddress: lucidToken.address,
        });
        await createClaimTx.wait();

        await expect(
          lucidBudgeteerModule.connect(outsider).rescindClaim(tokenId)
        ).to.be.revertedWith("LUCIDMODULE: Not safe owner");
      });
    });
  });
});
