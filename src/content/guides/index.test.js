import { guidePosts } from './index';

const valuesAreUnique = (values) => new Set(values.map((value) => value.toLowerCase())).size === values.length;

test('publishes one deliberate set of exactly twelve distinct guides', () => {
  expect(guidePosts).toHaveLength(12);
  expect(valuesAreUnique(guidePosts.map(({ slug }) => slug))).toBe(true);
  expect(valuesAreUnique(guidePosts.map(({ title }) => title))).toBe(true);
  // The first keyword is the guide's primary search/answer intent rather than a hidden second list.
  expect(valuesAreUnique(guidePosts.map(({ keywords }) => keywords[0]))).toBe(true);
});

test('every guide is a substantial, directly answerable, screenshot-backed reference', () => {
  const allSlugs = new Set([
    ...guidePosts.map(({ slug }) => slug),
    'introducing-polypdf-plugins'
  ]);

  guidePosts.forEach((entry) => {
    expect(entry.quickAnswer.length).toBeGreaterThan(120);
    expect(entry.sections.length).toBeGreaterThanOrEqual(5);
    expect(entry.faqs.length).toBeGreaterThanOrEqual(3);
    expect(entry.metaTitle.length).toBeLessThanOrEqual(60);
    expect(entry.metaDescription.length).toBeLessThanOrEqual(155);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry.dateModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry.heroImage.src).toBeTruthy();
    expect(entry.heroImage.alt.length).toBeGreaterThan(30);
    expect(entry.heroImage.caption.length).toBeGreaterThan(60);
    expect(entry.heroImage.width).toBeGreaterThanOrEqual(800);
    expect(entry.heroImage.height).toBeGreaterThanOrEqual(500);
    expect(entry.keywords.length).toBeGreaterThanOrEqual(3);
    expect(JSON.stringify(entry)).not.toContain('$49.99');

    entry.faqs.forEach(({ question, answer }) => {
      expect(question.length).toBeGreaterThan(15);
      expect(answer.length).toBeGreaterThan(40);
    });
    (entry.relatedSlugs || []).forEach((slug) => expect(allSlugs.has(slug)).toBe(true));
  });
});

test('high-risk product limits stay explicit in the public guides', () => {
  const bySlug = Object.fromEntries(guidePosts.map((entry) => [entry.slug, entry]));
  const redaction = JSON.stringify(bySlug['redact-and-sanitize-pdf']);
  const issuedSet = JSON.stringify(bySlug['prepare-issued-pdf-set']);
  const takeoff = JSON.stringify(bySlug['pdf-takeoff-worked-example']);
  const area = JSON.stringify(bySlug['measure-pdf-area-cutouts-depth']);
  const form = JSON.stringify(bySlug['create-fillable-pdf-form']);

  expect(redaction).toContain('does not generalize to every PDF structure');
  expect(redaction).toContain('the black area is never the check');
  expect(redaction).toContain('direct FileAttachment annotation and its embedded payload survived');
  expect(redaction).toContain('new PolyPDF /Producer and /ModDate');
  expect(issuedSet).toContain('No user-facing cross-file Batch Process is exposed in build 22');
  expect(issuedSet).toContain('10 automated checks');
  expect(takeoff).toContain('12 committed Supply diffuser counts');
  expect(takeoff).toContain('depends on your drawing, its calibration, and the boundary you choose to trace');
  expect(takeoff).toContain('not a professional estimate or bid');
  expect(area).toContain('does not prove that every connecting edge stays inside');
  expect(form).toContain('restricted safe subset');
});
