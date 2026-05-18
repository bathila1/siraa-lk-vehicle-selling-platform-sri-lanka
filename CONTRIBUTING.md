# Contributing to Siraa.lk

Thanks for your interest in contributing! This project is in early development — issues, ideas, and PRs are all welcome.

## Code of Conduct

Be respectful. Be patient. Help others.

## Development setup

See the [Quickstart](./README.md#quickstart) in the README.

## How to contribute

### Reporting bugs

Open a GitHub issue with:

- What you did
- What you expected
- What actually happened
- Browser / device / Node version
- Screenshots if applicable

### Suggesting features

Open a discussion or issue. Describe the use case and the problem it solves. Big features need a quick design discussion before code.

### Submitting code

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes — keep PRs focused
4. Run checks: `npm run lint && npm run typecheck && npm run format:check`
5. Commit using conventional commits (see below)
6. Push and open a PR against `main`

## Code style

- **TypeScript strict mode** — no `any` unless absolutely unavoidable, with a comment explaining why
- **Server components by default** — only use `'use client'` when interactivity requires it
- **Zod for validation** — every input boundary (forms, API routes, env vars) validates with Zod
- **No fetching on the client when SSR works** — keep payloads small
- **Mobile-first CSS** — design for 360px viewport, scale up
- **Image optimization** — always use `next/image` with explicit dimensions
- **Accessibility** — semantic HTML, alt text on every image, keyboard-navigable

Run before pushing:

```bash
npm run lint
npm run typecheck
npm run format
```

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add boost slot ranking to search results
fix: handle empty image array on vehicle detail
docs: clarify Supabase seed steps
refactor: extract OTP rate limit to middleware
perf: index vehicles.search_vector for FTS
chore: bump next to 16.2.7
```

Common types: `feat`, `fix`, `docs`, `refactor`, `perf`, `chore`, `test`, `style`.

## Database changes

- Always create a new migration file in `supabase/migrations/` — never edit an existing one
- Filename format: `NNNNN_short_description.sql` (e.g., `00012_add_vehicle_engine_cc.sql`)
- Each migration must be idempotent (`create table if not exists ...`, `create index if not exists ...`)
- Update `types/database.ts` after schema changes: `npm run db:types`

## Branches

- `main` — always deployable, protected
- `feat/*` — new features
- `fix/*` — bug fixes
- `chore/*` — tooling, deps, non-code
- `docs/*` — documentation only

## PR checklist

Before requesting review:

- [ ] PR title follows conventional commits
- [ ] Description explains _what_ and _why_
- [ ] Screenshots for UI changes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] No `console.log` left behind
- [ ] No secrets in code
- [ ] New env vars added to `.env.example`
- [ ] Migrations included if schema changed

## Need help?

Email: bathi.solutions@gmail.com — or open a discussion.

Thanks for helping make Sri Lanka's vehicle marketplace better. 🇱🇰
