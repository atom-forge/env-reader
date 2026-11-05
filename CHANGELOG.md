# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.2.0] - 2026-11-05

### Added

- Add an English BookMD documentation book in `book/` with installation, value parsing, URL mapping, path handling, and integration guidance, including Mermaid diagrams and callouts explaining implementation limitations.
- Add a test suite (`bun test`) for value parsing, URL mapping, and path handling, plus compile-time `DeepReadonly` checks, with `test`, `typecheck`, and `check` scripts.
- Add a CI workflow that type-checks, tests, and builds on pushes to `main` and on pull requests.
- Add an "Upgrading" book chapter (`book/upgrading.md`) with a migration guide from 0.1.6 covering every breaking change and what to do about it.
- Add an MIT `LICENSE` file.
- Add documentation rules in `AGENTS.md`: the `book/` BookMD book is the source of truth (intro, usage chapters, upgrading, AI Notes); changes flow one way to `docs/en/` (a single page or chapter files mirroring the book, depending on size; AI Notes stays book-only) and then to its Hungarian translation in `docs/hu/`; every change that may require user action is documented in `book/upgrading.md` (with `Unreleased` as the target version until it is decided) and marked **Breaking:** in the changelog; `README-AI.md` is kept in sync with the AI Notes chapter.
- Add `homepage` and `bugs` metadata to `package.json`.
- **Breaking:** declare `node >= 18` in `engines`.

### Changed

- Translate the BookMD documentation book from Hungarian to English and set its language to `en`.
- Drop the numeric prefixes from the book chapter file names (e.g. `book/01-start.md` → `book/start.md`); the order is defined only by `children` in `book/book.md`.
- **Breaking:** with `stayInProject = false`, relative `file()`/`dir()` paths are now resolved against the project root instead of the process working directory.
- **Breaking:** `regex()`, `file()`, and `dir()` now throw on an empty value instead of returning a match-everything pattern or the project root.
- **Breaking:** `int()` and `float()` validate the whole value: partial numbers such as `12px`, `Infinity`, `NaN`, and unsafe integers are rejected, and `int()` throws on a radix outside 2–36.
- Test files are now type-checked (`@types/bun` dev dependency).
- `oneOf()` accepts readonly (`as const`) arrays.
- **Breaking:** `DeepReadonly` keeps functions, `URL`, `RegExp`, `Date`, and `Error` types intact (functions stayed uncallable before) and maps arrays, maps, and sets to their readonly variants.
- **Breaking:** the invalid default URL is no longer included in the error message, so credentials in it are not leaked; malformed percent-encoding in URL maps now reports the affected selector instead of a bare `URI error`.
- Publish `docs/`, `README-AI.md`, and `LICENSE` in the npm package, so the documentation referenced by the AI entrypoint is available after installation.
- The release script now maintains the CHANGELOG comparison links, refuses to run on a dirty tree or outside `main`, and runs checks and the build before tagging.
- The publish workflow fails on a tag/version mismatch instead of silently bumping and runs checks before publishing.
- List `types` before `import` in package `exports` and use a `git+https` repository URL.
- Replace `docs/README.md` with `docs/en/index.md`, a single-page English guide derived from the book (including the upgrading notes), and its Hungarian translation `docs/hu/index.md`; both ship in the npm package and are linked from `README.md`.
- Restructure `README-AI.md` into essential usage rules, a minimal working example (ESM-safe project root), common extensions, and a documentation map pointing to `docs/en` and `docs/hu`.
- Add the audience and an AI Notes pointer to the book intro.

### Removed

- **Breaking:** drop JSR publishing support (`jsr.json`); the package is published to npm only.
- Remove the unreferenced `bookmd-llm.md` BookMD authoring reference from the repository root; it contained a broken link to a missing `authoring.md`.

### Fixed

- `file()`/`dir()` no longer reject paths when the project root has a trailing slash or is relative; the root is normalized with `path.resolve`.
- **Breaking:** `file()`/`dir()` project-boundary check compares path segments and resolves symlinks, so sibling directories with the same prefix (e.g. `/app-evil` for `/app`) and symlinks pointing outside are rejected.

---

## [0.1.6] - 2026-10-07

### Added

- Add `README-AI.md` as an entrypoint for AI agents, explaining when to use the package and linking to the detailed documentation.

### Changed

- Move the detailed usage guide and API reference to `docs/README.md`, keeping the root `README.md` as a concise introduction for human readers.

---

## [0.1.5] - 2026-08-28

### Added

- Add an `origin` URL map selector.

---

## [0.1.4] - 2026-08-28

### Added

- Add `[selector, defaultValue]` fallbacks for optional URL map values.

---

## [0.1.3] - 2026-08-28

### Added

- Add mapped URL component extraction to `url()`.

---

## [0.1.2] - 2026-08-27

### Changed

- Update package metadata, publishing support files, and the release workflow.

---

## [0.1.1] - 2026-06-01

### Added

- Initial changelog entry

---

[Unreleased]: https://github.com/atom-forge/env-reader/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/atom-forge/env-reader/compare/v0.1.6...v0.2.0
[0.1.6]: https://github.com/atom-forge/env-reader/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/atom-forge/env-reader/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/atom-forge/env-reader/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/atom-forge/env-reader/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/atom-forge/env-reader/releases/tag/v0.1.2
[0.1.1]: https://github.com/atom-forge/env-reader/releases/tag/v0.1.1
