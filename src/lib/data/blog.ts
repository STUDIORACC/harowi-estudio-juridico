import 'server-only';

import { cache } from 'react';
import { demoAreas, demoLawyers, demoPosts } from '@/content';
import type { BlogPost, BlogPostWithRelations } from '@/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logQueryError } from './helpers';

/**
 * ---------------------------------------------------------------------------
 * BLOG / CENTRO DE INFORMACIÓN
 * ---------------------------------------------------------------------------
 * El sitio público solo muestra artículos con estado «publicado» y fecha de
 * publicación cumplida. Los borradores son visibles únicamente en el panel.
 * ---------------------------------------------------------------------------
 */

const SELECT_WITH_RELATIONS =
  '*, author:lawyers(id, name, slug, role, portrait_tone, photo_url), area:practice_areas(id, name, slug)';

function withDemoRelations(post: BlogPost): BlogPostWithRelations {
  const author = demoLawyers.find((lawyer) => lawyer.id === post.author_id) ?? null;
  const area = demoAreas.find((item) => item.id === post.area_id) ?? null;

  return {
    ...post,
    author: author
      ? {
          id: author.id,
          name: author.name,
          slug: author.slug,
          role: author.role,
          portrait_tone: author.portrait_tone,
          photo_url: author.photo_url,
        }
      : null,
    area: area ? { id: area.id, name: area.name, slug: area.slug } : null,
  };
}

const demoPublished = () =>
  demoPosts
    .filter((post) => post.status === 'publicado')
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .map(withDemoRelations);

export const getPublishedPosts = cache(async (): Promise<BlogPostWithRelations[]> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoPublished();

  const { data, error } = await supabase
    .from('blog_posts')
    .select(SELECT_WITH_RELATIONS)
    .eq('status', 'publicado')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  logQueryError('blog_posts', error);
  if (!data || data.length === 0) return demoPublished();
  return data as unknown as BlogPostWithRelations[];
});

export const getPostBySlug = cache(async (slug: string): Promise<BlogPostWithRelations | null> => {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT_WITH_RELATIONS)
      .eq('slug', slug)
      .eq('status', 'publicado')
      .maybeSingle();

    logQueryError(`blog_posts:${slug}`, error);
    if (data) return data as unknown as BlogPostWithRelations;
  }

  const post = demoPosts.find((item) => item.slug === slug && item.status === 'publicado');
  return post ? withDemoRelations(post) : null;
});

/** Artículos relacionados: misma área si existe, y si no los más recientes. */
export const getRelatedPosts = cache(
  async (post: BlogPostWithRelations, limit = 3): Promise<BlogPostWithRelations[]> => {
    const posts = await getPublishedPosts();
    const others = posts.filter((item) => item.id !== post.id);
    const sameArea = others.filter((item) => post.area_id && item.area_id === post.area_id);
    return [...sameArea, ...others.filter((item) => !sameArea.includes(item))].slice(0, limit);
  },
);

/** Categorías con artículos publicados, para el filtro del listado. */
export const getPostCategories = cache(async (): Promise<string[]> => {
  const posts = await getPublishedPosts();
  return [...new Set(posts.map((post) => post.category))].sort((a, b) => a.localeCompare(b, 'es'));
});
