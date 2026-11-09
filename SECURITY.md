# Security Policy

## Project Status

BlogSpace is a learning and portfolio application. It includes security-focused engineering work, but it is not represented as production-hardened and should not be used to process sensitive information without an independent security review.

## Reporting a Vulnerability

Please do not publish passwords, access tokens, personal data, exploit instructions, or other sensitive vulnerability details in a public issue.

Report suspected security vulnerabilities privately to the repository maintainer at [fahim1252375@icloud.com](mailto:fahim1252375@icloud.com). Include:

- A short description of the affected feature or endpoint
- The potential impact
- Reproduction steps or a minimal proof of concept, where safe
- Any relevant version, commit, or environment details

Remove secrets and personal information from reports. Do not access, modify, or delete data that does not belong to you.

There is no guaranteed response or remediation timeframe. Reports will be reviewed on a best-effort basis.

## Security Scope and Known Limitations

Review the Security and Deployment Scope section in the main [README](README.md) before deploying this project. In particular, the current in-memory rate limiter is scoped to one server process; a shared store is needed for coordinated rate limits across multiple instances.
