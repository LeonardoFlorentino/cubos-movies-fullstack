import { Link } from "react-router-dom";
import { AuthCard } from "../../components/auth/AuthCard";

import "./NotFoundPage.css";

export function NotFoundPage() {
  return (
    <AuthCard>
      <div className="not-found-container">
        <p className="error-code">404</p>
        <h1 className="not-found-title">Página não encontrada</h1>

        <Link className="btn-back" to="/login">
          Voltar para login
        </Link>
      </div>
    </AuthCard>
  );
}
