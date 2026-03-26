import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LunchMoneyClient } from "../api/client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import {
  createCategorySchema,
  updateCategorySchema,
  createCategoryGroupSchema,
  addToGroupSchema,
  idSchema,
} from "../schemas/index.js";
import { CategoriesResponse, Category, CategoryGroup } from "../types/index.js";

export function registerCategoryTools(
  server: FastMCP,
  client: LunchMoneyClient
) {
  server.addTool({
    name: "getCategories",
    description: "List all categories including category groups and parent categories",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await client.get<CategoriesResponse>("/categories");
        return JSON.stringify(response, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "createCategory",
    description: "Create a new spending or income category",
    parameters: createCategorySchema,
    execute: async (args: z.infer<typeof createCategorySchema>) => {
      try {
        const category = await client.post<{ category: Category }>(
          "/categories",
          args
        );
        return JSON.stringify(category, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "updateCategory",
    description: "Update an existing category's properties",
    parameters: idSchema.merge(updateCategorySchema),
    execute: async (args: z.infer<typeof idSchema> & z.infer<typeof updateCategorySchema>) => {
      try {
        const { id, ...updateData } = args;
        const category = await client.put<{ category: Category }>(
          `/categories/${id}`,
          updateData
        );
        return JSON.stringify(category, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "deleteCategory",
    description: "Delete a category by ID",
    parameters: idSchema,
    execute: async (args: z.infer<typeof idSchema>) => {
      try {
        await client.delete(`/categories/${args.id}`);
        return `Category ${args.id} deleted successfully`;
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "getCategory",
    description: "Get a single category by ID",
    parameters: idSchema,
    execute: async (args: z.infer<typeof idSchema>) => {
      try {
        const category = await client.get<Category>(
          `/categories/${args.id}`
        );
        return JSON.stringify(category, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "createCategoryGroup",
    description: "Create a new category group with an optional list of category IDs",
    parameters: createCategoryGroupSchema,
    execute: async (args: z.infer<typeof createCategoryGroupSchema>) => {
      try {
        const response = await client.post<{ category_group: CategoryGroup }>(
          "/categories/group",
          args
        );
        return JSON.stringify(response, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "addToGroup",
    description: "Add existing categories to a category group",
    parameters: addToGroupSchema,
    execute: async (args: z.infer<typeof addToGroupSchema>) => {
      try {
        const response = await client.post(
          `/categories/group/${args.group_id}/add`,
          { category_ids: args.category_ids }
        );
        return JSON.stringify(response, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });
}
