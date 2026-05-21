import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { createServiceClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

export const revalidate = 300; // 5 min cache

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Vehicle buying tips, market insights, and guides for Sri Lankan car buyers and sellers.',
};

export default async function BlogIndexPage() {
  const supabase = createServiceClient();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image_url, author_name, published_at')
    .eq('published', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50);

  return (
    <>
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--brand-deep)] md:text-4xl">Blog</h1>
          <p className="mt-2 text-sm text-gray-500">
            Vehicle buying tips, market insights, and guides.
          </p>
        </div>

        {(!posts || posts.length === 0) ? (
          <div className="py-20 text-center text-gray-400">
            <p>No posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {(posts as any[]).map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block overflow-hidden rounded-xl border border-[var(--color-border)] bg-white transition-all hover:border-[var(--brand-green)] hover:shadow-md"
              >
                {post.cover_image_url && (
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    <Image
                      src={post.cover_image_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="mb-2 line-clamp-2 font-semibold leading-snug text-[var(--brand-black)] group-hover:text-[var(--brand-green)]">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="line-clamp-2 text-sm text-gray-500">{post.excerpt}</p>
                  )}
                  <p className="mt-3 text-xs text-gray-400">
                    {post.author_name ?? 'Siraa Team'} · {timeAgo(post.published_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
