// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Slugs of draft blog posts. Drafts are still built (so they have a shareable
// preview URL) but are excluded from the sitemap here and marked noindex in the
// layout, keeping them undiscoverable until published. Derived from frontmatter
// so there's nothing to hand-maintain — just toggle `draft:` in the post.
const blogDir = fileURLToPath(new URL('./src/content/blog', import.meta.url));
const draftSlugs = readdirSync(blogDir)
  .filter((file) => /\.mdx?$/.test(file))
  .filter((file) => {
    const frontmatter = readFileSync(`${blogDir}/${file}`, 'utf8').split(/^---$/m)[1] ?? '';
    return /^\s*draft:\s*true\s*$/m.test(frontmatter);
  })
  .map((file) => file.replace(/\.mdx?$/, ''));

// Slugs of talks whose deck page should stay out of the sitemap — which is the
// default. A deck is a few dozen words a slide with its substance in hidden
// speaker notes, so it indexes as thin content; the /talks listing carries the
// abstract and is the page worth ranking. Opt a deck in with `indexable: true`.
// Drafts are excluded regardless, matching the blog.
const talksDir = fileURLToPath(new URL('./src/content/talks', import.meta.url));
const hiddenTalkSlugs = readdirSync(talksDir)
  .filter((file) => /\.mdx?$/.test(file))
  .filter((file) => {
    const frontmatter = readFileSync(`${talksDir}/${file}`, 'utf8').split(/^---$/m)[1] ?? '';
    const indexable = /^\s*indexable:\s*true\s*$/m.test(frontmatter);
    const draft = /^\s*draft:\s*true\s*$/m.test(frontmatter);
    return !indexable || draft;
  })
  .map((file) => file.replace(/\.mdx?$/, ''));

// https://astro.build/config
export default defineConfig({
  site: 'https://cambra.dev',
  // css-variables delegates every token color to global.css, where the code
  // palette is defined from the brand colors (see "Code block palette" there).
  markdown: {
    shikiConfig: { theme: 'css-variables' },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      filter: (page) => {
        const url = page.replace(/\/$/, '');
        if (draftSlugs.some((slug) => url.endsWith(`/blog/${slug}`))) return false;
        if (hiddenTalkSlugs.some((slug) => url.endsWith(`/talks/${slug}`))) return false;
        return true;
      },
    }),
  ],
});
