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
      'Este e-mail já está cadastrado. Tente entrar ou use outro endereço.',
  },
  AUTH_EMAIL_NOT_FOUND: {
    code: 'AUTH_EMAIL_NOT_FOUND',
    message: 'Email not found',
    userMessage:
      'Não existe cadastro com este e-mail na plataforma. Verifique o endereço informado.',
  },
  AUTH_UNAUTHORIZED: {
    code: 'AUTH_UNAUTHORIZED',
    message: 'Authentication required',
    userMessage:
      'Sua sessão expirou ou não foi reconhecida. Entre novamente para continuar.',
  },
  AUTH_RESET_TOKEN_INVALID: {
    code: 'AUTH_RESET_TOKEN_INVALID',
    message: 'Password reset token is invalid or expired',
    userMessage:
      'O link de redefinição é inválido ou expirou. Solicite um novo link para continuar.',
  },
  VALIDATION_FAILED: {
    code: 'VALIDATION_FAILED',
    message: 'Validation failed',
    userMessage:
      'Alguns dados enviados são inválidos. Revise os campos destacados e tente novamente.',
  },
  RESOURCE_NOT_FOUND: {
    code: 'RESOURCE_NOT_FOUND',
    message: 'Resource not found',
    userMessage: 'Não encontramos o recurso solicitado.',
  },
  ACCESS_FORBIDDEN: {
    code: 'ACCESS_FORBIDDEN',
    message: 'Access denied',
    userMessage: 'Você não tem permissão para executar esta ação.',
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
      'Não foi possível enviar a imagem agora. Tente novamente em instantes.',
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
