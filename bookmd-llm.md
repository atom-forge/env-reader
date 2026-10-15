# BookMD authoring reference for LLMs

This file is written to be given to an AI assistant that writes or edits the Markdown of a BookMD collection. It is a compact, rule-first summary of the [authoring guide](authoring.md); where the two disagree, the guide wins.

## What BookMD builds

BookMD turns Markdown files into a static website: a **collection** (the site) with a catalogue of **books**; a book has **pages** (one Markdown file each) arranged in a tree. There is no central tree file: every page declares its own direct children.

## Files and the collection

```tree
content/
  books.md              # entry file of the collection: lists the books
  my-book/
    book.md             # front page of the book (its folder is the book's root)
    01-intro.md
    02-next.md
    img/diagram.png
```

`books.md` (path set by `entrypoint` in `portal.config.ts`):

```md
---
branding: My School
books:                         # the older key name "courses" is still accepted
  - "[[my-book/book.md]]"
  - "main@github.com/owner/repo/path/book.md"   # a book from another GitHub repository
---
# Catalogue text
```

## Frontmatter reference

Every list below holds **quoted** wikilinks or Markdown links, because unquoted `[[x]]` is parsed by YAML as a nested list.

| Field | Where | Meaning |
|---|---|---|
| `books` | collection entry file | Ordered list of books: `"[[dir/book.md]]"` or a Git source. (`courses` is the older name; never use both.) |
| `branding` | collection entry file | Text in the site header. |
| `name` | book front page | Book name; else `title`, else the first heading. |
| `language` | book front page | **Required.** e.g. `en`, `hu`. |
| `author`, `tags`, `image` | book front page | Optional. `author` and `tags` also work on any page. |
| `intro` | book front page | Short text for the catalogue card: plain text, or one quoted wikilink to a Markdown file whose text is used (`"[[about.md]]"`). |
| `id` | book front page | **Required only for a book included from another repository.** Lower-case letters, digits, single hyphens; at most 64 characters. |
| `publish: true` | book front page | **Required for a book in a private repository** that is included elsewhere; without it the book is left out. |
| `title` | page | Page title (see the order below). |
| `type` | page | `chapter` (numbered, children inherit the prefix), `content` (numbered inside the nearest chapter); anything else or missing is unnumbered. |
| `children` | page | Ordered direct subpages: `"[[page.md]]"` or `"[Custom title](page.md)"`. |
| `sources` | page | Files whose content is appended to this page, in order: `"[[part.md]]"`. |
| `requires`, `teaches` | page | Lists of concept strings, shown in the sidebar. |

Title order: the title in the parent's `children` link, then `title`, then the first heading of the shallowest level, then the file name.

## Rules that are easy to get wrong

- **All paths are relative to the file that contains them**, in `children`, `sources` and in the body. From `part/b.md`, a sibling is `[[c.md]]`, the parent folder is `[[../a.md]]`. A book-root-relative path such as `[[resources/x.md]]` written inside `resources/y.md` points to `resources/resources/x.md` and fails.
- The `.md` extension may be omitted in wikilinks. A Markdown link needs it.
- A page can have **one** parent. A page listed in two `children` lists, a cycle, or the old `series`/`tree` fields are errors. `chapter` in frontmatter is ignored: numbering comes from `type` and the `children` order.
- Instead of `children`, put the subpages in a folder named like the page without `.md` (`algebra.md` + `algebra/01-sets.md`, `algebra/02-functions.md`); they are ordered by file name with numbers compared as numbers. A `children` field, even an empty one, turns this off.
- A book's files may only reference files **inside the book's own folder** (a book from another GitHub repository: inside its own repository, so `../../_common/x.md` works there). A path leaving that is an error; an included book cannot link to another book.
- Pages under a folder named `resources` cannot have `tags`, `requires` or `teaches`.
- Raw HTML in Markdown does not reach the output. Do not rely on it.
- `author`, `tags`, `requires`, `teaches` are not inherited from the book or parent.

## Body syntax

- Standard Markdown with GitHub extensions (tables, task lists, strikethrough).
- Formulas: `$x^2$` inline, `$$E=mc^2$$` display (LaTeX). Chemistry: `$\ce{2H2 + O2 -> 2H2O}$`, `$\pu{12.5 kJ mol-1}$` (mhchem).
- Diagrams: a fenced code block with the language `mermaid`.
- File structures: a fenced block with the language `tree` (nesting by indentation, trailing `/` for folders, `# comment`, `**highlight**`, `...` for more); pasted `tree` command output works.
- Code blocks are syntax highlighted. A block can show a file's text: ```` ```ts file=examples/server.ts lines=10-20 ```` (empty body; `lines` optional, `5-` means to the end; the path is relative to the page and stays inside the book). The Obsidian plugin forms also work: an `embed-ts` block with `PATH:` / `LINES:` lines (`vault://` paths start at the book root) and `` ```codefile path:10-20 ``.
- Callouts (Obsidian syntax): `> [!tip] Title`, with `+` (open) or `-` (closed) after the type for collapsible ones. Types: note, abstract, info, todo, tip, success, question, warning, failure, danger, bug, example, quote.
- Links to other pages: `[[page]]`, `[[page#heading|Custom text]]` or `[text](page.md)`. Links in the body do not change the navigation tree.
- Images: `![alt](img/diagram.png)`. Other files: `[slides](slides.pdf)`. They are copied into the site and keep their file name.
- **Downloads:** end a link with `#!download` to offer the file as it is, even a `.md` file: `[notes](docs/llm.md#!download)` or `[[docs/llm#!download|notes]]`. A plain link to a `.md` file is a page; a link to any other file type (`[slides](slides.pdf)`) is copied and linked.
- Embeds: a paragraph containing only `[[https://youtu.be/<11-char-id>]]`, a Desmos (`https://www.desmos.com/calculator/<id>`, `…/3d/<id>`) or GeoGebra (`https://www.geogebra.org/m/<id>`) address. Other addresses are plain links.
- **Embeds of other files:** a paragraph containing only `![[path/to/note]]` inserts that Markdown file's body at that place; `![[note#Heading]]` inserts only that section. `![[img.png]]`, `![[img.png|300]]` (width) and `![[img.png|alt text]]` are images. Paths are relative to the current file; links inside the embedded file are relative to it.

## Included books (another GitHub repository)

A line in `books`: `<ref>@github.com/<owner>/<repo>/<path-to-entry.md>`, where `<ref>` is a branch, a tag or a full commit SHA. The entry file's folder is the book's root and the file needs an `id`. A private repository additionally needs `publish: true` in the entry file's frontmatter.

If an included book does not build, the site still builds: the book's last published version is used, or the book is left out, with a warning.

## Minimal examples

A book front page:

```md
---
name: Web Programming
language: en
author: Jane Doe
tags: [web]
intro: How the web works.
children:
  - "[[01-intro.md]]"
  - "[Second part](02-next.md)"
---
# Web Programming
```

A chapter with a download:

```md
---
type: chapter
---
# Introduction

See [[02-next]] and the [exercises](files/exercises.zip#!download).

> [!tip] Hint
> Formulas work: $a^2 + b^2 = c^2$.
```

## Checklist before you finish

1. The book front page has `language`; an included book also has `id` (and `publish: true` if its repository is private).
2. Every list item in `books`, `children` and `sources` is quoted.
3. Every path is relative to the file it is written in, and stays inside the book's folder.
4. Each page is listed under exactly one parent, and the `children` order is the reading order.
5. Chapters have `type: chapter`; their pages have `type: content`.
6. A `.md` file you want downloaded is linked with `#!download` (a plain link to a `.md` file makes a page).
