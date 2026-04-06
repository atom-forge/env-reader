# @atom-forge/env-reader

Type-safe environment variable reader for TypeScript. Reads, parses, and validates environment variables at startup — so your app fails fast if the environment is misconfigured, not at runtime.

## Installation

```bash
npm install @atom-forge/env-reader
```

## Usage

```typescript
import { EnvReader, asReadonly } from "@atom-forge/env-reader";
import path from "path";

const env = new EnvReader(path.resolve(__dirname, "../"));

const config = asReadonly({
    app: {
        env: env.oneOf("APP_ENV", ["dev", "prod", "test"], "prod"),
    },
    database: {
        connectionString: env.string("DATABASE_URL"),
        maxPool: env.int("DB_POOL_MAX", 20),
    },
    auth: {
        secret: env.string("JWT_SECRET"),
        expiresIn: env.int("JWT_EXPIRATION", 60 * 60 * 8),
    },
});
```

## API

### `new EnvReader(projectRoot: string)`

Instantiate with an absolute path to the project root. Used for resolving `file()` and `dir()` paths.

### Methods

| Method | Returns | Description |
|---|---|---|
| `string(key, default?, trim?)` | `string` | Reads a string. Trims whitespace by default. |
| `int(key, default?, radix?)` | `number` | Parses an integer. Radix defaults to `10`. |
| `float(key, default?)` | `number` | Parses a floating-point number. |
| `boolean(key, default?)` | `boolean` | Parses `true/false`, `yes/no`, `1/0` (case-insensitive). |
| `url(key, default?)` | `URL` | Validates and returns a `URL` object. |
| `regex(key, default?)` | `RegExp` | Validates and returns a `RegExp` object. |
| `oneOf(key, values, default?)` | `T` | Validates the value is one of the allowed strings. |
| `list(key, parser, default?, separator?)` | `T[]` | Splits by separator (default `,`) and parses each item. |
| `file(key, default?, onMissing?, stayInProject?)` | `string` | Resolves an absolute file path. |
| `dir(key, default?, onMissing?, stayInProject?)` | `string` | Resolves an absolute directory path. |

If a variable is missing and has no default, the method throws immediately.

### `asReadonly<T>(value: T): DeepReadonly<T>`

Wraps a config object in a `DeepReadonly` type. Zero runtime cost — pure TypeScript type cast.

```typescript
const config = asReadonly({ db: { host: "localhost" } });
config.db.host = "other"; // TS error
```

### `list` example

```typescript
// ALLOWED_PORTS=80,443,3000
const ports = env.list("ALLOWED_PORTS", v => parseInt(v, 10));
// → [80, 443, 3000]
```

### `file` / `dir` parameters

- `onMissing`: `true` (default) throws on missing path, `false` returns the path silently, or a `(path) => void` callback.
- `stayInProject`: `true` (default) prevents path traversal outside the project root.
