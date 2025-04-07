import CliTable3 from "cli-table3";
import { VaultValue } from "./vault";
import chalk from "chalk";
import { Log } from "./logger";

export class Printer {
  public static printDotenv(values: VaultValue[]) {
    for (const value of values) {
      if (value.type !== "empty") {
        if (value.type === "error") {
          console.log(`${value.name}=<error>`);
        } else if (value.value.includes("\n")) {
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

  public static printTable(
    values: VaultValue[],
    profile: string,
    show: boolean = false
  ) {
    Log.info("");

    Log.info(`Profile: ${chalk.bold.green(profile)}`);
    const rows: [string, string, string, string][] = [];

    for (const value of values) {
      let secret = show ? value.value ?? "" : "****";
      switch (value.type) {
        case "aws":
          rows.push([
            chalk.bold(value.name),
            chalk.bold.green(secret),
            "aws",
            `${value.secret}:${value.key}`,
          ]);
          break;
        case "dotenv":
          rows.push([
            chalk.bold(value.name),
            chalk.green(secret),
            "dotenv",
            `${value.file}:${value.variable}`,
          ]);
          break;
        case "default":
          rows.push([chalk.bold(value.name), secret, "default", ""]);
          break;
        case "error":
          rows.push([chalk.bold(value.name), chalk.red("missing"), "", ""]);
          break;
        case "empty":
          rows.push([chalk.bold(value.name), chalk.grey("<unset>"), "", ""]);
          break;
      }
    }

    const head = ["Name", "Value", "Provider", "Info"];

    const widths = rows
      .reduce(
        (acc, row) =>
          row.map((s) => s.length).map((len, i) => Math.max(acc[i], len)),
        head.map((s) => s.length)
      )
      .map((len) => len + 2); // add padding

    const separators = widths.length + 1;

    const shellWidth = process.stdout.columns || 80;

    while (widths.reduce((a, b) => a + b, 0) + separators > shellWidth) {
      let largestIndex = 0;
      widths.reduce((max, len, i) => {
        if (len > max) {
          largestIndex = i;
          return len;
        } else {
          return max;
        }
      }, 0);
      widths[largestIndex] -= 1;
    }

    const table = new CliTable3({
      head,
      style: { head: [] },
      colWidths: widths,
      wordWrap: true,
    });

    table.push(...rows);

    console.error(table.toString());

    Log.info("");
  }
}
