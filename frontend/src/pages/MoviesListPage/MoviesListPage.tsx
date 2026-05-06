import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMoviesStore } from "../../store/movies.store";
import { useAuthStore } from "../../store/auth.store";
import { AuthHeader } from "../../components/auth/AuthHeader";
import filterPropertiesGraphic from "../../assets/filter-properties.svg";
import type { CreateMoviePayload } from "../../types/movies";
import { toast } from "sonner";
import { uploadMovieImage } from "../../lib/api";
import {
  compressImageIfNeeded,
  formatMegabytes,
} from "../../lib/image-compression";

// ─── filter types ────────────────────────────────────────────────────────────
type DurationFilter = "all" | "short" | "medium" | "long";
type PeriodFilter = "all" | "last-30" | "last-365" | "year-to-date" | "custom";

interface MovieFilters {
  duration: DurationFilter;
  period: PeriodFilter;
  genre: string;
  customStartDate: string;
  customEndDate: string;
}

type AddMovieField =
  | "title"
  | "description"
  | "releaseDate"
  | "budget"
  | "durationMinutes"
  | "trailer";
type AddMovieFieldErrors = Partial<Record<AddMovieField, string>>;

const defaultFilters: MovieFilters = {
  duration: "all",
  period: "all",
  genre: "all",
  customStartDate: "",
  customEndDate: "",
};

const defaultForm: CreateMoviePayload = {
  title: "",
  description: "",
  releaseDate: "",
  budget: 0,
  imageUrl: "",
  trailer: "",
};

function formatIsoToBrDate(isoDate: string) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

