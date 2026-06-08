# Personal Website

This is the personal website of Moritz Lampert, live at **[lampert.ai](https://lampert.ai)**.

It is a static site built with [Jekyll](https://jekyllrb.com/) and hosted on
[GitHub Pages](https://pages.github.com/).

## Tech stack

- **[Jekyll](https://jekyllrb.com/)** (via the [`github-pages`](https://github.com/github/pages-gem)
  gem, which pins Jekyll and all plugins to the exact versions GitHub Pages runs in production).
- **[GitHub Pages](https://pages.github.com/)** for hosting, with a custom domain set via
  the [`CNAME`](CNAME) file.
- A **dev container** for a reproducible local environment (Ruby + Jekyll, plus Python/uv
  and pre-commit tooling).

## Project structure

```
.
├── _config.yml        # Site-wide settings (title, author, URL, SASS, build excludes)
├── _layouts/          # Page templates (default.html wraps every page)
├── _includes/         # Reusable snippets (header, banner, footer, icons/)
├── _sass/             # SCSS partials (libs/) — compiled to CSS by Jekyll
├── _data/             # Content data (publications, talks, awards) as YAML
├── *.html             # Pages — each has YAML front matter + content
├── assets/            # Adapted HTML5UP template: SCSS entry, JS, fonts
│   └── css/main.scss  # SCSS entry point → Jekyll compiles it to main.css
├── images/            # Images used across the site
├── CNAME              # Custom domain for GitHub Pages
└── _site/             # Build output (generated, git-ignored)
```

Each page (e.g. [`index.html`](index.html)) starts with a YAML _front matter_ block that
sets `layout: default` plus per-page variables (`title`, `description`, banner options, …).
Jekyll injects the page body into [`_layouts/default.html`](_layouts/default.html), which in
turn pulls in the shared [`_includes/`](_includes/) snippets — so the markup lives in one
place instead of being copy-pasted across pages.

## Content (publications, talks, awards)

The entries on the Publications, Talks, and Awards pages are **data, not markup**: they live in
[`_data/publications.yml`](_data/publications.yml), [`_data/talks.yml`](_data/talks.yml), and
[`_data/awards.yml`](_data/awards.yml). The pages ([`publications.html`](publications.html),
[`talks.html`](talks.html), [`awards.html`](awards.html)) just loop over that data, so to
add/edit/remove an entry you only touch the YAML.

- **Publication** — `title`, `authors`, `venue`, and `links` (each `{ type: pdf | code, url: … }`).
  Listed top-to-bottom in file order (newest first).
- **Talk** — `title`; `event` (text before the linked name) plus optional `event_name` +
  `event_url`; `date` (`YYYY-MM-DD`); optional `location`, `recording` (URL → a "Watch Recording"
  link), `abstract`, and `abstract_label` (defaults to "Abstract"; use "Zusammenfassung" for German).
  Talks are sorted by `date` and grouped by year automatically — order in the file doesn't matter.
  In an `abstract`, leave a **blank line** to get a line break.
- **Award** — `name`, the `url` it links to, `thesis` title, and `institution`.

## Local development

### Recommended: dev container

The repo ships a [dev container](.devcontainer/) with Ruby 3.3, Jekyll, and the pre-commit
tooling preinstalled.

1. Open the folder in **VS Code** with the _Dev Containers_ extension installed.
2. Run **“Dev Containers: Reopen in Container”**.
3. On first create, `postCreateCommand` runs automatically:
   - `bundle install` — installs the Ruby gems (Jekyll + GitHub Pages).
   - `pre-commit install` — wires up the git pre-commit hook.

Port **4000** (Jekyll's default) is forwarded to your host.

> Without the dev container you'll need Ruby and Bundler installed locally, then run
> `bundle install` yourself.

### Serve the site locally

```bash
bundle exec jekyll serve
```

Then open **http://localhost:4000**. Jekyll watches for changes and rebuilds automatically;
refresh the browser to see edits. (Changes to `_config.yml` require restarting the server.)

Useful variants:

```bash
bundle exec jekyll serve --livereload   # auto-refresh the browser on change
bundle exec jekyll serve --drafts       # also render files in _drafts/
```

### Build without serving

```bash
bundle exec jekyll build
```

This writes the generated static site to `_site/` (git-ignored). This is the same output
GitHub Pages produces — handy for inspecting the final HTML.

## Pre-commit hooks

A [`.pre-commit-config.yaml`](.pre-commit-config.yaml) runs on every commit (against the
staged files). It auto-formats whitespace, line endings, and CSS/JS/Markdown/YAML/JSON
(via Prettier), and blocks commits with merge markers, private keys, oversized files, or
leaked secrets (via gitleaks). The vendored `assets/` directory and Liquid `.html` templates
are deliberately excluded from the formatters.

Run the hooks across the whole repo (e.g. after first setup):

```bash
pre-commit run --all-files
pre-commit autoupdate    # bump pinned hook versions
```

## Deployment

Deployment is automatic: **pushing to the default branch publishes the site.** GitHub Pages
builds the Jekyll project server-side and serves it at the custom domain configured in
[`CNAME`](CNAME) ([lampert.ai](https://lampert.ai)). There is no separate build/deploy step
to run — just push.

## HTML Template

This website is **adapted** from the great [Alpha](https://html5up.net/alpha) template by
[HTML5 UP](https://html5up.net/), provided under the
[Creative Commons Attribution 3.0 License](https://html5up.net/license) (which permits
modification with attribution).

Modifications from the original template include:

- **Jekyll conversion** — layouts, includes, and per-page front matter (the original ships as
  plain static HTML).
- **SASS compiled by Jekyll** — the SCSS entry point
  [`assets/css/main.scss`](assets/css/main.scss), together with the partials in
  [`_sass/libs/`](_sass/libs/), is the single source of truth; Jekyll generates
  `assets/css/main.css` at build time (it is no longer hand-committed). Site-specific overrides
  live in [`_sass/libs/_custom.scss`](_sass/libs/_custom.scss), imported last.
- **Custom D3 graph background** ([`assets/js/network.js`](assets/js/network.js)) drawn behind the
  page content.

The template's color palette and main stylesheet are otherwise unchanged from stock Alpha — the only
visual customizations live in [`_sass/libs/_custom.scss`](_sass/libs/_custom.scss).

The HTML5 UP attribution is retained in the site footer ([`_includes/footer.html`](_includes/footer.html)).

## Icons

Icons are **inline SVGs** (FontAwesome was removed to save ~350 KB). Each icon is a small file in
[`_includes/icons/`](_includes/icons/) whose first line is an HTML comment recording its **source and
license**. They are pulled into a page with a Liquid include and inherit the surrounding text colour
via `fill: currentColor` (sized by the `.icon svg` rule in
[`_sass/libs/_custom.scss`](_sass/libs/_custom.scss)).

### Adding an icon

1. **Find an SVG.** Brand/logo marks: [Simple Icons](https://simpleicons.org) (CC0). UI glyphs:
   [Heroicons](https://heroicons.com) (MIT) or [Font Awesome Free](https://fontawesome.com/search?o=r&m=free)
   (icons under CC BY 4.0 — keep the attribution comment the SVG ships with).
2. **Save it** as `_includes/icons/<name>.svg`. Strip any `<title>`/`role="img"`, and on the `<svg>`
   tag set `fill="currentColor" aria-hidden="true" focusable="false"` (keep the `viewBox`). Add a
   first-line comment: `<!-- <Name> — <source>, <license> -->`.
3. **Use it** inside a link or a `<span class="icon">`, giving the link an `aria-label`:
   ```liquid
   <a href="https://example.com/me" class="icon" aria-label="Example">{% include icons/example.svg %}</a>
   ```
   Inside a `ul.icons` list the icon renders at `1.75em`; elsewhere it is `1em`.
