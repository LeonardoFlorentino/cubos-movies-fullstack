import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthCard } from "../../components/auth/AuthCard";
import { Input } from "../../components/ui/Input/Input";
import { resetPassword } from "../../lib/api";
import { getErrorMessage } from "../../lib/api-error";
import { resetPasswordSchema } from "../../lib/auth.schemas";
import "./reset-password-page.css";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    const result = resetPasswordSchema.safeParse({ token, password });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid form");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resetPassword(result.data);
      setFeedback(
        "Senha redefinida com sucesso. Voce ja pode entrar na sua conta.",
      );
      setTimeout(() => {
        navigate("/login");
      }, 1400);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Nao foi possivel redefinir a senha agora. Solicite um novo link.",
        ),
      );
      setFeedback(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard cardClassName="reset-password-card">
      <form className="reset-password-form" onSubmit={handleSubmit}>
        <h2 className="form-title">Redefinir senha</h2>
        <p className="form-subtitle">
          Digite uma nova senha para continuar usando sua conta.
        </p>

        <Input
          label="Nova senha"
          type="password"
          allowPasswordToggle
          placeholder="Digite a nova senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
        />

        <Input
          label="Confirmar nova senha"
          type="password"
          allowPasswordToggle
          placeholder="Digite novamente"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
        />

        {error && <p className="error-message">{error}</p>}
        {feedback && <p className="success-message">{feedback}</p>}

        <div className="form-actions-row">
          <Link className="link-secondary" to="/login">
            Voltar para login
          </Link>
          <button className="btn-submit" disabled={isLoading} type="submit">
            {isLoading ? "Salvando..." : "Salvar senha"}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}
