# Contributing

Use Node.js 20.9+ and keep TypeScript strict. Before submitting changes, run:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Keep browser media objects out of Zustand and IndexedDB. New capture flows must be user initiated, explain permissions before requesting them, stop tracks during cleanup, and provide an actionable failure state. Avoid React state updates per compositor frame. Add unit tests for serializable behavior and Playwright coverage for essential user flows.

