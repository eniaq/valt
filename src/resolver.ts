import { Config } from "./config";
import { ValtError } from "./error";
import { AWSVault, DotenvVault, Vault } from "./vault";

export class Resolver {
  profile: string;

  get envs(): string[] {
    return Object.keys(this.config.env).filter(
      (envName) => this.resolvePolicy(envName) !== "ignore"
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

    var awsSecret: string | undefined = undefined;
    var awsKey: string = env;
    var dotenvFile: string | undefined = undefined;
    var dotenvVariable: string = env;

    for (const vault of vaults) {
      if (vault.provider === "aws") {
        if (vault.secret) awsSecret = vault.secret;
        if (vault.key) awsKey = vault.key;
      } else if (vault.provider === "dotenv") {
        if (vault.file) dotenvFile = vault.file;
        if (vault.variable) dotenvVariable = vault.variable;
      }
    }

    return {
      aws: awsSecret && awsKey ? new AWSVault(awsSecret, awsKey) : undefined,
      dotenv:
        dotenvFile && dotenvVariable
          ? new DotenvVault(dotenvFile, dotenvVariable)
          : undefined,
      defaultValue: this.resolveDefaultValue(env),
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
      throw new ValtError(
        `Environment '${env}' not found in '${this.config.path}`,
        {
          hint: `Please check the config file for the correct environment name.`,
        }
      );
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

  private resolvePolicy = (env: string): "required" | "optional" | "ignore" => {
    let policyConfig = this.config.env[env].policy;

    if (policyConfig === undefined) {
      return "required";
    }

    if (typeof policyConfig === "string") {
      return policyConfig;
    }

    if (this.profile in policyConfig) {
      return policyConfig[this.profile];
    } else {
      return "required";
    }
  };
}
