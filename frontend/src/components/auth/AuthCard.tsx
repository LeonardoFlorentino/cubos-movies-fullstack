import "./auth.css";
import type { ReactNode } from "react";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter } from "./AuthFooter";

interface AuthCardProps {
  children: ReactNode;
  cardClassName?: string;
}

export function AuthCard({ children, cardClassName }: AuthCardProps) {
  return (
    <div className="auth-container">
      <div className="auth-bg-base auth-bg-image" />
      <div className="auth-bg-base auth-bg-gradient" />
      <div className="auth-bg-base auth-bg-radial" />

      <AuthHeader />

      <main className="auth-main">
        <section className={`auth-card ${cardClassName ?? ""}`}>
          {children}
        </section>
      </main>

      <AuthFooter />
    </div>
  );
}
