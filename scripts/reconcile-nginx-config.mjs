#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const REQUIRED_CSP_SOURCES = Object.freeze({
  'script-src': [
    'https://www.googletagmanager.com',
    'https://*.googletagmanager.com',
    'https://www.googleadservices.com',
    'https://www.google.com',
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net'
  ],
  'connect-src': [
    'https://www.googletagmanager.com',
    'https://*.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://analytics.google.com',
    'https://*.analytics.google.com',
    'https://www.google.com',
    'https://*.google.com',
    'https://www.googleadservices.com',
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://ad.doubleclick.net',
    'https://*.g.doubleclick.net',
    'https://stats.g.doubleclick.net',
    'https://google.com'
  ],
  'img-src': [
    'https://www.googletagmanager.com',
    'https://*.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://analytics.google.com',
    'https://*.analytics.google.com',
    'https://www.google.com',
    'https://*.google.com',
    'https://www.googleadservices.com',
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://ad.doubleclick.net',
    'https://*.g.doubleclick.net',
    'https://stats.g.doubleclick.net',
    'https://google.com'
  ],
  'frame-src': [
    'https://www.googletagmanager.com'
  ]
});

const CACHE_MARKER = '# polypdf-managed-stable-screenshot-cache';
const NOT_FOUND_MARKER = '# polypdf-managed-static-404';

const addCspSources = (policy, required) => {
  const directives = policy.split(';').map((part) => part.trim()).filter(Boolean);
  for (const [name, sources] of Object.entries(required)) {
    const index = directives.findIndex((directive) => directive === name || directive.startsWith(`${name} `));
    const tokens = index === -1 ? [name] : directives[index].split(/\s+/);
    for (const source of sources) {
      if (!tokens.includes(source)) tokens.push(source);
    }
    const updated = tokens.join(' ');
    if (index === -1) directives.push(updated);
    else directives[index] = updated;
  }
  return `${directives.join('; ')};`;
};

const stableImageLocations = (indent) => [
  `${indent}${CACHE_MARKER}`,
  `${indent}location = /og-image.png {`,
  `${indent}    add_header Cache-Control "public, max-age=0, must-revalidate" always;`,
  `${indent}    try_files $uri =404;`,
  `${indent}}`,
  '',
  `${indent}location ^~ /guides/ {`,
  `${indent}    add_header Cache-Control "public, max-age=0, must-revalidate" always;`,
  `${indent}    try_files $uri =404;`,
  `${indent}}`,
  ''
].join('\n');

const staticNotFoundLocations = (indent) => [
  `${indent}${NOT_FOUND_MARKER}`,
  `${indent}error_page 404 /404.html;`,
  `${indent}location = /404.html {`,
  `${indent}    internal;`,
  `${indent}}`,
  '',
  `${indent}location / {`,
  `${indent}    try_files $uri $uri/ =404;`,
  `${indent}}`
].join('\n');

export const reconcileNginxConfig = (input) => {
  if (!/server_name\s+[^;]*\bwww\.polypdf\.com\b[^;]*;/m.test(input)) {
    throw new Error('Nginx config does not contain the www.polypdf.com server');
  }

  let output = input.replace(
    /root\s+\/var\/www\/polypdf-site\/(?:build|current);/g,
    'root /var/www/polypdf-site/current;'
  );
  if (!output.includes('root /var/www/polypdf-site/current;')) {
    throw new Error('Nginx config does not expose the commit-addressed current release');
  }

  const cspPattern = /add_header\s+Content-Security-Policy\s+"([^"]+)"\s+always;/g;
  const cspMatches = [...output.matchAll(cspPattern)];
  if (cspMatches.length !== 1) {
    throw new Error(`Expected one Content-Security-Policy header, found ${cspMatches.length}`);
  }
  const currentPolicy = cspMatches[0][1];
  const nextPolicy = addCspSources(currentPolicy, REQUIRED_CSP_SOURCES);
  output = output.replace(cspMatches[0][0], `add_header Content-Security-Policy "${nextPolicy}" always;`);

  const hasOgLocation = /location\s+=\s+\/og-image\.png\s*\{/.test(output);
  const hasGuideLocation = /location\s+\^~\s+\/guides\/\s*\{/.test(output);
  if (hasOgLocation !== hasGuideLocation) {
    throw new Error('Nginx config has only one of the two stable screenshot cache locations');
  }
  if (!hasOgLocation) {
    const assetLocation = /^(\s*)location\s+~\*\s+\\\.\([^\n]*\bpng\b[^\n]*\)\$\s*\{/m;
    const match = output.match(assetLocation);
    if (!match) throw new Error('Could not find the general static-asset location');
    output = output.replace(match[0], `${stableImageLocations(match[1])}${match[0]}`);
  }

  if (!output.includes(NOT_FOUND_MARKER)) {
    const spaFallbackPattern = /^([ \t]*)location\s+\/\s*\{\s*try_files\s+\$uri\s+\$uri\/\s+\/index\.html;\s*\}/m;
    const fallbackMatches = [...output.matchAll(new RegExp(spaFallbackPattern.source, 'gm'))];
    if (fallbackMatches.length !== 1) {
      throw new Error(`Expected one SPA HTML fallback, found ${fallbackMatches.length}`);
    }
    output = output.replace(spaFallbackPattern, (_match, indent) => staticNotFoundLocations(indent));
  }

  for (const expression of [
    /location\s+=\s+\/og-image\.png\s*\{[^}]*max-age=0[^}]*must-revalidate[^}]*\}/s,
    /location\s+\^~\s+\/guides\/\s*\{[^}]*max-age=0[^}]*must-revalidate[^}]*\}/s,
    /error_page\s+404\s+\/404\.html;/,
    /location\s+=\s+\/404\.html\s*\{[^}]*internal;[^}]*\}/s,
    /location\s+\/\s*\{[^}]*try_files\s+\$uri\s+\$uri\/\s+=404;[^}]*\}/s
  ]) {
    if (!expression.test(output)) throw new Error('Managed Nginx route or cache rule is missing');
  }

  for (const [directive, sources] of Object.entries(REQUIRED_CSP_SOURCES)) {
    const policyDirective = nextPolicy.split(';').map((part) => part.trim())
      .find((part) => part === directive || part.startsWith(`${directive} `)) || '';
    for (const source of sources) {
      if (!policyDirective.split(/\s+/).includes(source)) {
        throw new Error(`${directive} is missing ${source}`);
      }
    }
  }

  return output;
};

const argument = (name) => {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
};

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const inputPath = argument('--input');
  const outputPath = argument('--output');
  if (!inputPath || !outputPath) {
    console.error('Usage: node scripts/reconcile-nginx-config.mjs --input <active.conf> --output <candidate.conf>');
    process.exit(2);
  }
  const reconciled = reconcileNginxConfig(fs.readFileSync(inputPath, 'utf8'));
  fs.writeFileSync(outputPath, reconciled);
  console.log(`Prepared reconciled Nginx configuration at ${outputPath}`);
}
