export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            accounts: {
                Row: {
                    balance: number | null
                    category: string
                    color: string | null
                    created_at: string
                    currency: string
                    hide_from_total: boolean | null
                    icon: string | null
                    id: string
                    institution: string | null
                    is_main: boolean | null
                    min_balance_limit: number | null
                    name: string
                    status: string | null
                    type: string
                    user_id: string
                    iban: string | null
                    account_number: string | null
                    mc_express_phone: string | null
                    mc_express_limit: number | null
                    mc_express_coords: string | null
                }
                Insert: {
                    balance?: number | null
                    category: string
                    color?: string | null
                    created_at?: string
                    currency?: string
                    hide_from_total?: boolean | null
                    icon?: string | null
                    id?: string
                    institution?: string | null
                    is_main?: boolean | null
                    min_balance_limit?: number | null
                    name: string
                    status?: string | null
                    type: string
                    user_id: string
                    iban?: string | null
                    account_number?: string | null
                    mc_express_phone?: string | null
                    mc_express_limit?: number | null
                    mc_express_coords?: string | null
                }
                Update: {
                    balance?: number | null
                    category?: string
                    color?: string | null
                    created_at?: string
                    currency?: string
                    hide_from_total?: boolean | null
                    icon?: string | null
                    id?: string
                    institution?: string | null
                    is_main?: boolean | null
                    min_balance_limit?: number | null
                    name?: string
                    status?: string | null
                    type?: string
                    user_id?: string
                    iban?: string | null
                    account_number?: string | null
                    mc_express_phone?: string | null
                    mc_express_limit?: number | null
                    mc_express_coords?: string | null
                }
                Relationships: []
            }
            budgets: {
                Row: {
                    account_id: string | null
                    amount: number
                    auto_renew: boolean | null
                    category: string | null
                    created_at: string
                    currency: string
                    end_date: string | null
                    id: string
                    name: string
                    notify_at: number[] | null
                    period: string | null
                    start_date: string
                    status: string | null
                    type: string | null
                    user_id: string
                }
                Insert: {
                    account_id?: string | null
                    amount: number
                    auto_renew?: boolean | null
                    category?: string | null
                    created_at?: string
                    currency?: string
                    end_date?: string | null
                    id?: string
                    name: string
                    notify_at?: number[] | null
                    period?: string | null
                    start_date?: string
                    status?: string | null
                    type?: string | null
                    user_id: string
                }
                Update: {
                    account_id?: string | null
                    amount?: number
                    auto_renew?: boolean | null
                    category?: string | null
                    created_at?: string
                    currency?: string
                    end_date?: string | null
                    id?: string
                    name?: string
                    notify_at?: number[] | null
                    period?: string | null
                    start_date?: string
                    status?: string | null
                    type?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "budgets_account_id_fkey"
                        columns: ["account_id"]
                        isOneToOne: false
                        referencedRelation: "accounts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            categories: {
                Row: {
                    color: string | null
                    created_at: string
                    icon: string | null
                    id: string
                    name: string
                    type: string
                    user_id: string | null
                }
                Insert: {
                    color?: string | null
                    created_at?: string
                    icon?: string | null
                    id?: string
                    name: string
                    type: string
                    user_id?: string | null
                }
                Update: {
                    color?: string | null
                    created_at?: string
                    icon?: string | null
                    id?: string
                    name?: string
                    type?: string
                    user_id?: string | null
                }
                Relationships: []
            }
            exchange_rates: {
                Row: {
                    from_currency: string
                    id: string
                    rate: number
                    to_currency: string
                    updated_at: string
                }
                Insert: {
                    from_currency: string
                    id?: string
                    rate: number
                    to_currency: string
                    updated_at?: string
                }
                Update: {
                    from_currency?: string
                    id?: string
                    rate?: number
                    to_currency?: string
                    updated_at?: string
                }
                Relationships: []
            }
            goals: {
                Row: {
                    account_id: string | null
                    category: string
                    color: string | null
                    created_at: string
                    currency: string
                    current_amount: number | null
                    deadline: string | null
                    icon: string | null
                    id: string
                    name: string
                    priority: string | null
                    status: string | null
                    target_amount: number
                    type: string | null
                    user_id: string
                }
                Insert: {
                    account_id?: string | null
                    category: string
                    color?: string | null
                    created_at?: string
                    currency?: string
                    current_amount?: number | null
                    deadline?: string | null
                    icon?: string | null
                    id?: string
                    name: string
                    priority?: string | null
                    status?: string | null
                    target_amount: number
                    type?: string | null
                    user_id: string
                }
                Update: {
                    account_id?: string | null
                    category?: string
                    color?: string | null
                    created_at?: string
                    currency?: string
                    current_amount?: number | null
                    deadline?: string | null
                    icon?: string | null
                    id?: string
                    name?: string
                    priority?: string | null
                    status?: string | null
                    target_amount?: number
                    type?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "goals_account_id_fkey"
                        columns: ["account_id"]
                        isOneToOne: false
                        referencedRelation: "accounts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            investments: {
                Row: {
                    account_id: string | null
                    broker: string | null
                    created_at: string
                    currency: string
                    current_value: number
                    fees: number | null
                    goal_id: string | null
                    id: string
                    invested_amount: number
                    name: string
                    purchase_date: string
                    quantity: number | null
                    risk: string | null
                    status: string | null
                    type: string
                    unit_price: number | null
                    user_id: string
                }
                Insert: {
                    account_id?: string | null
                    broker?: string | null
                    created_at?: string
                    currency?: string
                    current_value: number
                    fees?: number | null
                    goal_id?: string | null
                    id?: string
                    invested_amount: number
                    name: string
                    purchase_date?: string
                    quantity?: number | null
                    risk?: string | null
                    status?: string | null
                    type: string
                    unit_price?: number | null
                    user_id: string
                }
                Update: {
                    account_id?: string | null
                    broker?: string | null
                    created_at?: string
                    currency?: string
                    current_value?: number
                    fees?: number | null
                    goal_id?: string | null
                    id?: string
                    invested_amount?: number
                    name?: string
                    purchase_date?: string
                    quantity?: number | null
                    risk?: string | null
                    status?: string | null
                    type?: string
                    unit_price?: number | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "investments_account_id_fkey"
                        columns: ["account_id"]
                        isOneToOne: false
                        referencedRelation: "accounts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "investments_goal_id_fkey"
                        columns: ["goal_id"]
                        isOneToOne: false
                        referencedRelation: "goals"
                        referencedColumns: ["id"]
                    },
                ]
            }
            loan_payments: {
                Row: {
                    amount: number
                    created_at: string
                    date: string
                    id: string
                    loan_id: string
                    note: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string
                    date?: string
                    id?: string
                    loan_id: string
                    note?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string
                    date?: string
                    id?: string
                    loan_id?: string
                    note?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "loan_payments_loan_id_fkey"
                        columns: ["loan_id"]
                        isOneToOne: false
                        referencedRelation: "loans"
                        referencedColumns: ["id"]
                    },
                ]
            }
            loans: {
                Row: {
                    account_id: string | null
                    category: string
                    counterparty: string
                    created_at: string
                    currency: string
                    current_balance: number
                    description: string | null
                    due_date: string | null
                    frequency: string | null
                    id: string
                    institution: string | null
                    interest_rate: number | null
                    interest_type: string | null
                    principal_amount: number
                    start_date: string
                    status: string | null
                    type: string
                    user_id: string
                }
                Insert: {
                    account_id?: string | null
                    category: string
                    counterparty: string
                    created_at?: string
                    currency?: string
                    current_balance: number
                    description?: string | null
                    due_date?: string | null
                    frequency?: string | null
                    id?: string
                    institution?: string | null
                    interest_rate?: number | null
                    interest_type?: string | null
                    principal_amount: number
                    start_date?: string
                    status?: string | null
                    type: string
                    user_id: string
                }
                Update: {
                    account_id?: string | null
                    category?: string
                    counterparty?: string
                    created_at?: string
                    currency?: string
                    current_balance?: number
                    description?: string | null
                    due_date?: string | null
                    frequency?: string | null
                    id?: string
                    institution?: string | null
                    interest_rate?: number | null
                    interest_type?: string | null
                    principal_amount?: number
                    start_date?: string
                    status?: string | null
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "loans_account_id_fkey"
                        columns: ["account_id"]
                        isOneToOne: false
                        referencedRelation: "accounts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    full_name: string | null
                    id: string
                    updated_at: string
                }
                Insert: {
                    avatar_url?: string | null
                    full_name?: string | null
                    id: string
                    updated_at?: string
                }
                Update: {
                    avatar_url?: string | null
                    full_name?: string | null
                    id?: string
                    updated_at?: string
                }
                Relationships: []
            }
            savings: {
                Row: {
                    amount: number
                    created_at: string | null
                    currency: string
                    description: string | null
                    id: string
                    interest_rate: number | null
                    name: string
                    start_date: string | null
                    target_amount: number | null
                    user_id: string
                }
                Insert: {
                    amount?: number
                    created_at?: string | null
                    currency?: string
                    description?: string | null
                    id?: string
                    interest_rate?: number | null
                    name: string
                    start_date?: string | null
                    target_amount?: number | null
                    user_id: string
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    currency?: string
                    description?: string | null
                    id?: string
                    interest_rate?: number | null
                    name?: string
                    start_date?: string | null
                    target_amount?: number | null
                    user_id?: string
                }
                Relationships: []
            }
            subscriptions: {
                Row: {
                    account_id: string | null
                    amount: number
                    auto_renew: boolean | null
                    category: string
                    color: string | null
                    created_at: string
                    currency: string
                    cycle: string | null
                    icon: string | null
                    id: string
                    name: string
                    next_billing_date: string
                    notes: string | null
                    reminder_days: number | null
                    start_date: string
                    status: string | null
                    user_id: string
                }
                Insert: {
                    account_id?: string | null
                    amount: number
                    auto_renew?: boolean | null
                    category: string
                    color?: string | null
                    created_at?: string
                    currency?: string
                    cycle?: string | null
                    icon?: string | null
                    id?: string
                    name: string
                    next_billing_date: string
                    notes?: string | null
                    reminder_days?: number | null
                    start_date?: string
                    status?: string | null
                    user_id: string
                }
                Update: {
                    account_id?: string | null
                    amount?: number
                    auto_renew?: boolean | null
                    category?: string
                    color?: string | null
                    created_at?: string
                    currency?: string
                    cycle?: string | null
                    icon?: string | null
                    id?: string
                    name?: string
                    next_billing_date?: string
                    notes?: string | null
                    reminder_days?: number | null
                    start_date?: string
                    status?: string | null
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_account_id_fkey"
                        columns: ["account_id"]
                        isOneToOne: false
                        referencedRelation: "accounts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            transactions: {
                Row: {
                    account_id: string
                    amount: number
                    category: string
                    created_at: string
                    currency: string
                    date: string
                    description: string | null
                    destination_account_id: string | null
                    id: string
                    status: string | null
                    type: string
                    user_id: string
                }
                Insert: {
                    account_id: string
                    amount: number
                    category: string
                    created_at?: string
                    currency?: string
                    date?: string
                    description?: string | null
                    destination_account_id?: string | null
                    id?: string
                    status?: string | null
                    type: string
                    user_id: string
                }
                Update: {
                    account_id?: string
                    amount?: number
                    category?: string
                    created_at?: string
                    currency?: string
                    date?: string
                    description?: string | null
                    destination_account_id?: string | null
                    id?: string
                    status?: string | null
                    type?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_account_id_fkey"
                        columns: ["account_id"]
                        isOneToOne: false
                        referencedRelation: "accounts"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_destination_account_id_fkey"
                        columns: ["destination_account_id"]
                        isOneToOne: false
                        referencedRelation: "accounts"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_preferences: {
                Row: {
                    base_currency: string
                    date_format: string
                    language: string
                    notifications: Json
                    security: Json
                    theme: string
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    base_currency?: string
                    date_format?: string
                    language?: string
                    notifications?: Json
                    security?: Json
                    theme?: string
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    base_currency?: string
                    date_format?: string
                    language?: string
                    notifications?: Json
                    security?: Json
                    theme?: string
                    updated_at?: string
                    user_id?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            update_account_balance: {
                Args: { acc_id: string; amount_change: number }
                Returns: undefined
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
