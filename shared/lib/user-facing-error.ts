import { ApiClientError } from "@/shared/api/client";

type UserFacingErrorKind =
  | "network"
  | "not-found"
  | "unauthorized"
  | "forbidden"
  | "server"
  | "validation"
  | "unknown";

export type UserFacingError = {
  kind: UserFacingErrorKind;
  title: string;
  description: string;
  actionLabel: string;
};

type ErrorLike = {
  status?: number;
  code?: string;
  response?: {
    status?: number;
  };
};

function getErrorLike(error: unknown): ErrorLike | null {
  if (!error || typeof error !== "object") {
    return null;
  }

  return error as ErrorLike;
}

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiClientError) {
    return error.status;
  }

  const errorLike = getErrorLike(error);

  return errorLike?.status ?? errorLike?.response?.status;
}

function getErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiClientError) {
    return error.code;
  }

  return getErrorLike(error)?.code;
}

export function getUserFacingError(error: unknown): UserFacingError {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);

  if (code === "NETWORK_ERROR" || status === 0) {
    return {
      kind: "network",
      title: "Сервис временно недоступен",
      description:
        "Не удалось связаться с сервером. Проверьте подключение или попробуйте обновить страницу через минуту.",
      actionLabel: "Повторить",
    };
  }

  if (status === 404 || code === "NOT_FOUND") {
    return {
      kind: "not-found",
      title: "Страница не найдена",
      description:
        "Похоже, ссылка устарела или каталог больше не доступен по этому адресу.",
      actionLabel: "Обновить",
    };
  }

  if (status === 401 || code === "UNAUTHORIZED") {
    return {
      kind: "unauthorized",
      title: "Нужен вход",
      description:
        "Сессия могла закончиться. Войдите снова, чтобы продолжить работу с каталогом.",
      actionLabel: "Повторить",
    };
  }

  if (status === 403 || code === "FORBIDDEN") {
    return {
      kind: "forbidden",
      title: "Нет доступа",
      description:
        "У этой учетной записи нет прав для выполнения действия или просмотра страницы.",
      actionLabel: "Повторить",
    };
  }

  if (status === 400 || status === 422 || code === "VALIDATION_ERROR") {
    return {
      kind: "validation",
      title: "Проверьте данные",
      description:
        "Сервер не смог обработать запрос. Вернитесь назад и проверьте заполненные поля.",
      actionLabel: "Повторить",
    };
  }

  if ((status && status >= 500) || code === "SERVER_ERROR") {
    return {
      kind: "server",
      title: "Что-то сломалось на сервере",
      description:
        "Мы не смогли загрузить данные прямо сейчас. Обычно помогает повторить попытку немного позже.",
      actionLabel: "Повторить",
    };
  }

  return {
    kind: "unknown",
    title: "Что-то пошло не так",
    description:
      "Произошла непредвиденная ошибка. Попробуйте обновить страницу или повторить действие.",
    actionLabel: "Повторить",
  };
}
