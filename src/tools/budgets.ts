import { FastMCP } from "fastmcp";
import { z } from "zod";
import { LunchMoneyClient } from "../api/client.js";
import { formatErrorForMCP } from "../utils/errors.js";
import {
    createBudgetSchema,
    updateBudgetSchema,
    idSchema,
} from "../schemas/index.js";
import { BudgetsResponse, Budget } from "../types/index.js";

export function registerBudgetTools(
    server: FastMCP,
    client: LunchMoneyClient
) {
    server.addTool({
        name: "getBudgets",
        description: "List all budgets with their category assignments and date ranges",
        parameters: z.object({}),
        execute: async () => {
            try {
                const response = await client.get<BudgetsResponse>("/budgets");
                return JSON.stringify(response, null, 2);
            } catch (error) {
                return formatErrorForMCP(error);
            }
        },
    });

    server.addTool({
        name: "createBudget",
        description: "Create a new budget for a category with amount and date range",
        parameters: createBudgetSchema,
        execute: async (args: z.infer<typeof createBudgetSchema>) => {
            try {
                const budget = await client.post<{ budget: Budget }>(
                    "/budgets",
                    args
                );
                return JSON.stringify(budget, null, 2);
            } catch (error) {
                return formatErrorForMCP(error);
            }
        },
    });

    server.addTool({
        name: "updateBudget",
        description: "Update an existing budget's amount, category, or date range",
        parameters: idSchema.merge(updateBudgetSchema),
        execute: async (args: z.infer<typeof idSchema> & z.infer<typeof updateBudgetSchema>) => {
            try {
                const { id, ...updateData } = args;
                const budget = await client.put<{ budget: Budget }>(
                    `/budgets/${id}`,
                    updateData
                );
                return JSON.stringify(budget, null, 2);
            } catch (error) {
                return formatErrorForMCP(error);
            }
        },
    });

    server.addTool({
        name: "deleteBudget",
        description: "Delete a budget by ID",
        parameters: idSchema,
        execute: async (args: z.infer<typeof idSchema>) => {
            try {
                await client.delete(`/budgets/${args.id}`);
                return `Budget ${args.id} deleted successfully`;
            } catch (error) {
                return formatErrorForMCP(error);
            }
        },
    });
}
