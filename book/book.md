---
title: Env Reader
subtitle: "@atom-forge/env-reader"
author: AtomForge
id: atom-forge-env-reader
language: en
tags: [typescript, configuration, environment]
intro: Typed application configuration from environment variables, validated at startup.
children:
  - "[[start.md]]"
  - "[[values.md]]"
  - "[[urls.md]]"
  - "[[paths.md]]"
  - "[[integration.md]]"
  - "[[upgrading.md]]"
  - "[AI Notes](ai-notes.md)"
---
# @atom-forge/env-reader

This book shows how to read environment configuration in TypeScript applications: from installation to a typed configuration object, from URL mapping to filesystem paths.

`EnvReader` reads the current values of `process.env` with synchronous methods. Errors surface when you call those methods, so to validate at startup you must build the configuration when the application starts.

The book is for developers of Node-compatible TypeScript applications (Node.js, Bun, Deno with Node compatibility) who want their configuration typed and validated in one place.

> [!tip] Recommended reading order
> Start with the [[start|Getting Started]] chapter, then read the data types you need. [[integration|Integration and Error Handling]] gives a complete configuration example. Upgrading from an earlier version? Read [[upgrading|Upgrading]]. Working with a coding agent? [AI Notes](ai-notes.md) has instructions you can copy into your project.

## What you get

- Required and default configuration values.
- Parsing of strings, numbers, booleans, lists, and regular expressions.
- URL objects and typed URL component mapping.
- Resolution of file and directory paths.
- Deeply readonly TypeScript types through `asReadonly`.

> [!note] Runtime environment
> The package uses `process.env` and the Node-compatible `fs` and `path` modules. It is not a browser-side configuration library and not a `.env` loader.
