import {
  GetSecretValueCommand,
  PutSecretValueCommand,
  ResourceNotFoundException,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { ValtError } from "./error";
import CliTable3 from "cli-table3";
import chalk from "chalk";
import readline from "readline/promises";
import { Log } from "./logger";

export type AWSVaultValue = {
  type: "aws";
  name: string;
  value: string;
  secret: string;
  key: string;
};

export class AWSVault {
  type = "aws";

  private client: SecretsManagerClient;

  private static cache: Record<string, Record<string, unknown>> = {};

  constructor(
    public readonly name: string,
    public readonly secret: string,
    public readonly key: string
  ) {
    this.client = new SecretsManagerClient();
  }

  getValue = async (): Promise<AWSVaultValue> => {
    const secret = await this.getSecret();

    if (this.key in secret) {
      const value: unknown = secret[this.key];

      if (typeof value === "string") {
        return {
          type: "aws",
          name: this.name,
          value,
          secret: this.secret,
          key: this.key,
        };
      }
    }

    throw new ValtError(
      `Key ${this.key} not found in secret value for ${this.secret}`,
      {
        hint: "Check if the key exists in the secret.",
      }
    );
  };

  setValue = async (
    value: string | null,
    show: { before: boolean; after: boolean }
  ) => {
    const secret = await this.getSecret();

    const prevValue = secret[this.key] as string | undefined;

    if (value) secret[this.key] = value;
    else delete secret[this.key];

    const table = new CliTable3({
      head: ["", this.name],
    });

    const mask = (value: string | undefined | null, show: boolean) => {
      if (value === undefined || value === null) return "<unset>";
      if (!show) {
        const lines = value.split("\n").length;
        if (lines > 1) {
          return `**** (${lines} lines)`;
        } else {
          return "****";
        }
      }
      return value;
    };

    table.push([chalk.bold.green("Before"), mask(prevValue, show.before)]);

    table.push([chalk.bold.green("After"), mask(value, show.after)]);

    Log.info("");
    Log.info(`🔑 Changing secret value for '${this.key}' in '${this.secret}'`);
    Log.info("");

    console.error(table.toString());

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await rl.question(
      "Are you sure (only 'yes' will be accepted): "
    );

    rl.close();

    if (answer.trim() !== "yes") {
      Log.info("");
      Log.info(chalk.bold.red("🚫 Cancelled"));
      Log.info("");
      process.exit(1);
    }

    const command = new PutSecretValueCommand({
      SecretId: this.secret,
      SecretString: JSON.stringify(secret),
    });

    try {
      await this.client.send(command);
    } catch (error) {
      throw new ValtError(`Failed to set secret: ${this.secret}`, {
        debug: error instanceof Error ? error.message : undefined,
        hint: "Check if you have the right permissions.",
      });
    }

    Log.info("");
    Log.info("✅ Secret value changed");
    Log.info("");
  };

  private getSecret = async (): Promise<Record<string, unknown>> => {
    if (this.secret in AWSVault.cache) {
      return AWSVault.cache[this.secret];
    }

    const command = new GetSecretValueCommand({ SecretId: this.secret });

    let secretString: string | undefined;
    try {
      const output = await this.client.send(command);
      secretString = output.SecretString;
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        secretString = "{}";
      } else {
        throw new ValtError(`Failed to get secret: ${this.secret}`, {
          debug: error instanceof Error ? error.message : undefined,
          hint: "Check if the secret exists in AWS Secrets Manager and if you have the right permissions.",
        });
      }
    }

    if (!secretString) {
      throw new ValtError(`Secret value is empty for ${this.secret}`);
    }

    let data: unknown;
    try {
      data = JSON.parse(secretString);
    } catch (error) {
      throw new ValtError(`Failed to parse secret value for ${this.secret}`, {
        debug: error instanceof Error ? error.message : undefined,
        hint: "Check if the secret value is a valid JSON string.",
      });
    }

    if (typeof data === "object" && data) {
      const object = data as Record<string, unknown>;
      AWSVault.cache[this.secret] = object;

      return object;
    }

    throw new ValtError(`Secret value is not an object for ${this.secret}`, {
      hint: "Check if the secret value is a valid JSON string.",
    });
  };
}
