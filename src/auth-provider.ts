import { GoogleProvider, GitHubProvider } from "fastmcp";
import type { TokenStorage } from "fastmcp/auth";

export type AuthProviderType = "google" | "github";

export interface AuthProviderOptions {
  provider: AuthProviderType;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  /** Token storage backend for persisting OAuth sessions across restarts */
  tokenStorage?: TokenStorage;
  /** Encryption key for token storage (set to false to disable if already encrypted, or provide a hex string) */
  encryptionKey?: false | string;
}

/**
 * Create an OAuth auth provider for use with FastMCP HTTP transport.
 * Supports Google and GitHub OAuth providers.
 */
export function createAuthProvider(options: AuthProviderOptions) {
  const { provider, baseUrl, clientId, clientSecret } = options;

  switch (provider) {
    case "google":
      return new GoogleProvider({
        clientId,
        clientSecret,
        baseUrl,
        scopes: ["openid", "email"],
        consentRequired: false,
        ...(options.tokenStorage && { tokenStorage: options.tokenStorage }),
        ...(options.encryptionKey !== undefined && { encryptionKey: options.encryptionKey }),
      });

    case "github":
      return new GitHubProvider({
        clientId,
        clientSecret,
        baseUrl,
        scopes: ["read:user", "user:email"],
        ...(options.tokenStorage && { tokenStorage: options.tokenStorage }),
        ...(options.encryptionKey !== undefined && { encryptionKey: options.encryptionKey }),
      });

    default:
      throw new Error(
        `Unknown auth provider: ${provider as string}. Supported: google, github`
      );
  }
}

/**
 * Read OAuth credentials from environment variables for the given provider.
 * Throws if required env vars are missing.
 */
export function getAuthCredentialsFromEnv(provider: AuthProviderType): {
  clientId: string;
  clientSecret: string;
} {
  switch (provider) {
    case "google": {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error(
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required for Google OAuth"
        );
      }
      return { clientId, clientSecret };
    }

    case "github": {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error(
          "GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables are required for GitHub OAuth"
        );
      }
      return { clientId, clientSecret };
    }

    default:
      throw new Error(
        `Unknown auth provider: ${provider as string}. Supported: google, github`
      );
  }
}
