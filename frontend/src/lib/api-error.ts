export interface ApiErrorPayload {
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
  details?: unknown;
  path?: string;
  timestamp?: string;
}

const FALLBACK_MESSAGES: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS:
    "E-mail ou senha incorretos. Confira seus dados e tente novamente.",
  AUTH_EMAIL_ALREADY_IN_USE:
    "Este e-mail já está cadastrado. Tente entrar ou use outro endereço.",
  AUTH_EMAIL_NOT_FOUND:
    "Não existe cadastro com este e-mail na plataforma. Verifique o endereço informado.",
  AUTH_UNAUTHORIZED:
    "Sua sessão expirou ou não foi reconhecida. Entre novamente para continuar.",
  AUTH_RESET_TOKEN_INVALID:
    "O link de redefinição é inválido ou expirou. Solicite um novo link.",
  VALIDATION_FAILED:
    "Alguns dados enviados são inválidos. Revise os campos e tente novamente.",
  RESOURCE_NOT_FOUND: "Não encontramos o recurso solicitado.",
  ACCESS_FORBIDDEN: "Você não tem permissão para executar esta ação.",
  MOVIE_IMAGE_REQUIRED: "Selecione uma imagem para continuar com o envio.",
  MOVIE_IMAGE_TYPE_INVALID: "Use uma imagem JPG, JPEG, PNG ou WEBP.",
  MOVIE_IMAGE_TOO_LARGE: "Imagem muito grande. Tamanho máximo: 5MB.",
  STORAGE_UPLOAD_FAILED:
    "Não foi possível enviar a imagem agora. Tente novamente em instantes.",
  INTERNAL_SERVER_ERROR:
    "Ocorreu um erro inesperado. Tente novamente em instantes.",
};

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly userMessage: string;
  readonly backendMessage: string;
  readonly details?: unknown;
  readonly path?: string;
  readonly timestamp?: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.userMessage || payload.message || "Algo deu errado.");
    this.name = "ApiError";
    this.code = payload.code;
    this.statusCode = payload.statusCode;
    this.userMessage = payload.userMessage;
    this.backendMessage = payload.message;
    this.details = payload.details;
    this.path = payload.path;
    this.timestamp = payload.timestamp;
  }
}

function normalizeValidationDetails(details: unknown) {
  if (!Array.isArray(details)) {
    return undefined;
  }

  const values = details.filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  );

  return values.length > 0 ? values : undefined;
}

export function createApiError(payload: Partial<ApiErrorPayload>) {
  const code = payload.code ?? "INTERNAL_SERVER_ERROR";
  const userMessage =
    payload.userMessage ?? FALLBACK_MESSAGES[code] ?? "Algo deu errado.";
  const validationDetails = normalizeValidationDetails(payload.details);

  return new ApiError({
    code,
    message: payload.message ?? "Request failed",
    userMessage:
      code === "VALIDATION_FAILED" && validationDetails?.length
        ? validationDetails[0]
        : userMessage,
    statusCode: payload.statusCode ?? 500,
    ...(validationDetails ? { details: validationDetails } : {}),
    ...(payload.path ? { path: payload.path } : {}),
    ...(payload.timestamp ? { timestamp: payload.timestamp } : {}),
  });
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.userMessage;
  }

  return error instanceof Error ? error.message : fallback;
}
