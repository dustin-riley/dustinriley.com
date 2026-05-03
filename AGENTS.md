# Agent guidance — dustinriley.com

Same instructions as [CLAUDE.md](./CLAUDE.md). Both files exist so any agent tool — Claude Code, Codex, Cursor, Aider, Gemini, etc. — picks up the same guidance.

## TL;DR

- **Read [DESIGN.md](./DESIGN.md) before any UI / copy / styling change.** It is the source of truth for tokens, components, voice, and motion.
- All design tokens are CSS custom properties prefixed `--ds-*` in `src/styles/tokens.css`. Component CSS lives in `src/styles/design-system.css`.
- **Sentence case. First person. No emoji.** Three radii, three shadows, one primary, two accents — don't invent more.
- For text-as-link, use `--ds-link`, not `--ds-primary` (WCAG AA).
- Color alone never communicates state — pair with elevation, motion, or an icon.

See [CLAUDE.md](./CLAUDE.md) for the full guidance and project layout.
