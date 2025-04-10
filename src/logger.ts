import chalk from "chalk";

export class Log {
  static color: boolean = true;

  static error(log: string) {
    if (this.color) {
      console.error(chalk.red(log));
    } else {
      console.error(log);
    }
  }

  static debug(log: string) {
    if (this.color) {
      console.error(chalk.gray(log));
    } else {
      console.error(log);
    }
  }

  static info(log: string) {
    console.error(log);
  }
}
