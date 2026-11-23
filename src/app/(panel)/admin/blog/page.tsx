import Link from 'next/link';
import { Plus, SquarePen } from 'lucide-react';
import { AdminPageHeader, PostStatusBadge } from '@/components/admin/AdminUI';
import { EmptyState, Table, Td, Tr } from '@/components/ui/Table';
import { adminGetLawyers, adminGetPosts } from '@/lib/data/admin';
import { formatDateShort } from '@/lib/utils';

export const metadata = { title: 'Blog' };

export default async function AdminBlogPage() {
  const [posts, lawyers] = await Promise.all([adminGetPosts(), adminGetLawyers()]);
  const authorName = (id: string | null) =>
    id ? (lawyers.find((lawyer) => lawyer.id === id)?.name ?? '—') : '—';

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description="Artículos del centro de información. Solo los publicados aparecen en el sitio."
        action={
          <Link
            href="/admin/blog/nuevo"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[0.8125rem] text-paper transition-colors hover:bg-ink/85"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Nuevo artículo
          </Link>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          title="Sin artículos"
          description="Publique el primer artículo del centro de información."
        />
      ) : (
        <Table
          caption="Listado de artículos"
          head={['Título', 'Categoría', 'Autor', 'Publicación', 'Estado', '']}
        >
          {posts.map((post) => (
            <Tr key={post.id}>
              <Td className="text-ink">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="font-medium transition-colors hover:text-accent"
                >
                  {post.title}
                </Link>
                <span className="mt-1 block text-2xs text-ink-muted">/blog/{post.slug}</span>
              </Td>
              <Td className="text-[0.8125rem]">{post.category}</Td>
              <Td className="text-[0.8125rem]">{authorName(post.author_id)}</Td>
              <Td className="whitespace-nowrap text-2xs">
                {post.published_at ? formatDateShort(post.published_at.slice(0, 10)) : '—'}
              </Td>
              <Td>
                <PostStatusBadge status={post.status} />
              </Td>
              <Td>
                <Link
                  href={`/admin/blog/${post.id}`}
                  aria-label={`Editar ${post.title}`}
                  className="inline-flex text-ink-muted transition-colors hover:text-ink"
                >
                  <SquarePen className="h-4 w-4" aria-hidden />
                </Link>
              </Td>
            </Tr>
          ))}
        </Table>
      )}
    </>
  );
}
