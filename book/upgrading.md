---
title: Upgrading
type: chapter
requires: [reading values, path resolution]
teaches: [upgrading between versions]
---
# Upgrading

This chapter collects the changes that may require action when you upgrade. Each section covers one version step; read every section between your current and your target version. The complete list of changes, including the ones that need no action, is in the changelog.

## From 0.1.6 to 0.2.0

```sh
npm install @atom-forge/env-reader@latest
```

Most of the changes make validation stricter. A configuration that was accepted before may now abort startup with an error: that is intentional, because the old result was usually wrong. Start the application in every environment you deploy to (development, CI, staging, production) and fix the variables that are reported.

### Numbers must be complete

`int()` and `float()` used to accept anything that `parseInt` or `parseFloat` could start reading. Now the whole value must be a number.

| Value | 0.1.x | New |
|---|---|---|
| `int`: `"12px"` | `12` | error |
| `int`: `"1.5"` | `1` | error |
| `int`: `"1e3"` | `1` | error |
| `int`: `"99999999999999999999"` | imprecise number | error |
| `float`: `"Infinity"`, `"1e999"` | `Infinity` | error |
| `float`: `"1,5"` | `1` | error |
| `float`: `"0x10"` | `0` | error |

`int()` with radix 16 still accepts a `0x` prefix. A radix outside 2–36 now throws as soon as the method is called.

**What to do:** fix the environment values so they contain only the number (for example `PORT=3000`, not `PORT=3000/tcp`). If you relied on the lenient parsing on purpose, read the value with `string()` and parse it yourself.

### Empty values are rejected by more methods

`KEY=""` (or a value of only whitespace) now throws in `regex()`, `file()` and `dir()`.

| Method | 0.1.x result for an empty value | New |
|---|---|---|
| `regex()` | `/(?:)/`, which matches every string | error |
| `dir()` | the project root | error |
| `file()` | error (the project root is not a file) | error with a clearer message |

The default still applies only to a missing variable, not to an empty one.

**What to do:** remove empty assignments from your environment files so the default takes effect, or set a real value.

### `stayInProject = false` resolves relative paths from the project root

In 0.1.x, `file()` and `dir()` resolved a relative path against the **process working directory** when `stayInProject` was `false`, and against the project root otherwise. Now a relative path always counts from the project root; `stayInProject = false` only turns off the boundary check.

```typescript
const env = new EnvReader("/srv/app");
// LOG_DIR=../logs, process started in /srv/app/dist

env.dir("LOG_DIR", undefined, true, false);
// 0.1.x: /srv/app/logs   (relative to the working directory)
// New:   /srv/logs       (relative to the project root)
```

**What to do:** search your code for calls that pass `false` as the fourth argument. If their environment values are relative, rewrite them relative to the project root, or use absolute paths, which behave the same as before.

### The project boundary is stricter

With the default `stayInProject = true`, the boundary check used to be a plain string prefix test. Now it compares path segments and resolves symlinks.

- A sibling directory with the same prefix (`/srv/app-data` for the root `/srv/app`) is no longer accepted.
- A symlink inside the project that points outside it is rejected, also when the target file does not exist yet.

**What to do:** if a path is legitimately outside the project, for example a mounted volume or a symlinked shared directory, pass `stayInProject = false` for that call.

### Error messages

- An invalid default URL is no longer repeated in the message, so credentials in it do not end up in logs: `Env variable default is not a valid url: KEY`.
- Malformed percent-encoding in a URL map is reported as `Malformed percent-encoding in URL component: <selector>` instead of `URI error`.
- An empty value is reported as `Env variable type failed: KEY (regex) - empty pattern` or `... (dir) - empty path`.

**What to do:** only relevant if your code or monitoring matches on message text. Prefer matching on the variable name.

### TypeScript types

- `asReadonly()` keeps functions, `URL`, `RegExp`, `Date` and `Error` values as they are. Functions in the configuration are now callable (in 0.1.x they lost their call signature); a `URL` field now has the type `URL` instead of a readonly copy of its properties.
- Arrays, `Map` and `Set` values become `readonly` arrays, `ReadonlyMap` and `ReadonlySet`. Code that called mutating methods on them, such as `push`, no longer compiles; that was always a mistake, since the object is meant to be read-only.

**What to do:** run the type checker and fix any mutation of the readonly configuration it reports.

### Package and runtime

- The package declares `node >= 18` in `engines`.
- The package is published to npm only; the JSR version stays at 0.1.1 and will not be updated.

**What to do:** if you run an older Node.js, upgrade it to 18 or later. If you installed the package from JSR, switch to the npm package.
