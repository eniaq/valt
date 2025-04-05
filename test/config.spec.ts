import { Config } from "../src/config";

describe("Config", () => {
  describe("When the config file is not found", () => {
    it("throws an error", () => {
      expect(() => new Config({})).toThrow("Config file not found at");
    });
  });

  describe("when the given config is not yaml", () => {
    it("throws an error", () => {
      expect(
        () => new Config({ config: "test/configs/not-yaml.yaml" })
      ).toThrow("Failed to parse config");
    });
  });

  describe("when the given config cannot be read", () => {
    it("throws an error", () => {
      expect(
        () => new Config({ config: "test/configs/not-file.yaml" })
      ).toThrow("Failed to read config");
    });
  });

  describe("when the given config is empty", () => {
    it("throws an error", () => {
      expect(() => new Config({ config: "test/configs/empty.yaml" })).toThrow(
        "Config file is empty"
      );
    });
  });

  describe("when the given config has invalid schema", () => {
    it("throws an error", () => {
      expect(
        () => new Config({ config: "test/configs/invalid-schema.yaml" })
      ).toThrow("Validation failed");
    });
  });
});
