# Tian OS Data Models

**Status:** Working documentation
**Last updated:** June 2026

---

## 1. Two-database overview

Tian OS uses two databases. Both must be running for the application to function.

| Database | ORM | Schema file | Used for |
|---|---|---|---|
| PostgreSQL | Prisma 7 | `prisma/schema.prisma` | Reference data (skills, topics, curriculum) |
| MongoDB | Mongoose | `models/*.js`, `models/mathpath/*.js` | Operational data (sessions, mastery, users) |

The split is intentional: curriculum reference data changes rarely and benefits from relational integrity; session and mastery data is written frequently and benefits from schema flexibility.

---

## 2. PostgreSQL models (Prisma)

Source of truth: `prisma/schema.prisma`. Generated client at `generated/prisma/` (gitignored).

### SubjectRef
Table: `subjects`

The top-level curriculum subject (e.g. Math, English).

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| key | String | Unique slug (e.g. `math`) |
| name | String | Display name |
| displayOrder | Int | Sort order |
| legacyMongoId | String? | Bridge to MongoDB `Subject` during migration |
| metadata | Json? | Extensible |

### TopicRef
Table: `topics`

A topic within a subject (e.g. Fractions, Decimals). Belongs to one `SubjectRef`.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| subjectId | String | FK → SubjectRef |
| name | String | |
| moeLevel | String? | Singapore MOE level (e.g. `P3`) |
| displayOrder | Int | |
| legacyMongoId | String? | |

### SkillRef
Table: `skills`

A single teachable skill (e.g. F001 "Parts of a whole"). The canonical reference for a skill across all domains. Belongs to a `TopicRef`.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| frameworkSkillId | String | Unique (e.g. `F001`) |
| universalSkillSlug | String | Unique slug (e.g. `fr.meaning.parts`) |
| domain | String | Domain key (e.g. `fractions`) |
| title | String | |
| description | String? | |
| pathwayOrder | Int | Sequence within domain |
| difficultyBand | String? | |
| questionTypes | String[] | |
| mistakeTypes | String[] | |
| status | ReferenceStatus | `active` or `archived` |
| topicId | String? | FK → TopicRef |
| legacyMongoId | String? | |

### SkillPrerequisite
Table: `skill_prerequisites`

Directed edge in the prerequisite graph. A skill cannot be attempted until all its prerequisites are mastered.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| skillId | String | FK → SkillRef (the skill that requires) |
| prerequisiteSkillId | String | FK → SkillRef (the skill that must come first) |
| relationshipType | String | Default `required` |

### CurriculumSkillMapping
Table: `curriculum_skill_mappings`

Maps a skill to a specific curriculum document and level. Enables MOE-alignment reporting.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| mappingKey | String | Unique composite key |
| skillId | String | FK → SkillRef |
| country | String | e.g. `SG` |
| curriculum | String | e.g. `MOE_PRIMARY` |
| phase / level / strand | String? | Curriculum position |
| syllabusTopic | String? | |
| introducedLevel | String? | Grade skill first appears |
| masteryLevel | String? | Grade where mastery expected |

### QuestionFamilyRef
Table: `question_families`

A question family is a template class that generates variations on a skill concept. One skill has multiple families covering different question formats.

| Field | Type | Notes |
|---|---|---|
| id | String (cuid) | PK |
| questionFamilyId | String | Unique (e.g. `QF_F001_001`) |
| domain | String | |
| skillId | String | FK → SkillRef |
| name | String | |
| recommendedCount | Int? | Target question count per family |
| masteryTargetAccuracy | Int? | % accuracy required for this family |
| mentalMathEligible | Boolean | |
| workingRequired | Boolean | |
| assessmentRelevant | Boolean | |
| status | ReferenceStatus | |

---

## 3. MongoDB models (Mongoose)

Source files: `models/*.js` and `models/mathpath/*.js`.

### Identity and access

#### User — `models/User.js`
Auth identity. One user can own multiple workspaces and have multiple roles.

