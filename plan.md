http://plan.md

# Astro Config + Layout Enhancements Plan

**Overall Progress:** `100%`

## Tasks

- [x] 🟩 **Step 1: Align dependencies + tooling**
  - [x] 🟩 Decide which new packages (e.g., `@astrojs/node`, `@astrojs/sitemap`, `vite-plugin-pwa`, `astro-seo`) are required and add them to `package.json`
  - [x] 🟩 Ensure scripts/config (e.g., `format`, `build`) still make sense with the new tooling

- [x] 🟩 **Step 2: Extend Astro config**
  - [x] 🟩 Import `seoConfig` + any new integrations/plugins
  - [x] 🟩 Configure `site`, integrations array, Node adapter (if kept), and any needed Vite options (aliases already present, plus optional proxy/dev settings)
  - [x] 🟩 Wire in the PWA plugin using the shared `manifest`

- [x] 🟩 **Step 3: Add shared SEO manifest utilities**
  - [x] 🟩 Create `utils/seoConfig.ts` exporting the provided `seoConfig` + `manifest`
  - [x] 🟩 Verify both `astro.config.mjs` and `Layout.astro` can import from this path without tsconfig issues

- [x] 🟩 **Step 4: Rebuild `Layout.astro` for SEO**
  - [x] 🟩 Import global styles + new `SEO` component
  - [x] 🟩 Implement the prop structure (defaults, absolute image helper) minus the omitted components/routes
  - [x] 🟩 Render meta tags + `<SEO />` with values from props/`seoConfig`, excluding analytics/scripts you asked to omit

- [x] 🟩 **Step 5: Add public info files**
  - [x] 🟩 Create `public/humans.txt` with the supplied team/site info
  - [x] 🟩 Create `public/robots.txt` allowing full crawl
