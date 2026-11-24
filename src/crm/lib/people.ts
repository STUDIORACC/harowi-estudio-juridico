import type { Member } from '../types';

/** «Dra. Jovana Quispe» a partir de «Jovana Quispe Mendoza». */
export function memberShort(m: Pick<Member, 'name' | 'title'>) {
  const parts = m.name.split(/\s+/);
  return `${m.title} ${parts.slice(0, 2).join(' ')}`.trim();
}

/** «Dra. Jovana Quispe Mendoza». */
export function memberFull(m: Pick<Member, 'name' | 'title'>) {
  return `${m.title} ${m.name}`.trim();
}

/** Artículo según el tratamiento: «la Dra.» / «el Dr.». */
export function memberWithArticle(m: Pick<Member, 'name' | 'title'>) {
  const article = m.title.toLowerCase().startsWith('dra') || m.title.toLowerCase().startsWith('sra') ? 'la' : 'el';
  return `${article} ${memberShort(m)}`;
}

/** «a la Dra. Jovana Quispe» / «al Dr. Andrés Salazar». */
export function memberA(m: Pick<Member, 'name' | 'title'>) {
  const female = m.title.toLowerCase().startsWith('dra') || m.title.toLowerCase().startsWith('sra');
  return female ? `a la ${memberShort(m)}` : `al ${memberShort(m)}`;
}
