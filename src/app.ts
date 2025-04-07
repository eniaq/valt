import { Config } from "./config";
import { SetOptions, ShowOptions } from ".";
import { Resolver } from "./resolver";
import { VaultValue } from "./vault";
import { Printer } from "./printer";
import { ValtError } from "./error";
import fs from "fs/promises";

export class App {
  public static async show(options: ShowOptions) {
    let config = new Config(options);

    let resolver = new Resolver(config, options);

    let values: VaultValue[] = [];

    let missingValues: string[] = [];

    let awsError: unknown;
    for (const name of resolver.envs) {
      const { aws, dotenv, defaultValue, policy } = resolver.resolveVault(name);

      if (dotenv) {
        const dotenvValue = dotenv.getValue();
        if (dotenvValue) {
          values.push(dotenvValue);
          continue;
        }
      }

      if (aws) {
        try {
          values.push(await aws.getValue());
          continue;
        } catch (error) {
          awsError = error;
        }
      }

      if (defaultValue) {
        values.push({
          type: "default",
          name: name,
          value: defaultValue,
        });
        continue;
      }

      if (policy === "required") {
        values.push({
          type: "error",
          name: name,
          value: undefined,
        });
        missingValues.push(name);
      } else {
        values.push({
          type: "empty",
          name: name,
          value: undefined,
        });
      }
    }

    if (options.format === "table") {
      Printer.printTable(values, resolver.profile, options.show ?? false);
    } else if (options.format === "dotenv") {
      Printer.printDotenv(values);
    } else if (process.stdout.isTTY) {
      Printer.printTable(values, resolver.profile, options.show ?? false);
    } else {
      Printer.printDotenv(values);
    }

    if (missingValues.length > 0) {
      throw new ValtError(
        `Missing required values: [${missingValues.join(", ")}]`,
        {
          hint: "Check if the AWS secret exists and the key is correct.",
          debug: awsError instanceof Error ? awsError.message : undefined,
        }
      );
    }
  }

  public static async set(
    name: string,
    value: string | null,
    options: SetOptions
  ) {
    if (options.file) {
      if (value) {
        throw new ValtError("Cannot set both value and file");
      }
      value = await fs.readFile(options.file, "utf-8");
    }

    let config = new Config(options);
    let resolver = new Resolver(config, options);

    const { aws } = resolver.resolveVault(name);

    if (!aws) {
      throw new ValtError(`No aws provider and secret found for ${name}`);
    }

    await aws.setValue(value, {
      before: options.show ?? false,
      after: options.show ?? (options.file ? false : true),
    });
  }
}
