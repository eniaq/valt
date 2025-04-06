# valt

**valt** is a simple CLI tool for managing secrets and parameters in your projects.  
It integrates with **AWS Secrets Manager** and works seamlessly across both development and production environments.

With valt, you can manage environment variables **declaratively** per profile and leave access control to AWS IAM roles.

---

## Quick Start

1. Install valt.

```bash
npm install -g valt-cli
```

2. Make sure AWS CLI is configured.

```bash
aws configure
```

3. Create a secret in AWS Secrets Manager that valt can access.

4. Add a `valt.yaml` configuration to your project:

```yaml
# yaml-language-server: $schema=https://github.com/eniaq/valt/releases/download/0.1.0/valt.schema.json

version: "0.1"

defaults:
  profile: dev
  vault:
    dev:
      - provider: aws
        secret: valt-test
      - provider: dotenv
        file: .env.local

env:
  API_TOKEN:
    description: "An API token for a service"
    policy: optional
  PORT:
    default:
      dev: "3000"
      prod: "80"
    vault:
      - provider: aws
        enabled: false
```

5. Retrieve environment variables:

```bash
$ valt
Profile: dev
┌───────────┬─────────┬──────────┬──────┐
│ Name      │ Value   │ Provider │ Info │
├───────────┼─────────┼──────────┼──────┤
│ API_TOKEN │ <unset> │          │      │
│ PORT      │ ****    │ default  │      │
└───────────┴─────────┴──────────┴──────┘
```

6. Set a new value:

```bash
$ valt set API_TOKEN "token_****"
```

7. Output as `.env` file:

```bash
$ valt >> .env.test
```

8. You can also specify AWS profiles easily:

```bash
AWS_PROFILE=admin valt
```

---

## Features

- 🛡️ **Manage Secrets with AWS Secrets Manager**  
valt uses AWS Secrets Manager as the primary backend for storing secrets. It does not handle secrets directly — access control is delegated to AWS IAM.

- 📝 **Declarative Configuration with `valt.yaml`**  
Define your secrets, default values, and policies clearly. Profiles (`dev`, `prod`, etc.) are first-class citizens.

- 🔄 **Multiple Sources Support**
You can combine multiple secret sources. When `.env` files are specified, they have priority over AWS Secrets Manager for those variables.

- 📜 **Schema Validation**  
`valt.yaml` can be validated with the provided JSON schema for safety and editor integration.

- 🔍 **Flexible Command Options**  
  - `-c, --config <config>`: Path to configuration file
  - `-p, --profile <profile>`: Profile name override
  - `-f, --format <format>`: Output as `table`, `dotenv`, or `auto`
  - `-s, --show`: Show secret values in output (only with `table` format)

---

## Commands

### Show secrets

```bash
valt [options]
```

Options:
- `-c, --config <config>` — Path to the `valt.yaml`
- `-p, --profile <profile>` — Override default profile
- `-f, --format <format>` — Output format: `table`, `dotenv`, or `auto`
- `-s, --show` — Show values explicitly in the table

### Set a secret

```bash
valt set <name> [value] [options]
```

Options:
- `-c, --config <config>` — Path to the `valt.yaml`
- `-p, --profile <profile>` — Override default profile
- `--file <file>` — Read secret value from a file

---

## Configuration

The `valt.yaml` file defines how secrets and parameters are managed.

See [config.md](./config.md) for details.

## License

MIT