| Field | Notes |
|---|---|
| name, email, password | Standard auth fields; password bcrypt-hashed |
| role | `parent \| tutor \| teacher \| admin \| student` |
| workspaceId | Primary/default workspace |
| subscription, plan | Billing state |
| pilotFlags | Object — per-user pilot feature overrides |

#### Workspace — `models/Workspace.js`
The data boundary. All student records, sessions, and mastery data belong to a workspace. Role determines available features; workspace determines visible data.

| Field | Notes |
|---|---|
| type | `parent \| tutor \| teacher \| school \| admin` |
| role | Role exercised inside this workspace |
| ownerUserId | The user who owns this workspace |
| name | Display name |

#### WorkspaceMember — `models/WorkspaceMember.js`
Membership record linking a `User` to a `Workspace` with a role. Enables dual-role users (one user, two workspaces).

#### Student — `models/Student.js`
The learner record. Always belongs to a workspace. The same child may have two separate `Student` records in two workspaces (e.g. one in a parent workspace, one in a teacher workspace) — they are isolated unless explicitly linked via `StudentAccountLink`.

| Field | Notes |
|---|---|
| name, level | e.g. `Primary 4` |
| workspaceId | Data boundary |
| userId | Optional — set when the student has their own login |
| createdByUserId | The adult who added this student |
| profile.mainFocus | e.g. `MathPath` |
| profile.studentVisualMode | `lower_primary \| upper_primary \| secondary` |

#### StudentGuardian — `models/StudentGuardian.js`
Links a student to a parent/guardian user. Used by guardian isolation middleware to scope data access.

#### StudentAccountLink — `models/StudentAccountLink.js`
Explicitly links two `Student` records across workspaces (e.g. parent workspace student ↔ school student). Created when a parent claims a school-created student record.

---

### Mastery and progress

#### MasteryRecord — `models/MasteryRecord.js`
**The single source of truth for mastery.** Every adult-facing dashboard reads this. Updated by the mastery engine after every completed session.

| Field | Notes |
|---|---|
| studentId | FK → Student |
| skillId | FK → Skill (MongoDB) |
| module | e.g. `MathPath`, `Spelling` |
| subject | e.g. `Math` |
| workspaceId | |
| score | 0–100 |
| status | `not_started \| needs_review \| learning \| mastered` |

Score thresholds: 0–39 = `needs_review`, 40–69 = `learning`, 70–100 = `mastered`.

#### FluencyRecord — `models/FluencyRecord.js`
Tracks fluency (fast + accurate recall) per student × skill, separate from mastery. Fluency is a distinct status — a student can be `mastered` but not yet `fluent`.

| Field | Notes |
|---|---|
| studentId, skillId | |
| accuracy, averageTimeSeconds | |
| fluencyScore | 0–100 composite |
| fluencyStatus | `not_fluent \| developing \| fluent` |
| becameFluentAt | Timestamp |

#### RetentionReview — `models/RetentionReview.js`
Spaced-repetition scheduling. A review is created when a skill is first mastered and rescheduled after each review on a 3 / 7 / 30 / 90-day cycle.

#### MathPathStudentSkillState — `models/mathpath/MathPathStudentSkillState.js`
Extended per-student × skill state for MathPath, richer than `MasteryRecord`. Used by the domain orchestrator and dashboard engines.

| Field | Notes |
|---|---|
| studentId, domainId, skillId | |
| status | `notStarted \| learning \| accurate \| fluent \| retained \| needsReview \| weak \| forgotten` |
| accuracy, attemptCount, correctCount | |
| fluencyLevel | `notReady \| bronze \| silver \| gold \| platinum` |
| retentionStatus | `reviewScheduled \| retained \| needsReview \| forgotten` |
| lastPractisedAt | |

---

### Sessions

#### MathPathPracticeSession — `models/mathpath/MathPathPracticeSession.js`
One practice session (8–15 questions targeting one skill). Linked to a student, domain, and optional assignment.

| Field | Notes |
|---|---|
| practiceSessionId | Unique string ID |
| studentId, domainId, targetSkillId | |
| assignmentId | Optional — if launched from an assignment |
| workingSessionId | Optional — link to working upload session |
| status | `notStarted \| inProgress \| completed \| abandoned` |
| questions, responses | Arrays of question/response objects |
| summary | Accuracy, time, mastery delta after completion |

