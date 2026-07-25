# currency-pwa [![Build](https://github.com/IRus/currency-pwa/actions/workflows/build.yml/badge.svg)](https://github.com/IRus/currency-pwa/actions/workflows/build.yml)

PWA currency converter

* Exchange rates updates every day, by cron on Github Actions
* Three rate sources to pick between: fixer.io, the National Bank of the
  Republic of Belarus and the Deutsche Bundesbank
* Currencies are picked by typing — by code, by name, accents optional

## Development

```sh
FIXER_IO_TOKEN=<token> node generate-currencies.js   # writes src/data.json
pnpm install
pnpm start                                           # dev server
pnpm test                                            # unit and component tests
pnpm typecheck                                       # tsc --noEmit
pnpm build                                           # production build into dist/
```

`src/data.json` is generated, not committed. The rates are compiled into the
bundle, so the app makes no network requests at runtime — that is what lets it
work offline.

## Rate sources

Every source is one entry in `SOURCES` in `generate-currencies.js`: a name, a
URL and a parser that turns whatever that endpoint answers with into "units of
X per 1 unit of the source's base". Only ratios ever reach the app, so which
base a source anchored on stops mattering once its table is built. Adding a
fourth source means adding a fourth entry; the switch in the UI grows a segment
on its own.

| Source | Base | Currencies | Key |
| --- | --- | --- | --- |
| [fixer.io](https://data.fixer.io/) | EUR | ~170 | `FIXER_IO_TOKEN` |
| [NBRB](https://api.nbrb.by/) | BYN | ~30 | none |
| [Bundesbank](https://api.statistiken.bundesbank.de/) | EUR | ~30 | none |

Each table is validated on its own — a plausible currency count and the codes
the app opens with — and a source that fails validation is left out. fixer.io is
marked `required`, so losing it exits non-zero and leaves the previous file
untouched rather than shipping a converter that cannot price most currencies;
that covers the HTTP 200 + `{"success": false}` fixer.io uses for quota and auth
failures. The other two are best-effort: an endpoint that is down for an
afternoon costs the switch one segment.

Sources disagree, and that is the point of offering them: the National Bank's
official rate is not the rate the market cleared at. The date under the card is
the day the rates are *for*, taken from the source, not the day the build ran.

Vite does not type-check while bundling, so `pnpm typecheck` is a separate step
and runs in CI alongside the tests.

Favicons live in `public/icons/` and are regenerated with `generate-icons.sh`
(needs ImageMagick); run it from inside that directory. Everything under
`public/` is copied verbatim, while `dist/assets/` holds the content-hashed
build output — the two are kept apart so caching rules can be unambiguous.

## Deployment

The app is path-agnostic. Every URL it emits — bundles, icons, manifest,
service worker registration, precache entries — is relative, so it works
unchanged whether it is served from a domain root or from under a prefix.

The image serves it at the container root:

```sh
docker run --rm -p 8080:80 ghcr.io/irus/currency:main   # http://localhost:8080/
```

Production puts it at `https://ibragimov.by/currency/` with a reverse proxy
that strips the prefix before forwarding:

```nginx
location /currency/ {
  rewrite ^/currency/(.*)$ /$1 break;
  proxy_pass http://ibragimov_by_currency;
  proxy_set_header Host $http_host;
}
```

The browser resolves the relative URLs against `/currency/`, the proxy strips
it back off, and the container never has to know which prefix it is under.

## LICENSE

[GNU General Public License v3.0](LICENSE)
