# DATABASE_SCHEMA.md — MathPath MVP (MongoDB)

The persistence model for the MathPath MVP. It stores the **static graph** authored in
[`SKILL.md`](./SKILL.md) (`skills`, `skill_edges`), the **question bank contract** from
[`QUESTION_TAGGING.md`](./QUESTION_TAGGING.md) (`questions`), and the **runtime learner state**
(`students`, `mastery_profiles`, `practice_sessions`, `fluency_metrics`, `recommendations`,
`misconceptions`).

Conventions:

- Field names are `snake_case` to match the spec docs. `_id` is a Mongo `ObjectId` unless a
  natural string key exists (`skills`, `skill_edges`, `questions` use their domain key as `_id`).
- Timestamps are ISO-8601 UTC strings in examples; store as BSON `Date`.
- Every learner-state document references skills by `skill_id`, never by embedding the node.
  The skill graph is the single source of truth (`SKILL.md`).

---

## Collection map

| Collection | Kind | Cardinality | Source of truth |
| --- | --- | --- | --- |
| `skills` | static | ~70 nodes | `SKILL.md §1.1 / §3` |
| `skill_edges` | static | ~70 edges | `SKILL.md §4.1` |
| `questions` | static | large (generated/authored) | `QUESTION_TAGGING.md` |
| `students` | runtime | one per learner | app |
| `mastery_profiles` | runtime | one per (student, skill) | mastery engine |
| `practice_sessions` | runtime | one per session | session engine |
| `fluency_metrics` | runtime | one per (student, skill) | mastery engine |
| `recommendations` | runtime | one active per student | recommendation engine |
| `misconceptions` | hybrid | catalog + per-attempt logs | `SKILL.md §6/§8` + diagnosis |

---

## 1. `skills`

The skill nodes from `SKILL.md §1.1`. `_id` = `skill_id`.

**Indexes:** `{ domain: 1, level_tag: 1 }`, `{ mastery_type: 1 }`.

```json
{
  "_id": "mul-tables-6789",
  "domain": "D3 · Multiplication & Division",
  "skill_name": "Multiplication tables of 6, 7, 8, 9",
  "level_tag": "P3",
  "description": "Recall multiplication facts for the 6, 7, 8 and 9 times tables.",
  "mastery_type": "fluency",
  "fluency_type": "fact_recall",
  "expected_time_seconds": 4,
  "mastery_threshold": { "accuracy": 0.90, "speed_grace": 1.25 },
  "common_misconceptions": [
    "confuses adjacent facts (7×8 read as 7×7)",
    "adds instead of multiplies under time pressure",
    "off-by-one-row recall slips (8×7 → 49)"
  ],
  "recommended_practice_mode": "drill_high_volume",
  "question_tags": ["times-table", "single-digit", "recall", "6", "7", "8", "9"],
  "created_at": "2026-05-26T00:00:00Z",
  "updated_at": "2026-05-26T00:00:00Z"
}
```

> `prerequisites` / `extends_to` are **not** embedded here — they live in `skill_edges` so the
> graph can be queried and traversed in both directions without rewriting node documents.

---

## 2. `skill_edges`

The typed prerequisite edges from `SKILL.md §4.1`. `_id` = `"<source>__<target>"`.

**Indexes:** `{ source_skill_id: 1 }`, `{ target_skill_id: 1 }`, `{ relationship_type: 1 }`.

```json
{
  "_id": "mul-tables-6789__frac-equiv",
  "source_skill_id": "mul-tables-6789",
  "target_skill_id": "frac-equiv",
  "relationship_type": "fluency_gate",
  "reason": "Scaling numerator and denominator requires automatic multiplication facts."
}
```

- **Recommendation** queries `{ target_skill_id: X }` to check whether all sources are mastered.
- **Remediation** queries `{ target_skill_id: X }` and walks `source_skill_id` backwards (`SKILL.md §8`).

---

## 3. `questions`

Tagged items per `QUESTION_TAGGING.md`. `_id` = `question_id`.

**Indexes:** `{ skill_id: 1, difficulty: 1 }`, `{ skill_id: 1, "misconception_tags": 1 }`.

