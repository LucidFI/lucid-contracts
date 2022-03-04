import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BytesLike, utils } from "ethers";
import { Log } from "hardhat-deploy/dist/types";
import ERC20 from "../artifacts/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import ERC721Artifact from "../artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721.json";
import IERC721Artifact from "../artifacts/@openzeppelin/contracts/token/ERC721/IERC721.sol/IERC721.json";
import BatchCreateArtifact from "../artifacts/contracts/BatchCreate.sol/BatchCreate.json";
import LucidBudgeteerArtifact from "../artifacts/contracts/LucidBudgeteer.sol/LucidBudgeteer.json";
import LucidTxERC721Artifact from "../artifacts/contracts/LucidTxERC721.sol/LucidTxERC721.json";
import ILucidTxArtifact from "../artifacts/contracts/interfaces/ILucidTx.sol/ILucidTx.json";
import { BatchCreateInterface } from "typechain-types/BatchCreate";
import { LucidBudgeteerInterface } from "typechain-types/LucidBudgeteer";
import { LucidTxERC721Interface } from "typechain-types/LucidTxERC721";
import { ERC20Interface } from "typechain-types/ERC20";
import { ERC721Interface } from "typechain-types/ERC721";
import { ILucidTxInterface } from "typechain-types/ILucidTx";
import { IERC721Interface } from "typechain-types/IERC721";

export const declareSignerWithAddress = (): SignerWithAddress[] => [];

const ILucidTxERC721 = new utils.Interface(
  LucidTxERC721Artifact.abi
) as LucidTxERC721Interface;
const I_ILucidTx = new utils.Interface(
  ILucidTxArtifact.abi
) as ILucidTxInterface;
const I_IERC721 = new utils.Interface(IERC721Artifact.abi) as IERC721Interface;
const IERC721 = new utils.Interface(ERC721Artifact.abi) as ERC721Interface;
const IERC20 = new utils.Interface(ERC20.abi) as ERC20Interface;
const ILucidBudgeteer = new utils.Interface(
  LucidBudgeteerArtifact.abi
) as LucidBudgeteerInterface;
const IBatchCreate = new utils.Interface(
  BatchCreateArtifact.abi
) as BatchCreateInterface;

const interfaces = [
  ILucidTxERC721,
  IERC721,
  I_ILucidTx,
  ILucidBudgeteer,
  IERC20,
  I_IERC721,
  IBatchCreate,
];

type UnparsedLog = {
  __type: "log";
  log: Log;
};

type UnparsedTransaction = {
  __type: "transaction";
  data: string;
};

type UnparsedError = {
  __type: "error";
  error: BytesLike;
};

export const parseRaw = (
  unparsed: UnparsedLog | UnparsedTransaction | UnparsedError
) => {
  for (let iface of interfaces) {
    try {
      switch (unparsed.__type) {
        case "log":
          return iface.parseLog(unparsed.log);
        case "transaction":
          return iface.parseTransaction({ data: unparsed.data });
        case "error":
          return iface.parseError(unparsed.error);
      }
    } catch (e: any) {}
  }
};
