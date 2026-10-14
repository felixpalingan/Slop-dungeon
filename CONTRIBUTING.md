# Contributing to Slop Dungeon ⚡

Thank you for your interest in contributing to **Slop Dungeon**! We welcome community contributions to help improve this open-source chaotic multiplayer roguelike.

## Code of Conduct
Please treat everyone with respect, kindness, and professionalism. We are committed to providing a friendly, collaborative, and inclusive experience for all contributors.

## How Can I Contribute?

### 1. Reporting Bugs
- Check existing [GitHub Issues](https://github.com/felixpalingan/Slop-dungeon/issues) before opening a new issue to avoid duplicates.
- Provide a clear and descriptive title.
- Describe the exact steps to reproduce the issue, expected vs actual behavior, browser environment, and attach screenshots or console logs if relevant.

### 2. Suggesting Features
- Open a GitHub issue with the `[Feature Request]` tag.
- Clearly describe the proposed feature, the problem it solves, and how it aligns with the chaotic roguelike vision.

### 3. Submitting Pull Requests
1. **Fork** the repository and clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/Slop-dungeon.git
   cd Slop-dungeon
   ```
2. **Create a branch** for your feature or bugfix:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Follow code style & architecture conventions**:
   - Write clean, modular, and performant vanilla JavaScript / ES Modules.
   - Respect procedural 2D canvas rendering conventions (zero external image assets required for entities).
   - Ensure all code comments, documentation, and user-facing text are strictly in English.
   - Do NOT use copyrighted manga/anime character names; always use archetypal titles and epithets (e.g. *The Honored One*, *The Black Swordsman*, *Night City Legend*).
5. **Verify the build**:
   ```bash
   npm run build
   ```
   Ensure the build completes with zero errors and zero warnings.
6. **Commit with Conventional Commits**:
   - `feat(...)`: New features
   - `fix(...)`: Bug fixes
   - `refactor(...)`: Code refactoring without behavioral changes
   - `docs(...)`: Documentation changes
   - `chore(...)`: Maintenance and dependency upgrades
7. **Push to your fork** and open a Pull Request against the `main` branch.

## Networking & WebRTC Guidelines
- Slop Dungeon uses direct Peer-to-Peer WebRTC DataChannels via PeerJS (`NetworkManager`).
- State synchronizations must be token-efficient and delta-compressed whenever possible.
- Avoid introducing centralized server dependencies. All multiplayer logic must remain serverless and direct peer-to-peer.
