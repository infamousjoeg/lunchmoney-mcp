import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LunchMoneyClient } from "../api/client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import {
  createTagSchema,
  updateTagSchema,
  idSchema,
} from "../schemas/index.js";
import { TagsResponse, Tag } from "../types/index.js";

export function registerTagTools(server: FastMCP, client: LunchMoneyClient) {
  server.addTool({
    name: "getTags",
    description: "List all transaction tags",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await client.get<TagsResponse>("/tags");
        return JSON.stringify(response, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "createTag",
    description: "Create a new tag for categorizing transactions",
    parameters: createTagSchema,
    execute: async (args: z.infer<typeof createTagSchema>) => {
      try {
        const tag = await client.post<{ tag: Tag }>("/tags", args);
        return JSON.stringify(tag, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "updateTag",
    description: "Update an existing tag's name",
    parameters: idSchema.merge(updateTagSchema),
    execute: async (args: z.infer<typeof idSchema> & z.infer<typeof updateTagSchema>) => {
      try {
        const { id, ...updateData } = args;
        const tag = await client.put<{ tag: Tag }>(
          `/tags/${id}`,
          updateData
        );
        return JSON.stringify(tag, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "deleteTag",
    description: "Delete a tag by ID",
    parameters: idSchema,
    execute: async (args: z.infer<typeof idSchema>) => {
      try {
        await client.delete(`/tags/${args.id}`);
        return `Tag ${args.id} deleted successfully`;
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });
}
