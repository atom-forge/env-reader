# @atom-forge/env-reader

Type-safe environment variable reader for TypeScript. Turn environment variables into a typed configuration object and catch missing or invalid settings at startup — not later at runtime.

## Why use it?

- Read strings, numbers, booleans, and allowed values without repeating parsing logic.
- Define defaults for optional settings and require the ones your application needs.
- Work with URLs, lists, regular expressions, and project-relative file or directory paths.
- Give your configuration deeply readonly TypeScript types with `asReadonly`.

## Installation

```bash
npm install @atom-forge/env-reader
```

## Learn more

- [Detailed guide and API reference](./docs/README.md): usage examples, methods, defaults, URL mapping, and path handling.
- [AI agent entrypoint](./README-AI.md): package overview and guidance for AI-assisted integration.
