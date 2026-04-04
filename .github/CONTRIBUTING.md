# Contributing Guide

Thanks for your interest in contributing!

## Development Setup

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Run checks
bun lint
bun typecheck
bun build
```

## Submitting Changes

1. Fork the repository
2. Create a new branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Run `bun format && bun lint:fix && bun typecheck` to ensure code quality
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/)
6. Open a pull request

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new features
- `fix:` — bug fixes
- `chore:` — maintenance and tooling
- `docs:` — documentation changes
- `refactor:` — code refactoring without behavior change
- `test:` — adding or updating tests
