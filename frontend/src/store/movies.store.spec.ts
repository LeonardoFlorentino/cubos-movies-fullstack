import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMoviesStore } from "./movies.store";
import { createMovie, deleteMovie, getMovieById, getMovies } from "../lib/api";

vi.mock("../lib/api", () => ({
  getMovies: vi.fn(),
  getMovieById: vi.fn(),
  createMovie: vi.fn(),
  deleteMovie: vi.fn(),
}));

const mockedGetMovies = vi.mocked(getMovies);
const mockedGetMovieById = vi.mocked(getMovieById);
const mockedCreateMovie = vi.mocked(createMovie);
const mockedDeleteMovie = vi.mocked(deleteMovie);

describe("useMoviesStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMoviesStore.setState({
      movies: [],
      currentMovie: null,
      isLoading: false,
      error: null,
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      search: "",
      genre: "",
    });
  });

  it("loads paginated movies successfully", async () => {
    mockedGetMovies.mockResolvedValue({
      data: [
        {
          id: "1",
          title: "Interstellar",
          description: "Sci-fi movie",
          releaseDate: "2014-11-07",
          budget: "165000000",
          genres: ["Drama", "Sci-Fi"],
          durationMinutes: 169,
          imageUrl: null,
          trailer: null,
          ownerId: "u1",
          createdAt: "2026-05-01T00:00:00.000Z",
          updatedAt: "2026-05-01T00:00:00.000Z",
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });

    await useMoviesStore.getState().getMoviesAction(1, 10, "inter");

    const state = useMoviesStore.getState();
    expect(state.movies).toHaveLength(1);
    expect(state.movies[0]?.title).toBe("Interstellar");
    expect(state.search).toBe("inter");
    expect(state.error).toBeNull();
  });

  it("stores error when loading movies fails", async () => {
    mockedGetMovies.mockRejectedValue(new Error("Network error"));

    await useMoviesStore.getState().getMoviesAction();

    const state = useMoviesStore.getState();
    expect(state.movies).toHaveLength(0);
    expect(state.error).toBe("Network error");
    expect(state.isLoading).toBe(false);
  });

  it("returns true on successful movie creation", async () => {
    mockedCreateMovie.mockResolvedValue({
      id: "2",
      title: "Dune",
      description: "Epic sci-fi",
      releaseDate: "2021-10-22",
      budget: "165000000",
      genres: ["Aventura", "Sci-Fi"],
      durationMinutes: 155,
      imageUrl: null,
      trailer: null,
      ownerId: "u1",
      createdAt: "2026-05-01T00:00:00.000Z",
      updatedAt: "2026-05-01T00:00:00.000Z",
    });

    const result = await useMoviesStore.getState().createMovieAction({
      title: "Dune",
      description: "Epic sci-fi",
      releaseDate: "2021-10-22",
      budget: 165000000,
    });

    expect(result).toBe(true);
    expect(useMoviesStore.getState().error).toBeNull();
  });

  it("removes movie from local state after successful deletion", async () => {
    mockedDeleteMovie.mockResolvedValue({ message: "deleted" });

    useMoviesStore.setState({
      movies: [
        {
          id: "movie-1",
          title: "Movie 1",
          description: "Description",
          releaseDate: "2026-01-01",
          budget: "100",
          genres: ["Drama"],
          durationMinutes: 100,
          imageUrl: null,
          trailer: null,
          ownerId: "u1",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "movie-2",
          title: "Movie 2",
          description: "Description",
          releaseDate: "2026-01-02",
          budget: "200",
          genres: ["Ação"],
          durationMinutes: 115,
          imageUrl: null,
          trailer: null,
          ownerId: "u1",
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    });

    await useMoviesStore.getState().deleteMovieAction("movie-1");

    const state = useMoviesStore.getState();
    expect(state.movies).toHaveLength(1);
    expect(state.movies[0]?.id).toBe("movie-2");
    expect(state.error).toBeNull();
  });

  it("loads a movie by id", async () => {
    mockedGetMovieById.mockResolvedValue({
      id: "movie-9",
      title: "Blade Runner 2049",
      description: "Neo-noir sci-fi",
      releaseDate: "2017-10-06",
      budget: "150000000",
      genres: ["Sci-Fi", "Drama"],
      durationMinutes: 164,
      imageUrl: null,
      trailer: null,
      ownerId: "u1",
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });

    await useMoviesStore.getState().getMovieByIdAction("movie-9");

    const state = useMoviesStore.getState();
    expect(state.currentMovie?.id).toBe("movie-9");
    expect(state.error).toBeNull();
  });
});
