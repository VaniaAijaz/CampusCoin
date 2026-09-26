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
  monthlyAllowanceBaseline: z.number().nonnegative().optional(),
  monthlySavingsGoal: z.number().nonnegative().optional(),
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

/* ── Transaction Validation Schemas ── */
const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Type must be either income or expense" }),
  }),
  categoryId: z.string().min(1, "Category ID is required"),
  description: z.string().max(255, "Description cannot exceed 255 characters").optional().default(""),
  date: z.string().or(z.date()).optional(),
  isRecurring: z.boolean().optional(),
});

/* ── Budget Validation Schemas ── */
const budgetSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
  amount: z.coerce.number().positive("Budget cap must be greater than zero"),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month format must be YYYY-MM").optional(),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  transactionSchema,
  budgetSchema,
};
