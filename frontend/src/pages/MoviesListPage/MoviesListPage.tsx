import { useEffect, useState } from "react";
import { useMoviesStore } from "../../store/movies.store";
import { useAuthStore } from "../../store/auth.store";

export function MoviesListPage() {
  const {
    movies,
    isLoading,
    error,
    page,
    totalPages,
    search,
    getMoviesAction,
    setSearch,
    setPage,
    resetError,
  } = useMoviesStore();

  const { token } = useAuthStore();
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    getMoviesAction(page, 10, search);
  }, [page, search, getMoviesAction]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setPage(1);
    setSearch("");
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">
          Por favor, faça login para ver seus filmes.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Meus Filmes</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg flex justify-between items-center">
            <p className="text-red-200">{error}</p>
            <button
              onClick={resetError}
              className="text-red-200 hover:text-red-100 font-semibold"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8 flex gap-2">
          <input
            type="text"
            placeholder="Buscar filmes por título..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            Buscar
          </button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
            >
              Limpar
            </button>
          )}
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        )}

        {/* Movies Grid */}
        {!isLoading && movies.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {movies.map((movie: (typeof movies)[0]) => (
                <div
                  key={movie.id}
                  className="bg-slate-700 rounded-lg overflow-hidden hover:transform hover:scale-105 transition cursor-pointer group"
                >
                  {/* Movie Image */}
                  {movie.imageUrl && (
                    <div className="relative h-48 overflow-hidden bg-slate-600">
                      <img
                        src={movie.imageUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition"
                      />
                    </div>
                  )}

                  {/* Movie Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2 truncate">
                      {movie.title}
                    </h3>
                    <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                      {movie.description}
                    </p>

                    <div className="space-y-2 text-sm text-slate-400 mb-4">
                      <p>
                        <span className="font-semibold">Lançamento:</span>{" "}
                        {new Date(movie.releaseDate).toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>
                      <p>
                        <span className="font-semibold">Orçamento:</span> R${" "}
                        {parseFloat(movie.budget).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-sm transition">
                        Editar
                      </button>
                      <button className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-sm transition">
                        Deletar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold transition"
                >
                  Anterior
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-3 py-2 rounded font-semibold transition ${
                          page === pageNum
                            ? "bg-blue-600 text-white"
                            : "bg-slate-600 hover:bg-slate-700 text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded font-semibold transition"
                >
                  Próximo
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && movies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg text-slate-300 mb-4">
              {search ? "Nenhum filme encontrado" : "Você ainda não tem filmes"}
            </p>
            {search && (
              <button
                onClick={handleClearSearch}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Limpar busca
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
