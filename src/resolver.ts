import { AWSVault } from "./aws-vault";
import { Config } from "./config";
import { DotenvVault } from "./dotenv-vault";
import { ValtError } from "./error";

export class Resolver {
  profile: string;

  get envs(): string[] {
    return Object.keys(this.config.env).filter(
      (envName) => !this.resolveDisabled(envName)
    );
  }

  constructor(private config: Config, options: { profile?: string }) {
    const profile = options.profile || this.config.defaults?.profile;
    if (!profile) {
      throw new ValtError("No profile specified", {
        hint: "Please specify a profile in the config file or as an argument.",
      });
    }

    this.profile = profile;
  }

  public resolveVault = (env: string) => {
    const localVaults = this.resolveLocalEnvVaults(env);
    const globalVaults = this.resolveGlobalVaults();
    const vaults = [...(globalVaults ?? []), ...(localVaults ?? [])];

    let awsSecret: string | undefined = undefined;
    let awsKey: string = env;
    let awsEnabled = true;
    let dotenvFile: string | undefined = undefined;
    let dotenvVariable: string = env;
    let dotenvEnabled = true;

    for (const vault of vaults) {
      if (vault.provider === "aws") {
        if (vault.secret) awsSecret = vault.secret;
        if (vault.key) awsKey = vault.key;
        if (vault.enabled !== undefined) awsEnabled = vault.enabled;
      } else if (vault.provider === "dotenv") {
        if (vault.file) dotenvFile = vault.file;
        if (vault.variable) dotenvVariable = vault.variable;
        if (vault.enabled !== undefined) dotenvEnabled = vault.enabled;
      }
    }

    let aws: AWSVault | undefined = undefined;
    if (awsEnabled && awsSecret && awsKey) {
      aws = new AWSVault(env, awsSecret, awsKey);
    }

    let dotenv: DotenvVault | undefined = undefined;
    if (dotenvEnabled && dotenvFile) {
      dotenv = new DotenvVault(env, dotenvFile, dotenvVariable);
    }

    return {
      aws,
      dotenv,
      defaultValue: this.resolveDefaultValue(env),
      required: !this.resolveOptional(env),
    };
  };

  private resolveDefaultValue = (env: string) => {
    const defaultValue = this.config.env[env].default;

    if (defaultValue === undefined) {
      return undefined;
    }

    if (typeof defaultValue === "string") {
      return defaultValue;
    }

    if (this.profile in defaultValue) {
      return defaultValue[this.profile];
    }

    return undefined;
  };

  private resolveLocalEnvVaults = (env: string) => {
    if (!this.envs.includes(env)) {
      if (this.config.env[env]) {
        throw new ValtError(
          `Environment '${env}' is disabled in '${this.config.path}`,
          { hint: "This environment variable is ignored by the config." }
        );
      } else {
        throw new ValtError(
          `Environment '${env}' not found in '${this.config.path}`,
          {
            hint: "Please check the config file for the correct environment name.",
          }
        );
      }
    }

    const vaults = this.config.env[env].vault;

    if (vaults === undefined) {
      return undefined;
    }

    if (Array.isArray(vaults)) {
      return vaults;
    }

    if (this.profile in vaults) {
      return vaults[this.profile];
    }

    return undefined;
  };

  private resolveGlobalVaults = () => {
    const vault = this.config.defaults?.vault;

    if (vault === undefined) {
      return undefined;
    }

    if (Array.isArray(vault)) {
      return vault;
    }

    if (this.profile in vault) {
      return vault[this.profile];
    }

    return undefined;
  };

  private resolveOptional = (env: string): boolean => {
    return this.resolveBoolean(env, "optional", false);
  };

  private resolveDisabled = (env: string): boolean => {
    return this.resolveBoolean(env, "disabled", false);
  };

  private resolveBoolean = (
    env: string,
    param: "optional" | "disabled",
    defaultValue: boolean
  ): boolean => {
    let config = this.config.env[env][param];

    if (config === undefined) {
      return defaultValue;
    }

    if (typeof config === "boolean") {
      return config;
    }

    if (this.profile in config) {
      return config[this.profile];
    } else {
      return defaultValue;
    }
  };
}
