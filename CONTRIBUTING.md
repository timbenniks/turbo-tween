# Contributing to Turbo-Tween

Thanks for your interest in contributing!

## Getting Started

```bash
# Clone the repo
git clone https://github.com/timbenniks/turbo-tween.git
cd turbo-tween

# Install dependencies
vp install

# Run dev server (for examples)
vp dev
```

## Development Workflow

```bash
vp test            # Run unit tests
vp test watch      # Run tests in watch mode
vp run test:e2e    # Run Playwright end-to-end tests
vp check           # Format, lint, and typecheck
vp build           # Build JavaScript bundles only
vp run build       # Build JavaScript bundles and declaration files
vp run size        # Check bundle size limits
```

## Validation Matrix

- Use `vp check` for formatting, linting, and TypeScript validation.
- Use `vp test` for the Vitest suite.
- Use `vp run test:e2e` for Playwright coverage when changing browser-facing behavior.
- Use `vp run build` before release-oriented changes, export changes, or type changes.
- Use `vp run size` when changing code that could affect bundle footprint.

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests for any new functionality
4. Ensure all checks pass: `vp check && vp test && vp run build`
5. Create a changeset if your change affects the public API: `vp run changeset`
6. Open a pull request

## Code Style

- Formatting is enforced by Oxfmt through Vite+
- Linting is enforced by Oxlint through Vite+
- No `any` types -- use `unknown` with type narrowing
- Keep the bundle small -- check `vp run size` before submitting
- Prefer `vp exec <binary>` for project-local CLIs such as `playwright`, `changeset`, and `size-limit`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
