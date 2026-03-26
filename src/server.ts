import "dotenv/config";
import { FastMCP, GoogleProvider, GitHubProvider } from "fastmcp";
import { z } from "zod";
import { LunchMoneyClient } from "./api/client.js";
import { CredentialStore } from "./credential-store.js";
import { registerUserTools } from "./tools/user.js";
import { registerCategoryTools } from "./tools/categories.js";
import { registerTagTools } from "./tools/tags.js";
import { registerTransactionTools } from "./tools/transactions.js";
import { registerRecurringTools } from "./tools/recurring.js";
import { registerBudgetTools } from "./tools/budgets.js";
import { registerAssetTools } from "./tools/assets.js";
import { registerPlaidTools } from "./tools/plaid.js";
import { formatErrorForMCP } from "./utils/errors.js";
import type { User } from "./types/index.js";

/** Union type for supported auth provider instances */
export type AuthProviderInstance = InstanceType<typeof GoogleProvider> | InstanceType<typeof GitHubProvider>;

export interface CreateServerOptions {
  /** OAuth auth provider for HTTP transport mode */
  auth?: AuthProviderInstance;
  /** Enable health endpoint (default: true when using HTTP transport) */
  health?: boolean;
}

export const TOKEN_NOT_CONFIGURED_MSG =
  "Lunch Money API token not configured. Use the configureLunchMoneyToken tool to set your token, or run: npx lunchmoney-mcp setup";

/**
 * Execute logic for the configureLunchMoneyToken tool.
 * Exported for testing.
 */
export async function executeConfigureToken(
  args: { token: string },
  credentialStore: CredentialStore
): Promise<string> {
  try {
    // Validate the token by calling GET /me
    const testClient = new LunchMoneyClient(args.token);
    const user = await testClient.get<User>("/me");

    // Token is valid — store it
    await credentialStore.setApiToken(args.token);

    return `Token validated and stored successfully! Welcome, ${user.name} (${user.email}). Restart the MCP server to use the new token.`;
  } catch (error) {
    if (error instanceof Error && error.message === "Lunch Money API token is required") {
      return "Error: Token cannot be empty.";
    }
    return `Failed to validate token: ${formatErrorForMCP(error)}. Please check your token and try again. Get a token at https://my.lunchmoney.app/developers`;
  }
}

/**
 * Execute logic for the stub getUser tool (when no token is configured).
 * Exported for testing.
 */
export async function executeStubGetUser(): Promise<string> {
  return TOKEN_NOT_CONFIGURED_MSG;
}

export async function createServer(options?: CreateServerOptions): Promise<FastMCP> {
  const credentialStore = new CredentialStore();
  const token = await credentialStore.getApiToken();

  const serverConfig: Record<string, unknown> = {
    name: "Lunch Money MCP",
    version: "0.1.0",
    instructions:
      "This MCP server provides full integration with the Lunch Money API. " +
      "You can manage user accounts, categories, tags, transactions, recurring items, budgets, and assets. " +
      "All operations support full CRUD capabilities with proper validation.",
  };

  // Add auth provider if specified (for HTTP transport with OAuth)
  if (options?.auth) {
    serverConfig.auth = options.auth;
  }

  // Enable health endpoint (useful for HTTP transport)
  if (options?.health !== false) {
    serverConfig.health = { enabled: true };
  }

  const server = new FastMCP(serverConfig as ConstructorParameters<typeof FastMCP>[0]);

  // Register the configureLunchMoneyToken tool — works without a token
  server.addTool({
    name: "configureLunchMoneyToken",
    description:
      "Configure your Lunch Money API token. Validates the token by checking your account, then stores it securely in the system keychain.",
    parameters: z.object({
      token: z.string().min(1, "API token is required"),
    }),
    execute: async (args) => executeConfigureToken(args, credentialStore),
  });

  // Only register API tools if we have a token
  if (token) {
    const client = new LunchMoneyClient(token);
    registerUserTools(server, client);
    registerCategoryTools(server, client);
    registerTagTools(server, client);
    registerTransactionTools(server, client);
    registerRecurringTools(server, client);
    registerBudgetTools(server, client);
    registerAssetTools(server, client);
    registerPlaidTools(server, client);
  } else {
    // Register a stub getUser tool that tells the user to configure their token
    server.addTool({
      name: "getUser",
      description: "Get the current user's account details (requires API token to be configured)",
      parameters: z.object({}),
      execute: executeStubGetUser,
    });
  }

  return server;
}

export interface StartServerOptions {
  transportType: "stdio" | "httpStream";
  port?: number;
  authProvider?: string; // name of the auth provider for logging
}

export async function startServer(
  server: FastMCP,
  transportType: "stdio" | "httpStream",
  port?: number,
  authProvider?: string
): Promise<void> {
  if (transportType === "httpStream") {
    const effectivePort = port || 8080;
    server.start({
      transportType: "httpStream",
      httpStream: {
        port: effectivePort,
      },
    });
    console.log(`Lunch Money MCP server started on port ${effectivePort} (HTTP)`);
    if (authProvider) {
      console.log(`OAuth provider: ${authProvider}`);
    }
    console.log(`Health check: http://localhost:${effectivePort}/health`);
  } else {
    server.start({
      transportType: "stdio",
    });
    // Don't log to stdout in stdio mode — it would interfere with the protocol
  }
}
