#!/usr/bin/env node

import { program } from "commander";
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
        Log.debug(`${error.debug}`);
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
};

program
  .option("--config [config]")
  .option("--profile [profile]")
  .action((options: ShowOptions) => {
    runner(() => {
      App.show(options);
    });
  });

program.parse();
