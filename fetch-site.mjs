// Vercel build step: pull the static site out of the public GitHub repo into public/.
// This keeps deployments tiny (the deploy payload is just this script + api/ + configs)
// while the repo stays the single source of truth for every page and data file.
import { execSync } from 'node:child_process';

const REF = process.env.SITE_REF || 'refs/heads/claude/rmbh-dashboard-project-2sdzj2';
const TARBALL = `https://codeload.github.com/yygreen/RMBH-DB/tar.gz/${REF}`;

execSync(
  `mkdir -p /tmp/src public && curl -sfL "${TARBALL}" | tar xz -C /tmp/src && ` +
  `cp -r /tmp/src/*/site/. public/ && rm -f public/vercel.json`,
  { stdio: 'inherit', shell: '/bin/bash' },
);
console.log('site/ fetched from', REF);
