/**
 * Team member data. Update this file with real names, roles, bios, and photo
 * paths before launch. Drop headshot images into public/team/.
 *
 * Photo format: square JPG/WebP, at least 200×200px. Recommend 400×400px
 * for crisp display on retina screens.
 */
export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  /** Path relative to the public/ directory, e.g. "/team/alice.jpg" */
  photo: string;
  /** Optional LinkedIn or personal site URL */
  link?: string;
}

// TODO: Replace placeholder entries with real team data.
export const team: TeamMember[] = [
  {
    name: 'Dan Sotolongo',
    role: 'CEO, Founder',
    bio: 'Lover of databases, programming languages, and distributed systems.',
    photo: '/team/dan.jpg',
    link: 'https://www.linkedin.com/in/sortalongo',
  },
  {
    name: 'Daniel Mills',
    role: 'Cofounder',
    bio: 'Database and stream-processor implementor extraordinaire.',
    photo: '/team/daniel.jpg',
    link: 'https://www.linkedin.com/in/daniel-mills-14a593205/',
  },
  {
    name: 'Skylar Cook',
    role: 'Cofounder',
    bio: 'Developer tool aficionado. Hard-thing doer.',
    photo: '/team/skylar.jpg',
    link: 'https://www.linkedin.com/in/skylarcc/',
  },
];
