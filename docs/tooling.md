# Tooling

Turbo-Tween uses Vite+ as the primary local toolchain. The goal is simple: contributors and agents should be able to use one command surface instead of remembering separate package-manager, formatter, linter, test-runner, and build-tool commands.

## Core Rule

Prefer `vp` commands first.

- Use `vp install` instead of calling the package manager directly
- Use `vp check` instead of running format, lint, and typecheck separately
- Use `vp test` for Vitest
- Use `vp run <script>` for project scripts such as `build`, `size`, and `test:e2e`
- Use `vp exec <binary>` for one-off local binaries such as `playwright`, `changeset`, and `size-limit`

## Command Guide

| Task                         | Command            | Notes                                                           |
| ---------------------------- | ------------------ | --------------------------------------------------------------- |
| Install dependencies         | `vp install`       | Preferred over `pnpm install`, `npm install`, or `yarn install` |
| Format + lint + typecheck    | `vp check`         | Best default validation command                                 |
| Unit/integration tests       | `vp test`          | Runs the Vitest suite                                           |
| Watch tests                  | `vp test watch`    | Good for local test-driven work                                 |
| End-to-end tests             | `vp run test:e2e`  | Runs Playwright                                                 |
| Build JS bundles only        | `vp build`         | Uses `vite.config.ts` directly                                  |
| Build JS + declaration files | `vp run build`     | Wraps `vp build` plus `tsc --emitDeclarationOnly`               |
| Check bundle budgets         | `vp run size`      | Uses `size-limit` through `vp exec`                             |
| Create a changeset           | `vp run changeset` | Release metadata for public API changes                         |

## Which Build Command Should I Use?

Use `vp build` when you only need to verify the Vite/Rolldown bundle output.

Use `vp run build` when you are validating the package the way consumers will see it. That script does two things:

1. Runs `vp build` to generate the JavaScript bundles in `dist/`
2. Runs `tsc --emitDeclarationOnly` to generate `.d.ts` files

If you changed exports, public types, package metadata, or release behavior, prefer `vp run build`.

## Testing Model

Turbo-Tween has two different test layers:

- `vp test` runs the Vitest suite for library logic and component behavior
- `vp run test:e2e` runs Playwright for browser-level behavior

`vp test` does not run Playwright. If you changed browser orchestration, preview behavior, or example flows, run both.

## Configuration Files

These files matter most when working on tooling:

- `vite.config.ts` - single source of truth for Vite+, Oxlint, Oxfmt, and library bundling
- `vitest.config.ts` - Vitest runtime settings
- `playwright.config.ts` - Playwright browser test settings
- `tsconfig.json` - shared TypeScript settings
- `tsconfig.build.json` - declaration build settings
- `.oxfmtignore` - formatter ignore list
- `.vite-hooks/pre-commit` - generated hook entrypoint from `vp config`

## Dependency Guardrails

Do not add the following unless there is a strong, documented reason:

- `vite`
- `vitest`
- `eslint`
- `prettier`
- `vite-plugin-dts`
- `@typescript-eslint/*`

Vite+ already provides the toolchain wrappers those packages previously supported in this repo.

## Recommended Validation Flow

For most changes:

```bash
vp check
vp test
```

For changes that affect package output, public types, or release behavior:

```bash
vp check
vp test
vp run build
```

For changes that could affect browser behavior:

```bash
vp check
vp test
vp run test:e2e
```

For changes that could affect bundle size:

```bash
vp check
vp test
vp run build
vp run size
```

## Notes For AI Agents

- Start with `vp install` if the dependency state may have changed
- Prefer reading `vite.config.ts` before assuming how tooling works
- Avoid reintroducing direct `vite`, `vitest`, `eslint`, or `prettier` dependencies
- If you need a project-local binary, prefer `vp exec <binary>` over raw `npx` or direct `node_modules/.bin`
