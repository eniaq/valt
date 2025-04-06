# valt.yaml Configuration Reference

This document explains the basic structure of `valt.yaml` and how to manage environment variables with it.

See `valt.schema.json` for complete documentation.

---

## Basic Structure

```yaml
version: "0.1"

defaults:
  # Default settings for the entire project

env:
  # Define environment variables here
```

### version (Required)
Indicates the schema version used by the valt configuration file.
- **Type**: `string`
- **Allowed Value**: `"0.1"`

```yaml
version: "0.1"
```

### defaults (Optional)
Holds default settings for your project.
- **Type**: `object`

**Key Properties**:
- **profile**: `string`  
  The default profile name (e.g., dev, prod).
- **vault**: A list of vault providers (discussed below).

```yaml
defaults:
  profile: dev
  vault:
    - provider: aws
      secret: myapp-secrets
    - provider: dotenv
      file: .env.local
```

### env (Required)
The definitions for each environment variable.
- **Type**: `object`
- Variable names must match the regex pattern `^[a-zA-Z0-9_]+$`.

Within each environment variable key, you can specify:
- **description**: A string description of what the variable is
- **default**: The default value (explained below)
- **vault**: The vault configuration (a list) for this environment variable (e.g., AWS, dotenv, etc.).
- **policy**: A policy defining whether the variable is required, optional, or ignored

```yaml
env:
  API_TOKEN:
    description: "API token"
    policy: required
  PORT:
    default: "3000"
```

---

## Common Properties in Detail

Below are the main properties you can define under each environment variable in env.
Note that some settings like vault can also be specified globally in defaults to avoid redundancy when they apply to many variables.
You can set them for **all profiles** (a global value) or specify them **per-profile** if you need different values (e.g., for `dev` vs. `prod`).

### default
Specifies the default value for the environment variable.

- **All profiles**:

```yaml
PORT:
  default: "3000"
```

- **Per-profile**:

```yaml
PORT:
  default:
    dev: "3000"
    prod: "80"
```

In this case, `PORT` will be `3000` in the `dev` profile, and `80` in the `prod` profile.

### policy
Defines whether the variable is `required`, `optional`, or `ignore`.

- **All profiles**:

```yaml
API_TOKEN:
  policy: optional
```

- **Per-profile**:

```yaml
API_TOKEN:
  policy:
    dev: optional
    prod: required
```

If `policy` is omitted entirely, it defaults to `required`.

### vault
Specifies which vault provider(s) to retrieve the variable’s value from. You can list multiple providers.

#### All profiles

```yaml
API_TOKEN:
  vault:
    - provider: aws
      secret: "myapp-secrets"
    - provider: dotenv
      file: .env.local
```

#### Per-profile

```yaml
API_TOKEN:
  vault:
    dev:
      - provider: aws
        enabled: false
      - provider: dotenv
        file: .env
    prod:
      - provider: aws
        secret: myapp-prod-secrets
```

Below are the two supported vault providers in detail:

- **AWS Vault**:

  ```yaml
  - provider: aws
    secret: "myapp-secrets"
    key: "API_TOKEN"      # optional
    enabled: true         # defaults to true
  ```

  - **provider** must be `aws`
  - **secret**: name of the secret in AWS Secrets Manager
  - **key** (optional): which key in the secret to use (defaults to the variable name)
  - **enabled** (optional): defaults to `true`

- **Dotenv Vault**:

  ```yaml
  - provider: dotenv
    file: .env.local
    variable: "API_TOKEN"  # optional
    enabled: true           # defaults to true
  ```

  - **provider** must be `dotenv`
  - **file**: path to the dotenv file.
  You must explicitly specify the file when using the dotenv provider, either in defaults or within env.
  There is no automatic default to .env.
  - **variable** (optional): name in that file (defaults to the variable name)
  - **enabled** (optional): defaults to `true`
