# Gift Vault tests

Unit tests (engine + store, no browser):

    npx esbuild src/gifts/__entry.ts --bundle --format=esm --platform=node \
      --outfile=tests/gifts/gifts.bundle.mjs --define:import.meta.env=undefined
    node tests/gifts/engine.test.mjs

where `src/gifts/__entry.ts` re-exports `engine`, `definitions`, `config` and `store`.

Browser tests: `npm run build && npm run preview -- --port 5199 --host 127.0.0.1`, then `python3 tests/gifts/e2e.py`
(needs `pip install playwright`; edit the Chromium path at the top of the script).
