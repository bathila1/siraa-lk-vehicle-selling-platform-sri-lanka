import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-[var(--color-border)] py-8 text-sm text-gray-500">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div className="flex items-center gap-1">
          <span className="font-bold text-[var(--brand-deep)]">Siraa.lk</span>
          <span className="lang-si text-xs">· අභිමානවත් ශ්‍රී ලාංකීය නිර්මාණයකි</span>
        </div>
        <nav className="flex flex-wrap justify-center gap-4">
          {[
            { href: '/about', label: 'About' },
            { href: '/blog', label: 'Blog' },
            { href: '/contact', label: 'Contact' },
            { href: '/terms', label: 'Terms' },
            { href: '/privacy', label: 'Privacy' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-colors hover:text-[var(--brand-green)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <p>© {year} Siraa.lk</p>
      </div>
    </footer>
  );
}
