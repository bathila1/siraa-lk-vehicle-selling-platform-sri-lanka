'use client';

import { useState } from 'react';
import { Share2, Check, Link as LinkIcon, MessageCircle, Facebook } from 'lucide-react';

interface Props {
  /** Full URL to share (absolute). Falls back to current URL. */
  url?: string;
  /** Title shown in share text. */
  title: string;
  /** Optional extra context (e.g. price, location). */
  description?: string;
  /** Display size — compact for inline use. */
  size?: 'default' | 'compact';
}

/**
 * Share buttons row.
 *
 * On mobile (where Web Share API is available), the main button triggers
 * the native sheet with WhatsApp/SMS/etc. — that's how Sri Lankan users
 * actually share things.
 *
 * Always shows secondary buttons (WhatsApp, copy, Facebook) so people who
 * prefer a specific channel get one-tap access.
 */
export function ShareButtons({ url, title, description, size = 'default' }: Props) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState(url ?? '');

  // Resolve current URL on the client if not provided
  if (!shareUrl && typeof window !== 'undefined') {
    setShareUrl(window.location.href);
  }

  const text = description ? `${title} — ${description}` : title;
  const shareText = `${text}\n\n${shareUrl}`;

  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || !('share' in navigator)) {
      // Fall back to copy
      handleCopy();
      return;
    }
    try {
      await navigator.share({ title, text, url: shareUrl });
    } catch {
      // User cancelled — no-op
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Older browsers — show prompt
      window.prompt('Copy this link:', shareUrl);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  // Compact: just 4 icon buttons in a row
  if (size === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <IconButton
          href={whatsappUrl}
          label="WhatsApp"
          color="bg-[#25D366]"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
        </IconButton>
        <IconButton
          href={facebookUrl}
          label="Facebook"
          color="bg-[#1877F2]"
        >
          <Facebook className="h-4 w-4 fill-current" />
        </IconButton>
        <IconButton onClick={handleCopy} label={copied ? 'Copied!' : 'Copy link'} color="bg-gray-700">
          {copied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
        </IconButton>
      </div>
    );
  }

  // Default: full row with labels + native share trigger
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-gray-500">Share this</p>
      <div className="flex flex-wrap items-center gap-2">
        {/* WhatsApp — biggest button since most SL users use it */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
        >
          <MessageCircle className="h-4 w-4 fill-current" />
          WhatsApp
        </a>

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-3 py-2 text-sm font-medium text-white shadow-sm transition-transform active:scale-95"
        >
          <Facebook className="h-4 w-4 fill-current" />
          Facebook
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--brand-green)] active:scale-95"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-[var(--brand-green)]" />
              Copied!
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              Copy link
            </>
          )}
        </button>

        {/* Native share — only useful on mobile */}
        <button
          type="button"
          onClick={handleNativeShare}
          className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[var(--brand-green)] active:scale-95 sm:hidden"
        >
          <Share2 className="h-4 w-4" />
          More
        </button>
      </div>
    </div>
  );
}

function IconButton({
  href,
  onClick,
  label,
  color,
  children,
}: {
  href?: string;
  onClick?: () => void;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  const className = `${color} flex h-8 w-8 items-center justify-center rounded-full text-white transition-transform hover:scale-110 active:scale-95`;
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener"
        aria-label={label}
        title={label}
        className={className}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={className}
    >
      {children}
    </button>
  );
}
