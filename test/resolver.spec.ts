import { Resolver } from "../src/resolver";
import { Config } from "../src/config";

describe("Resolver", () => {
  describe("when no profile specified", () => {
    it("throws an error", () => {
      const config = new Config({ config: "test/configs/no-default.yaml" });
      expect(() => new Resolver(config, {})).toThrow("No profile specified");
    });
  });

  describe("when try to resolve a non-existing env", () => {
    it("throws an error", () => {
      const config = new Config({ config: "test/configs/no-default.yaml" });
      const resolver = new Resolver(config, { profile: "test" });
      expect(() => resolver.resolveVault("NON_EXISTING_ENV")).toThrow(
        "Environment 'NON_EXISTING_ENV' not found"
      );
    });
  });

  describe("when policy specified", () => {
    it("ignores variables with `ignore` policy", () => {
      const config = new Config({ config: "test/configs/policy-test.yaml" });

      const test = new Resolver(config, { profile: "test" });
      expect(test.envs).toContain("REQUIRED");
      expect(test.envs).toContain("OPTIONAL");
      expect(test.envs).not.toContain("IGNORE");
      expect(test.envs).toContain("NOT_SPECIFIED");
      expect(test.envs).toContain("PROD_IGNORE");

      const prod = new Resolver(config, { profile: "prod" });
      expect(prod.envs).toContain("REQUIRED");
      expect(prod.envs).toContain("OPTIONAL");
      expect(prod.envs).not.toContain("IGNORE");
      expect(prod.envs).toContain("NOT_SPECIFIED");
      expect(prod.envs).not.toContain("PROD_IGNORE");
    });
  });

  describe("when no default specified", () => {
    it("resolves only with `env` config", () => {
      const config = new Config({ config: "test/configs/no-default.yaml" });
      const resolver = new Resolver(config, { profile: "test" });

      const noVault = resolver.resolveVault("NO_VAULT");
      expect(noVault.aws).toBeUndefined();
      expect(noVault.dotenv).toBeUndefined();
      expect(noVault.defaultValue).toBeUndefined();

      const onlyDefault = resolver.resolveVault("ONLY_DEFAULT");
      expect(onlyDefault.aws).toBeUndefined();
      expect(onlyDefault.dotenv).toBeUndefined();
      expect(onlyDefault.defaultValue).toBe("default-value");

      const onlyDotenv = resolver.resolveVault("ONLY_DOTENV");
      expect(onlyDotenv.aws).toBeUndefined();
      expect(onlyDotenv.dotenv).not.toBeUndefined();
      expect(onlyDotenv.defaultValue).toBeUndefined();

      const onlyAWS = resolver.resolveVault("ONLY_AWS");
      expect(onlyAWS.aws).not.toBeUndefined();
      expect(onlyAWS.dotenv).toBeUndefined();
      expect(onlyAWS.defaultValue).toBeUndefined();

      const both = resolver.resolveVault("BOTH");
      expect(both.aws).not.toBeUndefined();
      expect(both.dotenv).not.toBeUndefined();
      expect(both.defaultValue).toBeUndefined();
    });
  });

  describe("when default specified", () => {
    it("resolves with `env` config overriding `defaults`", () => {
      const config = new Config({ config: "test/configs/aws-default.yaml" });
      const resolver = new Resolver(config, { profile: "test" });

      const noOverride = resolver.resolveVault("NO_OVERRIDE");
      expect(noOverride.aws).not.toBeUndefined();
      expect(noOverride.aws?.secret).toBe("default-secret");
      expect(noOverride.aws?.key).toBe("NO_OVERRIDE");
      expect(noOverride.dotenv).toBeUndefined();
      expect(noOverride.defaultValue).toBeUndefined();

      const override = resolver.resolveVault("OVERRIDE");
      expect(override.aws).not.toBeUndefined();
      expect(override.aws?.secret).toBe("override-secret");
      expect(override.aws?.key).toBe("OVERRIDE");
      expect(override.dotenv).toBeUndefined();
      expect(override.defaultValue).toBeUndefined();

      const setKey = resolver.resolveVault("SET_KEY");
      expect(setKey.aws).not.toBeUndefined();
      expect(setKey.aws?.secret).toBe("override-secret");
      expect(setKey.aws?.key).toBe("test-key");
      expect(setKey.dotenv).toBeUndefined();
      expect(setKey.defaultValue).toBeUndefined();

      const setDotenv = resolver.resolveVault("SET_DOTENV");
      expect(setDotenv.aws).not.toBeUndefined();
      expect(setDotenv.dotenv).not.toBeUndefined();
      expect(setDotenv.dotenv?.file).toBe(".env");
      expect(setDotenv.dotenv?.variable).toBe("test-variable");
      expect(setDotenv.defaultValue).toBeUndefined();
    });
  });

  describe("when profile specified", () => {
    it("resolves default value accordingly", () => {
      const config = new Config({ config: "test/configs/profile-test.yaml" });

      const resolver1 = new Resolver(config, { profile: "profile1" });
      const result1 = resolver1.resolveVault("OVERRIDE_PROFILE1");

      expect(result1.aws?.secret).toBe("profile1-override-secret");
      expect(result1.aws?.key).toBe("profile1-override-key");
      expect(result1.dotenv?.file).toBe("profile1-override-file");
      expect(result1.dotenv?.variable).toBe("profile1-override-variable");
      expect(result1.defaultValue).toBe("profile1-default-value");

      const resolver2 = new Resolver(config, { profile: "profile2" });
      const result2 = resolver2.resolveVault("OVERRIDE_PROFILE1");

      expect(result2.aws?.secret).toBe("profile2-default-secret");
      expect(result2.aws?.key).toBe("profile2-default-key");
      expect(result2.dotenv?.file).toBe("profile2-default-file");
      expect(result2.dotenv?.variable).toBe("profile2-default-variable");
      expect(result2.defaultValue).toBeUndefined();

      const resolver3 = new Resolver(config, { profile: "profile3" });
      const result3 = resolver3.resolveVault("OVERRIDE_PROFILE1");

      expect(result3.aws?.secret).toBe("profile3-override-secret");
      expect(result3.aws?.key).toBe("profile3-override-key");
      expect(result3.dotenv?.file).toBeUndefined();
      expect(result3.dotenv?.variable).toBeUndefined();
      expect(result3.defaultValue).toBeUndefined();
    });
  });
});
