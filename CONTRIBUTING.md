# Contributing Guide

Thanks for your interest in contributing to **V0 Playground**!

Whether you’re fixing a bug, improving documentation, or adding a new feature, we appreciate your help.

## Getting Started

1. **Fork** the repo and clone it locally
2. Install dependencies with `yarn` or `npm install`
3. Run `yarn dev` or use `yalc` to link it locally in your test project
4. Create a new branch: `git checkout -b my-feature`
5. Make your changes and commit with clear messages
6. Run `yarn build` to verify everything compiles
7. Open a pull request

## Coding Standards

- Follow the existing file structure and naming conventions
- Write clear, readable code
- Add comments if something could be confusing
- Keep commits focused and scoped to one task

## Commit Format

Use descriptive commit messages like:

- fix: correct control rendering bug on first mount
- feat: add support for live JSX preview
- docs: update README with new example

## Local Testing with Yalc

To test the package in a local project:

```bash
yarn build && yalc publish
# then in your example project
yalc add @toriistudio/v0-playground && yarn
```

## Issues and Suggestions

Found a bug or want to request a feature?
Open an [issue on GitHub](https://github.com/toriistudio/v0-playground/issues).

Thanks again for being part of the project! 💫
