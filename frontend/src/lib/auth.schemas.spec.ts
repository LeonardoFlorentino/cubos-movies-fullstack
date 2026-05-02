import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth.schemas";

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
});
