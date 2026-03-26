import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LunchMoneyClient } from "../api/client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import {
  createRecurringItemSchema,
  updateRecurringItemSchema,
  idSchema,
} from "../schemas/index.js";
import { RecurringItemsResponse, RecurringItem } from "../types/index.js";

export function registerRecurringTools(
  server: FastMCP,
  client: LunchMoneyClient
) {
  server.addTool({
    name: "getRecurringItems",
    description: "List all recurring expense and income items",
    parameters: z.object({}),
    execute: async () => {
      try {
        const response = await client.get<RecurringItemsResponse>(
          "/recurring_expenses"
        );
        return JSON.stringify(response, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "createRecurringItem",
    description: "Create a new recurring expense or income item",
    parameters: createRecurringItemSchema,
    execute: async (args: z.infer<typeof createRecurringItemSchema>) => {
      try {
        const item = await client.post<{ recurring_expense: RecurringItem }>(
          "/recurring_expenses",
          args
        );
        return JSON.stringify(item, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "updateRecurringItem",
    description: "Update an existing recurring item's properties",
    parameters: idSchema.merge(updateRecurringItemSchema),
    execute: async (args: z.infer<typeof idSchema> & z.infer<typeof updateRecurringItemSchema>) => {
      try {
        const { id, ...updateData } = args;
        const item = await client.put<{ recurring_expense: RecurringItem }>(
          `/recurring_expenses/${id}`,
          updateData
        );
        return JSON.stringify(item, null, 2);
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });

  server.addTool({
    name: "deleteRecurringItem",
    description: "Delete a recurring item by ID",
    parameters: idSchema,
    execute: async (args: z.infer<typeof idSchema>) => {
      try {
        await client.delete(`/recurring_expenses/${args.id}`);
        return `Recurring item ${args.id} deleted successfully`;
      } catch (error) {
        return formatErrorForMCP(error);
      }
    },
  });
}