#### MathPathDiagnosticSession — `models/mathpath/MathPathDiagnosticSession.js`
An adaptive diagnostic session that probes a student's skill level in a domain.

| Field | Notes |
|---|---|
| diagnosticSessionId | |
| studentId, domainId | |
| mode | `basic \| core \| full` |
| diagnosticPurpose | `baseline \| recheck \| assigned` |
| isBaseline | Whether this is the first diagnostic for this domain |
| currentSkillId | Current probe skill |
| decisionHistory | Array of adaptive decisions (`MOVE_UP`, `STEP_DOWN`, etc.) |
| assignedPracticeSkillIds | Skills flagged for practice based on results |
| status | `notStarted \| inProgress \| completed` |

#### MathPathAttempt — `models/mathpath/MathPathAttempt.js`
One question attempt within any session type. The atomic unit of evidence.

| Field | Notes |
|---|---|
| attemptId | |
| studentId, domainId, skillId | |
| questionFamilyId, questionId | |
| sessionId, sessionType | `diagnostic \| practice \| fluency \| retention \| assessment \| story` |
| assignmentId | Optional |
| correct | Boolean |
| studentAnswer, correctAnswer | |
| timeTakenSeconds | |
| workingSubmitted | Whether the student uploaded working |
| misconceptionCode | Populated on wrong answers where diagnosis is confident |

#### PracticeSession — `models/PracticeSession.js`
Generic practice session used by modules other than MathPath (Spelling, PSL). MathPath-specific sessions use `MathPathPracticeSession` above.

---

### Mistakes and remediation

#### Mistake — `models/Mistake.js`
Saved on every wrong answer. Powers the Mistake-to-Mastery review flow and drives parent/tutor/teacher remediation suggestions.

| Field | Notes |
|---|---|
| studentId, workspaceId | |
| questionId | |
| skillId, skillCode | |
| module | e.g. `MathPath` |
| questionText, workedSolution | Snapshot at time of attempt (renders without join) |
| studentAnswer, correctAnswer | |
| workingSubmitted | |
| mistakeType | `concept_gap \| calculation_error \| careless \| method_error \| unknown` |
| misconceptionTag | Specific misconception code if diagnosed |
| status | `open \| reviewed \| resolved` |
| reviewSource | `student \| parent \| tutor \| teacher` |

Resolution is mastery-derived: when the associated skill reaches `mastered`, open mistakes flip to `resolved`.

#### MathPathMistakeRecord — `models/mathpath/MathPathMistakeRecord.js`
Aggregated misconception record per student × domain × mistake code. Tracks frequency and severity over time; drives the Recovery Pack and remediation engine.

| Field | Notes |
|---|---|
| studentId, domainId | |
| mistakeCode | Domain-specific misconception code |
| frequency | Count of occurrences |
| severity | `low \| medium \| high` |
| evidence | Array of attempt IDs |
| remediationSkillIds | Skills the engine recommends for remediation |
| lastSeenAt | |

#### RemediationSession — `models/RemediationSession.js`
A structured remediation sequence (the "Recovery Pack") triggered after identified misconceptions. Tracks which recovery steps the student has completed.

---

### Assignments

#### Assignment — `models/Assignment.js`
A task assigned by a parent, tutor, or teacher to one student. Can be a practice session, diagnostic, worksheet, or PSL problem.

| Field | Notes |
|---|---|
| studentId, assignedByUserId, workspaceId | |
| assignedByRole | `parent \| tutor \| teacher` |
| module | e.g. `MathPath` |
| feature | e.g. `Fluency Practice`, `Mistake-to-Mastery` |
| skillId, topicId | Target |
| status | `pending \| inProgress \| completed` |
| completedAt, score | |

#### MathPathAssignment — `models/mathpath/MathPathAssignment.js`
MathPath-specific assignment extension with domain and question family targeting.

---

### Skill reference (MongoDB — legacy)

