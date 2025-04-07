import { AWSVaultValue } from "./aws-vault";
import { DotenvVaultValue } from "./dotenv-vault";

export type DefaultValue = {
  type: "default";
  name: string;
  value: string;
};

export type ErrorValue = {
  type: "error";
  name: string;
  value: undefined;
};

export type EmptyValue = {
  type: "empty";
  name: string;
  value: undefined;
};

export type VaultValue =
  | AWSVaultValue
  | DotenvVaultValue
  | DefaultValue
  | EmptyValue
  | ErrorValue;
