/**
 * Locale and time zone used for every user-facing date/time format.
 *
 * Passing both explicitly to `toLocale*String` makes the server render and the
 * browser hydration produce identical text, regardless of the host machine's
 * locale/time zone (avoids SSR hydration mismatches).
 */
export const APP_LOCALE = "es-VE";
export const APP_TIME_ZONE = "America/Caracas";
