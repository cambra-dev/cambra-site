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
    /** Set to true to hide a post from the listing and builds. */
    draft: z.boolean().optional().default(false),
    /** Optional explicit reading time in minutes. Auto-calculated if omitted. */
    readingTime: z.number().optional(),
    /** Absolute path to a custom OG image. Falls back to the site default. */
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog };
