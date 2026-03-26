import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock keytar before importing CredentialStore
const mockKeytar = vi.hoisted(() => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  deletePassword: vi.fn(),
}));

vi.mock("keytar", () => ({
  default: mockKeytar,
}));

// Now import CredentialStore (which uses the mocked keytar)
import { CredentialStore } from "../src/credential-store.js";

describe("CredentialStore", () => {
  let store: CredentialStore;
  const originalEnv = process.env;

  beforeEach(() => {
    store = new CredentialStore();
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getApiToken", () => {
    it("returns token from keychain when available", async () => {
      mockKeytar.getPassword.mockResolvedValue("keychain-token");

      const token = await store.getApiToken();

      expect(token).toBe("keychain-token");
      expect(mockKeytar.getPassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "api-token"
      );
    });

    it("falls back to ENV when keychain returns null", async () => {
      mockKeytar.getPassword.mockResolvedValue(null);
      process.env.LUNCH_MONEY_API_TOKEN = "env-token";

      const token = await store.getApiToken();

      expect(token).toBe("env-token");
    });

    it("falls back to ENV when keychain throws", async () => {
      mockKeytar.getPassword.mockRejectedValue(new Error("Keychain locked"));
      process.env.LUNCH_MONEY_API_TOKEN = "env-token";

      const token = await store.getApiToken();

      expect(token).toBe("env-token");
    });

    it("returns null when keychain empty and no ENV var", async () => {
      mockKeytar.getPassword.mockResolvedValue(null);
      delete process.env.LUNCH_MONEY_API_TOKEN;

      const token = await store.getApiToken();

      expect(token).toBeNull();
    });

    it("returns null when keychain throws and no ENV var", async () => {
      mockKeytar.getPassword.mockRejectedValue(new Error("Keychain locked"));
      delete process.env.LUNCH_MONEY_API_TOKEN;

      const token = await store.getApiToken();

      expect(token).toBeNull();
    });
  });

  describe("setApiToken", () => {
    it("stores token in keychain", async () => {
      mockKeytar.setPassword.mockResolvedValue(undefined);

      await store.setApiToken("new-token");

      expect(mockKeytar.setPassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "api-token",
        "new-token"
      );
    });

    it("throws when keychain unavailable", async () => {
      mockKeytar.setPassword.mockRejectedValue(new Error("Keychain locked"));

      await expect(store.setApiToken("new-token")).rejects.toThrow(
        "Failed to store token in keychain"
      );
    });
  });

  describe("deleteApiToken", () => {
    it("deletes token from keychain", async () => {
      mockKeytar.deletePassword.mockResolvedValue(true);

      await store.deleteApiToken();

      expect(mockKeytar.deletePassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "api-token"
      );
    });

    it("ignores errors when keychain unavailable", async () => {
      mockKeytar.deletePassword.mockRejectedValue(new Error("Keychain locked"));

      // Should not throw
      await store.deleteApiToken();
    });
  });

  describe("getEncryptionKey", () => {
    it("returns existing key from keychain", async () => {
      mockKeytar.getPassword.mockResolvedValue("existing-key-hex");

      const key = await store.getEncryptionKey();

      expect(key).toBe("existing-key-hex");
      expect(mockKeytar.getPassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "encryption-key"
      );
    });

    it("generates and stores new key when not in keychain", async () => {
      mockKeytar.getPassword.mockResolvedValue(null);
      mockKeytar.setPassword.mockResolvedValue(undefined);

      const key = await store.getEncryptionKey();

      // Should be a 64-char hex string (32 bytes)
      expect(key).toMatch(/^[a-f0-9]{64}$/);
      expect(mockKeytar.setPassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "encryption-key",
        key
      );
    });

    it("falls back to ENCRYPTION_KEY env var when keychain throws", async () => {
      mockKeytar.getPassword.mockRejectedValue(new Error("Keychain locked"));
      process.env.ENCRYPTION_KEY = "env-encryption-key";

      const key = await store.getEncryptionKey();

      expect(key).toBe("env-encryption-key");
    });

    it("generates ephemeral key when keychain throws and no env var", async () => {
      mockKeytar.getPassword.mockRejectedValue(new Error("Keychain locked"));
      delete process.env.ENCRYPTION_KEY;

      const key = await store.getEncryptionKey();

      // Should be a 64-char hex string (32 bytes)
      expect(key).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe("clear", () => {
    it("deletes both api-token and encryption-key from keychain", async () => {
      mockKeytar.deletePassword.mockResolvedValue(true);

      await store.clear();

      expect(mockKeytar.deletePassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "api-token"
      );
      expect(mockKeytar.deletePassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "encryption-key"
      );
      expect(mockKeytar.deletePassword).toHaveBeenCalledTimes(2);
    });

    it("ignores errors when keychain unavailable", async () => {
      mockKeytar.deletePassword.mockRejectedValue(new Error("Keychain locked"));

      // Should not throw
      await store.clear();
    });
  });
});
