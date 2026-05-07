import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Informe um e-mail válido."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "O link de redefinição é inválido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});