```json
{
  "_id": "mul-tables-6789-q0017",
  "skill_id": "mul-tables-6789",
  "domain": "D3 · Multiplication & Division",
  "level_tag": "P3",
  "difficulty": 2,
  "estimated_time_seconds": 4,
  "fluency_type": "fact_recall",
  "question_type": "numeric_entry",
  "prompt": "7 × 8 = ?",
  "answer": { "value": 56, "accepted": ["56"], "unit": null },
  "worked_solution": [
    "Recall the fact directly: 7 × 8 = 56.",
    "Check: 7 × 8 = 7 × 4 × 2 = 28 × 2 = 56."
  ],
  "hint_sequence": [
    "It's one of the 7 or 8 times-table facts — try to recall it.",
    "7 × 8 sits between 7 × 7 = 49 and 7 × 9 = 63.",
    "7 × 8 = (7 × 4) × 2 = 28 × 2."
  ],
  "misconception_tags": ["mult/adjacent-fact-slip", "mult/adds-instead-of-multiplies"],
  "prerequisite_skill_ids": ["mul-tables-346"],
  "remediation_skill_ids": ["mul-tables-346", "mul-tables-2510"],
  "source": "generated",
  "created_at": "2026-05-26T00:00:00Z"
}
```

---

## 4. `students`

Minimal learner account for the MVP. `_id` = `ObjectId`.

**Indexes:** `{ email: 1 }` (unique), `{ tianos_user_id: 1 }`.

```json
{
  "_id": "ObjectId(665a1f000000000000000001)",
  "tianos_user_id": "usr_8f12",
  "display_name": "Tian",
  "email": "tian@example.com",
  "level_band": "P3",
  "active_curriculum": "sg-p3",
  "created_at": "2026-05-26T09:00:00Z",
  "last_active_at": "2026-05-26T09:42:00Z"
}
```

> `tianos_user_id` links the MathPath learner to the Tian OS account so the unified learning
> profile (`/api/learning/result`) can be reconciled later.

---

## 5. `mastery_profiles`

One document per `(student_id, skill_id)` — the mastery engine's verdict.
`status` ∈ `not_started | in_progress | mastered`.

**Indexes:** `{ student_id: 1, skill_id: 1 }` (unique), `{ student_id: 1, status: 1 }`.

```json
{
  "_id": "ObjectId(665a1f000000000000000010)",
  "student_id": "ObjectId(665a1f000000000000000001)",
  "skill_id": "mul-tables-6789",
  "status": "in_progress",
  "accuracy": 0.82,
  "median_first_try_seconds": 5.1,
  "attempts": 44,
  "first_try_correct": 36,
  "mastered_at": null,
  "last_practiced_at": "2026-05-26T09:42:00Z",
  "meets_accuracy": false,
  "meets_speed": false,
  "updated_at": "2026-05-26T09:42:00Z"
}
```

> Mastery rule (`SKILL.md §1`): `status = mastered` when `accuracy ≥ mastery_threshold.accuracy`
> **and** `median_first_try_seconds ≤ expected_time_seconds × mastery_threshold.speed_grace`.

---

## 6. `practice_sessions`

One document per practice session (default `QUESTIONS_PER_SESSION = 10`). Embeds per-item
attempts so a session is a self-contained record.

**Indexes:** `{ student_id: 1, started_at: -1 }`, `{ skill_id: 1 }`.

```json
{
  "_id": "ObjectId(665a1f000000000000000020)",
  "student_id": "ObjectId(665a1f000000000000000001)",
  "skill_id": "mul-tables-6789",
  "mode": "timed_fluency",
  "started_at": "2026-05-26T09:40:00Z",
  "ended_at": "2026-05-26T09:42:30Z",
  "item_count": 10,
  "correct_count": 8,
  "items": [
    {
      "question_id": "mul-tables-6789-q0017",
      "prompt": "7 × 8 = ?",
      "given_answer": "49",
      "correct": false,
      "first_try": true,
      "hint_used": false,
      "time_seconds": 6.4,
      "misconception_tag": "mult/adjacent-fact-slip"
    },
    {
      "question_id": "mul-tables-6789-q0031",
      "prompt": "6 × 9 = ?",
      "given_answer": "54",
      "correct": true,
      "first_try": true,
      "hint_used": false,
      "time_seconds": 3.2,
      "misconception_tag": null
    }
  ],
  "triggered_remediation": true,
  "remediation_skill_id": "mul-tables-346"
}
```

