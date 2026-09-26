/**
 * Campus Coin - Strict Type Safety & Domain Interfaces
 * Strictly typed definitions for financial entities, error responses, and state models.
 * Zero "any" types permitted in core financial calculation and authentication paths.
 */

export type UserRole = "student" | "admin";
export type TransactionType = "income" | "expense";
export type SystemTheme = "light" | "dark";
export type FontSize = "small" | "medium" | "large";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  academicYear?: string;
  monthlyAllowanceBaseline?: number;
  monthlySavingsGoal?: number;
  currency?: string;
  theme?: SystemTheme;
  fontSize?: FontSize;
  isActive: boolean;
  lastLogin?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Category {
  _id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: string;
}

export interface Transaction {
  _id: string;
  userId: string;
  categoryId: Category | string;
  amount: number;
  type: TransactionType;
  description: string;
  date: string | Date;
  isRecurring?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Budget {
  _id: string;
  userId: string;
  categoryId: Category | string;
  limitAmount: number;
  spentAmount: number;
  month: string; // YYYY-MM
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Subscription {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  billing_cycle: "monthly" | "yearly";
  next_due_date: string | Date;
  category: string;
  isActive: boolean;
}

export interface CashFlowTrend {
  month: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardMetrics {
  currentMonth: {
    income: number;
    expense: number;
    savings: number;
    burnRateDaily: number;
  };
  trends: CashFlowTrend[];
}

/**
 * Standardized API Error Response Contract
 * Guarantees zero leak of backend stack traces or database internal errors to clients.
 */
export interface APIError {
  success: false;
  errorCode: string;
  message: string;
  statusCode?: number;
}

export interface APISuccess<T = unknown> {
  success: true;
  message?: string;
  token?: string;
  user?: User;
  data?: T;
}

export type APIResponse<T = unknown> = APISuccess<T> | APIError;
