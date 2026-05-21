import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowLeft, Calendar, User } from 'lucide-react';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';
import { MarkdownBody } from '@/components/blog/MarkdownBody';
import { JsonLd, breadcrumbSchema } from '@/components/shared/JsonLd';
import { createServiceClient } from '@/lib/supabase/server';
import { timeAgo } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, cover_image_url, meta_description')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (!post) return { title: 'Post not found' };

  const p = post as any;
  return {
    title: p.title,
    description: p.meta_description ?? p.excerpt ?? p.title,
    openGraph: {
      title: p.title,
      description: p.meta_description ?? p.excerpt ?? '',
      images: p.cover_image_url ? [{ url: p.cover_image_url }] : [],
      type: 'article',
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .lte('published_at', new Date().toISOString())
    .single();

  if (!post) notFound();
  const p = post as any;

  // Increment view count (fire-and-forget)
  await supabase
    .from('blog_posts')
    .update({ view_count: (p.view_count ?? 0) + 1 } as any)
    .eq('id', p.id);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.excerpt ?? p.meta_description,
    image: p.cover_image_url ? [p.cover_image_url] : [],
    datePublished: p.published_at,
    dateModified: p.updated_at ?? p.published_at,
    author: { '@type': 'Person', name: p.author_name ?? 'Siraa Team' },
    publisher: {
      '@type': 'Organization',
      name: 'Siraa.lk',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/icon.png` },
    },
    mainEntityOfPage: `${siteUrl}/blog/${p.slug}`,
  };

  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: siteUrl },
    { name: 'Blog', url: `${siteUrl}/blog` },
    { name: p.title, url: `${siteUrl}/blog/${p.slug}` },
  ]);

  return (
    <>
      <JsonLd data={[articleSchema, breadcrumb]} />
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-6">
        <Link
          href="/blog"
          className="mb-4 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[var(--brand-green)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to all posts
        </Link>

        <article>
          <h1 className="mb-3 text-3xl font-bold leading-tight text-[var(--brand-deep)] md:text-4xl">
            {p.title}
          </h1>

          {p.excerpt && (
            <p className="mb-5 text-lg text-gray-600 leading-relaxed">{p.excerpt}</p>
          )}

          <div className="mb-6 flex items-center gap-4 border-b border-[var(--color-border)] pb-5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {p.author_name ?? 'Siraa Team'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(p.published_at).toLocaleDateString('en-LK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          {p.cover_image_url && (
            <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl">
              <Image
                src={p.cover_image_url}
                alt={p.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                priority
                className="object-cover"
              />
            </div>
          )}

          <MarkdownBody content={p.content} />
        </article>

        {/* CTA */}
        <div className="mt-10 rounded-2xl bg-gradient-to-br from-[var(--brand-deep)] to-[var(--brand-green)] p-6 text-center text-white">
          <p className="mb-3 text-sm">Looking for your next vehicle?</p>
          <Link
            href="/search"
            className="inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-[var(--brand-deep)] transition-transform hover:scale-105"
          >
            Browse Vehicles →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
