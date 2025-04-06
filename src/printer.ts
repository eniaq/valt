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

  public static printTable(values: VaultValue[], show: boolean = false) {
    Log.info("");

    const table = new CliTable3({
      head: ["Name", "Value", "Provider", "Info"],
      style: { head: [] },
    });

    for (const value of values) {
      let secret = show ? value.value : "****";
      switch (value.type) {
        case "aws":
          table.push([
            chalk.bold(value.name),
            chalk.bold.green(secret),
            "aws",
            `${value.secret}:${value.key}`,
          ]);
          break;
        case "dotenv":
          table.push([
            chalk.bold(value.name),
            chalk.green(secret),
            "dotenv",
            `${value.file}:${value.variable}`,
          ]);
          break;
        case "default":
          table.push([chalk.bold(value.name), secret, "default", ""]);
          break;
        case "env":
          table.push([chalk.bold(value.name), chalk.grey(secret), "local env"]);
          break;
        case "empty":
          table.push([chalk.bold(value.name), chalk.grey("<unset>"), "", ""]);
          break;
      }
    }
    console.log(table.toString());

    Log.info("");
  }
}
