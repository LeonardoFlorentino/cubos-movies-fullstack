import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
import { useThemeStore } from "../../store/theme.store";

export function AuthHeader() {
  const navigate = useNavigate();
  const { logoutAction } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = () => {
    logoutAction();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-(--line-color) px-4 py-3 max-[820px]:flex-wrap max-[820px]:gap-3">
      <div className="flex items-center gap-3" aria-label="Cubos Movies">
        <img
          src="/logo.svg"
          alt="Logo Cubos Movies"
          className="brand-logo h-9 w-auto"
        />
        <span className="text-[20px] font-bold tracking-[0.01em]">Movies</span>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <button
          className="flex h-11 w-16 items-center justify-center rounded-md bg-[var(--theme-toggle-bg)] text-[var(--theme-toggle-fg)] transition hover:bg-[var(--theme-toggle-bg-hover)] max-[820px]:h-9.5 max-[820px]:w-[52px]"
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"
          }
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
            {theme === "dark" ? (
              <>
                <path
                  d="M12 3.5V5.5M12 18.5V20.5M5.94 5.94L7.36 7.36M16.64 16.64L18.06 18.06M3.5 12H5.5M18.5 12H20.5M5.94 18.06L7.36 16.64M16.64 7.36L18.06 5.94"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="3.3" fill="currentColor" />
              </>
            ) : (
              <path
                d="M20 14.9A8.5 8.5 0 1 1 9.1 4a6.8 6.8 0 1 0 10.9 10.9Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>

        <button
          className="h-11 min-w-[90px] bg-(--accent) px-5 text-base font-medium text-[#f5f0ff] hover:bg-(--accent-hover) max-[820px]:h-[38px] max-[820px]:min-w-[82px] max-[820px]:px-4"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
