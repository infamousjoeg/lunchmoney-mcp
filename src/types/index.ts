// User types
export interface User {
    id: number;
    email: string;
    name: string;
    currency: string;
    budget_display_order?: number[];
    date_format?: string;
    first_day_of_week?: number;
    beta_user?: boolean;
    created_at?: string;
}

// Category types
export interface Category {
    id: number;
    name: string;
    description?: string;
    is_income?: boolean;
    exclude_budget?: boolean;
    exclude_from_totals?: boolean;
    archived?: boolean;
    category_group_id?: number;
    category_group_name?: string;
    parent_category_id?: number;
    parent_category_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CategoryGroup {
    id: number;
    name: string;
    created_at?: string;
}

// Tag types
export interface Tag {
    id: number;
    name: string;
    created_at?: string;
}

// Transaction types
export interface Transaction {
    id: number;
    date: string;
    payee?: string;
    amount: string;
    currency: string;
    notes?: string;
    category_id?: number;
    category_name?: string;
    parent_category_id?: number;
    parent_category_name?: string;
    account_id: number;
    account_name?: string;
    tags?: Tag[];
    status?: "cleared" | "uncleared" | "recurring" | "recurring_suggested";
    is_group?: boolean;
    group_id?: number;
    external_id?: string;
    original_name?: string;
    type?: "expense" | "income" | "transfer";
    subtransactions?: Transaction[];
    plaid_account_id?: number;
    created_at?: string;
    updated_at?: string;
}

export interface TransactionFilter {
    start_date?: string;
    end_date?: string;
    category_id?: number;
    tag_id?: number;
    account_id?: number;
    debit_as_negative?: boolean;
    pending?: boolean;
    status?: "cleared" | "uncleared" | "recurring" | "recurring_suggested";
    offset?: number;
    limit?: number;
}

// Recurring types
export interface RecurringItem {
    id: number;
    payee?: string;
    amount: string;
    currency: string;
    category_id?: number;
    category_name?: string;
    notes?: string;
    account_id?: number;
    account_name?: string;
    tag_id?: number;
    tag_name?: string;
    frequency?: string;
    flow?: "inflow" | "outflow";
    start_date?: string;
    end_date?: string;
    created_at?: string;
    updated_at?: string;
}

// Budget types
export interface Budget {
    id: number;
    category_id?: number;
    category_name?: string;
    amount: string;
    currency: string;
    start_date: string;
    end_date: string;
    created_at?: string;
    updated_at?: string;
}

// Asset types
export interface Asset {
    id: number;
    type_name: string;
    type_name_override?: string;
    name: string;
    balance: string;
    balance_as_of?: string;
    currency: string;
    institution_name?: string;
    created_at?: string;
    updated_at?: string;
}

// API Response types
export interface APIResponse<T> {
    [key: string]: T | unknown;
}

export interface CategoriesResponse {
    categories: Category[];
    category_groups?: CategoryGroup[];
}

export interface TransactionsResponse {
    transactions: Transaction[];
}

export interface TagsResponse {
    tags: Tag[];
}

export interface RecurringItemsResponse {
    recurring_items: RecurringItem[];
}

export interface BudgetsResponse {
    budgets: Budget[];
}

export interface AssetsResponse {
    assets: Asset[];
}

// Plaid account types
export interface PlaidAccount {
    id: number;
    date_linked: string;
    name: string;
    display_name?: string;
    type: string;
    subtype: string;
    mask: string;
    institution_name: string;
    status: string;
    balance: string;
    currency: string;
    balance_last_update: string;
    limit?: number;
    plaid_item_id?: number;
    linked_by_name?: string;
    allow_transaction_modifications?: boolean;
    to_base?: number;
    import_start_date?: string;
    last_import?: string;
    last_fetch?: string;
    plaid_last_successful_update?: string;
}

export interface PlaidAccountsResponse {
    plaid_accounts: PlaidAccount[];
}
