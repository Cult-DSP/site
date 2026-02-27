# CULT DSP — Website

Plain HTML/CSS/JS marketing site for CULT DSP. No build step required.
Hosted on Cloudflare Pages.

## File Structure

```
/
├── index.html       ← Home page (hero + features + project previews + CTA)
├── projects.html    ← Full project listing (Spatial Root, Spatial Seed)
├── docs.html        ← Documentation link hub
├── about.html       ← Mission + bio
├── contact.html     ← Email + GitHub + mailto form
├── style.css        ← All styles — one file, CSS variables in :root
├── nav.js           ← Minimal JS: mobile hamburger toggle only
├── sitemap.xml      ← SEO sitemap
├── robots.txt       ← Search engine directives
└── README.md        ← This file
```

---

## How to Edit Content

### Text Content (any page)
Open the relevant `.html` file and edit the text directly.
Look for comments like `<!-- EDIT: ... -->` marking the key spots.

### Design Tokens (colors, spacing, fonts)
Open `style.css`. All tokens are CSS variables at the top in `:root { }`.
Change them there and they update everywhere instantly.

### Your Email Address
Search for `hello@cultdsp.com` — appears in `contact.html` (×2). Replace both.

### GitHub Organisation URL
Search for `placeholder-cult-dsp` across all files and replace with your real org name.

---

## How to Edit Project Cards

Project cards live in **`projects.html`** inside clearly labelled comment blocks:

```
<!-- ── PROJECT CARD: SPATIAL ROOT ───────────────────────────── -->
...card content...
<!-- ── END SPATIAL ROOT ──────────────────────────────────────── -->
```

### To edit an existing project:
1. Open `projects.html`
2. Find the `<!-- PROJECT CARD: ... -->` comment for the project
3. Edit these four things inside the card:
   - **Name** → `<h2 class="project-name">` text
   - **Description** → `<p class="project-desc">` text
   - **Tags** → `<span class="tag">` elements inside `.tags`
   - **Links** → `href` values on `.btn` elements in `.project-footer`
   - **Status badge** → the last `<span class="tag">` near the bottom of the card

### To add a new project:
1. Copy an entire `<article class="card project-card">...</article>` block
2. Paste it after the last card, before `<!-- ===== END PROJECT CARDS -->` comment
3. Edit the name, description, tags, links, and status
4. Update the `id=""` attribute (e.g. `id="my-new-project"`)

The preview cards on the **home page** (`index.html`) are separate simplified cards —
update them manually when you update `projects.html`.

---

## Favicon Setup

Add these files to the repo root (not included — generate from your logo):
- `favicon.ico` — 32×32 ICO (browser tab)
- `favicon.svg` — SVG version
- `apple-touch-icon.png` — 180×180 PNG

Generate them at [realfavicongenerator.net](https://realfavicongenerator.net).

---

## SEO

Each page has unique `<title>` and `<meta name="description">`.
Update these if you change the copy:
- `index.html` line 4–5
- `projects.html` line 4–5
- etc.

Replace the `og:url` values with your real domain once confirmed.

---

## Cloudflare Pages Deploy

1. Push this repo to GitHub (or GitLab / Bitbucket).
2. Log in to [Cloudflare Pages](https://pages.cloudflare.com).
3. Click **Create a project → Connect to Git**.
4. Select your repository.
5. Settings:
   - **Build command:** *(leave blank — no build needed)*
   - **Build output directory:** `/` (or leave blank)
6. Click **Save and Deploy**.

Cloudflare will serve the root of your repo directly. All HTML files are
accessible at their filename paths (e.g. `/projects.html`).

### Custom Domain
In the Cloudflare Pages project settings → **Custom domains** → add your domain.
Then update `sitemap.xml` and `robots.txt` with the real domain.

---

## Adding More Pages

1. Copy any existing page (e.g. `about.html`)
2. Update the `<title>`, `<meta name="description">`, and `og:url`
3. Set `aria-current="page"` on the correct nav link
4. Add a link to the new page in every page's `<nav>` and `<footer>`
5. Add the new URL to `sitemap.xml`
