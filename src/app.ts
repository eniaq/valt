import { Config } from "./config";
import { SetOptions, ShowOptions } from ".";
import { Resolver } from "./resolver";
import { VaultValue } from "./vault";
import { Printer } from "./printer";
import { ValtError } from "./error";

export class App {
  public static async show(options: ShowOptions) {
    let config = new Config(options);

    let resolver = new Resolver(config, options);

    var values: VaultValue[] = [];

    for (const name of resolver.envs) {
      const { aws, dotenv, defaultValue, policy } = resolver.resolveVault(name);

      const dotenvValue = dotenv.getValue();

      if (dotenvValue) {
        values.push(dotenvValue);
        continue;
      }

      if (aws) {
        try {
          values.push(await aws.getValue());
          continue;
        } catch (error) {
          if (policy === "required") {
            throw error;
          }
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

      const envValue = process.env[name];
      if (envValue) {
        values.push({
          type: "env",
          name: name,
          value: envValue,
        });
        continue;
      }

      values.push({
        type: "empty",
        name: name,
        value: undefined,
      });
    }

    if (options.format === "table") {
      Printer.printTable(values);
    } else if (options.format === "dotenv") {
      Printer.printDotenv(values);
    } else if (process.stdout.isTTY) {
      Printer.printTable(values);
    } else {
      Printer.printDotenv(values);
    }
  }

  public static async set(
    name: string,
    value: string | null,
    options: SetOptions
  ) {
    let config = new Config(options);
    let resolver = new Resolver(config, options);

    const { aws } = resolver.resolveVault(name);

    if (!aws) {
      throw new ValtError(`No aws provider and secret found for ${name}`);
    }

    await aws.setValue(value);
  }
}
