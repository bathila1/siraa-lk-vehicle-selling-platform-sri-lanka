/**
 * Server-side markdown renderer for blog posts.
 *
 * Uses a small custom parser that supports:
 * - Headings (#, ##, ###)
 * - Bold, italic, code, links
 * - Lists (-, *, 1.)
 * - Blockquotes (>)
 * - Code blocks (```)
 * - Images (![alt](url))
 * - Paragraphs
 *
 * Keeps everything HTML-safe by escaping first, then injecting tags.
 * Avoids heavy dependencies and runs entirely server-side.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInline(text: string): string {
  let out = escapeHtml(text);

  // Code spans
  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 px-1 py-0.5 text-[0.9em] font-mono">$1</code>');
  // Bold + italic
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Links — only allow http(s)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-[var(--brand-green)] hover:underline">$1</a>');
  return out;
}

function parseMarkdown(md: string): string {
  const lines = md.split(/\r?\n/);
  const html: string[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith('```')) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      html.push(
        `<pre class="my-4 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100"><code>${escapeHtml(
          code.join('\n'),
        )}</code></pre>`,
      );
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,3})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      const cls =
        level === 1
          ? 'text-2xl font-bold mt-8 mb-3 text-[var(--brand-deep)]'
          : level === 2
          ? 'text-xl font-bold mt-6 mb-2 text-[var(--brand-deep)]'
          : 'text-lg font-semibold mt-5 mb-2 text-[var(--brand-deep)]';
      html.push(`<h${level} class="${cls}">${renderInline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quote.push(lines[i].slice(2));
        i++;
      }
      html.push(
        `<blockquote class="my-4 border-l-4 border-[var(--brand-green)] bg-[var(--brand-bg)] py-2 pl-4 italic text-gray-600">${renderInline(
          quote.join(' ',
        ))}</blockquote>`,
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ul class="my-3 list-disc space-y-1 pl-6 text-gray-700">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ol class="my-3 list-decimal space-y-1 pl-6 text-gray-700">${items.join('')}</ol>`);
      continue;
    }

    // Image
    const img = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
    if (img) {
      html.push(
        `<img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" class="my-5 w-full rounded-xl" loading="lazy" />`,
      );
      i++;
      continue;
    }

    // Blank line → skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph (gather consecutive non-blank lines)
    const paragraph: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('#') &&
      !lines[i].startsWith('>') &&
      !lines[i].startsWith('```') &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i]);
      i++;
    }
    html.push(`<p class="my-3 text-gray-700 leading-relaxed">${renderInline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}

export function MarkdownBody({ content }: { content: string }) {
  const html = parseMarkdown(content ?? '');
  return (
    <div
      className="prose-content text-base"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
