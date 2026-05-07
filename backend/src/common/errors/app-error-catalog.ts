export interface AppErrorDefinition {
  code: string;
  message: string;
  userMessage: string;
}

export const APP_ERROR_CATALOG = {
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_INVALID_CREDENTIALS',
    message: 'Invalid credentials',
    userMessage:
      'E-mail ou senha incorretos. Confira seus dados e tente novamente.',
  },
  AUTH_EMAIL_ALREADY_IN_USE: {
    code: 'AUTH_EMAIL_ALREADY_IN_USE',
    message: 'Email already in use',
    userMessage:
      'Este e-mail ja esta cadastrado. Tente entrar ou use outro endereco.',
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_UNAUTHORIZED',
    message: 'Authentication required',
    userMessage:
      'Sua sessao expirou ou nao foi reconhecida. Entre novamente para continuar.',
  },
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    message: 'Validation failed',
    userMessage:
      'Alguns dados enviados sao invalidos. Revise os campos destacados e tente novamente.',
  },
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
    userMessage: 'Nao encontramos o recurso solicitado.',
  },
  ACCESS_FORBIDDEN: {
    code: 'ACCESS_FORBIDDEN',
    message: 'Access denied',
    userMessage: 'Voce nao tem permissao para executar esta acao.',
  },
  MOVIE_IMAGE_REQUIRED: {
    code: 'MOVIE_IMAGE_REQUIRED',
    message: 'Image file is required',
    userMessage: 'Selecione uma imagem para continuar com o envio.',
  },
  MOVIE_IMAGE_TYPE_INVALID: {
    code: 'MOVIE_IMAGE_TYPE_INVALID',
    message: 'Image format is invalid',
    userMessage: 'Use uma imagem JPG, JPEG, PNG ou WEBP.',
  },
  MOVIE_IMAGE_TOO_LARGE: {
    code: 'MOVIE_IMAGE_TOO_LARGE',
    message: 'Image exceeds maximum allowed size',
    userMessage: 'Imagem muito grande. Tamanho máximo: 5MB.',
  },
  STORAGE_UPLOAD_FAILED: {
    code: 'STORAGE_UPLOAD_FAILED',
    message: 'Could not upload image',
    userMessage:
      'Nao foi possivel enviar a imagem agora. Tente novamente em instantes.',
  },
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    userMessage: 'Ocorreu um erro inesperado. Tente novamente em instantes.',
  },
} satisfies Record<string, AppErrorDefinition>;

export type AppErrorCode = keyof typeof APP_ERROR_CATALOG;

export function getAppErrorDefinition(code: AppErrorCode): AppErrorDefinition {
  return APP_ERROR_CATALOG[code];
}
