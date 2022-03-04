/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface ModuleInterface extends utils.Interface {
  contractName: "Module";
  functions: {
    "avatar()": FunctionFragment;
    "getGuard()": FunctionFragment;
    "guard()": FunctionFragment;
    "owner()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "setAvatar(address)": FunctionFragment;
    "setGuard(address)": FunctionFragment;
    "setTarget(address)": FunctionFragment;
    "setUp(bytes)": FunctionFragment;
    "target()": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "avatar", values?: undefined): string;
  encodeFunctionData(functionFragment: "getGuard", values?: undefined): string;
  encodeFunctionData(functionFragment: "guard", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "renounceOwnership",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "setAvatar", values: [string]): string;
  encodeFunctionData(functionFragment: "setGuard", values: [string]): string;
  encodeFunctionData(functionFragment: "setTarget", values: [string]): string;
  encodeFunctionData(functionFragment: "setUp", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "target", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "transferOwnership",
    values: [string]
  ): string;

  decodeFunctionResult(functionFragment: "avatar", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getGuard", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "guard", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "renounceOwnership",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "setAvatar", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setGuard", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setTarget", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setUp", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "target", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "transferOwnership",
    data: BytesLike
  ): Result;

  events: {
    "AvatarSet(address,address)": EventFragment;
    "ChangedGuard(address)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "TargetSet(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "AvatarSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ChangedGuard"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TargetSet"): EventFragment;
}

export type AvatarSetEvent = TypedEvent<
  [string, string],
  { previousAvatar: string; newAvatar: string }
>;

export type AvatarSetEventFilter = TypedEventFilter<AvatarSetEvent>;

export type ChangedGuardEvent = TypedEvent<[string], { guard: string }>;

export type ChangedGuardEventFilter = TypedEventFilter<ChangedGuardEvent>;

export type OwnershipTransferredEvent = TypedEvent<
  [string, string],
  { previousOwner: string; newOwner: string }
>;

export type OwnershipTransferredEventFilter =
  TypedEventFilter<OwnershipTransferredEvent>;

export type TargetSetEvent = TypedEvent<
  [string, string],
  { previousTarget: string; newTarget: string }
>;

export type TargetSetEventFilter = TypedEventFilter<TargetSetEvent>;

export interface Module extends BaseContract {
  contractName: "Module";
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ModuleInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    avatar(overrides?: CallOverrides): Promise<[string]>;

    getGuard(overrides?: CallOverrides): Promise<[string] & { _guard: string }>;

    guard(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setAvatar(
      _avatar: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setGuard(
      _guard: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setTarget(
      _target: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setUp(
      initializeParams: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    target(overrides?: CallOverrides): Promise<[string]>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  avatar(overrides?: CallOverrides): Promise<string>;

  getGuard(overrides?: CallOverrides): Promise<string>;

  guard(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setAvatar(
    _avatar: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setGuard(
    _guard: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setTarget(
    _target: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setUp(
    initializeParams: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  target(overrides?: CallOverrides): Promise<string>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    avatar(overrides?: CallOverrides): Promise<string>;

    getGuard(overrides?: CallOverrides): Promise<string>;

    guard(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    setAvatar(_avatar: string, overrides?: CallOverrides): Promise<void>;

    setGuard(_guard: string, overrides?: CallOverrides): Promise<void>;

    setTarget(_target: string, overrides?: CallOverrides): Promise<void>;

    setUp(
      initializeParams: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    target(overrides?: CallOverrides): Promise<string>;

    transferOwnership(
      newOwner: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "AvatarSet(address,address)"(
      previousAvatar?: string | null,
      newAvatar?: string | null
    ): AvatarSetEventFilter;
    AvatarSet(
      previousAvatar?: string | null,
      newAvatar?: string | null
    ): AvatarSetEventFilter;

    "ChangedGuard(address)"(guard?: null): ChangedGuardEventFilter;
    ChangedGuard(guard?: null): ChangedGuardEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(
      previousOwner?: string | null,
      newOwner?: string | null
    ): OwnershipTransferredEventFilter;

    "TargetSet(address,address)"(
      previousTarget?: string | null,
      newTarget?: string | null
    ): TargetSetEventFilter;
    TargetSet(
      previousTarget?: string | null,
      newTarget?: string | null
    ): TargetSetEventFilter;
  };

  estimateGas: {
    avatar(overrides?: CallOverrides): Promise<BigNumber>;

    getGuard(overrides?: CallOverrides): Promise<BigNumber>;

    guard(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setAvatar(
      _avatar: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setGuard(
      _guard: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setTarget(
      _target: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setUp(
      initializeParams: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    target(overrides?: CallOverrides): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    avatar(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getGuard(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    guard(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setAvatar(
      _avatar: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setGuard(
      _guard: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setTarget(
      _target: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setUp(
      initializeParams: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    target(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}
