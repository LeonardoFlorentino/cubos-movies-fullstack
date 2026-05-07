import { beforeEach, describe, expect, it, vi } from "vitest";
import { login, uploadMovieImage } from "./api";
import { ApiError } from "./api-error";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe("uploadMovieImage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  it("uploads image with bearer token and returns imageUrl", async () => {
    localStorage.setItem("cubos_movies_token", "token-123");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        imageUrl: "https://cdn.example.com/poster.jpg",
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["binary"], "poster.jpg", { type: "image/jpeg" });
    const result = await uploadMovieImage(file);

    expect(result.imageUrl).toBe("https://cdn.example.com/poster.jpg");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ Authorization: "Bearer token-123" });
    expect(options.body).toBeInstanceOf(FormData);
  });

  it("throws a user-friendly message for 413 payload too large", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      text: vi.fn().mockResolvedValue("payload too large"),
    });

    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["binary"], "huge.jpg", { type: "image/jpeg" });

    await expect(uploadMovieImage(file)).rejects.toThrow(
      "Imagem muito grande. Tamanho máximo: 5MB.",
    );
  });

  it("throws backend message for non-413 upload errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("Invalid image format"),
    });

    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["binary"], "poster.gif", { type: "image/gif" });

    await expect(uploadMovieImage(file)).rejects.toThrow(
      "Invalid image format",
    );
  });
});

describe("login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("localStorage", new MemoryStorage());
  });

  it("throws a typed ApiError with the friendly backend message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: {
        get: vi.fn().mockReturnValue("application/json"),
      },
      json: vi.fn().mockResolvedValue({
        error: {
          code: "AUTH_INVALID_CREDENTIALS",
          message: "Invalid credentials",
          userMessage:
            "E-mail ou senha incorretos. Confira seus dados e tente novamente.",
          statusCode: 401,
          path: "/auth/login",
          timestamp: "2026-05-07T00:00:00.000Z",
        },
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({ email: "leo@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject<ApiError>({
      name: "ApiError",
      code: "AUTH_INVALID_CREDENTIALS",
      statusCode: 401,
      userMessage:
        "E-mail ou senha incorretos. Confira seus dados e tente novamente.",
    });
  });
});
