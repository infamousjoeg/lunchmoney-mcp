import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerBudgetTools } from "../../src/tools/budgets.js";
import { LunchMoneyClient } from "../../src/api/client.js";
import { LunchMoneyAPIError } from "../../src/utils/errors.js";
import type { BudgetsResponse, Budget } from "../../src/types/index.js";

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

describe("Budget tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockClient: ReturnType<typeof createMockClient>;
  let tools: RegisteredTool[];

  beforeEach(() => {
    mockServer = createMockServer();
    mockClient = createMockClient();
    registerBudgetTools(mockServer as never, mockClient);
    tools = mockServer.tools;
  });

  it("registers four tools", () => {
    expect(tools).toHaveLength(4);
    expect(tools.map((t) => t.name)).toEqual([
      "getBudgets",
      "createBudget",
      "updateBudget",
      "deleteBudget",
    ]);
  });

  describe("getBudgets", () => {
    it("returns JSON stringified budgets on success", async () => {
      const mockResponse: BudgetsResponse = {
        budgets: [
          {
            id: 1,
            category_id: 10,
            category_name: "Groceries",
            amount: "500.00",
            currency: "usd",
            start_date: "2024-01-01",
            end_date: "2024-01-31",
          },
          {
            id: 2,
            category_id: 20,
            category_name: "Entertainment",
            amount: "200.00",
            currency: "usd",
            start_date: "2024-01-01",
            end_date: "2024-01-31",
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "getBudgets")!;
      const result = await tool.execute({});

      expect(mockClient.get).toHaveBeenCalledWith("/budgets");
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.get.mockRejectedValue(
        new LunchMoneyAPIError("Unauthorized", 401)
      );

      const tool = tools.find((t) => t.name === "getBudgets")!;
      const result = await tool.execute({});

      expect(result).toBe(
        "Lunch Money API Error: Unauthorized (Status: 401)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.get.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "getBudgets")!;
      const result = await tool.execute({});

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.get.mockRejectedValue("something unexpected");

      const tool = tools.find((t) => t.name === "getBudgets")!;
      const result = await tool.execute({});

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("createBudget", () => {
    it("returns JSON stringified budget on success", async () => {
      const mockResponse: { budget: Budget } = {
        budget: {
          id: 3,
          category_id: 30,
          category_name: "Transport",
          amount: "150.00",
          currency: "usd",
          start_date: "2024-02-01",
          end_date: "2024-02-29",
        },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "createBudget")!;
      const args = {
        category_id: 30,
        amount: "150.00",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
      };
      const result = await tool.execute(args);

      expect(mockClient.post).toHaveBeenCalledWith("/budgets", args);
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.post.mockRejectedValue(
        new LunchMoneyAPIError("Bad Request", 400)
      );

      const tool = tools.find((t) => t.name === "createBudget")!;
      const result = await tool.execute({
        amount: "150.00",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
      });

      expect(result).toBe(
        "Lunch Money API Error: Bad Request (Status: 400)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.post.mockRejectedValue(new Error("Connection timeout"));

      const tool = tools.find((t) => t.name === "createBudget")!;
      const result = await tool.execute({
        amount: "150.00",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
      });

      expect(result).toBe("Error: Connection timeout");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.post.mockRejectedValue(42);

      const tool = tools.find((t) => t.name === "createBudget")!;
      const result = await tool.execute({
        amount: "150.00",
        start_date: "2024-02-01",
        end_date: "2024-02-29",
      });

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("updateBudget", () => {
    it("returns JSON stringified updated budget on success", async () => {
      const mockResponse: { budget: Budget } = {
        budget: {
          id: 1,
          category_id: 10,
          category_name: "Groceries",
          amount: "600.00",
          currency: "usd",
          start_date: "2024-01-01",
          end_date: "2024-01-31",
        },
      };

      mockClient.put.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "updateBudget")!;
      const result = await tool.execute({ id: 1, amount: "600.00" });

      expect(mockClient.put).toHaveBeenCalledWith("/budgets/1", {
        amount: "600.00",
      });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.put.mockRejectedValue(
        new LunchMoneyAPIError("Not Found", 404)
      );

      const tool = tools.find((t) => t.name === "updateBudget")!;
      const result = await tool.execute({ id: 999, amount: "600.00" });

      expect(result).toBe(
        "Lunch Money API Error: Not Found (Status: 404)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.put.mockRejectedValue(new Error("Server error"));

      const tool = tools.find((t) => t.name === "updateBudget")!;
      const result = await tool.execute({ id: 1, amount: "600.00" });

      expect(result).toBe("Error: Server error");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.put.mockRejectedValue(undefined);

      const tool = tools.find((t) => t.name === "updateBudget")!;
      const result = await tool.execute({ id: 1, amount: "600.00" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("deleteBudget", () => {
    it("returns success message on delete", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const tool = tools.find((t) => t.name === "deleteBudget")!;
      const result = await tool.execute({ id: 2 });

      expect(mockClient.delete).toHaveBeenCalledWith("/budgets/2");
      expect(result).toBe("Budget 2 deleted successfully");
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.delete.mockRejectedValue(
        new LunchMoneyAPIError("Forbidden", 403)
      );

      const tool = tools.find((t) => t.name === "deleteBudget")!;
      const result = await tool.execute({ id: 2 });

      expect(result).toBe(
        "Lunch Money API Error: Forbidden (Status: 403)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.delete.mockRejectedValue(new Error("Network issue"));

      const tool = tools.find((t) => t.name === "deleteBudget")!;
      const result = await tool.execute({ id: 2 });

      expect(result).toBe("Error: Network issue");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.delete.mockRejectedValue(null);

      const tool = tools.find((t) => t.name === "deleteBudget")!;
      const result = await tool.execute({ id: 2 });

      expect(result).toBe("An unknown error occurred");
    });
  });
});
