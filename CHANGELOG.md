# Changelog

## 0.1.0 — 2026-09-16

Initial release. Extracted unchanged from the
[blink](https://github.com/lojell/blink) VS Code extension:

- `token<T>(description)` — branded token usable as a parameter decorator
  (`@Tok` or `@Tok()`).
- `Inject(key)` — parameter decorator for concrete-class keys.
- `Container` — `register(token, class)`, `register(Class)`,
  `register(key, factory)`; lazy singletons; circular-dependency detection with
  the resolution chain; decorator-coverage validation at registration.
- ESM + CJS builds with type declarations.
