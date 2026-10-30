export class StartupError extends Error {
}
export const URL_VARIABLE = "OBJECT_SERVICE_URL";
export const USER_VARIABLE = "OBJECT_SERVICE_USER";
export const PASSWORD_VARIABLE = "OBJECT_SERVICE_PASSWORD";
// Адрес сервиса, пользователь и пароль 1С задаются окружением процесса сервера:
// в коде и в записи подключения их нет. Пустой пароль допустим.
export function loadPublication(env) {
    const url = env[URL_VARIABLE]?.trim() ?? "";
    const user = env[USER_VARIABLE] ?? "";
    const missing = [
        ...(url === "" ? [URL_VARIABLE] : []),
        ...(user === "" ? [USER_VARIABLE] : []),
    ];
    if (missing.length > 0) {
        throw new StartupError(`Не заданы переменные окружения: ${missing.join(", ")}.`);
    }
    return { url: url.replace(/\/+$/, ""), user, password: env[PASSWORD_VARIABLE] ?? "" };
}
