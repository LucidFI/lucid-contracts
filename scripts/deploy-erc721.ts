import { writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import hre, { ethers } from "hardhat";

const dateLabel = (date: Date) => date.toISOString().replace(/\D/g, "");
const MAX_BATCH_OPERATIONS = 40;

const deployCreator = async function () {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const { address: managerAddress, receipt: managerReceipt } = await deploy(
    "LucidManager",
    {
      from: deployer,
      args: [
        ethers.utils.formatBytes32String("LucidManager v1"),
        "0x89e03E7980C92fd81Ed3A9b72F5c73fDf57E5e6D",
        0,
      ],
      log: true,
    }
  );

  const { address: ERC721Address } = await deploy("LucidTxERC721", {
    from: deployer,
    log: true,
    args: [managerAddress, "https://ipfs.io/ipfs/"],
  });

  const { address: budgeteerAddress, receipt: budgeteerReceipt } = await deploy(
    "LucidBudgeteer",
    {
      from: deployer,
      log: true,
      args: [ERC721Address],
    }
  );

  const { address: batchCreateAddress } = await deploy("BatchCreate", {
    from: deployer,
    log: true,
    args: [budgeteerAddress, ERC721Address, MAX_BATCH_OPERATIONS],
  });

  console.log({
    budgeteerAddress,
    managerAddress,
    ERC721Address,
    batchCreateAddress,
    deployedOnBlock: managerReceipt?.blockNumber,
  });
  const now = new Date();
  const deployInfo = {
    contract: "LucidManager",
    filename: `deploy_info_${dateLabel(now)}.json`,
    deployer: deployer,
    chainId: await getChainId(),
    currentTime: now.toISOString(),
    managerReceipt: managerReceipt,
    managerAddress: managerAddress,
    gasUsed: managerReceipt?.gasUsed,
    budgeteerReceipt: budgeteerReceipt,
    budgeteerAddress: budgeteerAddress,
  };

	const deployFile = `./deploy_info/${deployInfo.filename}`;

	ensureDirectoryExistence(deployFile);

  writeFileSync(
    `./deploy_info/${deployInfo.filename}`,
    JSON.stringify(deployInfo, undefined, 4)
  );
};

function ensureDirectoryExistence(filePath: string) {
  var dirname = path.dirname(filePath);
  if (existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  mkdirSync(dirname);
}

deployCreator()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
