# Founder/Team Safe QA Bundle

Run at: 2026-05-31T03:03:57.263Z
Base URL: http://127.0.0.1:5050/api

| Area | Check | Status | Severity | Details |
|---|---|---|---|---|
| student | login | PASS | critical |  |
| student | /mastery returns | PASS | high | status=200 |
| student | recommended skill exists | PASS | high | Counting to 20 |
| student | practice session starts | PASS | high | status=200 |
| student | recommended skill has questions | PASS | critical | 5 items |
| parent | login | PASS | critical |  |
| parent | /family/children returns | PASS | high | status=200 |
| parent | has visible children | PASS | high | 4 children |
| tutor | login | PASS | critical |  |
| tutor | tutor workspace resolved | PASS | high | 6a1b0383cc02f1dbfd391dd1 |
| tutor | /tutor/home returns | FAIL | medium | status=404 |
| tutor | /tutor/students returns | FAIL | medium | status=404 |
| teacher | login | FAIL | critical |  |

Overall: 10 PASS / 3 FAIL
Top blocker severity: critical
