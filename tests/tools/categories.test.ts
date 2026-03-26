import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerCategoryTools } from "../../src/tools/categories.js";
import { LunchMoneyClient } from "../../src/api/client.js";
import { LunchMoneyAPIError } from "../../src/utils/errors.js";
import type {
  CategoriesResponse,
  Category,
  CategoryGroup,
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

describe("Category tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockClient: ReturnType<typeof createMockClient>;
  let tools: RegisteredTool[];

  beforeEach(() => {
    mockServer = createMockServer();
    mockClient = createMockClient();
    registerCategoryTools(mockServer as never, mockClient);
    tools = mockServer.tools;
  });

  it("registers seven tools", () => {
    expect(tools).toHaveLength(7);
    expect(tools.map((t) => t.name)).toEqual([
      "getCategories",
      "createCategory",
      "updateCategory",
      "deleteCategory",
      "getCategory",
      "createCategoryGroup",
      "addToGroup",
    ]);
  });

  // ── getCategories ──────────────────────────────────────────────

  describe("getCategories", () => {
    it("returns JSON stringified categories on success", async () => {
      const mockResponse: CategoriesResponse = {
        categories: [
          {
            id: 1,
            name: "Food",
            description: "Groceries and dining",
            is_income: false,
            exclude_budget: false,
            exclude_from_totals: false,
            archived: false,
          },
        ],
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "getCategories")!;
      const result = await tool.execute({});

      expect(mockClient.get).toHaveBeenCalledWith("/categories");
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.get.mockRejectedValue(
        new LunchMoneyAPIError("Unauthorized", 401)
      );

      const tool = tools.find((t) => t.name === "getCategories")!;
      const result = await tool.execute({});

      expect(result).toBe(
        "Lunch Money API Error: Unauthorized (Status: 401)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.get.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "getCategories")!;
      const result = await tool.execute({});

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.get.mockRejectedValue("something unexpected");

      const tool = tools.find((t) => t.name === "getCategories")!;
      const result = await tool.execute({});

      expect(result).toBe("An unknown error occurred");
    });
  });

  // ── getCategory ────────────────────────────────────────────────

  describe("getCategory", () => {
    it("returns JSON stringified category on success", async () => {
      const mockCategory: Category = {
        id: 42,
        name: "Transport",
        description: "Public transit and rideshares",
        is_income: false,
      };

      mockClient.get.mockResolvedValue(mockCategory);

      const tool = tools.find((t) => t.name === "getCategory")!;
      const result = await tool.execute({ id: 42 });

      expect(mockClient.get).toHaveBeenCalledWith("/categories/42");
      expect(result).toBe(JSON.stringify(mockCategory, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.get.mockRejectedValue(
        new LunchMoneyAPIError("Not Found", 404)
      );

      const tool = tools.find((t) => t.name === "getCategory")!;
      const result = await tool.execute({ id: 999 });

      expect(result).toBe("Lunch Money API Error: Not Found (Status: 404)");
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.get.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "getCategory")!;
      const result = await tool.execute({ id: 1 });

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.get.mockRejectedValue(null);

      const tool = tools.find((t) => t.name === "getCategory")!;
      const result = await tool.execute({ id: 1 });

      expect(result).toBe("An unknown error occurred");
    });
  });

  // ── createCategory ─────────────────────────────────────────────

  describe("createCategory", () => {
    it("returns JSON stringified created category on success", async () => {
      const mockResponse = {
        category: { id: 10, name: "Subscriptions" } as Category,
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "createCategory")!;
      const result = await tool.execute({
        name: "Subscriptions",
        is_income: false,
      });

      expect(mockClient.post).toHaveBeenCalledWith("/categories", {
        name: "Subscriptions",
        is_income: false,
      });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.post.mockRejectedValue(
        new LunchMoneyAPIError("Bad Request", 400)
      );

      const tool = tools.find((t) => t.name === "createCategory")!;
      const result = await tool.execute({ name: "Test" });

      expect(result).toBe(
        "Lunch Money API Error: Bad Request (Status: 400)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.post.mockRejectedValue(new Error("Timeout"));

      const tool = tools.find((t) => t.name === "createCategory")!;
      const result = await tool.execute({ name: "Test" });

      expect(result).toBe("Error: Timeout");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.post.mockRejectedValue(undefined);

      const tool = tools.find((t) => t.name === "createCategory")!;
      const result = await tool.execute({ name: "Test" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  // ── updateCategory ─────────────────────────────────────────────

  describe("updateCategory", () => {
    it("returns JSON stringified updated category on success", async () => {
      const mockResponse = {
        category: { id: 5, name: "Dining Out" } as Category,
      };

      mockClient.put.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "updateCategory")!;
      const result = await tool.execute({ id: 5, name: "Dining Out" });

      expect(mockClient.put).toHaveBeenCalledWith("/categories/5", {
        name: "Dining Out",
      });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.put.mockRejectedValue(
        new LunchMoneyAPIError("Not Found", 404)
      );

      const tool = tools.find((t) => t.name === "updateCategory")!;
      const result = await tool.execute({ id: 999, name: "Nope" });

      expect(result).toBe("Lunch Money API Error: Not Found (Status: 404)");
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.put.mockRejectedValue(new Error("Connection reset"));

      const tool = tools.find((t) => t.name === "updateCategory")!;
      const result = await tool.execute({ id: 1, name: "Updated" });

      expect(result).toBe("Error: Connection reset");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.put.mockRejectedValue(42);

      const tool = tools.find((t) => t.name === "updateCategory")!;
      const result = await tool.execute({ id: 1, name: "Updated" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  // ── deleteCategory ─────────────────────────────────────────────

  describe("deleteCategory", () => {
    it("returns success message on success", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const tool = tools.find((t) => t.name === "deleteCategory")!;
      const result = await tool.execute({ id: 7 });

      expect(mockClient.delete).toHaveBeenCalledWith("/categories/7");
      expect(result).toBe("Category 7 deleted successfully");
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.delete.mockRejectedValue(
        new LunchMoneyAPIError("Forbidden", 403)
      );

      const tool = tools.find((t) => t.name === "deleteCategory")!;
      const result = await tool.execute({ id: 1 });

      expect(result).toBe("Lunch Money API Error: Forbidden (Status: 403)");
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.delete.mockRejectedValue(new Error("Server error"));

      const tool = tools.find((t) => t.name === "deleteCategory")!;
      const result = await tool.execute({ id: 1 });

      expect(result).toBe("Error: Server error");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.delete.mockRejectedValue(false);

      const tool = tools.find((t) => t.name === "deleteCategory")!;
      const result = await tool.execute({ id: 1 });

      expect(result).toBe("An unknown error occurred");
    });
  });

  // ── createCategoryGroup ────────────────────────────────────────

  describe("createCategoryGroup", () => {
    it("returns JSON stringified category group on success", async () => {
      const mockResponse = {
        category_group: {
          id: 100,
          name: "Fixed Expenses",
          created_at: "2024-06-01T00:00:00.000Z",
        } as CategoryGroup,
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "createCategoryGroup")!;
      const result = await tool.execute({
        name: "Fixed Expenses",
        category_ids: [1, 2, 3],
      });

      expect(mockClient.post).toHaveBeenCalledWith("/categories/group", {
        name: "Fixed Expenses",
        category_ids: [1, 2, 3],
      });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("works without optional category_ids", async () => {
      const mockResponse = {
        category_group: { id: 101, name: "Variable" } as CategoryGroup,
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "createCategoryGroup")!;
      const result = await tool.execute({ name: "Variable" });

      expect(mockClient.post).toHaveBeenCalledWith("/categories/group", {
        name: "Variable",
      });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.post.mockRejectedValue(
        new LunchMoneyAPIError("Bad Request", 400)
      );

      const tool = tools.find((t) => t.name === "createCategoryGroup")!;
      const result = await tool.execute({ name: "Test Group" });

      expect(result).toBe(
        "Lunch Money API Error: Bad Request (Status: 400)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.post.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "createCategoryGroup")!;
      const result = await tool.execute({ name: "Test Group" });

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.post.mockRejectedValue("bad");

      const tool = tools.find((t) => t.name === "createCategoryGroup")!;
      const result = await tool.execute({ name: "Test Group" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  // ── addToGroup ─────────────────────────────────────────────────

  describe("addToGroup", () => {
    it("returns JSON stringified response on success", async () => {
      const mockResponse = { success: true };

      mockClient.post.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "addToGroup")!;
      const result = await tool.execute({
        group_id: 100,
        category_ids: [4, 5],
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        "/categories/group/100/add",
        { category_ids: [4, 5] }
      );
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.post.mockRejectedValue(
        new LunchMoneyAPIError("Not Found", 404)
      );

      const tool = tools.find((t) => t.name === "addToGroup")!;
      const result = await tool.execute({
        group_id: 999,
        category_ids: [1],
      });

      expect(result).toBe("Lunch Money API Error: Not Found (Status: 404)");
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.post.mockRejectedValue(new Error("Connection refused"));

      const tool = tools.find((t) => t.name === "addToGroup")!;
      const result = await tool.execute({
        group_id: 1,
        category_ids: [2],
      });

      expect(result).toBe("Error: Connection refused");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.post.mockRejectedValue(0);

      const tool = tools.find((t) => t.name === "addToGroup")!;
      const result = await tool.execute({
        group_id: 1,
        category_ids: [2],
      });

      expect(result).toBe("An unknown error occurred");
    });
  });
});
