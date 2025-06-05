# AGENTS.md

This guide provides instructions for Codex agents contributing to this repository. Use it alongside `CLAUDE.md`.

## Development Commands
Node 20 is recommended for development.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Overview
- React application built with TypeScript and Vite.
- Implements an advanced todo list with timers, drag and drop, notifications and dark mode.
- Data structures for tasks and timer states are defined in `types.ts`.
- Tests are located in the `__tests__` directory and run with Jest using `ts-jest` and jsdom.

## Coding Style
- Use two spaces for indentation.
- Keep code consistent with the existing formatting.

## Test Driven Development
1. **Write a failing test** in `__tests__` describing the desired behaviour.
2. Run `npm test` to confirm the test fails.
3. Implement the minimal code change to make the test pass.
4. Run `npm test` again; all tests should pass.
5. Refactor if needed while keeping tests green.

Always include appropriate tests with your changes and ensure `npm test` passes before committing.
