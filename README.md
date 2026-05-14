Place Nyasa's three showcase photos in the project root with these exact filenames:

- `nyasa-1.jpg`
- `nyasa-2.jpg`
- `nyasa-3.jpg`

The site will show elegant placeholders until these files exist.

This version is fully static and can be hosted directly on GitHub Pages.

Password access and button logging now use `localStorage`, so they work without any server.

Important:

- The reusable password works normally.
- The three one-time passwords are only one-time per browser/device, not globally across all visitors.
- Interaction logs are stored locally in that visitor's browser, not in repo JSON files.
