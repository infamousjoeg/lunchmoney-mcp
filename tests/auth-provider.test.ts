import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Hoist mock values so they're available in vi.mock factory
const mocks = vi.hoisted(() => {
  // Use mockImplementation for classes called with `new`
  const GoogleProviderMock = vi.fn().mockImplementation(function (this: any, config: any) {
    this.type = "google";
    this.config = config;
  });
  const GitHubProviderMock = vi.fn().mockImplementation(function (this: any, config: any) {
    this.type = "github";
    this.config = config;
  });
  return {
    GoogleProviderMock,
    GitHubProviderMock,
  };
});

vi.mock("fastmcp", () => ({
  GoogleProvider: mocks.GoogleProviderMock,
  GitHubProvider: mocks.GitHubProviderMock,
}));

import {
  createAuthProvider,
  getAuthCredentialsFromEnv,
  type AuthProviderType,
} from "../src/auth-provider.js";

describe("auth-provider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("createAuthProvider", () => {
    it("creates a Google provider with correct config", () => {
      const result = createAuthProvider({
        provider: "google",
        baseUrl: "http://localhost:8080",
        clientId: "google-client-id",
        clientSecret: "google-client-secret",
      });

      expect(mocks.GoogleProviderMock).toHaveBeenCalledWith({
        clientId: "google-client-id",
        clientSecret: "google-client-secret",
        baseUrl: "http://localhost:8080",
        scopes: ["openid", "email"],
        consentRequired: false,
      });
      expect(result).toHaveProperty("type", "google");
    });

    it("creates a GitHub provider with correct config", () => {
      const result = createAuthProvider({
        provider: "github",
        baseUrl: "http://localhost:3000",
        clientId: "github-client-id",
        clientSecret: "github-client-secret",
      });

      expect(mocks.GitHubProviderMock).toHaveBeenCalledWith({
        clientId: "github-client-id",
        clientSecret: "github-client-secret",
        baseUrl: "http://localhost:3000",
        scopes: ["read:user", "user:email"],
      });
      expect(result).toHaveProperty("type", "github");
    });

    it("throws for unknown provider type", () => {
      expect(() =>
        createAuthProvider({
          provider: "unknown" as AuthProviderType,
          baseUrl: "http://localhost:8080",
          clientId: "id",
          clientSecret: "secret",
        })
      ).toThrow("Unknown auth provider: unknown. Supported: google, github");
    });

    it("passes different baseUrl values correctly", () => {
      createAuthProvider({
        provider: "google",
        baseUrl: "https://mcp.example.com",
        clientId: "id",
        clientSecret: "secret",
      });

      expect(mocks.GoogleProviderMock).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: "https://mcp.example.com",
        })
      );
    });
  });

  describe("getAuthCredentialsFromEnv", () => {
    describe("google provider", () => {
      it("returns credentials when both env vars are set", () => {
        process.env.GOOGLE_CLIENT_ID = "test-google-id";
        process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

        const result = getAuthCredentialsFromEnv("google");

        expect(result).toEqual({
          clientId: "test-google-id",
          clientSecret: "test-google-secret",
        });
      });

      it("throws when GOOGLE_CLIENT_ID is missing", () => {
        delete process.env.GOOGLE_CLIENT_ID;
        process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

        expect(() => getAuthCredentialsFromEnv("google")).toThrow(
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required for Google OAuth"
        );
      });

      it("throws when GOOGLE_CLIENT_SECRET is missing", () => {
        process.env.GOOGLE_CLIENT_ID = "test-google-id";
        delete process.env.GOOGLE_CLIENT_SECRET;

        expect(() => getAuthCredentialsFromEnv("google")).toThrow(
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required for Google OAuth"
        );
      });

      it("throws when both Google env vars are missing", () => {
        delete process.env.GOOGLE_CLIENT_ID;
        delete process.env.GOOGLE_CLIENT_SECRET;

        expect(() => getAuthCredentialsFromEnv("google")).toThrow(
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required for Google OAuth"
        );
      });

      it("throws when GOOGLE_CLIENT_ID is empty string", () => {
        process.env.GOOGLE_CLIENT_ID = "";
        process.env.GOOGLE_CLIENT_SECRET = "test-google-secret";

        expect(() => getAuthCredentialsFromEnv("google")).toThrow(
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required for Google OAuth"
        );
      });
    });

    describe("github provider", () => {
      it("returns credentials when both env vars are set", () => {
        process.env.GITHUB_CLIENT_ID = "test-github-id";
        process.env.GITHUB_CLIENT_SECRET = "test-github-secret";

        const result = getAuthCredentialsFromEnv("github");

        expect(result).toEqual({
          clientId: "test-github-id",
          clientSecret: "test-github-secret",
        });
      });

      it("throws when GITHUB_CLIENT_ID is missing", () => {
        delete process.env.GITHUB_CLIENT_ID;
        process.env.GITHUB_CLIENT_SECRET = "test-github-secret";

        expect(() => getAuthCredentialsFromEnv("github")).toThrow(
          "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables are required for GitHub OAuth"
        );
      });

      it("throws when GITHUB_CLIENT_SECRET is missing", () => {
        process.env.GITHUB_CLIENT_ID = "test-github-id";
        delete process.env.GITHUB_CLIENT_SECRET;

        expect(() => getAuthCredentialsFromEnv("github")).toThrow(
          "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables are required for GitHub OAuth"
        );
      });

      it("throws when both GitHub env vars are missing", () => {
        delete process.env.GITHUB_CLIENT_ID;
        delete process.env.GITHUB_CLIENT_SECRET;

        expect(() => getAuthCredentialsFromEnv("github")).toThrow(
          "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables are required for GitHub OAuth"
        );
      });
    });

    describe("unknown provider", () => {
      it("throws for invalid provider name", () => {
        expect(() =>
          getAuthCredentialsFromEnv("okta" as AuthProviderType)
        ).toThrow("Unknown auth provider: okta. Supported: google, github");
      });
    });
  });
});
