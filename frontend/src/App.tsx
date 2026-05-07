import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage/ForgotPasswordPage";
import { MovieDetailsPage } from "./pages/MovieDetailsPage/MovieDetailsPage";
import { NotFoundPage } from "./pages/NotFoundPage/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage/ResetPasswordPage";
import { MoviesListPage } from "./pages/MoviesListPage/MoviesListPage";
import { useAuthStore } from "./store/auth.store";
import { useThemeStore } from "./store/theme.store";

function ProtectedRoute() {
  const { token } = useAuthStore();

  if (!token) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const { token } = useAuthStore();

  if (token) {
    return <Navigate replace to="/movies" />;
  }

  return <Outlet />;
}

function App() {
  const { token } = useAuthStore();
  const { theme } = useThemeStore();

  return (
    <main>
      <Toaster
        key={theme}
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: "var(--toast-bg)",
            border: "1px solid var(--toast-border)",
            color: "var(--toast-text)",
          },
        }}
      />
      <Routes>
        <Route element={<Navigate replace to="/movies" />} path="/" />
        <Route element={<PublicOnlyRoute />}>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<RegisterPage />} path="/register" />
          <Route element={<ForgotPasswordPage />} path="/forgot-password" />
          <Route element={<ResetPasswordPage />} path="/reset-password" />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<MoviesListPage />} path="/movies" />
          <Route element={<MovieDetailsPage />} path="/movies/:id" />
        </Route>
        <Route
          element={token ? <NotFoundPage /> : <Navigate replace to="/login" />}
          path="*"
        />
      </Routes>
    </main>
  );
}

export default App;
