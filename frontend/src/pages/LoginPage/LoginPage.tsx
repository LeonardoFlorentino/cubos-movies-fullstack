import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { AuthCard } from "../../components/auth/AuthCard";
import { Input } from "../../components/ui/Input/Input";
import { loginSchema } from "../../lib/auth.schemas";
import { useAuthStore } from "../../store/auth.store";

// Importação direta do CSS global do componente
import "./login-page.css";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { loginAction, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const errorMessage = validationError || error;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      setValidationError(result.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setValidationError(null);
    await loginAction(result.data);

    if (!useAuthStore.getState().error) {
      navigate("/movies");
    }
  };

  return (
    <AuthCard cardClassName="auth-card-custom">
      <form className="login-form" onSubmit={handleSubmit}>
        <Input
          label="Nome/E-mail"
          type="email"
          placeholder="Digite seu nome/E-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />

        <Input
          label="Senha"
          type="password"
          allowPasswordToggle
          placeholder="Digite sua senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
        />

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <div className="actions-wrapper">
          <div className="actions-links">
            <Link className="forgot-password-link" to="/forgot-password">
              Esqueci minha senha
            </Link>
            <Link className="forgot-password-link" to="/register">
              Criar conta
            </Link>
          </div>
          <button className="btn-submit" disabled={isLoading} type="submit">
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
