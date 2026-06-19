# MathPath Pilot Account Setup

This document explains how to create the controlled 5-student MathPath pilot accounts.

## Accounts created

| Role | Email |
|---|---|
| Parent | `pilot.parent@tianos.local` |
| Tutor | `pilot.tutor@tianos.local` |
| Student 1 | `pilot.student1@tianos.local` |
| Student 2 | `pilot.student2@tianos.local` |
| Student 3 | `pilot.student3@tianos.local` |
| Student 4 | `pilot.student4@tianos.local` |
| Student 5 | `pilot.student5@tianos.local` |

## Student assignment table

| Student | Level | Assigned Non-Fractions Domain | Also completes |
|---|---|---|---|
| Pilot Student 1 | Primary 4 | Decimals | Fractions |
| Pilot Student 2 | Primary 5 | Percentages | Fractions |
| Pilot Student 3 | Primary 5 | Ratio & Rate | Fractions |
| Pilot Student 4 | Primary 4 | Number Sense | Fractions |
| Pilot Student 5 | Primary 4 | Operations | Fractions |

## Script

**File:** `scripts/createMathPathPilotAccounts.js`

The script is idempotent — running it again updates/relinks existing accounts without creating duplicates.

## Required environment variables

| Variable | Purpose |
|---|---|
| `PILOT_PARENT_PASSWORD` | Password for `pilot.parent@tianos.local` |
| `PILOT_TUTOR_PASSWORD` | Password for `pilot.tutor@tianos.local` |
| `PILOT_STUDENT_PASSWORD` | Shared password for all 5 student accounts |
| `CONFIRM_PILOT_SETUP=true` | Explicit confirmation gate (must be set) |
| `MONGODB_URI` | Target database (from `.env`) |

The script fails with a clear error if any password variable is missing.

## How to run

```bash
PILOT_PARENT_PASSWORD="..." \
PILOT_TUTOR_PASSWORD="..." \
PILOT_STUDENT_PASSWORD="..." \
CONFIRM_PILOT_SETUP=true \
node scripts/createMathPathPilotAccounts.js
```

The script connects to `MONGODB_URI` from your `.env` file, so ensure that points to the correct database before running.

## How to verify links after running

The script runs its own verification step and exits non-zero if it fails. You can also check manually:

```js
// In mongo shell or Compass:
db.studentguardians.find({ guardianUserId: <parent _id> }).count()  // should be 5
db.tutorstudentlinks.find({ tutorUserId: <tutor _id> }).count()      // should be 5
```

## Relationship model

- Each student has a **User** record (role: `student`) and a **Student** record in the parent's workspace.
- **StudentGuardian** records link the parent to each student (5 records).
- **TutorStudentLink** records link the tutor to each student via the tutor's workspace (5 records).
- No mastery data is seeded — students start with a clean state.

## Password safety

- Passwords are **never stored in this repository**.
- The script reads them from environment variables only.
- Store credentials in your team password manager or vault (1Password, Bitwarden, AWS Secrets Manager, etc.).
- Do not commit `.env` files containing pilot passwords.
- Do not share passwords over unencrypted channels.

## Running again safely

The script is idempotent. Re-running it:
- Updates existing accounts (name, role, workspace linkage)
- Does **not** duplicate Student records or relationship links
- Does **not** touch existing MathPath session data
