import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthHeader } from "../../components/auth/AuthHeader";
import { MoviePoster } from "../../components/ui/MoviePoster";
import { useMoviesStore } from "../../store/movies.store";
import { useAuthStore } from "../../store/auth.store";
import { deleteMovie, updateMovie, uploadMovieImage } from "../../lib/api";
import { getErrorMessage } from "../../lib/api-error";
import { toast } from "sonner";
import {
  compressImageIfNeeded,
  formatMegabytes,
} from "../../lib/image-compression";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

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

function isoToBrDate(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

function runtimeFromDescriptionOrBudget(description: string, budget: string) {
  const explicit = description.match(/(\d{2,3})\s?(min|mins|minutes|minutos)/i);
  if (explicit) {
    return Number(explicit[1]);
  }

  const b = Number.parseFloat(budget);
  if (!Number.isFinite(b) || b <= 0) {
    return 110;
  }

  return Math.max(85, Math.min(185, Math.round(70 + Math.log10(b + 1) * 24)));
}

function stableHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function deriveMovieInsights(id: string, releaseDate: string, budget: string) {
  const hash = stableHash(id);
  const budgetValue = Number.parseFloat(budget) || 0;
  const multiplier = 1.3 + (hash % 220) / 100;
  const revenue = Math.max(0, budgetValue * multiplier);
  const profit = revenue - budgetValue;
  const popularity = (35 + (hash % 60) + Math.round(multiplier * 4)) / 1;
  const votes = 1200 + (hash % 7600);

  const now = new Date();
  const release = new Date(releaseDate);
  const status =
    Number.isNaN(release.getTime()) || release <= now
      ? "Lançado"
      : "Em produção";

  const language =
    hash % 3 === 0 ? "Português" : hash % 3 === 1 ? "Inglês" : "Espanhol";
  const approval = Math.min(97, Math.max(52, Math.round(52 + (hash % 39))));

  return {
    popularity,
    votes,
    revenue,
    profit,
    status,
    language,
    approval,
  };
}

function getYoutubeEmbedUrl(url: string | null) {
  if (!url) {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return trimmed;
      }
    }
  } catch {
    return null;
  }

  return null;
}

const GENRE_OPTIONS = [
  "Ação",
  "Animação",
  "Aventura",
  "Comédia",
  "Documentário",
  "Drama",
  "Fantasia",
  "Ficção Científica",
  "Horror",
  "Musical",
  "Romance",
  "Suspense",
  "Thriller",
  "Western",
];

