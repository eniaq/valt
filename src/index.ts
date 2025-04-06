#!/usr/bin/env node

import { Option, program } from "commander";
import { readFileSync } from "fs";
import { join } from "path";
import { App } from "./app";
import { Log } from "./logger";
import { ValtError } from "./error";

const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);

const { name, version } = packageJson;

const runner = async (block: () => void | Promise<void>) => {
  try {
    await block();
  } catch (error) {
    if (error instanceof ValtError) {
      Log.error(`${error.message}`);
      if (error.hint) {
        Log.info(`${error.hint}`);
      }
      if (error.debug) {
        Log.debug(`[DEBUG] ${error.debug}`);
      }
    } else if (error instanceof Error) {
      Log.error(`${error.message}`);
    } else if (typeof error === "string") {
      Log.error(`${error}`);
    }
    process.exit(1);
  }
};

program
  .name(name)
  .description("Manage secrets and parameters with AWS Secrets Manager.")
  .version(version);

export type ShowOptions = {
  config?: string;
  profile?: string;
  format?: "table" | "dotenv" | "auto";
  show?: boolean;
};

program
  .option("-c, --config <config>", "path to the config file")
  .option("-p, --profile <profile>", "profile name")
  .option("-s, --show", "show secrets (only for table format)")
  .addOption(
    new Option("-f, --format <format>", "output format")
      .choices(["table", "dotenv", "auto"])
      .default("auto")
  )
  .action((options: ShowOptions) => {
    runner(async () => {
      await App.show(options);
    });
  });

export type SetOptions = {
  config?: string;
  profile?: string;
  name: string;
  value?: string;
  file?: string;
};

program
  .command("set <name> [value]")
  .option("-c, --config <config>", "path to the config file")
  .option("-p, --profile <profile>", "profile name")
  .option("--file <file>", "read value from file")
  .action((name: string, value: string | undefined, options: SetOptions) => {
    runner(async () => {
      await App.set(name, value ?? null, options);
    });
  });

program.parse();
