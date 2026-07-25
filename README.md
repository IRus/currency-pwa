# currency-pwa [![Build](https://github.com/IRus/currency-pwa/actions/workflows/build.yml/badge.svg)](https://github.com/IRus/currency-pwa/actions/workflows/build.yml)

PWA currency converter

* Exchange rates updates every day, by cron on Github Actions
* fixer.io used as rates source

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
work offline. `generate-currencies.js` exits non-zero and leaves the previous
file untouched if fixer.io answers with anything unexpected, including the
HTTP 200 + `{"success": false}` it uses for quota and auth failures.

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
