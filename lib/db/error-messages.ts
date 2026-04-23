export function getDatabaseUnavailableMessage(): string {
  if (process.env.NODE_ENV === "development") {
    return "База данных недоступна. Проверьте DATABASE_URL и локальный PostgreSQL.";
  }

  return "Сервис временно недоступен. Попробуйте позже.";
}
