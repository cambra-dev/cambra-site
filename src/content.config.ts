/**
 * Astro content collection schema for blog posts (Astro v5+ Content Layer API).
 * All fields except `draft` are required on published posts.
 */
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    /** Post author's display name. */
    author: z.string().optional(),
    /**
     * Set to true to keep a post out of the listing, the sitemap, and the
     * search index. The page is still built at its URL, so a draft can be
     * shared as a private preview link before it's announced.
     */
    draft: z.boolean().optional().default(false),
    /** Optional explicit reading time in minutes. Auto-calculated if omitted. */
    readingTime: z.number().optional(),
    /** Absolute path to a custom OG image. Falls back to the site default. */
    ogImage: z.string().optional(),
  }),
});

/**
 * Talks. The entry body is the abstract shown on the /talks listing; the deck
 * itself is a self-contained HTML file built from `src/decks/<deck>/` and served
 * verbatim at /talks/<slug>/.
 */
const talks = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/talks' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Where it was given, shown under the title in the listing. */
    venue: z.string(),
    pubDate: z.coerce.date(),
    /** Directory under src/decks/ holding the built deck. Defaults to the slug. */
    deck: z.string().optional(),
    /**
     * Allow search engines to index the deck page itself. Off by default: a
     * deck is ~25 words a slide with its substance in hidden speaker notes, so
     * it indexes as thin content and competes with the prose that says the same
     * thing better. The /talks listing carries the abstract and IS indexed.
     */
    indexable: z.boolean().optional().default(false),
    /** Keep out of the listing and the sitemap, but still build the URL. */
    draft: z.boolean().optional().default(false),
    /** Absolute path to a custom OG image. Falls back to the site default. */
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog, talks };
