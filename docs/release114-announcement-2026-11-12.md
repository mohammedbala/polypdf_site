# PolyPDF 1.6.32 build 114 release announcement

Prepared from the exact deployed website source, 6f94eea9542102ea5695bd1d84d673f011937089. The separately published Mac and Windows update channels passed all 43 public checks before this announcement change.

The current version, build, release date, FAQ summary, version-history summary and corresponding translated release strings now describe 1.6.32 build 114. Existing screenshot identities and the November 6 build 101 metric practice evidence are unchanged. This is a website announcement; packaged app language qualification and localized desktop downloads remain deferred.

Validation: the initial complete test run passed 438 of 439 tests; its only failure expected the new release in generated llms.txt. The normal full build regenerated that file, and all five discovery tests then passed. The full build passed screenshot evidence, prerender completeness, 240 marketing pages across eight languages, 836 translated interactive tool pages, content parity, RTL, metadata, links, assets and sitemap checks. Explicit content checks cover English home/Windows/versions and all eight translated homes; the historical metric verification page is byte-identical.

Deploy with the existing two-phase scripts/deploy-static.py from this clean source commit. It verifies staged bytes and available capacity, preserves the predecessor, atomically activates the candidate, and checks every public resource with automatic rollback on failure. Deployment receipts remain under .tmp/deploy-static/<commit> and in the private release114 support directory.
