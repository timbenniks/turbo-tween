# Contributing to Turbo-Tween

Thanks for your interest in contributing!

## Getting Started

```bash
# Clone the repo
git clone https://github.com/timbenniks/turbo-tween.git
cd turbo-tween

# Install dependencies
pnpm install

# Run dev server (for examples)
pnpm dev
```

## Development Workflow

```bash
pnpm test          # Run unit tests
pnpm test:watch    # Run tests in watch mode
pnpm typecheck     # TypeScript type checking
pnpm lint          # ESLint
pnpm format        # Prettier (auto-fix)
pnpm format:check  # Prettier (check only)
pnpm build         # Build the library
pnpm size          # Check bundle size limits
```

## Pull Requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Add or update tests for any new functionality
4. Ensure all checks pass: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`
5. Create a changeset if your change affects the public API: `pnpm changeset`
6. Open a pull request

## Code Style

- Formatting is enforced by Prettier (see `.prettierrc`)
- Linting is enforced by ESLint (see `eslint.config.js`)
- No `any` types -- use `unknown` with type narrowing
- Keep the bundle small -- check `pnpm size` before submitting

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
