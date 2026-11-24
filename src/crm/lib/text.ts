/** Utilidades de texto: normalización para búsqueda y para el asistente. */

/** Minúsculas, sin tildes ni signos, espacios colapsados. */
export function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[¿?¡!.,;:()"'«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Solo dígitos de un teléfono; para comparar se usan los últimos 9. */
export function phoneKey(phone: string) {
  return phone.replace(/\D/g, '').slice(-9);
}

export function emailKey(email: string) {
  return email.trim().toLowerCase();
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  const local = digits.slice(-9);
  if (local.length === 9) return `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  return phone;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidPhone(phone: string) {
  return phone.replace(/\D/g, '').length >= 9;
}

export function initialsOf(name: string) {
  return name
    .replace(/^(Dr|Dra|Sra|Sr|Lic|Mg)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function formatBytes(kb: number) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${Math.round(kb)} KB`;
}

export function pluralize(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

/** Primer nombre con mayúscula inicial, para saludar. */
export function firstName(full: string) {
  const first = full.trim().split(/\s+/)[0] ?? '';
  return first ? first[0].toUpperCase() + first.slice(1).toLowerCase() : '';
}

export function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
