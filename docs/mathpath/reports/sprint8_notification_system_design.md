# Sprint 8 Notification System Design

Status: Completed

## Notification Events Supported

- assignment due
- assignment overdue
- retention review due
- new intervention assigned
- student completed assignment
- mastery achieved
- student requested help

## Audiences

Notifications are tagged for:

- student
- parent
- tutor
- teacher

## Implementation

`buildNotificationEvents(assignments, now)` produces notification events from assignment state and due dates. `handleHelpRequest(helpRequest)` creates an intervention recommendation and adult notification set.

No delivery channel was added in this sprint; the data contract is ready for in-app, email, or push delivery later.

