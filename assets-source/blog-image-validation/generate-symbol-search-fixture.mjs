#!/usr/bin/env node
import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : fallback;
};
const appRoot = resolve(valueAfter('--app-root', '/tmp/polypdf-1.4-capture-tQ8oBz/worktree/polypdf'));
const output = resolve(valueAfter('--output', '/tmp/polypdf-symbol-search-fixture.pdf'));
const { PDFDocument, rgb } = createRequire(join(appRoot, 'package.json'))('pdf-lib');

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const SIZE = 40;
const LARGE_SIZE = 260;
const anchors = [[100, 100], [250, 100], [400, 100], [100, 250], [250, 250]];
const pdf = await PDFDocument.create();
const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
const black = rgb(0, 0, 0);
const flip = (appY) => PAGE_HEIGHT - appY;

function drawSymbol(ax, ay, size) {
  const stroke = Math.max(2, size / 20);
  page.drawRectangle({
    x: ax,
    y: flip(ay + size),
    width: size,
    height: size,
    borderColor: black,
    borderWidth: stroke
  });
  page.drawLine({
    start: { x: ax, y: flip(ay) },
    end: { x: ax + size, y: flip(ay + size) },
    thickness: stroke,
    color: black
  });
  const block = size / 4;
  page.drawRectangle({
    x: ax + stroke * 2,
    y: flip(ay + stroke * 2 + block),
    width: block,
    height: block,
    color: black
  });
}

for (const [x, y] of anchors) drawSymbol(x, y, SIZE);
drawSymbol(180, 430, LARGE_SIZE);
await writeFile(output, await pdf.save());
process.stdout.write(`${output}\n`);
