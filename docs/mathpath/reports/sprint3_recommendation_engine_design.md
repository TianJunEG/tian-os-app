# Sprint 3 Recommendation Engine Design

Generated: 2026-06-01

## Status
Completed for diagnostic outputs

## Recommendation inputs
- recommended starting skill
- weak skills
- root causes
- misconceptions
- prerequisite gaps
- confidence insights
- fluency insights
- working evidence signals

## Audience-specific outputs
The engine now returns:
- `recommendations.student`
- `recommendations.parent`
- `recommendations.tutor`
- `recommendations.teacher`

## Example outputs
Student:
Practise the recommended skill and show each step clearly.

Parent:
Student may have a denominator comparison misconception. Use fraction bars to show why more parts means smaller parts.

Tutor:
Prioritise common denominator reasoning before unlike-denominator operations.

Teacher:
Group students by misconception cluster for targeted remediation.

## Current integration
Student diagnostic page displays student/parent-style recommendation text. Tutor/teacher dashboard-specific rendering remains a next UI pass, but the data is now generated and available.