---

## 7. `fluency_metrics`

Rolling fluency aggregates per `(student_id, skill_id)`, separate from `mastery_profiles` so
speed/streak data can update at high frequency without rewriting the mastery verdict. Only
**first-try, un-hinted, correct** items contribute (`SKILL.md §1`).

**Indexes:** `{ student_id: 1, skill_id: 1 }` (unique).

```json
{
  "_id": "ObjectId(665a1f000000000000000030)",
  "student_id": "ObjectId(665a1f000000000000000001)",
  "skill_id": "mul-tables-6789",
  "fluent_attempts": 36,
  "median_time_seconds": 5.1,
  "p90_time_seconds": 8.7,
  "rolling_window": [3.2, 6.4, 4.0, 5.5, 4.8, 7.1, 3.9, 5.0],
  "best_streak": 12,
  "current_streak": 3,
  "updated_at": "2026-05-26T09:42:30Z"
}
```

---

## 8. `recommendations`

The recommendation engine's current next-best skill for a student. One active row per student
(`is_active: true`); superseded rows are kept for history.

**Indexes:** `{ student_id: 1, is_active: 1 }`, `{ student_id: 1, generated_at: -1 }`.

```json
{
  "_id": "ObjectId(665a1f000000000000000040)",
  "student_id": "ObjectId(665a1f000000000000000001)",
  "recommended_skill_id": "mul-tables-6789",
  "kind": "continue",
  "reason": "All prerequisites mastered; in progress and below the speed bar — keep drilling.",
  "candidate_skill_ids": ["mul-tables-6789", "div-within-tables"],
  "blocked_by": [],
  "is_active": true,
  "generated_at": "2026-05-26T09:42:30Z"
}
```

- `kind` ∈ `start_new | continue | remediate`.
- A `remediate` recommendation sets `recommended_skill_id` to a prerequisite and lists the
  failed skill in `blocked_by`.

---

## 9. `misconceptions`

Two roles in one collection, distinguished by `doc_type`:

- `doc_type: "catalog"` — the canonical misconception definitions (slug, label, reteach hint),
  seeded from each skill's `common_misconceptions` (`SKILL.md §6`).
- `doc_type: "observation"` — a logged occurrence of a misconception for a student, feeding
  remediation and analytics.

**Indexes:** `{ doc_type: 1, tag: 1 }`, `{ student_id: 1, observed_at: -1 }`.

```json
{
  "_id": "mult/adjacent-fact-slip",
  "doc_type": "catalog",
  "tag": "mult/adjacent-fact-slip",
  "skill_id": "mul-tables-6789",
  "label": "Recalls an adjacent times-table fact",
  "example": "Answers 7 × 8 as 49 (7×7) or 63 (7×9).",
  "reteach_hint": "Anchor on a known nearby fact and adjust by one group.",
  "remediation_skill_ids": ["mul-tables-346"]
}
```

```json
{
  "_id": "ObjectId(665a1f000000000000000050)",
  "doc_type": "observation",
  "tag": "mult/adjacent-fact-slip",
  "student_id": "ObjectId(665a1f000000000000000001)",
  "skill_id": "mul-tables-6789",
  "question_id": "mul-tables-6789-q0017",
  "session_id": "ObjectId(665a1f000000000000000020)",
  "given_answer": "49",
  "observed_at": "2026-05-26T09:41:10Z",
  "remediation_served": true
}
```

---

## Read paths (MVP)

| Operation | Query |
| --- | --- |
| Next recommendation | read active `recommendations` for `student_id` |
| Is skill unlocked? | `skill_edges.find({ target_skill_id })` → all sources `mastered` in `mastery_profiles` |
| Build a session | `questions.find({ skill_id, difficulty })`, sample `item_count` |
| Update mastery | recompute from `practice_sessions` + `fluency_metrics`, write `mastery_profiles` |
| Diagnose a miss | match `given_answer` → `misconception_tags` on the question → log `observation` |
| Route remediation | question's `remediation_skill_ids` ∩ unmastered prerequisites (`skill_edges`) |
