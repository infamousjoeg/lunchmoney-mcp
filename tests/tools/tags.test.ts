import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerTagTools } from "../../src/tools/tags.js";
import { LunchMoneyClient } from "../../src/api/client.js";
import { LunchMoneyAPIError } from "../../src/utils/errors.js";
import type { TagsResponse, Tag } from "../../src/types/index.js";

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

describe("Tag tools", () => {
  let mockServer: ReturnType<typeof createMockServer>;
  let mockClient: ReturnType<typeof createMockClient>;
  let tools: RegisteredTool[];

  beforeEach(() => {
    mockServer = createMockServer();
    mockClient = createMockClient();
    registerTagTools(mockServer as never, mockClient);
    tools = mockServer.tools;
  });

  it("registers four tools", () => {
    expect(tools).toHaveLength(4);
    expect(tools.map((t) => t.name)).toEqual([
      "getTags",
      "createTag",
      "updateTag",
      "deleteTag",
    ]);
  });

  describe("getTags", () => {
    it("returns JSON stringified tags on success", async () => {
      const mockResponse: TagsResponse = {
        tags: [
          { id: 1, name: "groceries", created_at: "2024-01-01T00:00:00.000Z" },
          { id: 2, name: "travel", created_at: "2024-02-01T00:00:00.000Z" },
        ],
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "getTags")!;
      const result = await tool.execute({});

      expect(mockClient.get).toHaveBeenCalledWith("/tags");
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.get.mockRejectedValue(
        new LunchMoneyAPIError("Unauthorized", 401)
      );

      const tool = tools.find((t) => t.name === "getTags")!;
      const result = await tool.execute({});

      expect(result).toBe(
        "Lunch Money API Error: Unauthorized (Status: 401)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.get.mockRejectedValue(new Error("Network failure"));

      const tool = tools.find((t) => t.name === "getTags")!;
      const result = await tool.execute({});

      expect(result).toBe("Error: Network failure");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.get.mockRejectedValue("something unexpected");

      const tool = tools.find((t) => t.name === "getTags")!;
      const result = await tool.execute({});

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("createTag", () => {
    it("returns JSON stringified tag on success", async () => {
      const mockResponse: { tag: Tag } = {
        tag: { id: 3, name: "utilities", created_at: "2024-03-01T00:00:00.000Z" },
      };

      mockClient.post.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "createTag")!;
      const result = await tool.execute({ name: "utilities" });

      expect(mockClient.post).toHaveBeenCalledWith("/tags", { name: "utilities" });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.post.mockRejectedValue(
        new LunchMoneyAPIError("Bad Request", 400)
      );

      const tool = tools.find((t) => t.name === "createTag")!;
      const result = await tool.execute({ name: "utilities" });

      expect(result).toBe(
        "Lunch Money API Error: Bad Request (Status: 400)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.post.mockRejectedValue(new Error("Connection timeout"));

      const tool = tools.find((t) => t.name === "createTag")!;
      const result = await tool.execute({ name: "utilities" });

      expect(result).toBe("Error: Connection timeout");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.post.mockRejectedValue(42);

      const tool = tools.find((t) => t.name === "createTag")!;
      const result = await tool.execute({ name: "utilities" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("updateTag", () => {
    it("returns JSON stringified updated tag on success", async () => {
      const mockResponse: { tag: Tag } = {
        tag: { id: 1, name: "food", created_at: "2024-01-01T00:00:00.000Z" },
      };

      mockClient.put.mockResolvedValue(mockResponse);

      const tool = tools.find((t) => t.name === "updateTag")!;
      const result = await tool.execute({ id: 1, name: "food" });

      expect(mockClient.put).toHaveBeenCalledWith("/tags/1", { name: "food" });
      expect(result).toBe(JSON.stringify(mockResponse, null, 2));
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.put.mockRejectedValue(
        new LunchMoneyAPIError("Not Found", 404)
      );

      const tool = tools.find((t) => t.name === "updateTag")!;
      const result = await tool.execute({ id: 999, name: "food" });

      expect(result).toBe(
        "Lunch Money API Error: Not Found (Status: 404)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.put.mockRejectedValue(new Error("Server error"));

      const tool = tools.find((t) => t.name === "updateTag")!;
      const result = await tool.execute({ id: 1, name: "food" });

      expect(result).toBe("Error: Server error");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.put.mockRejectedValue(undefined);

      const tool = tools.find((t) => t.name === "updateTag")!;
      const result = await tool.execute({ id: 1, name: "food" });

      expect(result).toBe("An unknown error occurred");
    });
  });

  describe("deleteTag", () => {
    it("returns success message on delete", async () => {
      mockClient.delete.mockResolvedValue(undefined);

      const tool = tools.find((t) => t.name === "deleteTag")!;
      const result = await tool.execute({ id: 5 });

      expect(mockClient.delete).toHaveBeenCalledWith("/tags/5");
      expect(result).toBe("Tag 5 deleted successfully");
    });

    it("returns formatted error on LunchMoneyAPIError", async () => {
      mockClient.delete.mockRejectedValue(
        new LunchMoneyAPIError("Forbidden", 403)
      );

      const tool = tools.find((t) => t.name === "deleteTag")!;
      const result = await tool.execute({ id: 5 });

      expect(result).toBe(
        "Lunch Money API Error: Forbidden (Status: 403)"
      );
    });

    it("returns formatted error on generic Error", async () => {
      mockClient.delete.mockRejectedValue(new Error("Network issue"));

      const tool = tools.find((t) => t.name === "deleteTag")!;
      const result = await tool.execute({ id: 5 });

      expect(result).toBe("Error: Network issue");
    });

    it("returns unknown error message for non-Error throws", async () => {
      mockClient.delete.mockRejectedValue(null);

      const tool = tools.find((t) => t.name === "deleteTag")!;
      const result = await tool.execute({ id: 5 });

      expect(result).toBe("An unknown error occurred");
    });
  });
});
