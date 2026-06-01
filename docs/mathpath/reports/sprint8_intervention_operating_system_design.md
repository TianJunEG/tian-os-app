# Sprint 8 Intervention Operating System Design

Status: Completed

## Root Cause

Tian OS had diagnostic insight and adult dashboards, but no central object representing an intervention from detection through reassessment.

## Implemented Design

Added `interventionOperatingSystem.js` with deterministic functions for:

- building interventions from diagnostic or help-request insights
- choosing intervention type
- selecting playbook
- determining priority
- building one-click assignment options
- creating assignments
- tracking completion
- measuring effectiveness
- building task centres, notifications, calendar buckets, journey maps, and analytics

## Intervention Types

- Practice Pack
- Worksheet
- Fluency Drill
- Retention Review
- Heuristics Pack
- Exam Technique Pack
- LifeLab Activity
- Tutor Session Recommendation
- Teacher Small Group Recommendation
- Parent Home Support Activity
- Model Drawing Trainer
- Intervention Pack

## Data Contract

Every intervention carries:

- intervention ID
- type
- linked skills
- linked misconceptions
- priority
- status
- source
- template
- playbook
- workflow
- next action

