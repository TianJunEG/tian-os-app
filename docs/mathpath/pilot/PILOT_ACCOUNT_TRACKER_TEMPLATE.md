# Pilot Account Tracker

Do not store real passwords in this file. Store credentials in your password manager or vault.

## Accounts

| Role | Email |
|---|---|
| Parent | pilot.parent@tianos.local |
| Tutor | pilot.tutor@tianos.local |
| Student 1 | pilot.student1@tianos.local |
| Student 2 | pilot.student2@tianos.local |
| Student 3 | pilot.student3@tianos.local |
| Student 4 | pilot.student4@tianos.local |
| Student 5 | pilot.student5@tianos.local |

## Student Assignment Table

| Student Label | Student Account/Email | Linked Parent Account | Tutor/Admin Reviewer | Level | Assigned Non-Fractions Domain | Required Fractions Session Done? | Required Assigned-Domain Session Done? | Device/Browser | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Pilot Student 1 | pilot.student1@tianos.local | pilot.parent@tianos.local | pilot.tutor@tianos.local | Primary 4 | Decimals | No | No | | |
| Pilot Student 2 | pilot.student2@tianos.local | pilot.parent@tianos.local | pilot.tutor@tianos.local | Primary 5 | Percentages | No | No | | |
| Pilot Student 3 | pilot.student3@tianos.local | pilot.parent@tianos.local | pilot.tutor@tianos.local | Primary 5 | Ratio & Rate | No | No | | |
| Pilot Student 4 | pilot.student4@tianos.local | pilot.parent@tianos.local | pilot.tutor@tianos.local | Primary 4 | Number Sense | No | No | | |
| Pilot Student 5 | pilot.student5@tianos.local | pilot.parent@tianos.local | pilot.tutor@tianos.local | Primary 4 | Operations | No | No | | |

All 5 students must also complete one Fractions session during the pilot.

## Account Checks

- [ ] Dry-run completed successfully
- [ ] Real provisioning completed successfully with password env vars
- [ ] Verify-only command completed successfully
- [ ] Script run successfully (`createMathPathPilotAccounts.js` exited 0)
- [ ] Parent has active parent workspace
- [ ] Tutor has active tutor workspace
- [ ] Parent has 5 pilot StudentGuardian links
- [ ] Tutor has 5 pilot TutorStudentLink records
- [ ] Tutor has 5 active StudentAccountLink consent records
- [ ] Parent account can log in
- [ ] Parent sees all 5 children on dashboard
- [ ] Tutor account can log in
- [ ] Tutor sees all 5 students on dashboard
- [ ] Student 1 can log in and open MathPath
- [ ] Student 2 can log in and open MathPath
- [ ] Student 3 can log in and open MathPath
- [ ] Student 4 can log in and open MathPath
- [ ] Student 5 can log in and open MathPath
- [ ] Credentials stored securely outside this repository
