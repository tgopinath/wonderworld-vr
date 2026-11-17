# Browser tests

`npm run test:e2e` starts Vite on port 5194 and plays real rounds with mouse drags on the WebGL canvas.

- Each test uses a fresh browser context, so local storage starts empty.
- The parent PIN used by the tests is the test-only value `2468` (see `math.spec.ts`). It exists only inside
  the test browser's local storage and is never a real credential.
- `window.__ww` is a read-only bridge (dev builds, or any build opened with `?e2e`) that reports object screen
  positions and the current round so the test can aim its drags. It cannot change state.
