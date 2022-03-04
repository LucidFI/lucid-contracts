import "@nomiclabs/hardhat-ethers";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { utils } from "ethers";
import hre, { deployments, ethers } from "hardhat";
import { LucidToken } from "typechain-types/LucidToken";
import { BatchCreate__factory } from "typechain-types/factories/BatchCreate__factory";
import { LucidBudgeteer__factory } from "typechain-types/factories/LucidBudgeteer__factory";
import { LucidTxERC721__factory } from "typechain-types/factories/LucidTxERC721__factory";
import { LucidManager__factory } from "typechain-types/factories/LucidManager__factory";
import { LucidToken__factory } from "typechain-types/factories/LucidToken__factory";
import { declareSignerWithAddress, parseRaw } from "../test-utils";

chai.use(solidity);

describe("test module", async () => {
  let [
    collector,
    wallet1,
    wallet2,
    wallet3,
    wallet4,
    wallet5,
    wallet6,
    wallet7,
  ] = declareSignerWithAddress();
  const defaultTag = utils.formatBytes32String("test");
  const maxOperations = 20;
  let dueBy = (await ethers.provider.getBlock("latest")).timestamp + 100;
  let feeBasisPoint = 1000;

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture();
    [collector, wallet1, wallet2, wallet3, wallet4, wallet5, wallet6, wallet7] =
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

    const lucidToken = await ERC20.connect(wallet1).deploy();
    const lucidManager = await LucidManager.deploy(
      ethers.utils.formatBytes32String("Lucid Manager Test"),
      ethers.utils.formatBytes32String("proposal tx"),
      collector.address,
      feeBasisPoint
    );
    const lucidTx = await LucidTxERC721.deploy(
      lucidManager.address,
      "ipfs.io/ipfs/"
    );
    const lucidBudgeteer = await LucidBudgeteer.deploy(lucidTx.address);
    const batchLucid = await BatchLucid.deploy(
      lucidBudgeteer.address,
      lucidTx.address,
      maxOperations
    );

    return {
      batchLucid,
      lucidManager,
      lucidBudgeteer,
      lucidToken,
      lucidTx,
    };
  });

  const getCreateClaimTx = ({
    token,
    payments,
  }: {
    token: LucidToken;
    payments?: boolean;
  }) => {
    const randomAddressAndWallet1 = [
      [wallet2, wallet3, wallet4, wallet5, wallet6, wallet7].map(
        (w) => w.address
      )[Math.floor(Math.random() * 6)],
      wallet1.address,
    ];

    const [creditor, debtor] = payments
      ? randomAddressAndWallet1
      : randomAddressAndWallet1.reverse();

    return {
      claimAmount: utils.parseEther("1"),
      creditor,
      debtor,
      claimToken: token.address,
      dueBy,
      tag: defaultTag,
      description: `claim! ${Math.random()}`,
      proposal: "0x157019768a338f666dc543734358987d992ff6feb4c68e21ec6d46c6c7906db9",
      tokenURI: `ipfs.io/ipfs/${Math.random()}`,
      attachment: {
        hash: utils.formatBytes32String("some hash"),
        hashFunction: 0,
        size: 0,
      },
    };
  };

  describe("Batch Lucid - Batching lucid functions", async () => {
    describe("batchCreate", async () => {
      it("should create claims and emit correct events", async () => {
        const { lucidToken, batchLucid } = await setupTests();

        const claimsToMake = 4;

        const claims = [...Array(claimsToMake)].map((_) =>
          getCreateClaimTx({ token: lucidToken })
        );

        const tx = await (
          await batchLucid.connect(wallet1).batchCreate(claims)
        ).wait();

        const events = tx.events?.map((log) =>
          parseRaw({ log, __type: "log" })
        );
        expect(events && events.length);
        if (!events || !events.length) throw new Error("No events emitted");

        const claimCreatedEvents = events.filter(
          (event) => event?.name === "ClaimCreated"
        );
        claimCreatedEvents.forEach((event) => {
          expect(event?.args.creator === wallet1.address);
          expect(event?.args.creditor === wallet1.address);
        });

        expect(claimCreatedEvents?.length).to.eq(claimsToMake);

        const tagUpdatedEvents = events.filter(
          (event) => event?.name === "LucidTagUpdated"
        );
        expect(tagUpdatedEvents.length).to.eq(claimsToMake);

        tagUpdatedEvents.forEach((event) => {
          expect(event?.args.tag === defaultTag);
          expect(event?.args.updatedBy === wallet1.address);
        });
      });

      it("should revert on bad params", async () => {
        const { lucidToken, batchLucid } = await setupTests();

        let claimsToMake = maxOperations + 1;

        let claims = [...Array(claimsToMake)].map((_) =>
          getCreateClaimTx({ token: lucidToken })
        );

        expect(batchLucid.connect(wallet1).batchCreate(claims)).to.revertedWith(
          "BatchTooLarge"
        );

        expect(batchLucid.connect(wallet1).batchCreate([])).to.revertedWith(
          "ZeroLength"
        );

        claims = [...Array(1)].map((_) =>
          getCreateClaimTx({ token: lucidToken })
        );

        claims[0].dueBy =
          (await ethers.provider.getBlock("latest")).timestamp - 1;

        // there were strange VM issues with catching the revert message here: this is a more verbose way of handling a expect().to.revert
        await batchLucid
          .connect(wallet1)
          .batchCreate(claims)
          .then(() => {
            throw new Error();
          })
          .catch((e: any) => {
            if (!e.message.includes("BatchFailed()"))
              throw new Error("Expected revert");
          });
      });
    });

    describe("updateMaxOperations", async () => {
      it("should update max operations", async () => {
        const { batchLucid } = await setupTests();

        await (
          await batchLucid.connect(collector).updateMaxOperations(8)
        ).wait();

        expect(await batchLucid.maxOperations()).to.eq(8);
      });

      it("should revert on non-owner update of max operations", async () => {
        const { batchLucid } = await setupTests();

        expect(
          batchLucid.connect(wallet1).updateMaxOperations(8)
        ).to.be.revertedWith("NotOwner");
      });
    });

    describe("transferOwnership", async () => {
      it("should update the owner", async () => {
        const { batchLucid } = await setupTests();

        const batchContract = batchLucid.connect(collector);
        const newOwner = wallet1.address;

        const tx = await batchContract.transferOwnership(newOwner);
        tx.wait();

        expect(await batchLucid.owner()).to.eq(newOwner);
      });
    });
  });
});
