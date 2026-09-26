const { z } = require("zod");
const { AppError } = require("./errors");

/**
 * Higher-order middleware for Zod schema validation
 * @param {z.ZodSchema} schema - Zod schema to validate req.body
 * @param {"body" | "query" | "params"} source - Property to validate
 */
const validate = (schema, source = "body") => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issues = error.issues || error.errors || [];
        const formatted = issues.map((err) => `${err.path.join(".") || "field"}: ${err.message}`).join(", ");
        return next(new AppError(400, "ERR_VALIDATION_001", formatted || "Validation failed for request payload."));
      }
      return next(error);
    }
  };
};

/* ── Auth Validation Schemas ── */
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters").trim(),
  email: z.string().email("Please provide a valid email address").toLowerCase().trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  academicYear: z.string().optional(),
  academic_year: z.string().optional(),
  monthlyAllowanceBaseline: z.number().nonnegative().optional(),
  monthlySavingsGoal: z.number().nonnegative().optional(),
  monthly_savings_goal: z.number().nonnegative().optional(),
  currency: z.enum(["USD", "EUR", "PKR"]).optional(),
  currency_preference: z.enum(["USD", "EUR", "PKR"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

const verifyEmailSchema = z.object({
  token: z.string().optional(),
  otp: z.string().length(6, "Verification code must be 6 digits").optional(),
  email: z.string().email().optional(),
}).refine((data) => data.token || (data.otp && data.email), {
  message: "Either a valid verification token or both email and 6-digit OTP code must be provided.",
});

const resendVerificationSchema = z.object({
  email: z.string().email("Please provide a valid email address").optional(),
});

/* ── Currency Preference Validation Schema ── */
const currencyPreferenceSchema = z.object({
  currency_preference: z.enum(["USD", "EUR", "PKR"]).optional(),
  currency: z.enum(["USD", "EUR", "PKR"]).optional(),
}).refine((data) => data.currency_preference || data.currency, {
  message: "Must provide currency or currency_preference with value 'USD', 'EUR', or 'PKR'.",
});

/* ── Transaction Validation Schemas ── */
const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Type must be either income or expense" }),
  }),
  categoryId: z.string().optional(),
  category_id: z.string().optional(),
  categoryName: z.string().optional(),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().default(""),
  date: z.string().or(z.date()).optional(),
  paymentMethod: z
    .enum(["Cash", "Digital", "Digital Bank"])
    .optional()
    .default("Digital Bank")
    .transform((val) => (val === "Cash" ? "Cash" : "Digital Bank")),
  transactionId: z.string().optional(),
  transaction_id: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringFrequency: z.enum(["daily", "weekly", "monthly", "yearly", null]).nullable().optional(),
  isDeleted: z.boolean().optional(),
  is_deleted: z.boolean().optional(),
}).refine((data) => data.categoryId || data.category_id || data.categoryName, {
  message: "Category ID or name is required",
});

/* ── Budget Validation Schemas ── */
const budgetSchema = z.object({
  categoryId: z.string().optional(),
  category_id: z.string().optional(),
  amount: z.coerce.number().positive("Budget cap must be greater than zero").optional(),
  limitAmount: z.coerce.number().positive("Budget limit must be greater than zero").optional(),
  limit_amount: z.coerce.number().positive("Budget limit must be greater than zero").optional(),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month format must be YYYY-MM").optional(),
}).refine((data) => data.categoryId || data.category_id, {
  message: "Category ID is required",
}).refine((data) => data.amount || data.limitAmount || data.limit_amount, {
  message: "Budget limit amount must be greater than zero",
});

/* ── Khata (IOU / Debt) Validation Schema ── */
const debtSchema = z.object({
  counterparty_name: z.string().min(1, "Counterparty name is required").trim(),
  direction: z.enum(["owed_to_me", "i_owe"], {
    errorMap: () => ({ message: "Direction must be either owed_to_me or i_owe" }),
  }),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  due_date: z.string().or(z.date()).optional().nullable(),
  settlement_status: z.enum(["pending", "settled"]).optional().default("pending"),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  currencyPreferenceSchema,
  transactionSchema,
  budgetSchema,
  debtSchema,
};
