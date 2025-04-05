import path from "path";
import fs from "fs";
import yaml from "yaml";
import schema from "./schema";
import { FromSchema } from "json-schema-to-ts";
import Ajv from "ajv";
import { ValtError } from "./error";

export type ConfigSchema = FromSchema<typeof schema>;

export class Config implements ConfigSchema {
  readonly version: ConfigSchema["version"];
  readonly defaults: ConfigSchema["defaults"];
  readonly env: ConfigSchema["env"];
  readonly path: string;

  constructor(options: { config?: string }) {
    this.path = options.config ?? "valt.yaml";

    const configPath = path.resolve(this.path);

    if (!fs.existsSync(configPath)) {
      throw new ValtError(`Config file not found at ${configPath}`, {
        hint: "Please create a config file (valt.yaml) or specify a valid path with --config.",
      });
    }

    let fileContent: string;
    try {
      fileContent = fs.readFileSync(configPath, "utf8");
    } catch (error) {
      throw new ValtError(`Failed to read config: ${configPath}`, {
        hint: "Please check the config file for errors.",
      });
    }

    if (!fileContent) {
      throw new ValtError(`Config file is empty: ${configPath}`, {
        hint: "Please check the config file for errors.",
      });
    }

    let config: unknown;
    try {
      config = yaml.parse(fileContent);
    } catch (error) {
      if (error instanceof Error) {
        throw new ValtError(`Failed to parse config: ${configPath}`, {
          hint: "Please check the config file for errors.",
          debug: error.message,
        });
      }

      /* istanbul ignore next */
      throw new ValtError(`Failed to parse config: ${configPath}`, {
        hint: "Please check the config file for errors.",
        debug: "Unknown error occurred.",
      });
    }

    const ajv = new Ajv({ allErrors: true, strict: true });

    try {
      if (!ajv.validate<ConfigSchema>(schema, config)) {
        throw new ValtError(`Validation failed: ${configPath}`, {
          hint: "Please check the config file for errors.",
          debug: ajv.errorsText(),
        });
      }
    } catch (error) {
      if (error instanceof ValtError) {
        throw error;
      }

      /* istanbul ignore next */
      if (error instanceof Error) {
        throw new ValtError(`Failed to parse config: ${configPath}`, {
          hint: "Please check the config file for errors.",
          debug: error.message,
        });
      }

      /* istanbul ignore next */
      throw new ValtError(`Failed to parse config: ${configPath}`, {
        hint: "Please check the config file for errors.",
        debug: "Unknown error occurred.",
      });
    }

    this.version = config.version;
    this.defaults = config.defaults;
    this.env = config.env;
  }
}
