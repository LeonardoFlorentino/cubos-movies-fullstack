import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { MovieDetailsPage } from "./pages/MovieDetailsPage/MovieDetailsPage";
import { NotFoundPage } from "./pages/NotFoundPage/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { MoviesListPage } from "./pages/MoviesListPage/MoviesListPage";
import { useThemeStore } from "./store/theme.store";

function App() {
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
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegisterPage />} path="/register" />
        <Route element={<MoviesListPage />} path="/movies" />
        <Route element={<MovieDetailsPage />} path="/movies/:id" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </main>
  );
}

export default App;