#### Skill — `models/Skill.js`
The MongoDB-side skill reference, used before the Prisma migration. Still queried by some services during the dual-write transition period. The Postgres `SkillRef` is the authoritative source; `Skill` will be deprecated once migration is complete.

#### Topic — `models/Topic.js`
MongoDB-side topic reference. Same migration status as `Skill`.

#### MathPathSkill — `models/mathpath/MathPathSkill.js`
Domain-specific skill record used by the MathPath diagnostic and practice engines. Includes `frameworkSkillId` (F-code) and `universalSkillSlug` to bridge MongoDB ↔ Postgres.

---

### School / teacher models

#### Class — `models/Class.js`
A teacher's class in a school workspace.

#### ClassStudent — `models/ClassStudent.js`
Enrolment record linking a `Student` to a `Class`.

#### StudentGroup — `models/StudentGroup.js`
A teacher-defined group of students within a class, typically for differentiated instruction.

#### InterventionRecord — `models/InterventionRecord.js`
A teacher's record of an intervention taken with a student or group.

---

### Tutor models

#### TutorStudentLink — `models/TutorStudentLink.js`
Links a student to a tutor within a tutor workspace. Required before a tutor can access a student's data.

#### LessonNote — `models/LessonNote.js`
Notes recorded by a tutor for a lesson session.

#### TutorAvailability — `models/TutorAvailability.js`
Weekly time slot availability for a tutor.

#### TutorCertification — `models/TutorCertification.js`
Tutor training and certification status.

---

### Billing

#### Subscription — `models/Subscription.js`
Active subscription record for a user. Links to a `BillingPlan`.

#### BillingPlan — `models/BillingPlan.js`
Available plans (free, mid, premium). Controls which features are accessible via `services/billing/featureAccessService.js`.

#### Payment — `models/Payment.js`
Payment event record (Stripe).

---

### Other operational models

| Model | Purpose |
|---|---|
| `Notification` | In-app notifications for parents/tutors/teachers |
| `Message` | Internal messaging |
| `Worksheet` | Generated worksheet record |
| `LessonRecording` | Tutor lesson recordings |
| `SpellingList` | Spelling curriculum list |
| `SpellingAttempt` | Spelling practice attempts |
| `LifeLabActivity` | LifeLab activity definitions |
| `LifeLabSubmission` | Student LifeLab submissions |
| `InformalAssessment` | Teacher-created informal assessments |
| `LearningTelemetryEvent` | Analytics events |
| `PilotFeedback` | Pilot programme feedback records |

---

## 4. Key relationships

```
User
  └── Workspace (owns many)
        ├── Student (many, workspace-scoped)
        │     ├── MasteryRecord (one per skill)
        │     ├── FluencyRecord (one per skill)
        │     ├── RetentionReview (one per scheduled review)
        │     ├── Mistake (many)
        │     ├── Assignment (many)
        │     └── MathPathStudentSkillState (one per domain × skill)
        ├── Class → ClassStudent → Student   [teacher workspace]
        └── TutorStudentLink → Student       [tutor workspace]

MathPathPracticeSession
  └── MathPathAttempt (many, one per question)
        └── Mistake (created on wrong answer)
              └── MathPathMistakeRecord (aggregated per domain)

SkillRef (Postgres)
  ├── QuestionFamilyRef (many)
  ├── SkillPrerequisite (graph edges)
  └── CurriculumSkillMapping (many)
```

---

## 5. Mastery score thresholds

`MasteryRecord.score` is 0–100. The mastery engine (`utils/masteryEngine.js`) calculates it from accuracy, attempt count, and streak.

| Score | Status | Meaning |
|---|---|---|
| No record | `not_started` | Student has not attempted this skill |
| 0–39 | `needs_review` | Attempted but accuracy is low |
| 40–69 | `learning` | Progressing; not yet mastered |
| 70–100 | `mastered` | Mastery criteria met |

`MathPathStudentSkillState.status` has a finer-grained enum (`accurate`, `fluent`, `retained`, `weak`, `forgotten`) used by the domain orchestrator and retention engine.
