---
title: Env Reader
subtitle: "@atom-forge/env-reader"
author: AtomForge
id: atom-forge-env-reader
language: en
tags: [typescript, configuration, environment]
intro: Typed application configuration from environment variables, validated at startup.
children:
  - "[[01-start.md]]"
  - "[[02-values.md]]"
  - "[[03-urls.md]]"
  - "[[04-paths.md]]"
  - "[[05-integration.md]]"
  - "[AI Notes](ai-notes.md)"
---
# @atom-forge/env-reader

This book shows how to read environment configuration in TypeScript applications: from installation to a typed configuration object, from URL mapping to filesystem paths.

`EnvReader` reads the current values of `process.env` with synchronous methods. Errors surface when you call those methods, so to validate at startup you must build the configuration when the application starts.

> [!tip] Recommended reading order
> Start with the [[01-start|Getting Started]] chapter, then read the data types you need. [[05-integration|Integration and Error Handling]] closes the book with a complete configuration example.

## What you get

- Required and default configuration values.
- Parsing of strings, numbers, booleans, lists, and regular expressions.
- URL objects and typed URL component mapping.
- Resolution of file and directory paths.
- Deeply readonly TypeScript types through `asReadonly`.

> [!note] Runtime environment
> The package uses `process.env` and the Node-compatible `fs` and `path` modules. It is not a browser-side configuration library and not a `.env` loader.
