import CliTable3 from "cli-table3";
import { VaultValue } from "./vault";
import chalk from "chalk";
import { Log } from "./logger";

export class Printer {
  public static printDotenv(values: VaultValue[]) {
    for (const value of values) {
      if (value.type !== "empty") {
        if (value.value.includes("\n")) {
          if (value.value.includes('"')) {
            console.log(`${value.name}='${value.value}'`);
          } else {
            console.log(`${value.name}="${value.value}"`);
          }
        } else {
          console.log(`${value.name}=${value.value}`);
        }
      }
    }
  }

  public static printTable(values: VaultValue[]) {
    Log.info("");

    const table = new CliTable3({
      head: ["Name", "Value", "Provider", "Info"],
      style: { head: [] },
    });

    for (const value of values) {
      switch (value.type) {
        case "aws":
          table.push([
            chalk.bold(value.name),
            chalk.bold.green(value.value),
            "aws",
            `${value.secret}:${value.key}`,
          ]);
          break;
        case "dotenv":
          table.push([
            chalk.bold(value.name),
            chalk.green(value.value),
            "dotenv",
            `${value.file}:${value.variable}`,
          ]);
          break;
        case "default":
          table.push([chalk.bold(value.name), value.value, "default", ""]);
          break;
        case "env":
          table.push([
            chalk.bold(value.name),
            chalk.grey(value.value),
            "local env",
          ]);
          break;
        case "empty":
          table.push([chalk.bold(value.name), chalk.grey("<empty>"), "", ""]);
          break;
      }
    }
    console.log(table.toString());

    Log.info("");
  }
}
