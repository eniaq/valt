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
      console.debug(chalk.gray(log));
    } else {
      console.debug(log);
    }
  }

  static info(log: string) {
    console.info(log);
  }
}
