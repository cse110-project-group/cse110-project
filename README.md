# cse110-project

A browser game built with [Konva](https://konvajs.org/), TypeScript, and [Vite](https://vite.dev/).

## Getting started

Requires Node.js 22.22.2+ (CI uses Node 24).

```sh
npm install
npm run dev      # start the dev server
npm run build    # production build
npm run preview  # preview the production build
```

## Testing

Tests use [Vitest](https://vitest.dev/) with a [jsdom](https://github.com/jsdom/jsdom) browser environment. Test files sit next to the code they test and are named `*.test.ts` (e.g. `src/systems/input.test.ts`).

```sh
npm test            # run all tests once
npm run test:watch  # rerun tests on file changes
```

Tests that touch browser APIs like `window` should start with:

```ts
// @vitest-environment jsdom
```

### Continuous integration

GitHub Actions (`.github/workflows/test.yml`) runs `npm test` on every push to any branch except `main`. Make sure tests pass before opening a pull request.
