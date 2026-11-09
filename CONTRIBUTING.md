# Contributing to BlogSpace

Thank you for taking an interest in this learning and portfolio project. Contributions that improve correctness, accessibility, security, documentation, or maintainability are welcome.

## Before You Start

For substantial changes, open an issue first to describe the problem or proposed improvement. For small documentation fixes, a pull request can be opened directly.

## Development Setup

1. Fork the repository and clone your fork.
2. Install dependencies with npm ci.
3. Copy .env.example to .env and configure the required local values.
4. Create a focused branch, such as docs/improve-setup-guide or fix/auth-validation.
5. Make the smallest clear change that addresses the issue.

Never commit .env files, credentials, private keys, access tokens, or real user data.

## Validation

Before opening a pull request, run:

~~~bash
npm run lint
npm test
npm run build
~~~

Include the actual commands you ran and their results in the pull request description. Add or update tests when behavior changes. Do not claim a check passed unless you ran it on the submitted changes.

## Pull Request Guidelines

- Explain the problem and the proposed solution.
- Keep each pull request focused.
- Link related issues where applicable.
- Update documentation when setup, behavior, configuration, or limitations change.
- Describe security-sensitive changes and their testing.
- Do not include secrets, personal data, or unrelated generated files.

## AI-Assisted Contributions

AI tools may be used as development aids, but contributors remain responsible for understanding and reviewing their submissions. Verify generated suggestions against the codebase, run relevant checks, and disclose material AI assistance when it meaningfully shaped the implementation. Do not submit unreviewed AI output as verified work.
