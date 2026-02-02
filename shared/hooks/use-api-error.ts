// hooks/use-api-error.ts
import axios from 'axios';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { ApiClientError } from '../api/client';

const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Проверьте подключение к интернету',
  NOT_FOUND: 'Данные не найдены',
  UNAUTHORIZED: 'Необходима авторизация',
  FORBIDDEN: 'Нет доступа',
  VALIDATION_ERROR: 'Проверьте введенные данные',
  SERVER_ERROR: 'Ошибка сервера, попробуйте позже',
  UNKNOWN_ERROR: 'Произошла ошибка',
};

export function useApiError() {
  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiClientError) {
      const message = ERROR_MESSAGES[error.code] || error.message;

      toast.error(message);

      // Специальная обработка
      if (error.status === 401) {
        // Редирект на логин
      }

      return;
    }

    if (axios.isAxiosError(error)) {
      if (!error.response) {
        toast.error(ERROR_MESSAGES.NETWORK_ERROR);
        return;
      }

      const status = error.response.status;

      if (status === 401) {
        toast.error(ERROR_MESSAGES.UNAUTHORIZED);
        return;
      }
      if (status === 403) {
        toast.error(ERROR_MESSAGES.FORBIDDEN);
        return;
      }
      if (status === 404) {
        toast.error(ERROR_MESSAGES.NOT_FOUND);
        return;
      }
      if (status === 400 || status === 422) {
        toast.error(ERROR_MESSAGES.VALIDATION_ERROR);
        return;
      }
      if (status >= 500) {
        toast.error(ERROR_MESSAGES.SERVER_ERROR);
        return;
      }

      toast.error(ERROR_MESSAGES.UNKNOWN_ERROR);
      return;
    }

    // Сетевая ошибка
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      toast.error(ERROR_MESSAGES.NETWORK_ERROR);
      return;
    }

    toast.error(ERROR_MESSAGES.UNKNOWN_ERROR);
  }, []);

  return { handleError };
}