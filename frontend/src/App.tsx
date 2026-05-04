import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { MovieDetailsPage } from "./pages/MovieDetailsPage/MovieDetailsPage";
import { NotFoundPage } from "./pages/NotFoundPage/NotFoundPage";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { MoviesListPage } from "./pages/MoviesListPage/MoviesListPage";

function App() {
  return (
    <main>
      <Toaster
        position="top-right"
        richColors
        toastOptions={{
          style: {
            background: "#1a1b23",
            border: "1px solid rgba(96, 97, 120, 0.45)",
            color: "#f4f4fb",
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
