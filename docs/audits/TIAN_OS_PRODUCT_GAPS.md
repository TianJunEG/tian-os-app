# Tian OS Product Gaps

**Date:** 2026-06-14
**Context:** Assessment of missing product features relative to pilot and scale goals

---

## Missing Product Flows

### Student-Facing

| Gap | Priority | Impact | Description |
|-----|----------|--------|-------------|
| Mastery celebration moment | P2 | Medium | No explicit celebration when student masters a skill; missed motivation opportunity |
| Real-time mastery update after recovery pack | P2 | Medium | Recovery pack completion doesn't visibly update mastery on student screen immediately |
| Help request notification to adults | P2 | High | When student flags "I need help", no push notification reaches parent/tutor |
| Offline practice support | P3 | Low (pilot) | No offline capability; requires constant internet connection |
| Audio explanations for all question types | P3 | Medium | TTS exists for Story Mode but not for practice/diagnostic feedback |
| Student-to-student comparison (opt-in) | P3 | Low | No peer benchmarking or friendly competition features |
| Practice session resume | P2 | Medium | If student closes browser mid-practice, session may not resume cleanly |
| Streak/consistency tracking | P3 | Low | No daily streak or consistency motivation system |

### Adult-Facing

| Gap | Priority | Impact | Description |
|-----|----------|--------|-------------|
| Adult note on specific mistake | P2 | Medium | Parent/tutor cannot leave a comment on a specific mistake for the student |
| Parent push notification for help requests | P2 | High | No real-time alert when child requests help during practice |
| Weekly parent digest (automated) | P2 | Medium | Script exists (`sendWeeklyParentDigest.js`) but unclear if scheduled |
| Tutor-parent communication | P2 | Medium | No direct messaging channel between tutor and parent about a child |
| Teacher → parent progress report | P2 | Medium | No one-click PDF report generation for parent conferences |
| Multi-child comparison view for parent | P3 | Low | Parent with multiple children cannot compare progress side-by-side |

---

## Missing Dashboard Insights

### Parent Dashboard

| Missing Insight | Priority | Notes |
|-----------------|----------|-------|
| Time spent per session | P2 | Data captured but not surfaced to parent |
| Confidence calibration (overconfidence warnings) | P2 | Confidence data exists; parent should see "your child is overconfident on X" |
| Recommended daily practice time | P3 | Based on mastery gaps and retention patterns |
| Comparison to peer cohort (anonymized) | P3 | "Your child is in top 20% for Fractions" |

### Tutor Dashboard

| Missing Insight | Priority | Notes |
|-----------------|----------|-------|
| Student engagement trends (declining?) | P2 | Session frequency and duration trends |
| Cross-student misconception patterns | P2 | "3 of your 5 students struggle with unlike denominators" |
| Lesson effectiveness tracking | P3 | Did post-lesson mastery improve? |
| Recommended focus areas with priority scoring | P2 | Beyond weak skills; time-weighted urgency |

### Teacher Dashboard

| Missing Insight | Priority | Notes |
|-----------------|----------|-------|
| Class progress over time chart | P2 | Historical mastery trajectory for the class |
| Homework completion rate by student | P2 | Partially implemented; needs surface in dashboard |
| Parent engagement metric | P3 | How often parents check dashboard |
| Assessment readiness indicator | P2 | "Class is ready / not ready for Topic X test" |

---

## Missing Student Supports

| Support | Priority | Description |
|---------|----------|-------------|
| Worked example before practice | P2 | Show a model solution before student attempts similar problem |
| Hint system (progressive disclosure) | P2 | Currently all-or-nothing; need 3-level hints (nudge → strategy → partial solution) |
| Visual model library | P2 | Reusable bar models, number lines, area models students can reference |
| Vocabulary support | P3 | Math term definitions (numerator, denominator, equivalent) in-context |
| "Try again" vs "Show me" choice | P1 | After wrong answer, student should choose: retry with hint OR see full solution |
| Emotional check-in | P3 | Periodic "how are you feeling about math?" sentiment tracking |
| Practice difficulty selection | P2 | Let student choose "easier" or "challenge" mode within their level |

---

## Missing Adult Supports

| Support | Priority | Description |
|---------|----------|-------------|
| Guided onboarding for parents | P1 | First-time parent experience: "Here's what to look for in your child's dashboard" |
| Tutor onboarding checklist | P2 | Step-by-step: add students, review mastery, prep first lesson |
| Teacher class setup wizard | P2 | Create class -> import students -> set learning goals -> assign diagnostic |
| Data export (CSV/PDF) | P2 | Parents and teachers need downloadable reports |
| Help/FAQ section | P2 | Common questions about what scores mean, what to do about weak areas |
| Video walkthrough of dashboard | P3 | 2-minute tour of key features |

---

## Recommended MVP Scope for Pilot

### Must Have (Pilot Launch)

1. Student can complete diagnostic and get placed correctly
2. Student can practice with adaptive difficulty
3. Wrong answers create trackable mistakes
4. Student can upload/draw working evidence
5. Mistakes show clear explanations
6. Parent can see child's weak areas and mistakes
7. Mobile works at common phone sizes (375px+)
8. Login/auth works reliably

### Should Have (First Week of Pilot)

1. Recovery pack generates practice from mistakes
2. Mastery updates visibly after remediation
3. Story Mode accessible for F025/F026
4. Parent can assign practice to child
5. Working evidence visible to parent/tutor

### Nice to Have (During Pilot)

1. Tutor lesson prep suggestions
2. Teacher class overview
3. Weekly parent digest email
4. Confidence calibration insights
5. Audio support for younger students

### Not Needed for Pilot

1. Billing/subscription management
2. Partner/school licensing
3. Multi-domain expansion
4. Content authoring tools
5. Peer benchmarking
6. Offline mode
