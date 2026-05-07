import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "./auth.schemas";

describe("auth schemas", () => {
  it("accepts valid login payload", () => {
    const result = loginSchema.safeParse({
      email: "leo@example.com",
      password: "secret123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid register payload", () => {
    const result = registerSchema.safeParse({
      name: "A",
      email: "invalid-email",
      password: "123",
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid forgot password payload", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "leo@example.com",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid reset password payload", () => {
    const result = resetPasswordSchema.safeParse({
      token: "",
      password: "123",
    });

    expect(result.success).toBe(false);
  });
});
