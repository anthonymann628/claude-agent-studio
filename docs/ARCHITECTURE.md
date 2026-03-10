# Claude Agent Studio Architecture

## Core Principles
- Agents are markdown files with frontmatter
- Catalogs are decentralized
- Packs are first-class
- The app is local-first
- Repo scanning powers recommendations
- Context injection makes agents project-aware

## Main Workstreams
- Core App
- Catalogs and Packs
- Recommendation Engine
- Agent Content

## Technical Split
- React/TypeScript: UI, workflows, editors, filtering
- Tauri/Rust: filesystem, scanning, install/update operations
