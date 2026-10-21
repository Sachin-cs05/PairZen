import { z } from "zod";

// Password policy: At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
export const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        passwordRegex,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    confirmPassword: z.string(),
    role: z
      .enum(["user", "interviewer"])
      .optional()
      .default("user"), // Prevent clients from passing "admin"
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional().default(false),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  avatarUrl: z
    .string()
    .trim()
    .url("Avatar must be a valid URL")
    .or(z.literal(""))
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Calculates a password strength score (0 to 4) and label.
 */
export function getPasswordStrength(password: string): {
  score: number; // 0 (empty/very weak) to 4 (very strong)
  label: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";
  checks: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} {
  const checks = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  let passed = 0;
  if (checks.hasMinLength) passed += 1;
  if (checks.hasUppercase) passed += 1;
  if (checks.hasLowercase) passed += 1;
  if (checks.hasNumber) passed += 1;
  if (checks.hasSpecial) passed += 1;

  if (password.length === 0) return { score: 0, label: "Very Weak", checks };
  if (passed <= 2) return { score: 1, label: "Weak", checks };
  if (passed === 3) return { score: 2, label: "Fair", checks };
  if (passed === 4) return { score: 3, label: "Good", checks };
  return { score: 4, label: "Strong", checks };
}
