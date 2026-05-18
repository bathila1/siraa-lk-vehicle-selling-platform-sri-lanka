import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-border)] mt-16 py-8 text-sm text-gray-500">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <span className="font-bold text-[var(--brand-deep)]">Siraa.lk</span>
          <span className="lang-si text-xs">· අභිමානවත් ශ්‍රී ලාංකීය නිර්මාණයකි</span>
        </div>
        <nav className="flex flex-wrap gap-4 justify-center">
          {[
            { href: '/about', label: 'About' },
            { href: '/blog', label: 'Blog' },
            { href: '/contact', label: 'Contact' },
            { href: '/terms', label: 'Terms' },
            { href: '/privacy', label: 'Privacy' },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[var(--brand-green)] transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <p>© {year} Siraa.lk</p>
      </div>
    </footer>
  );
}
