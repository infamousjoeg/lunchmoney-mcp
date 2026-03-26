import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdirSync, existsSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomBytes } from "crypto";

// Mock keytar before importing anything that depends on it
const mockKeytar = vi.hoisted(() => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  deletePassword: vi.fn(),
}));

vi.mock("keytar", () => ({
  default: mockKeytar,
}));

// Import after mocks are set up
import { CredentialStore } from "../src/credential-store.js";
import { createSessionStore, getDataDirectory } from "../src/session-store.js";

/**
 * Create a unique temporary directory for each test to avoid collisions.
 */
function createTempDir(): string {
  const dir = join(tmpdir(), `lunchmoney-mcp-test-${randomBytes(8).toString("hex")}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

describe("session-store", () => {
  let credentialStore: CredentialStore;
  let tempDir: string;
  // A valid 64-char hex key (32 bytes for AES-256)
  const TEST_ENCRYPTION_KEY = "a".repeat(64);

  beforeEach(() => {
    vi.clearAllMocks();
    credentialStore = new CredentialStore();
    tempDir = createTempDir();

    // Default: keychain returns the test encryption key
    mockKeytar.getPassword.mockResolvedValue(TEST_ENCRYPTION_KEY);
  });

  afterEach(() => {
    // Clean up temp directories
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("getDataDirectory", () => {
    it("returns a platform-native data path containing the app name", () => {
      const dataDir = getDataDirectory();
      expect(dataDir).toContain("lunchmoney-mcp");
      // Should be an absolute path
      expect(dataDir).toMatch(/^\//);
    });

    it("returns macOS Application Support path on darwin", () => {
      // env-paths respects the platform; on macOS this should include Application Support
      const dataDir = getDataDirectory();
      if (process.platform === "darwin") {
        expect(dataDir).toContain("Application Support");
      }
      // On other platforms just verify it's non-empty
      expect(dataDir.length).toBeGreaterThan(0);
    });
  });

  describe("createSessionStore", () => {
    it("creates the data directory if it does not exist", async () => {
      const nonExistentDir = join(tempDir, "sessions", "nested");
      expect(existsSync(nonExistentDir)).toBe(false);

      await createSessionStore(credentialStore, { directory: nonExistentDir });

      expect(existsSync(nonExistentDir)).toBe(true);
    });

    it("retrieves encryption key from the credential store (keychain)", async () => {
      await createSessionStore(credentialStore, { directory: tempDir });

      expect(mockKeytar.getPassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "encryption-key"
      );
    });

    it("returns a TokenStorage-compatible object", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });

      // Verify the returned object implements the TokenStorage interface
      expect(typeof store.save).toBe("function");
      expect(typeof store.get).toBe("function");
      expect(typeof store.delete).toBe("function");
      expect(typeof store.cleanup).toBe("function");
    });
  });

  describe("encryption round-trip", () => {
    it("stores and retrieves a simple string value", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });

      await store.save("test-key", "test-value");
      const result = await store.get("test-key");

      expect(result).toBe("test-value");
    });

    it("stores and retrieves a complex object", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });

      const tokenData = {
        accessToken: "at_1234567890",
        refreshToken: "rt_0987654321",
        expiresAt: Date.now() + 3600_000,
        scopes: ["openid", "email"],
        claims: { sub: "user-123", email: "test@example.com" },
      };

      await store.save("session:abc", tokenData);
      const result = await store.get("session:abc");

      expect(result).toEqual(tokenData);
    });

    it("stores data encrypted on disk (not plaintext)", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });
      const secretValue = "super-secret-token-value";

      await store.save("encrypted-test", secretValue);

      // Read the raw file from disk - it should NOT contain the plaintext
      const { readdirSync, readFileSync } = await import("fs");
      const files = readdirSync(tempDir).filter((f) => f.endsWith(".json"));
      expect(files.length).toBeGreaterThan(0);

      // Check file contents - should be encrypted, not plaintext
      const rawContent = readFileSync(join(tempDir, files[0]), "utf-8");
      expect(rawContent).not.toContain(secretValue);

      // But retrieval should work
      const result = await store.get("encrypted-test");
      expect(result).toBe(secretValue);
    });

    it("returns null for a key that does not exist", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });

      const result = await store.get("nonexistent-key");

      expect(result).toBeNull();
    });

    it("handles multiple keys independently", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });

      await store.save("key-a", "value-a");
      await store.save("key-b", "value-b");

      expect(await store.get("key-a")).toBe("value-a");
      expect(await store.get("key-b")).toBe("value-b");
    });

    it("overwrites an existing key with new value", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });

      await store.save("key", "original");
      await store.save("key", "updated");

      expect(await store.get("key")).toBe("updated");
    });
  });

  describe("TTL expiration", () => {
    it("returns null for expired tokens", async () => {
      const store = await createSessionStore(credentialStore, {
        directory: tempDir,
        cleanupIntervalMs: 100_000, // don't auto-cleanup during test
      });

      // Save with a very short TTL (1 second — DiskStore TTL is in seconds)
      await store.save("expiring-key", "expiring-value", 1);

      // Wait for TTL to elapse (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1_200));

      const result = await store.get("expiring-key");
      expect(result).toBeNull();
    });

    it("returns value before TTL expires", async () => {
      const store = await createSessionStore(credentialStore, {
        directory: tempDir,
        cleanupIntervalMs: 100_000,
      });

      // Save with a long TTL (60 seconds)
      await store.save("long-lived-key", "long-lived-value", 60);

      const result = await store.get("long-lived-key");
      expect(result).toBe("long-lived-value");
    });

    it("cleanup removes expired entries", async () => {
      const store = await createSessionStore(credentialStore, {
        directory: tempDir,
        cleanupIntervalMs: 100_000,
      });

      // Save with 1 second TTL
      await store.save("cleanup-test", "will-expire", 1);

      // Wait for expiration (1 second + buffer)
      await new Promise((resolve) => setTimeout(resolve, 1_200));

      // Run cleanup
      await store.cleanup();

      // Should be gone
      const result = await store.get("cleanup-test");
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    it("removes a stored token", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });

      await store.save("delete-me", "some-value");
      expect(await store.get("delete-me")).toBe("some-value");

      await store.delete("delete-me");
      expect(await store.get("delete-me")).toBeNull();
    });

    it("does not throw when deleting a nonexistent key", async () => {
      const store = await createSessionStore(credentialStore, { directory: tempDir });

      // Should not throw
      await expect(store.delete("nonexistent")).resolves.toBeUndefined();
    });
  });

  describe("keychain integration", () => {
    it("generates and stores a new encryption key when keychain has none", async () => {
      // First call returns null (no key), then we need setPassword to succeed
      mockKeytar.getPassword.mockResolvedValue(null);
      mockKeytar.setPassword.mockResolvedValue(undefined);

      const store = await createSessionStore(credentialStore, { directory: tempDir });

      // The CredentialStore.getEncryptionKey() generates a key when none exists
      expect(mockKeytar.getPassword).toHaveBeenCalledWith("lunchmoney-mcp", "encryption-key");
      expect(mockKeytar.setPassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "encryption-key",
        expect.stringMatching(/^[a-f0-9]{64}$/)
      );

      // Should still work for round-trip
      await store.save("test", "data");
      expect(await store.get("test")).toBe("data");
    });

    it("falls back to ENCRYPTION_KEY env var when keychain is unavailable", async () => {
      const envKey = "b".repeat(64);
      mockKeytar.getPassword.mockRejectedValue(new Error("Keychain locked"));
      process.env.ENCRYPTION_KEY = envKey;

      const store = await createSessionStore(credentialStore, { directory: tempDir });

      // Should still work for round-trip using the env-provided key
      await store.save("env-test", "env-data");
      expect(await store.get("env-test")).toBe("env-data");
    });

    it("data encrypted with one key cannot be decrypted with another", async () => {
      // Create store with key A
      const keyA = "a".repeat(64);
      mockKeytar.getPassword.mockResolvedValue(keyA);
      const storeA = await createSessionStore(credentialStore, { directory: tempDir });
      await storeA.save("secret", "classified-data");

      // Create a new store in the SAME directory but with key B
      const keyB = "b".repeat(64);
      mockKeytar.getPassword.mockResolvedValue(keyB);
      const storeB = await createSessionStore(credentialStore, { directory: tempDir });

      // Attempting to decrypt with the wrong key should return null or throw
      // (FastMCP's EncryptedTokenStorage returns null on decryption failure)
      const result = await storeB.get("secret");
      expect(result).toBeNull();
    });
  });

  describe("persistence across restarts", () => {
    it("data survives creating a new store instance pointing to the same directory", async () => {
      // Simulate first server run
      const store1 = await createSessionStore(credentialStore, { directory: tempDir });
      await store1.save("persistent-key", { token: "abc123" });

      // Simulate server restart - create a new store with same dir and key
      const store2 = await createSessionStore(credentialStore, { directory: tempDir });
      const result = await store2.get("persistent-key");

      expect(result).toEqual({ token: "abc123" });
    });
  });
});
