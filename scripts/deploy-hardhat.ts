import { BigNumber, utils } from "ethers";
import hre from "hardhat";

const MAX_BATCH_OPERATIONS = 20;

const hardhatDeploy = async () => {
  const { deployments, getNamedAccounts, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const { address: managerAddress } = await deploy("LucidManager", {
    from: deployer,
    args: [
      ethers.utils.formatBytes32String("LucidManager v1"),
      "0xc211950B090B5FDE9483048de082B874FB2150C6",
      1,
    ],
    log: true,
  });

  const { address: ERC721Address } = await deploy("LucidTxERC721", {
    from: deployer,
    log: true,
    args: [managerAddress, "https://ipfs.io/ipfs/"],
  });

  const { address: budgeteerAddress } = await deploy("LucidBudgeteer", {
    from: deployer,
    log: true,
    args: [ERC721Address],
  });

  const { address: batchCreateAddress } = await deploy("BatchCreate", {
    from: deployer,
    log: true,
    args: [budgeteerAddress, ERC721Address, MAX_BATCH_OPERATIONS],
  });

  const WETH = await ethers.getContractFactory("WETH");
  const { address: wethAddress } = await WETH.deploy(
    utils.parseEther("10"),
    "Wrapped Ether",
    BigNumber.from(18),
    "WETH"
  );

  console.log({
    managerAddress,
    budgeteerAddress,
    wethAddress,
    ERC721Address,
    batchCreateAddress,
  });
};

hardhatDeploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
