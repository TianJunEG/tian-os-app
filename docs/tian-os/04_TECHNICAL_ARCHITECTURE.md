# Tian OS Technical Architecture

**Status:** Working documentation  
**Last updated:** June 8, 2026  
**Current safe product scope:** MathPath Fractions Intervention Pilot

---

## 1. Purpose of This Document

This document explains how Tian OS is technically structured.

It is written for:

- AI-native developers
- technical leads
- future CTO / senior engineer
- product engineers
- DevOps support
- technical investors
- anyone maintaining the Tian OS codebase

This document should help a new engineer understand:

- where the frontend lives
- where the backend lives
- how data flows
- which services matter most
- what systems are safety-critical
- what must not be broken

This document is not a full API reference or data model reference. Those should live in separate files:

```text
06_DATA_MODELS.md
07_API_REFERENCE.md