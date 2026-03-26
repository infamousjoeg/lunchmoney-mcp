import * as readline from "readline";
import { LunchMoneyClient } from "./api/client.js";
import { CredentialStore } from "./credential-store.js";
import type { User } from "./types/index.js";

export interface ReadlineInterface {
  question(query: string, callback: (answer: string) => void): void;
  close(): void;
}

export function createReadlineInterface(): ReadlineInterface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askQuestion(rl: ReadlineInterface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

export async function validateToken(token: string): Promise<User> {
  const client = new LunchMoneyClient(token);
  return client.get<User>("/me");
}

export async function runSetupWizard(
  rlFactory?: () => ReadlineInterface,
  credentialStore?: CredentialStore,
  log?: (msg: string) => void
): Promise<void> {
  const print = log || console.log;
  const store = credentialStore || new CredentialStore();
  const rl = rlFactory ? rlFactory() : createReadlineInterface();

  try {
    print("");
    print("=== Lunch Money MCP Server Setup ===");
    print("");
    print("This wizard will help you configure your Lunch Money API token.");
    print("You can get a token at: https://my.lunchmoney.app/developers");
    print("");

    const token = await askQuestion(rl, "Enter your Lunch Money API token: ");

    if (!token) {
      print("No token provided. Setup cancelled.");
      return;
    }

    print("");
    print("Validating token...");

    try {
      const user = await validateToken(token);
      await store.setApiToken(token);

      print("");
      print(`Token validated and stored successfully!`);
      print(`  Name: ${user.name}`);
      print(`  Email: ${user.email}`);
      print(`  Currency: ${user.currency}`);
      print("");
      print("You can now start the MCP server:");
      print("  npx lunchmoney-mcp        (stdio mode)");
      print("  npx lunchmoney-mcp --http  (HTTP mode)");
      print("");
    } catch (error) {
      print("");
      if (error instanceof Error) {
        print(`Token validation failed: ${error.message}`);
      } else {
        print("Token validation failed. Please check your token and try again.");
      }
      print("Get a new token at: https://my.lunchmoney.app/developers");
      print("");
    }
  } finally {
    rl.close();
  }
}
