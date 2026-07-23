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
      filter: (page) =>
        !draftSlugs.some((slug) => page.replace(/\/$/, '').endsWith(`/blog/${slug}`)),
    }),
  ],
});
