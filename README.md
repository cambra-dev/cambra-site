# Cambra

Marketing and blog site for [cambra.dev](https://cambra.dev) — a new programming system built on a unified model for internet software.

Built with [Astro](https://astro.build), [Tailwind CSS](https://tailwindcss.com), and deployed on [Netlify](https://www.netlify.com).

## Development

Requires Node.js >= 22.12.0.

```sh
npm install
npm run dev
```

The dev server starts at `localhost:4321`.

## Project Structure

```
src/
├── pages/          # Routes (index, blog, thanks)
├── components/     # Astro components (Nav, Hero, Vision, Contact, Team)
├── content/        # Blog posts (Markdown)
├── layouts/        # Page layouts
├── data/           # Structured data (team info)
└── styles/         # Global styles
```

Blog posts are authored as Markdown files in `src/content/blog/` and rendered via Astro's content collections.

## Building

```sh
npm run build
```

Output goes to `dist/`.

## Deploying

The site is hosted on Netlify. Build settings are configured in `netlify.toml`.

Pushes to `main` trigger an automatic production deploy via Netlify's GitHub integration.

**Manual deploy (via CLI):**

```sh
npm run build
npx netlify deploy --prod --dir=dist
```

You'll need to authenticate with `npx netlify login` first.

**DNS:**

The domain `cambra.dev` uses Netlify DNS. Nameservers are configured at the registrar (Namecheap) to point to Netlify's nameservers. SSL is provisioned automatically by Netlify via Let's Encrypt.

## Commands

| Command             | Action                                   |
| :------------------ | :--------------------------------------- |
| `npm install`       | Install dependencies                     |
| `npm run dev`       | Start dev server at `localhost:4321`     |
| `npm run build`     | Build production site to `./dist/`       |
| `npm run preview`   | Preview the build locally before deploy  |
| `npm run astro ...` | Run Astro CLI commands (e.g. `astro add`)|
