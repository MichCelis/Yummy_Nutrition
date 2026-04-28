const MX_TZ = 'America/Mexico_City'

/**
 * Formatea un timestamp ISO a hora local de México.
 * El backend envía UTC, esta función fuerza la conversión a hora México
 * sin importar la zona del navegador.
 */
export function formatDateTimeMx(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('es-MX', {
    timeZone: MX_TZ,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Solo la hora en formato 24h (México).
 */
export function formatTimeMx(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('es-MX', {
    timeZone: MX_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

/**
 * Fecha legible larga (México), capitalizada.
 * Ej: "Lunes, 27 De Abril De 2026"
 */
export function formatDateLongMx(iso) {
  if (!iso) return ''
  const formatted = new Date(iso).toLocaleDateString('es-MX', {
    timeZone: MX_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return formatted.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Devuelve la clave de día YYYY-MM-DD según hora México.
 * Útil para agrupar logs por día del usuario (no por día UTC).
 */
export function getDayKeyMx(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: MX_TZ })
}