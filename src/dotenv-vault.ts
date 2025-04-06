import dotenv from "dotenv";

export type DotenvVaultValue = {
  type: "dotenv";
  name: string;
  value: string;
  file: string;
  variable: string;
};

export class DotenvVault {
  type = "dotenv";

  private static cache: Record<string, Record<string, string>> = {};

  constructor(
    public readonly name: string,
    public readonly file: string,
    public readonly variable: string
  ) {}

  getValue = (): DotenvVaultValue | null => {
    const env: Record<string, string> = {};
    dotenv.config({
      path: this.file,
      processEnv: env,
    });

    if (this.variable in env) {
      const value = env[this.variable];
      if (value) {
        return {
          type: "dotenv",
          name: this.name,
          value,
          file: this.file || "",
          variable: this.variable,
        };
      }
    }

    return null;
  };
}
