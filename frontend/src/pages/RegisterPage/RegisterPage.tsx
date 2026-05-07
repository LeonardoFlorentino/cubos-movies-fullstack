import { useState } from "react";
import type { FormEvent } from "react";
import { AuthCard } from "../../components/auth/AuthCard";
import { Input } from "../../components/ui/Input/Input";
import { registerSchema } from "../../lib/auth.schemas";
import { useAuthStore } from "../../store/auth.store";

import "./register-page.css";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { registerAction, isLoading, error } = useAuthStore();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setValidationError("As senhas precisam ser iguais");
      return;
    }

    const result = registerSchema.safeParse({ name, email, password });

    if (!result.success) {
      setValidationError(
        result.error.issues[0]?.message ?? "Revise os dados informados.",
      );
      return;
    }

    setValidationError(null);
    await registerAction(result.data);
  };

  return (
    <AuthCard cardClassName="mt-8 max-[820px]:mt-0">
      <form className="register-form" onSubmit={handleSubmit} noValidate>
        <label className="input-group">
          <span className="input-label">Nome</span>
          <input
            autoComplete="name"
            className="register-input"
            onChange={(event) => setName(event.target.value)}
            placeholder="Digite seu nome"
            type="text"
            value={name}
          />
        </label>

        <label className="input-group">
          <span className="input-label">E-mail</span>
          <input
            autoComplete="email"
            className="register-input"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Digite seu e-mail"
            type="email"
            value={email}
          />
        </label>

        <Input
          label="Senha"
          autoComplete="new-password"
          className="register-input"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Digite sua senha"
          type="password"
          allowPasswordToggle
          value={password}
        />

        <Input
          label="Confirmação de senha"
          autoComplete="new-password"
          className="register-input"
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Digite sua senha novamente"
          type="password"
          allowPasswordToggle
          value={confirmPassword}
        />

        {(validationError || error) && (
          <p className="error-container">{validationError || error}</p>
        )}

        <div className="form-actions">
          <button className="btn-submit" disabled={isLoading} type="submit">
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
