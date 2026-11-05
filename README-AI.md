# AI entrypoint

This document is the starting point for AI agents evaluating or using `@atom-forge/env-reader`. It sits at the package root (`node_modules/@atom-forge/env-reader/README-AI.md`); the paths below are relative to it. Use the documentation that ships with the installed version.

## What this package is for

`@atom-forge/env-reader` is a type-safe environment variable reader for TypeScript. It reads, parses, and validates environment variables when your application initializes, so configuration errors are detected at startup rather than later at runtime. It supports strings, integers, floats, booleans, allowed string values, regular expressions, URLs (including typed component mapping), lists, and file or directory paths.

It is not a `.env` loader, not a schema validator, and not for browser code: it reads `process.env` and uses Node-compatible `fs` and `path`.

## Essential usage rules

- Read and validate configuration once, at startup, in a single module; pass the result to the code that needs it instead of reading `process.env` elsewhere.
- Pass an absolute project root to `new EnvReader(root)`. `process.cwd()` is only correct if the app always starts from the project root.
- Load `.env` files (if any) before building the configuration; `EnvReader` does not load them.
- A default applies only to a **missing** variable. An empty value (`KEY=""`) is present: `string()` returns `""`, `list()` returns `[]`, every other method throws.
- Required secrets get no default. Defaults are returned as-is, without validation.
- `int()`/`float()` check the number format, not the range; add domain checks (ports, pool sizes, URL protocols) yourself. `list()` parsers must throw on invalid items.
- Keep the default `stayInProject = true` for `file()`/`dir()` unless an external location is explicitly required.
- `asReadonly()` is a type-level cast, not `Object.freeze`. Do not log the configuration or `process.env`; some error messages contain values or paths.

## Minimal working example

```typescript
// src/config.ts
import { EnvReader, asReadonly } from "@atom-forge/env-reader";
import { fileURLToPath } from "url";

const env = new EnvReader(fileURLToPath(new URL("../", import.meta.url)));

export const config = asReadonly({
    mode: env.oneOf("APP_ENV", ["dev", "prod", "test"] as const, "prod"),
    port: env.int("PORT", 3000),
    databaseUrl: env.url("DATABASE_URL"),
    jwtSecret: env.string("JWT_SECRET"),
});
```

## Common extensions

```typescript
import * as fs from "node:fs";

const debug = env.boolean("DEBUG", false);                       // true/false, yes/no, 1/0
const hosts = env.list("ALLOWED_HOSTS", v => v, []);             // comma-separated, trimmed
const s3 = env.url("S3_URL", {                                   // typed URL components
    map: { accessKey: "username", secretKey: "password", bucket: "path(0)", prefix: ["path(1,end)", ""] },
});
const cert = env.file("TLS_CERT", "certs/server.pem");           // absolute path, must exist
const cache = env.dir("CACHE_DIR", "var/cache", dir => fs.mkdirSync(dir, { recursive: true }));
```

## Documentation map

- [docs/en/index.md](./docs/en/index.md): the full guide in English — all methods, defaults, URL selectors, path handling, error messages, and the **Upgrading** section with migration notes between versions. Read it before writing integration code.
- [docs/hu/index.md](./docs/hu/index.md): the same guide in Hungarian.
- [CHANGELOG.md](./CHANGELOG.md): every change by version.
- [README.md](./README.md): short introduction for human readers.

The guide is derived from the [Env Reader book](https://books.atom-forge.eu). For behavior the guide does not cover, inspect the compiled implementation in `dist/`, or the TypeScript source and the tests in `test/` of the [source repository](https://github.com/atom-forge/env-reader); do not assume undocumented behavior.
