---
title: Integration and Error Handling
type: chapter
requires: [reading values]
teaches: [readonly configuration, error handling]
---
# Integration and Error Handling

## A single configuration module

The rest of the application should use a pre-built configuration instead of repeating environment reads.

```tree
src/
  config.ts       # Read and validate environment values
  server.ts       # Use the configuration
```

```typescript
// config.ts
import { EnvReader, asReadonly } from "@atom-forge/env-reader";

const env = new EnvReader(process.cwd());
const port = env.int("PORT", 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}

export const config = asReadonly({
    app: {
        mode: env.oneOf("APP_ENV", ["dev", "prod", "test"], "prod"),
        port,
        debug: env.boolean("DEBUG", false),
    },
    database: {
        url: env.url("DATABASE_URL"),
        poolSize: env.int("DB_POOL_MAX", 20),
    },
    auth: {
        secret: env.string("JWT_SECRET"),
    },
});

if (!config.auth.secret) {
    throw new Error("JWT_SECRET must not be empty");
}
```

> [!tip] You define the domain rules
> The minimum pool size, the minimum secret length, the allowed URL protocol, and relationships between fields need separate application-level checks. The library is not a configuration schema or a business validator.

## What does asReadonly mean?

```typescript
const config = asReadonly({ db: { host: "localhost" } });
// config.db.host = "other"; // TypeScript compile error
```

`asReadonly<T>(value: T): DeepReadonly<T>` returns the same object, using a type assertion. It makes no copy and does not call `Object.freeze`.

> [!warning] Type-level protection only
> From JavaScript, or through another mutable reference, the object can still be modified. A readonly type is not runtime immutability or a security boundary.

## Error handling and logging

The methods throw synchronous `Error`s. There is no error report that collects the whole configuration: the first thrown error aborts building the configuration.

| Situation | Example message |
|---|---|
| Missing value | `Missing Env variable (string): DATABASE_URL` |
| Invalid value | `Env variable type failed: PORT (int)` |
| Invalid list item | `Env variable type failed: ALLOWED_PORTS[0] - invalid` |
| URL mapping error | `Env variable URL map failed: SERVICE_URL - ...` |
| Not a file | `Env variable path is not a file: TLS_CERT - ...` |

> [!danger] Secrets in error messages
> Some messages contain a list item, a default URL, or an absolute filesystem path. Think about redaction before logging; do not log the whole configuration object or the contents of `process.env`.

## Integration checklist

- [ ] Loading the environment happens before building the configuration.
- [ ] The project root is absolute and correct regardless of where the app is run from.
- [ ] Required secrets have no convenience default.
- [ ] You check empty strings separately where needed.
- [ ] You validate number ranges and the domain rules of URLs.
- [ ] Services start only after the configuration has been validated.
- [ ] In tests, you restore modified environment variables and clean up temporary files.

> [!note] Repeated reads
> `EnvReader` does not take an environment snapshot. Every method call reads the current `process.env`. The configuration built once above, however, does not update automatically when the environment changes later.
