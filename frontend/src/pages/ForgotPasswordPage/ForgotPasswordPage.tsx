import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/AuthCard";
import { Input } from "../../components/ui/Input/Input";
import { forgotPassword } from "../../lib/api";
import { getErrorMessage } from "../../lib/api-error";
import { forgotPasswordSchema } from "../../lib/auth.schemas";
import "./forgot-password-page.css";

const SUCCESS_MESSAGE =
  "Se o e-mail informado existir, voce recebera uma mensagem para redefinir sua senha.";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await forgotPassword(result.data);
      setFeedback(SUCCESS_MESSAGE);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Nao foi possivel enviar o e-mail de recuperacao agora.",
        ),
      );
      setFeedback(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard cardClassName="forgot-password-card">
      <form className="forgot-password-form" onSubmit={handleSubmit}>
        <h2 className="form-title">Esqueci minha senha</h2>
        <p className="form-subtitle">
          Informe seu e-mail para receber o link de redefinicao.
        </p>

        <Input
          label="E-mail"
          type="email"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
        />

        {error && <p className="error-message">{error}</p>}
        {feedback && <p className="success-message">{feedback}</p>}

        <div className="form-actions-row">
          <Link className="link-secondary" to="/login">
            Voltar para login
          </Link>
          <button className="btn-submit" disabled={isLoading} type="submit">
            {isLoading ? "Enviando..." : "Enviar link"}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
