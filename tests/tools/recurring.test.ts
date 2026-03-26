import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerRecurringTools } from "../../src/tools/recurring.js";
import { LunchMoneyClient } from "../../src/api/client.js";
import { LunchMoneyAPIError } from "../../src/utils/errors.js";
import type {
  RecurringItemsResponse,
  RecurringItem,
} from "../../src/types/index.js";

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
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
}

describe("Recurring tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockClient: ReturnType<typeof createMockClient>;
  let tools: RegisteredTool[];

  beforeEach(() => {
    mockServer = createMockServer();
    mockClient = createMockClient();
    registerRecurringTools(mockServer as never, mockClient);
    tools = mockServer.tools;
  });

  it("registers four tools", () => {
    expect(tools).toHaveLength(4);
    expect(tools.map((t) => t.name)).toEqual([
      "getRecurringItems",
      "createRecurringItem",
      "updateRecurringItem",
      "deleteRecurringItem",
    ]);
  });

  describe("getRecurringItems", () => {
    it("returns JSON stringified recurring items on success", async () => {
      const mockResponse: RecurringItemsResponse = {
        recurring_items: [
          {
            id: 1,
            payee: "Netflix",
            amount: "15.99",
            currency: "usd",
            frequency: "monthly",
            flow: "outflow",
            start_date: "2024-01-01",
          },
          {
            id: 2,
            payee: "Salary",
            amount: "5000.00",
            currency: "usd",
            frequency: "monthly",
            flow: "inflow",
            start_date: "2024-01-15",
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "getRecurringItems")!;
      const result = await tool.execute({});

      expect(mockClient.get).toHaveBeenCalledWith("/recurring_expenses");
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.get.mockRejectedValue(
        new LunchMoneyAPIError("Unauthorized", 401)
      );

      const tool = tools.find((t) => t.name === "getRecurringItems")!;
      const result = await tool.execute({});

      expect(result).toBe(
        "Lunch Money API Error: Unauthorized (Status: 401)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.get.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "getRecurringItems")!;
      const result = await tool.execute({});

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.get.mockRejectedValue("something unexpected");

      const tool = tools.find((t) => t.name === "getRecurringItems")!;
      const result = await tool.execute({});

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("createRecurringItem", () => {
    it("returns JSON stringified recurring item on success", async () => {
      const mockResponse: { recurring_expense: RecurringItem } = {
        recurring_expense: {
          id: 3,
          payee: "Gym",
          amount: "50.00",
          currency: "usd",
          frequency: "monthly",
          flow: "outflow",
          start_date: "2024-03-01",
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "createRecurringItem")!;
      const args = { payee: "Gym", amount: "50.00", frequency: "monthly", flow: "outflow", start_date: "2024-03-01" };
      const result = await tool.execute(args);

      expect(mockClient.post).toHaveBeenCalledWith("/recurring_expenses", args);
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.post.mockRejectedValue(
        new LunchMoneyAPIError("Bad Request", 400)
      );

      const tool = tools.find((t) => t.name === "createRecurringItem")!;
      const result = await tool.execute({ amount: "50.00" });

      expect(result).toBe(
        "Lunch Money API Error: Bad Request (Status: 400)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.post.mockRejectedValue(new Error("Connection timeout"));

      const tool = tools.find((t) => t.name === "createRecurringItem")!;
      const result = await tool.execute({ amount: "50.00" });

      expect(result).toBe("Error: Connection timeout");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.post.mockRejectedValue(42);

      const tool = tools.find((t) => t.name === "createRecurringItem")!;
      const result = await tool.execute({ amount: "50.00" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("updateRecurringItem", () => {
    it("returns JSON stringified updated recurring item on success", async () => {
      const mockResponse: { recurring_expense: RecurringItem } = {
        recurring_expense: {
          id: 1,
          payee: "Netflix Premium",
          amount: "22.99",
          currency: "usd",
          frequency: "monthly",
          flow: "outflow",
        },
      };

      mockClient.put.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "updateRecurringItem")!;
      const result = await tool.execute({ id: 1, payee: "Netflix Premium", amount: "22.99" });

      expect(mockClient.put).toHaveBeenCalledWith("/recurring_expenses/1", {
        payee: "Netflix Premium",
        amount: "22.99",
      });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.put.mockRejectedValue(
        new LunchMoneyAPIError("Not Found", 404)
      );

      const tool = tools.find((t) => t.name === "updateRecurringItem")!;
      const result = await tool.execute({ id: 999, amount: "22.99" });

      expect(result).toBe(
        "Lunch Money API Error: Not Found (Status: 404)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.put.mockRejectedValue(new Error("Server error"));

      const tool = tools.find((t) => t.name === "updateRecurringItem")!;
      const result = await tool.execute({ id: 1, amount: "22.99" });

      expect(result).toBe("Error: Server error");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.put.mockRejectedValue(undefined);

      const tool = tools.find((t) => t.name === "updateRecurringItem")!;
      const result = await tool.execute({ id: 1, amount: "22.99" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("deleteRecurringItem", () => {
    it("returns success message on delete", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const tool = tools.find((t) => t.name === "deleteRecurringItem")!;
      const result = await tool.execute({ id: 3 });

      expect(mockClient.delete).toHaveBeenCalledWith("/recurring_expenses/3");
      expect(result).toBe("Recurring item 3 deleted successfully");
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.delete.mockRejectedValue(
        new LunchMoneyAPIError("Forbidden", 403)
      );

      const tool = tools.find((t) => t.name === "deleteRecurringItem")!;
      const result = await tool.execute({ id: 3 });

      expect(result).toBe(
        "Lunch Money API Error: Forbidden (Status: 403)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.delete.mockRejectedValue(new Error("Network issue"));

      const tool = tools.find((t) => t.name === "deleteRecurringItem")!;
      const result = await tool.execute({ id: 3 });

      expect(result).toBe("Error: Network issue");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.delete.mockRejectedValue(null);

      const tool = tools.find((t) => t.name === "deleteRecurringItem")!;
      const result = await tool.execute({ id: 3 });

      expect(result).toBe("An unknown error occurred");
    });
  });
});
