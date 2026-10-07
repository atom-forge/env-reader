# AI entrypoint

This document is the starting point for AI agents evaluating or using `@atom-forge/env-reader`. For usage examples and the public API, continue with the [detailed guide](./docs/README.md).

## What this package is for

`@atom-forge/env-reader` is a type-safe environment variable reader for TypeScript. It reads, parses, and validates environment variables when your application initializes, so configuration errors are detected at startup rather than later at runtime.

It supports strings, integers, floating-point numbers, booleans, URLs, regular expressions, allowed string values, lists, and file or directory paths. It also provides `asReadonly` for typing configuration objects as deeply readonly; this is a TypeScript-only operation, not runtime freezing.

## When to use it

Use this package when a TypeScript application needs to:

- Build a typed configuration object from environment variables.
- Fail fast when required configuration is missing or invalid.
- Provide defaults for optional configuration values.
- Validate allowed values or parse structured values such as lists and URLs.
- Resolve file and directory paths relative to a project root, with an option to prevent paths from escaping that root.

## Continue with the detailed guide

Read [docs/README.md](./docs/README.md) before writing integration code. It contains installation instructions, configuration examples, method signatures, defaults, URL mapping selectors, and path-handling options. The root [README.md](./README.md) is a short introduction for human readers.

Use the detailed guide as the primary usage reference. When modifying this package or checking behavior not covered there, inspect the implementation and relevant tests rather than assuming undocumented behavior.
