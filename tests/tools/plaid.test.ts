import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerPlaidTools } from "../../src/tools/plaid.js";
import { LunchMoneyClient } from "../../src/api/client.js";
import { LunchMoneyAPIError } from "../../src/utils/errors.js";
import type { PlaidAccountsResponse } from "../../src/types/index.js";

// Capture registered tools via a fake FastMCP server
interface RegisteredTool {
  name: string;
  description: string;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

function createMockServer() {
  const tools: RegisteredTool[] = [];
  return {
    addTool: (tool: RegisteredTool) => {
      tools.push(tool);
    },
    tools,
  };
}

function createMockClient() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as LunchMoneyClient & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };
}

describe("Plaid tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockClient: ReturnType<typeof createMockClient>;
  let tools: RegisteredTool[];

  beforeEach(() => {
    mockServer = createMockServer();
    mockClient = createMockClient();
    registerPlaidTools(mockServer as never, mockClient);
    tools = mockServer.tools;
  });

  it("registers two tools", () => {
    expect(tools).toHaveLength(2);
    expect(tools.map((t) => t.name)).toEqual([
      "getPlaidAccounts",
      "fetchPlaidAccounts",
    ]);
  });

  describe("getPlaidAccounts", () => {
    it("returns JSON stringified Plaid accounts on success", async () => {
      const mockResponse: PlaidAccountsResponse = {
        plaid_accounts: [
          {
            id: 1,
            date_linked: "2024-01-15",
            name: "Checking Account",
            display_name: "My Checking",
            type: "depository",
            subtype: "checking",
            mask: "1234",
            institution_name: "Chase",
            status: "active",
            balance: "5000.00",
            currency: "usd",
            balance_last_update: "2024-06-01T12:00:00.000Z",
            limit: undefined,
          },
          {
            id: 2,
            date_linked: "2024-02-01",
            name: "Credit Card",
            type: "credit",
            subtype: "credit card",
            mask: "5678",
            institution_name: "Amex",
            status: "active",
            balance: "1500.00",
            currency: "usd",
            balance_last_update: "2024-06-01T12:00:00.000Z",
            limit: 10000,
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "getPlaidAccounts")!;
      const result = await tool.execute({});

      expect(mockClient.get).toHaveBeenCalledWith("/plaid_accounts");
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.get.mockRejectedValue(
        new LunchMoneyAPIError("Unauthorized", 401)
      );

      const tool = tools.find((t) => t.name === "getPlaidAccounts")!;
      const result = await tool.execute({});

      expect(result).toBe(
        "Lunch Money API Error: Unauthorized (Status: 401)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.get.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "getPlaidAccounts")!;
      const result = await tool.execute({});

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.get.mockRejectedValue("something unexpected");

      const tool = tools.find((t) => t.name === "getPlaidAccounts")!;
      const result = await tool.execute({});

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("fetchPlaidAccounts", () => {
    it("returns JSON stringified boolean on success", async () => {
      mockClient.post.mockResolvedValue(true);

      const tool = tools.find((t) => t.name === "fetchPlaidAccounts")!;
      const result = await tool.execute({});

      expect(mockClient.post).toHaveBeenCalledWith("/plaid_accounts/fetch");
      expect(result).toBe(JSON.stringify(true, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.post.mockRejectedValue(
        new LunchMoneyAPIError("Rate limited", 429)
      );

      const tool = tools.find((t) => t.name === "fetchPlaidAccounts")!;
      const result = await tool.execute({});

      expect(result).toBe(
        "Lunch Money API Error: Rate limited (Status: 429)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.post.mockRejectedValue(new Error("Connection timeout"));

      const tool = tools.find((t) => t.name === "fetchPlaidAccounts")!;
      const result = await tool.execute({});

      expect(result).toBe("Error: Connection timeout");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.post.mockRejectedValue(42);

      const tool = tools.find((t) => t.name === "fetchPlaidAccounts")!;
      const result = await tool.execute({});

      expect(result).toBe("An unknown error occurred");
    });
  });
});
