export class AWSVault {
  type = "aws";

  constructor(public readonly secret: string, public readonly key: string) {}
}

export class DotenvVault {
  type = "dotenv";

  constructor(public readonly file: string, public readonly variable: string) {}
}

export type Vault = AWSVault | DotenvVault;
