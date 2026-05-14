# Nyasa Sharma Cinematic Apology Website

A premium interactive apology website built as a static React experience with Tailwind's browser runtime, Framer Motion, and GSAP.

## Preview

The local preview server is running at:

http://localhost:4173

## Files

- `index.html` loads the app and vendored libraries.
- `styles.css` contains the cinematic visual system, responsive layout, particles, glassmorphism, and animation keyframes.
- `app.js` contains the React sections, Framer Motion transitions, GSAP scroll effects, playful interactions, response tracking, audio toggle, theme toggle, and science surprise flow.
- `supabase-config.js` stores the public Supabase project URL, anon key, and admin email placeholder.
- `supabase-setup.sql` creates the lightweight interaction table and secure row level security policies.
- `dashboard-admin.html` and `dashboard-admin.js` power the private analytics dashboard.
- `vercel.json` and `_redirects` map `/dashboard-admin` to the dashboard file on Vercel or Netlify.
- `react.production.min.js`, `react-dom.production.min.js`, `framer-motion.js`, `gsap.min.js`, `ScrollTrigger.min.js`, `lenis.min.js`, and `tailwindcdn.js` are the local browser builds used by the page.
- `nyasa-1.jpg`, `nyasa-2.jpg`, and `nyasa-3.jpg` are the three Polaroid Showcase images.

All project files now live in this single folder.

## Supabase setup

1. Create a Supabase project.
2. Open `supabase-setup.sql`, replace `replace-with-your-email@example.com` with your admin email, then run it in the Supabase SQL editor.
3. In Supabase Auth, create/invite that same admin email user.
4. Add your site URL and `/dashboard-admin` as allowed redirect URLs in Supabase Auth settings.
5. Fill `supabase-config.js` with your project URL, anon key, and admin email.

Visitors can only insert interaction events. Reading the dashboard requires a Supabase magic-link login for the admin email allowed by the RLS policy.