function parseBrDateToIso(brDate: string) {
  const digits = brDate.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  if (digits.length < 8) {
    return {
      masked: [day, month, year].filter(Boolean).join("/"),
      iso: "",
      isValid: false,
    };
  }

  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00`);
  const isValid =
    !Number.isNaN(date.getTime()) &&
    date.getUTCDate() === Number(day) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCFullYear() === Number(year);

  return {
    masked: `${day}/${month}/${year}`,
    iso: isValid ? iso : "",
    isValid,
  };
}

function formatUsdValueInput(rawValue: string) {
  const digits = rawValue.replace(/\D/g, "");
  if (!digits) {
    return { masked: "", numeric: 0 };
  }

  const numeric = Number(digits) / 100;
  const masked = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric);

  return { masked, numeric };
}

const normalizeGenre = (value: string) => value.trim();

function extractRuntime(description: string): number | null {
  const m = description.match(/(\d{2,3})\s?(min|mins|minutes|minutos)/i);
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

function estimateRuntime(budget: string): number {
  const b = Number.parseFloat(budget);
  if (!Number.isFinite(b) || b <= 0) return 100;
  return Math.max(75, Math.min(190, Math.round(70 + Math.log10(b + 1) * 24)));
}

function getRuntime(description: string, budget: string) {
  return extractRuntime(description) ?? estimateRuntime(budget);
}

// ─── component ────────────────────────────────────────────────────────────────
export function MoviesListPage() {
  const {
    movies,
    isLoading,
    error,
    page,
    totalPages,
    search,
    getMoviesAction,
    createMovieAction,
    deleteMovieAction,
    setSearch,
    setPage,
    resetError,
  } = useMoviesStore();

  const { token } = useAuthStore();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState("");

  // filter modal
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<MovieFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] =
    useState<MovieFilters>(defaultFilters);

  // add-movie modal
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<CreateMoviePayload>(defaultForm);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<AddMovieFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [releaseDateInput, setReleaseDateInput] = useState("");
  const [budgetInput, setBudgetInput] = useState("");
  const [genresInput, setGenresInput] = useState("");
  const [durationInput, setDurationInput] = useState("");

  // delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selectedGenre =
    appliedFilters.genre !== "all" ? appliedFilters.genre : "";

  useEffect(() => {
    getMoviesAction(page, 10, search, selectedGenre);
  }, [page, search, selectedGenre, getMoviesAction]);

  const availableGenres = useMemo(() => {
    const uniqueGenres = new Set<string>();
    movies.forEach((movie) => {
      (movie.genres ?? []).forEach((genre) => {
        const normalized = normalizeGenre(genre);
        if (normalized) {
          uniqueGenres.add(normalized);
        }
      });
    });

    return Array.from(uniqueGenres).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [movies]);

  // ── search ────────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setSearchInput("");
    setPage(1);
    setSearch("");
  };

  // ── filters ───────────────────────────────────────────────────────────────
  const activeCount =
    (appliedFilters.duration !== "all" ? 1 : 0) +
    (appliedFilters.period !== "all" ? 1 : 0) +
    (appliedFilters.genre !== "all" ? 1 : 0);

  const filteredMovies = useMemo(() => {
    const today = new Date();
    const cutoff30 = new Date(today);
    cutoff30.setDate(today.getDate() - 30);
    const cutoff365 = new Date(today);
    cutoff365.setDate(today.getDate() - 365);
    const yearStart = new Date(today.getFullYear(), 0, 1);

    return movies.filter((movie) => {
      const movieGenres = (movie.genres ?? []).map(normalizeGenre);
      const runtime =
        typeof movie.durationMinutes === "number"
          ? movie.durationMinutes
          : getRuntime(movie.description, movie.budget);
      const releaseDate = new Date(movie.releaseDate);

      if (
        appliedFilters.genre !== "all" &&
        !movieGenres.includes(appliedFilters.genre)
      )
        return false;
      if (appliedFilters.duration === "short" && runtime >= 90) return false;
      if (
        appliedFilters.duration === "medium" &&
        (runtime < 90 || runtime > 130)
      )
        return false;
      if (appliedFilters.duration === "long" && runtime <= 130) return false;

      if (!Number.isNaN(releaseDate.getTime())) {
        if (appliedFilters.period === "last-30" && releaseDate < cutoff30)
          return false;
        if (appliedFilters.period === "last-365" && releaseDate < cutoff365)
          return false;
        if (appliedFilters.period === "year-to-date" && releaseDate < yearStart)
          return false;
        if (appliedFilters.period === "custom") {
          const s = appliedFilters.customStartDate
            ? new Date(`${appliedFilters.customStartDate}T00:00:00`)
            : null;
          const en = appliedFilters.customEndDate
            ? new Date(`${appliedFilters.customEndDate}T23:59:59`)
            : null;
          if (s && releaseDate < s) return false;
          if (en && releaseDate > en) return false;
        }
      }
      return true;
    });
  }, [movies, appliedFilters]);

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  };
  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setFiltersOpen(false);
  };
  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setPage(1);
    setFiltersOpen(false);
  };

  // ── add movie ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(defaultForm);
    setReleaseDateInput("");
    setBudgetInput("");
    setGenresInput("");
    setDurationInput("");
    setFormError("");
    setFieldErrors({});
    setIsUploadingImage(false);
    setAddOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const prepared = await compressImageIfNeeded(file);
      const { imageUrl } = await uploadMovieImage(prepared.file);
      setForm((prev) => ({ ...prev, imageUrl }));

      if (prepared.wasCompressed) {
        toast.success(
          `Imagem comprimida (${formatMegabytes(prepared.originalSize)} -> ${formatMegabytes(prepared.finalSize)}) e enviada com sucesso.`,
        );
      } else {
        toast.success("Imagem enviada com sucesso.");
      }
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível enviar a imagem.";
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (
      name === "title" ||
      name === "description" ||
      name === "trailer" ||
      name === "imageUrl"
    ) {
      setFieldErrors((prev) => ({
        ...prev,
        ...(name === "title" ? { title: undefined } : {}),
        ...(name === "description" ? { description: undefined } : {}),
        ...(name === "trailer" || name === "imageUrl"
          ? { trailer: undefined }
          : {}),
      }));
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReleaseDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseBrDateToIso(e.target.value);
    setReleaseDateInput(parsed.masked);
    setFieldErrors((prev) => ({
      ...prev,
      releaseDate: undefined,
    }));
    setForm((prev) => ({
      ...prev,
      releaseDate: parsed.iso,
    }));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatUsdValueInput(e.target.value);
    setBudgetInput(formatted.masked);
    setFieldErrors((prev) => ({
      ...prev,
      budget: undefined,
    }));
    setForm((prev) => ({
      ...prev,
      budget: formatted.numeric,
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const nextFieldErrors: AddMovieFieldErrors = {};

    if (!form.title.trim()) {
      nextFieldErrors.title = "Informe o título do filme.";
    }

    if (!form.description.trim()) {
      nextFieldErrors.description = "A descrição é obrigatória.";
    }

    if (!form.releaseDate) {
      nextFieldErrors.releaseDate = "Informe a data no formato dd/mm/aaaa.";
    }

    if (form.budget <= 0) {
      nextFieldErrors.budget = "Informe um orçamento em dólar maior que zero.";
    }

    const parsedDuration = durationInput.trim()
      ? Number.parseInt(durationInput, 10)
      : undefined;

    if (
      durationInput.trim() &&
      (!Number.isInteger(parsedDuration) || (parsedDuration ?? 0) <= 0)
    ) {
      nextFieldErrors.durationMinutes =
        "Informe uma duração válida em minutos (inteiro maior que zero).";
    }

    if (!form.imageUrl?.trim() && !form.trailer?.trim()) {
      nextFieldErrors.trailer =
        "Informe a URL do filme (trailer) quando não houver imagem.";
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError("Revise os campos obrigatórios destacados.");
      return;
    }

    setFieldErrors({});

    const parsedGenres = genresInput
      .split(",")
      .map((genre) => normalizeGenre(genre))
      .filter((genre) => genre.length > 0);

    setIsSubmitting(true);
    const created = await createMovieAction({
      ...form,
      genres: parsedGenres.length > 0 ? parsedGenres : undefined,
      durationMinutes: parsedDuration,
      imageUrl: form.imageUrl?.trim() || undefined,
      trailer: form.trailer?.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!created) {
      const createError = useMoviesStore.getState().error;
      toast.error(createError ?? "Não foi possível salvar o filme.");
      return;
    }

    toast.success("Filme salvo com sucesso.");
    setAddOpen(false);
    await getMoviesAction(page, 10, search, selectedGenre);
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    await deleteMovieAction(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  // ── guard ─────────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-400">
          Por favor, faça login para ver seus filmes.
        </p>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#070711]">
      <AuthHeader />

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        {/* ── error banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="mb-5 flex items-center justify-between rounded-lg border border-red-700/60 bg-red-900/25 px-4 py-3">
            <p className="text-sm text-red-300">{error}</p>
            <button
              type="button"
              onClick={resetError}
              className="ml-4 text-sm font-semibold text-red-300 hover:text-red-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── toolbar ──────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSearch}
          className="mb-8 flex items-center gap-3 rounded-2xl border border-[rgba(96,97,120,0.35)] bg-[rgba(23,23,30,0.70)] px-4 py-3 backdrop-blur"
        >
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Pesquise por filmes"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-md border border-[rgba(89,90,112,0.56)] bg-[rgba(23,23,30,0.88)] pl-9 pr-4 text-sm text-[#f4f4fb] placeholder:text-[#747488] transition-all focus:border-[#8d67ce] focus:shadow-[inset_0_0_0_1px_#8d67ce] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openFilters}
            className="h-10 shrink-0 rounded-md border border-violet-500/40 bg-violet-500/15 px-4 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/30"
          >
            {activeCount > 0 ? `Filtros (${activeCount})` : "Filtros"}
          </button>

          <button
            type="button"
            onClick={openAdd}
            className="h-10 shrink-0 rounded-md bg-[#8e4ec6] px-4 text-sm font-semibold text-white transition hover:bg-[#9a5be1]"
          >
            Adicionar Filme
          </button>
        </form>

        {/* ── loading ───────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-violet-500" />
          </div>
        )}

        {/* ── grid ──────────────────────────────────────────────────────── */}
        {!isLoading && filteredMovies.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredMovies.map((movie) => {
                const year = new Date(movie.releaseDate).getFullYear();
                const primaryGenre = movie.genres?.[0] ?? "Sem gênero";
                const runtime =
                  typeof movie.durationMinutes === "number"
                    ? movie.durationMinutes
                    : getRuntime(movie.description, movie.budget);

                return (
                  <article
                    key={movie.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/movies/${movie.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/movies/${movie.id}`);
                      }
                    }}
                    className="group relative flex flex-col overflow-hidden rounded-xl border border-[rgba(96,97,120,0.32)] bg-[rgba(36,36,43,0.92)] transition hover:-translate-y-0.5 hover:border-violet-400/50 hover:shadow-[0_8px_32px_rgba(142,78,198,0.18)]"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#16161e]">
                      {movie.imageUrl ? (
                        <img
                          src={movie.imageUrl}
                          alt={movie.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-600">
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-14 w-14 opacity-30"
                          >
                            <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm6 2l5 4-5 4V8z" />
                          </svg>
                        </div>
                      )}

                      <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setConfirmDeleteId(movie.id);
                          }}
                          className="rounded-md bg-red-600/80 px-2 py-1 text-xs font-semibold text-white backdrop-blur hover:bg-red-500"
                          aria-label={`Deletar ${movie.title}`}
                        >
                          Deletar
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <h3 className="truncate text-sm font-bold text-[#f4f4fb]">
                        {movie.title}
                      </h3>
                      <p className="text-xs text-[#9899b8]">
                        {Number.isNaN(year) ? "—" : year}
                        {" · "}
                        {primaryGenre}
                      </p>
                      <p className="text-xs text-[#6b6c85]">{runtime} min</p>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-800/60 text-sm text-slate-300 transition hover:border-violet-500 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      className={`h-9 w-9 rounded-md text-sm font-semibold transition ${
                        n === page
                          ? "bg-[#8e4ec6] text-white shadow-[0_0_12px_rgba(142,78,198,0.45)]"
                          : "border border-slate-700 bg-slate-800/60 text-slate-300 hover:border-violet-500 hover:text-violet-300"
                      }`}
                    >
                      {n}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 bg-slate-800/60 text-sm text-slate-300 transition hover:border-violet-500 hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Próxima página"
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}

        {/* ── empty state ───────────────────────────────────────────────── */}
        {!isLoading && filteredMovies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg
              className="mb-4 h-16 w-16 text-slate-700"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm6 2l5 4-5 4V8z" />
            </svg>
            <p className="mb-4 text-base text-slate-400">
              {search || activeCount > 0
                ? "Nenhum filme encontrado com os filtros atuais"
                : "Você ainda não tem filmes"}
            </p>
            {(search || activeCount > 0) && (
              <button
                type="button"
                onClick={() => {
                  clearSearch();
                  setAppliedFilters(defaultFilters);
                }}
                className="rounded-md bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Limpar filtros e busca
              </button>
            )}
          </div>
        )}
      </main>

      {/* modal — adicionar filme */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#1a1b23] shadow-[0_25px_70px_rgba(3,7,18,0.8)]">
            <div className="flex items-center justify-between border-b border-slate-700/80 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-100">
                Adicionar Filme
              </h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700/60 hover:text-white"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 p-6">
              {formError && (
                <p className="rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-300">
                  {formError}
                </p>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Título *
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  className={`input-field ${
                    fieldErrors.title
                      ? "border-red-500 focus:border-red-400 focus:shadow-[inset_0_0_0_1px_#f87171]"
                      : ""
                  }`}
                  placeholder="Nome do filme"
                />
                {fieldErrors.title && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Descrição *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                  required
                  className={`w-full resize-none rounded border bg-[rgba(23,23,30,0.88)] px-3.5 py-2.5 text-sm text-[#d3d4e2] placeholder:text-[#747488] focus:outline-none ${
                    fieldErrors.description
                      ? "border-red-500 focus:border-red-400 focus:shadow-[inset_0_0_0_1px_#f87171]"
                      : "border-[rgba(89,90,112,0.56)] focus:border-[#8d67ce] focus:shadow-[inset_0_0_0_1px_#8d67ce]"
                  }`}
                  placeholder="Sinopse do filme"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.description}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Data de lançamento *
                  </label>
                  <input
                    name="releaseDate"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={
                      releaseDateInput || formatIsoToBrDate(form.releaseDate)
                    }
                    onChange={handleReleaseDateChange}
                    required
                    className={`input-field ${
                      fieldErrors.releaseDate
                        ? "border-red-500 focus:border-red-400 focus:shadow-[inset_0_0_0_1px_#f87171]"
                        : ""
                    }`}
                    placeholder="dd/mm/aaaa"
                  />
                  {fieldErrors.releaseDate && (
                    <p className="mt-1 text-xs text-red-300">
                      {fieldErrors.releaseDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Orçamento (US$) *
                  </label>
                  <input
                    name="budget"
                    type="text"
                    inputMode="numeric"
                    value={budgetInput}
                    onChange={handleBudgetChange}
                    required
                    className={`input-field ${
                      fieldErrors.budget
                        ? "border-red-500 focus:border-red-400 focus:shadow-[inset_0_0_0_1px_#f87171]"
                        : ""
                    }`}
                    placeholder="$ 0.00"
                  />
                  {fieldErrors.budget && (
                    <p className="mt-1 text-xs text-red-300">
                      {fieldErrors.budget}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Gêneros
                  </label>
                  <input
                    type="text"
                    value={genresInput}
                    onChange={(e) => setGenresInput(e.target.value)}
                    className="input-field"
                    placeholder="Aventura, Drama, Sci-Fi"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Separe os gêneros por vírgula.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Duração (min)
                  </label>
                  <input
                    name="durationMinutes"
                    type="number"
                    min="1"
                    step="1"
                    value={durationInput}
                    onChange={(e) => {
                      setDurationInput(e.target.value);
                      setFieldErrors((prev) => ({
                        ...prev,
                        durationMinutes: undefined,
                      }));
                    }}
                    className={`input-field ${
                      fieldErrors.durationMinutes
                        ? "border-red-500 focus:border-red-400 focus:shadow-[inset_0_0_0_1px_#f87171]"
                        : ""
                    }`}
                    placeholder="169"
                  />
                  {fieldErrors.durationMinutes && (
                    <p className="mt-1 text-xs text-red-300">
                      {fieldErrors.durationMinutes}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  URL da imagem (poster)
                </label>
                <input
                  name="imageUrl"
                  type="url"
                  value={form.imageUrl ?? ""}
                  onChange={handleFormChange}
                  className="input-field"
                  placeholder="https://..."
                />
                <div className="mt-2 flex items-center gap-2">
                  <label className="cursor-pointer rounded-md border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700/60">
                    {isUploadingImage ? "Enviando..." : "Upload imagem"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                    />
                  </label>
                  {form.imageUrl?.trim() && (
                    <span className="text-xs text-emerald-300">
                      URL preenchida automaticamente
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Trailer (URL do YouTube)
                </label>
                <input
                  name="trailer"
                  type="url"
                  value={form.trailer ?? ""}
                  onChange={handleFormChange}
                  className={`input-field ${
                    fieldErrors.trailer
                      ? "border-red-500 focus:border-red-400 focus:shadow-[inset_0_0_0_1px_#f87171]"
                      : ""
                  }`}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {fieldErrors.trailer && (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.trailer}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/60"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-[#8e4ec6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#9a5be1] disabled:opacity-60"
                >
                  {isSubmitting ? "Salvando…" : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal — filtros */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-[#1a1b23] shadow-[0_25px_70px_rgba(3,7,18,0.75)]">
            <div className="flex items-center justify-between border-b border-slate-700/80 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-100">Filtros</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-700/60 hover:text-white"
                aria-label="Fechar filtros"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="space-y-5 rounded-xl border border-slate-700/70 bg-slate-900/55 p-5">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Duração
                  </label>
                  <select
                    value={draftFilters.duration}
                    onChange={(e) =>
                      setDraftFilters((p) => ({
                        ...p,
                        duration: e.target.value as DurationFilter,
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-600 bg-slate-950/75 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="all">Todas</option>
                    <option value="short">Curta (até 89 min)</option>
                    <option value="medium">Média (90 – 130 min)</option>
                    <option value="long">Longa (acima de 130 min)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Período de lançamento
                  </label>
                  <select
                    value={draftFilters.period}
                    onChange={(e) =>
                      setDraftFilters((p) => ({
                        ...p,
                        period: e.target.value as PeriodFilter,
                      }))
                    }
                    className="h-11 w-full rounded-md border border-slate-600 bg-slate-950/75 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="all">Todos os períodos</option>
                    <option value="last-30">Últimos 30 dias</option>
                    <option value="last-365">Últimos 12 meses</option>
                    <option value="year-to-date">Desde o início do ano</option>
                    <option value="custom">Personalizado</option>
                  </select>

                  {draftFilters.period === "custom" && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        type="date"
                        value={draftFilters.customStartDate}
                        onChange={(e) =>
                          setDraftFilters((p) => ({
                            ...p,
                            customStartDate: e.target.value,
                          }))
                        }
                        className="h-11 rounded-md border border-slate-600 bg-slate-950/75 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                      />
                      <input
                        type="date"
                        value={draftFilters.customEndDate}
                        onChange={(e) =>
                          setDraftFilters((p) => ({
                            ...p,
                            customEndDate: e.target.value,
                          }))
                        }
                        className="h-11 rounded-md border border-slate-600 bg-slate-950/75 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-200">
                    Gênero
                  </label>
                  <select
                    value={draftFilters.genre}
                    onChange={(e) =>
                      setDraftFilters((p) => ({ ...p, genre: e.target.value }))
                    }
                    className="h-11 w-full rounded-md border border-slate-600 bg-slate-950/75 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="all">Todos os gêneros</option>
                    {availableGenres.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <aside className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                  Propriedades do filtro
                </p>
                <img
                  src={filterPropertiesGraphic}
                  alt="Painel visual com propriedades dos filtros"
                  className="h-auto w-full rounded-md border border-slate-700/80"
                />
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Os filtros combinam duração, período e gênero para refinar a
                  grade em tempo real.
                </p>
              </aside>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-700/80 px-6 py-4">
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/70"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* modal — confirmar exclusão */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-700 bg-[#1a1b23] p-6 shadow-[0_25px_70px_rgba(3,7,18,0.8)]">
            <h2 className="mb-2 text-base font-semibold text-slate-100">
              Deletar filme?
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Essa ação é irreversível. O filme será removido permanentemente.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-4 text-center text-xs text-slate-600">
        © 2025 · Todos os direitos reservados a Cubos Movies
      </footer>
    </div>
  );
}
