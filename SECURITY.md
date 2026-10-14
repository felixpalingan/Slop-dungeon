# Security Policy 🛡️

The maintainers of **Slop Dungeon** take security and fair-play integrity seriously. We appreciate your efforts to responsibly disclose any vulnerabilities you discover.

## Supported Versions

| Version | Supported          |
| :---    | :---               |
| `main`  | :white_check_mark: |
| `< 1.0` | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, **please do NOT report it via public GitHub issues or public discussions**.

Instead, please report the vulnerability privately through:
1. **GitHub Security Advisory**: Open a private advisory on GitHub via the [Security Advisories tab](https://github.com/felixpalingan/Slop-dungeon/security/advisories/new).
2. **Direct Maintainer Contact**: Reach out to the repository maintainer directly via GitHub ([@felixpalingan](https://github.com/felixpalingan)).

### What to Include in Your Report
To help us triage and resolve the issue quickly, please provide:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Any affected components (e.g. WebRTC message deserialization, state validation, DOM sanitization).
- Recommended fixes or mitigations, if known.

## Response Timeline
- **Initial Acknowledgment**: Within 48 hours of receipt.
- **Triage & Status Update**: Within 5 business days detailing validation results and target remediation timeline.
- **Resolution**: A coordinated patch will be prepared and merged into `main` prior to any public disclosure.

## Security Best Practices
- Never commit active production secrets, private tokens, or sensitive API keys into version control.
- Validate all incoming WebRTC peer message payloads to prevent malicious state manipulation or payload injection.
