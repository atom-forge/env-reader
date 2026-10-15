# AI Notes

A coding agent works best when it reads the documentation of the package first and knows the decisions your project has already made. Copy the fenced block below into the instruction file of your project (for example `AGENTS.md`) and replace every `<...>` field with a fact you have verified in your application.

## Purpose

Read environment values into typed configuration at startup rather than throughout
application logic.

## Copyable instructions

```markdown
## AtomForge Env Reader

Before using `@atom-forge/env-reader`, start with
`node_modules/@atom-forge/env-reader/README-AI.md` at the package root, then follow
its documentation pointers. Follow dependency symlinks to the library repository
when present and use documentation matching the installed version. This is a
filesystem Markdown path, not a package import subpath.

Read and validate configuration once at startup with `EnvReader`, then pass the
result to the code that needs it. Avoid scattered `process.env` reads. Choose an
explicit parser for each value and add domain constraints where needed. Missing
required configuration should fail early; defaults must be intentional.

Pass an absolute project-root path to the reader. Environment-file loading is
runtime-owned; constructing the reader does not load a `.env` file. Keep the
default project-boundary protection for file and directory paths unless an
external location is explicitly required.

Keep server secrets out of browser-visible configuration and logs. `asReadonly`
provides readonly TypeScript typing, not runtime freezing.
```

## Usage

Copy the block when implementing application configuration. Variable names and
defaults belong to the target application, not this reusable note.
