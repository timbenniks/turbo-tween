# Testing

Turbo-Tween uses multiple validation layers. Picking the right one keeps feedback fast without skipping the checks that matter.

## Test Layers

| Layer                                | Command           | Purpose                                       |
| ------------------------------------ | ----------------- | --------------------------------------------- |
| Formatting, linting, and type checks | `vp check`        | Fast repo-wide quality gate                   |
| Unit and integration tests           | `vp test`         | Core logic, adapters, and component behavior  |
| End-to-end browser tests             | `vp run test:e2e` | Browser orchestration and served app behavior |
| Package output validation            | `vp run build`    | JavaScript bundles plus declaration files     |
| Bundle size validation               | `vp run size`     | Ensures size budgets still pass               |

## Fastest Useful Loops

### Working on library internals

```bash
vp check
vp test
```

### Working on browser behavior or dev-server flows

```bash
vp check
vp test
vp run test:e2e
```

### Working on exports, public types, or release output

```bash
vp check
vp test
vp run build
```

### Working on performance-sensitive or bundle-sensitive code

```bash
vp check
vp test
vp run build
vp run size
```

## Important Distinctions

- `vp test` runs Vitest, not Playwright
- `vp run test:e2e` runs the Playwright suite defined in `package.json`
- `vp build` only builds JavaScript bundles
- `vp run build` is the release-oriented build because it also emits `.d.ts` files

## When To Run Playwright

Run Playwright when your change affects:

- browser-only behavior
- Vite dev-server integration
- end-to-end animation flows
- rendered example behavior
- wiring between served assets and browser code

You usually do not need Playwright for a small internal utility or math-only change if `vp check` and `vp test` already cover it.
