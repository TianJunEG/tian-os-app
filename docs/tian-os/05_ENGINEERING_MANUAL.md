# Tian OS Engineering Manual

**Status:** Working documentation  
**Last updated:** June 8, 2026  
**Current safe product scope:** MathPath Fractions Intervention Pilot

---

## 1. Purpose of This Document

This document explains how engineers should work safely on Tian OS.

It is intended for:

- remote AI-native developers
- product engineers
- future CTO / senior engineer
- technical project managers
- Codex/Cursor/Claude Code users
- anyone making code changes in the Tian OS repository

Tian OS is not a simple CRUD app.

It contains interconnected evidence systems:

```text
diagnostics
→ mistakes
→ Recovery Packs
→ teaching flows
→ rechecks
→ reports