export function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { token } = useAuthStore();
  const { currentMovie, isLoading, error, getMovieByIdAction, resetError } =
    useMoviesStore();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [editGenres, setEditGenres] = useState<string[]>([]);
  const [releaseDateInput, setReleaseDateInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    releaseDate: "",
    budget: "",
    genres: "",
    durationMinutes: "",
    imageUrl: "",
    trailer: "",
  });

  useEffect(() => {
    if (id) {
      getMovieByIdAction(id);
    }
  }, [id, getMovieByIdAction]);

  const details = useMemo(() => {
    if (!currentMovie || !id) {
      return null;
    }

    const genres =
      currentMovie.genres?.filter((genre) => genre.trim().length > 0) ?? [];
    const durationMinutes =
      typeof currentMovie.durationMinutes === "number"
        ? currentMovie.durationMinutes
        : runtimeFromDescriptionOrBudget(
            currentMovie.description,
            currentMovie.budget,
          );
    const insights = deriveMovieInsights(
      id,
      currentMovie.releaseDate,
      currentMovie.budget,
    );

    return {
      genres,
      durationMinutes,
      ...insights,
    };
  }, [currentMovie, id]);

  const openEditDrawer = () => {
    if (!currentMovie) {
      return;
    }

    setEditForm({
      title: currentMovie.title,
      description: currentMovie.description,
      releaseDate: currentMovie.releaseDate,
      budget: Number(currentMovie.budget || 0).toFixed(2),
      genres: "",
      durationMinutes:
        typeof currentMovie.durationMinutes === "number"
          ? String(currentMovie.durationMinutes)
          : "",
      imageUrl: currentMovie.imageUrl ?? "",
      trailer: currentMovie.trailer ?? "",
    });
    setEditGenres([...(currentMovie.genres ?? [])]);
    setReleaseDateInput(isoToBrDate(currentMovie.releaseDate));
    setIsUploadingEditImage(false);
    setIsEditOpen(true);
  };

  const handleEditReleaseDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const parsed = parseBrDateToIso(e.target.value);
    setReleaseDateInput(parsed.masked);
    setEditForm((prev) => ({ ...prev, releaseDate: parsed.iso }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingEditImage(true);
    try {
      const prepared = await compressImageIfNeeded(file);
      const { imageUrl } = await uploadMovieImage(prepared.file);
      setEditForm((prev) => ({ ...prev, imageUrl }));

      if (prepared.wasCompressed) {
        toast.success(
          `Imagem comprimida (${formatMegabytes(prepared.originalSize)} -> ${formatMegabytes(prepared.finalSize)}) e enviada com sucesso.`,
        );
      } else {
        toast.success("Imagem enviada com sucesso.");
      }
    } catch (uploadError) {
      toast.error(
        getErrorMessage(uploadError, "Não foi possível enviar a imagem."),
      );
    } finally {
      setIsUploadingEditImage(false);
      e.target.value = "";
    }
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) {
      return;
    }

    if (!editForm.title.trim() || !editForm.description.trim()) {
      toast.error("Título e descrição são obrigatórios para editar o filme.");
      return;
    }

    setIsSavingEdit(true);
    try {
      const parsedDuration = editForm.durationMinutes.trim()
        ? Number.parseInt(editForm.durationMinutes, 10)
        : undefined;

      await updateMovie(id, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        releaseDate: editForm.releaseDate,
        budget: Number.parseFloat(editForm.budget),
        genres: editGenres.length > 0 ? editGenres : undefined,
        durationMinutes:
          parsedDuration && parsedDuration > 0 ? parsedDuration : undefined,
        imageUrl: editForm.imageUrl.trim() || undefined,
        trailer: editForm.trailer.trim() || undefined,
      });
      await getMovieByIdAction(id);
      setIsEditOpen(false);
      toast.success("Filme atualizado com sucesso.");
    } catch (editError) {
      toast.error(
        getErrorMessage(editError, "Não foi possível editar o filme."),
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteMovie = async () => {
    if (!id) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMovie(id);
      toast.success("Filme deletado com sucesso.");
      navigate("/movies");
    } catch (deleteError) {
      toast.error(
        getErrorMessage(deleteError, "Não foi possível deletar o filme."),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070711] p-6 text-slate-300">
        Faça login para visualizar os detalhes do filme.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070711] text-slate-100">
      <AuthHeader />

      <main className="mx-auto w-full max-w-[1220px] px-6 py-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-violet-500"
          >
            Voltar
          </button>

          <Link
            to="/movies"
            className="text-sm text-slate-400 transition hover:text-violet-300"
          >
            Ir para lista
          </Link>
        </div>

        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-800/60 bg-red-900/25 px-4 py-3">
            <p className="text-sm text-red-200">{error}</p>
            <button
              type="button"
              onClick={resetError}
              className="text-sm font-semibold text-red-200 hover:text-red-100"
            >
              Fechar
            </button>
          </div>
        )}

        {isLoading && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-violet-400" />
          </div>
        )}

        {!isLoading && currentMovie && details && (
          <section className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[#111827] shadow-[0_20px_70px_rgba(2,6,23,0.65)]">
            <div className="relative">
              <div className="h-40 w-full">
                <MoviePoster
                  src={currentMovie.imageUrl}
                  title={currentMovie.title}
                  imageClassName="opacity-35"
                  fallbackClassName="opacity-85"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172ad4] to-[#0f172a95]" />
              <div className="absolute inset-x-0 bottom-0 top-0 flex items-end p-6">
                <div className="flex w-full items-end justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">
                      {currentMovie.title}
                    </h1>
                    <p className="mt-1 text-lg text-slate-300">
                      Título original: {currentMovie.title}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteMovie}
                      disabled={isDeleting}
                      className="rounded-md border border-slate-500/70 bg-slate-700/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-slate-600 disabled:opacity-60"
                    >
                      {isDeleting ? "Deletando..." : "Deletar"}
                    </button>
                    <button
                      type="button"
                      onClick={openEditDrawer}
                      className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[300px_1fr]">
              <aside className="overflow-hidden rounded-lg border border-slate-700/80 bg-slate-900">
                <MoviePoster
                  src={currentMovie.imageUrl}
                  title={currentMovie.title}
                  className="aspect-[2/3]"
                />
              </aside>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Popularidade
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-100">
                      {details.popularity.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Votos
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-100">
                      {details.votes}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Aprovação
                    </p>
                    <p className="mt-1 text-2xl font-bold text-emerald-300">
                      {details.approval}%
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Duração
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-100">
                      {Math.floor(details.durationMinutes / 60)}h{" "}
                      {details.durationMinutes % 60}m
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-slate-700 bg-slate-800/70 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-200">
                    Sinopse
                  </h2>
                  <p className="mt-2 leading-relaxed text-slate-300">
                    {currentMovie.description}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Lançamento
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">
                      {new Date(currentMovie.releaseDate).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Situação
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">
                      {details.status}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Idioma
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">
                      {details.language}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Orçamento
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">
                      {currencyFormatter.format(Number(currentMovie.budget))}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Receita
                    </p>
                    <p className="mt-1 text-lg font-semibold text-emerald-300">
                      {currencyFormatter.format(details.revenue)}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-700 bg-slate-800/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Lucro
                    </p>
                    <p className="mt-1 text-lg font-semibold text-violet-300">
                      {currencyFormatter.format(details.profit)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-200">
                    Gêneros
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {details.genres.length === 0 && (
                      <span className="text-sm text-slate-400">
                        Sem gênero informado
                      </span>
                    )}
                    {details.genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-md border border-violet-500/35 bg-violet-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-200"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-700/70 bg-[#0d1320] p-6">
              <h2 className="mb-3 text-2xl font-semibold text-slate-100">
                Trailer
              </h2>
              {getYoutubeEmbedUrl(currentMovie.trailer) ? (
                <div className="overflow-hidden rounded-lg border border-slate-700/80 bg-black">
                  <iframe
                    title={`Trailer de ${currentMovie.title}`}
                    src={getYoutubeEmbedUrl(currentMovie.trailer) ?? undefined}
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-600 bg-slate-900/55 p-6 text-sm text-slate-400">
                  Nenhum trailer informado para este filme.
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-700 bg-[#151824] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">
                Editar Filme
              </h2>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-700/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Título
                </label>
                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditChange}
                  className="h-11 w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Descrição
                </label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={5}
                  className="w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">
                    Lançamento
                  </label>
                  <input
                    name="releaseDate"
                    type="text"
                    inputMode="numeric"
                    value={releaseDateInput}
                    onChange={handleEditReleaseDateChange}
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                    className="h-11 w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-300">
                    Orçamento (US$)
                  </label>
                  <input
                    name="budget"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.budget}
                    onChange={handleEditChange}
                    className="h-11 w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Gêneros
                </label>
                <select
                  className="h-11 w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !editGenres.includes(val)) {
                      setEditGenres((prev) => [...prev, val]);
                    }
                  }}
                >
                  <option value="" disabled>
                    Selecione um gênero...
                  </option>
                  {GENRE_OPTIONS.filter((g) => !editGenres.includes(g)).map(
                    (g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ),
                  )}
                </select>
                {editGenres.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {editGenres.map((genre) => (
                      <span
                        key={genre}
                        className="inline-flex items-center gap-1 rounded-full bg-violet-600/20 px-2.5 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/40"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() =>
                            setEditGenres((prev) =>
                              prev.filter((g) => g !== genre),
                            )
                          }
                          className="ml-0.5 rounded-full p-0.5 hover:bg-violet-500/30"
                          aria-label={`Remover ${genre}`}
                        >
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm text-slate-300">
                    Duração (min)
                  </label>
                  <input
                    name="durationMinutes"
                    type="number"
                    min="1"
                    step="1"
                    value={editForm.durationMinutes}
                    onChange={handleEditChange}
                    className="h-11 w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Imagem do filme
                </label>
                <label
                  className={`group relative inline-flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isUploadingEditImage
                      ? "cursor-not-allowed border-slate-700 bg-slate-800/60 text-slate-500"
                      : "border-violet-500/60 bg-violet-600/10 text-violet-300 hover:border-violet-400 hover:bg-violet-600/25 hover:text-violet-200 active:scale-[0.98]"
                  }`}
                >
                  {isUploadingEditImage ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4"
                        />
                      </svg>
                      Upload de imagem
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleEditImageUpload}
                    disabled={isUploadingEditImage}
                  />
                </label>
                {editForm.imageUrl && (
                  <p className="mt-1.5 truncate text-xs text-slate-500">
                    {editForm.imageUrl}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Trailer (YouTube)
                </label>
                <input
                  name="trailer"
                  type="url"
                  value={editForm.trailer}
                  onChange={handleEditChange}
                  className="h-11 w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 text-sm text-slate-100 focus:border-violet-500 focus:outline-none"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700/70"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                >
                  {isSavingEdit ? "Salvando..." : "Editar Filme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
