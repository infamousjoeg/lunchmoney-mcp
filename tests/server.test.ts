import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock keytar
const mockKeytar = vi.hoisted(() => ({
  getPassword: vi.fn(),
  setPassword: vi.fn(),
  deletePassword: vi.fn(),
}));
vi.mock("keytar", () => ({
  default: mockKeytar,
}));

// Mock fetch for token validation
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function createJsonResponse(data: unknown, status = 200, ok = true) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    headers: new Headers({ "content-type": "application/json" }),
    json: vi.fn().mockResolvedValue(data),
    text: vi.fn().mockResolvedValue(JSON.stringify(data)),
  };
}

import {
  createServer,
  startServer,
  executeConfigureToken,
  executeStubGetUser,
  TOKEN_NOT_CONFIGURED_MSG,
} from "../src/server.js";
import { CredentialStore } from "../src/credential-store.js";

describe("Server", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    delete process.env.LUNCH_MONEY_API_TOKEN;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("createServer", () => {
    it("creates server without token (no keychain, no env)", async () => {
      mockKeytar.getPassword.mockResolvedValue(null);

      const server = await createServer();
      expect(server).toBeDefined();
    });

    it("creates server with token from env", async () => {
      mockKeytar.getPassword.mockResolvedValue(null);
      process.env.LUNCH_MONEY_API_TOKEN = "test-token";

      const server = await createServer();
      expect(server).toBeDefined();
    });

    it("creates server with token from keychain", async () => {
      mockKeytar.getPassword.mockResolvedValue("keychain-token");

      const server = await createServer();
      expect(server).toBeDefined();
    });
  });

  describe("executeConfigureToken", () => {
    it("validates and stores a valid token", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        currency: "usd",
      };
      mockFetch.mockResolvedValue(createJsonResponse(mockUser));
      mockKeytar.setPassword.mockResolvedValue(undefined);

      const store = new CredentialStore();
      const result = await executeConfigureToken({ token: "valid-token" }, store);

      expect(result).toContain("Token validated and stored successfully!");
      expect(result).toContain("Test User");
      expect(result).toContain("test@example.com");
      expect(mockKeytar.setPassword).toHaveBeenCalledWith(
        "lunchmoney-mcp",
        "api-token",
        "valid-token"
      );
    });

    it("returns error for invalid token (API rejects)", async () => {
      const errorResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ error: "Invalid API key" }),
        text: vi.fn().mockResolvedValue('{"error":"Invalid API key"}'),
      };
      mockFetch.mockResolvedValue(errorResponse);

      const store = new CredentialStore();
      const result = await executeConfigureToken({ token: "bad-token" }, store);

      expect(result).toContain("Failed to validate token");
      expect(result).toContain("Invalid API key");
      expect(result).toContain("https://my.lunchmoney.app/developers");
      expect(mockKeytar.setPassword).not.toHaveBeenCalled();
    });

    it("returns error for network failure during validation", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const store = new CredentialStore();
      const result = await executeConfigureToken({ token: "some-token" }, store);

      expect(result).toContain("Failed to validate token");
      expect(mockKeytar.setPassword).not.toHaveBeenCalled();
    });

    it("returns error when setApiToken fails (keychain unavailable)", async () => {
      const mockUser = {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        currency: "usd",
      };
      mockFetch.mockResolvedValue(createJsonResponse(mockUser));
      mockKeytar.setPassword.mockRejectedValue(new Error("Keychain locked"));

      const store = new CredentialStore();
      const result = await executeConfigureToken({ token: "valid-token" }, store);

      expect(result).toContain("Failed to validate token");
      expect(result).toContain("Failed to store token in keychain");
    });
  });

  describe("executeStubGetUser", () => {
    it("returns token-not-configured message", async () => {
      const result = await executeStubGetUser();

      expect(result).toBe(TOKEN_NOT_CONFIGURED_MSG);
      expect(result).toContain("not configured");
      expect(result).toContain("configureLunchMoneyToken");
      expect(result).toContain("npx lunchmoney-mcp setup");
    });
  });

  describe("startServer", () => {
    it("starts in http mode with specified port", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const mockServer = {
        start: vi.fn(),
      };

      await startServer(mockServer as never, "httpStream", 3000);

      expect(mockServer.start).toHaveBeenCalledWith({
        transportType: "httpStream",
        httpStream: { port: 3000 },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("3000")
      );
      consoleSpy.mockRestore();
    });

    it("starts in http mode with default port", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const mockServer = {
        start: vi.fn(),
      };

      await startServer(mockServer as never, "httpStream");

      expect(mockServer.start).toHaveBeenCalledWith({
        transportType: "httpStream",
        httpStream: { port: 8080 },
      });
      consoleSpy.mockRestore();
    });

    it("starts in stdio mode", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const mockServer = {
        start: vi.fn(),
      };

      await startServer(mockServer as never, "stdio");

      expect(mockServer.start).toHaveBeenCalledWith({
        transportType: "stdio",
      });
      // stdio mode should NOT log to stdout
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("TOKEN_NOT_CONFIGURED_MSG", () => {
    it("contains helpful instructions", () => {
      expect(TOKEN_NOT_CONFIGURED_MSG).toContain("configureLunchMoneyToken");
      expect(TOKEN_NOT_CONFIGURED_MSG).toContain("npx lunchmoney-mcp setup");
    });
  });
});
