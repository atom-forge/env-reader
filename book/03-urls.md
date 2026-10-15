---
title: URLs and Mappings
type: chapter
teaches: [URL validation, URL mapping]
---
# URLs and Mappings

## The URL object

```typescript
const api = env.url("API_URL", "https://api.example.com/v1/");
console.log(api.hostname); // The hostname of the configured URL
```

The return value is a standard `URL` object. The environment string is trimmed before it is passed to the constructor. The default URL is also parsed and validated.

> [!warning] A valid URL is not necessarily an allowed URL
> The method does not restrict the protocol to HTTPS and does not apply a host allowlist. If your use case needs that, check the `protocol` and `hostname` fields separately.

## Typed component mapping

```typescript
// S3_URL=s3://accessKey:secretKey@storage.example.com/assets/files/
const storage = env.url("S3_URL", {
    map: {
        accessKey: "username",
        secretKey: "password",
        host: "hostname",
        bucket: "path(0)",
        prefix: ["path(1,end)", ""],
    },
});
// bucket: "assets", prefix: "files/"; every field is a string
```

The second argument is the options object: `map` and an optional `defaultValue`. The output keys match the keys of the map; every value is a string.

| Selector | Meaning |
|---|---|
| `protocol` | Protocol with a colon, for example `https:`. |
| `username`, `password` | Percent-decoded credential components. |
| `hostname` | Hostname without the port. |
| `host` | Hostname with the port, if the URL object keeps one. |
| `port` | Port as a string; may be empty. |
| `origin` | String assembled as `${protocol}//${host}`. |
| `path` | Decoded pathname without the leading `/`. |
| `hash` | Fragment including the `#`, when present. |
| `path(index)` | One decoded path segment. |
| `path(start,end)` | Inclusive segment range; the end index may be `end`. |
| `query("name")` | Value of the first query parameter with that name; single quotes also work. |

The URL constructor may normalize values, for example by removing a default port. Here `origin` is assembled by the package itself, not taken directly from the `URL.origin` property.

## Path segments

Indexing is zero-based; a negative index counts from the end. Indexed selectors drop empty segments during the split.

For the path `/assets/images/logo.svg`:

- `path(0)` → `assets`
- `path(-1)` → `logo.svg`
- `path(1,end)` → `images/logo.svg`

When a range reaches the last segment, it keeps the URL's trailing `/` if there was one. Selecting a single segment does not add it.

## Fallbacks, precisely

```typescript
const endpoint = env.url("SERVICE_URL", {
    defaultValue: "https://api.example.com/v1/",
    map: {
        host: "hostname",
        token: ['query("token")', ""],
        extraPath: ["path(2,end)", ""],
    },
});
```

> [!warning] Not every empty component triggers a fallback
> A fallback applies only to a missing query parameter and to a path segment out of range. A missing `username`, `password`, `port`, or `hash` comes back as an empty string even without a fallback. `?token=` also yields an empty string, not the default.

An invalid selector or malformed percent-encoding is not swallowed by the fallback. Mapping errors are prefixed with `Env variable URL map failed: KEY - ...`.

Continue with [[04-paths|Files and Directories]].
