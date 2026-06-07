# Parent Child Access Model

## Source Of Truth

`StudentGuardian` is the source of truth for parent-child access in Tian OS.

A parent may view or act on a student's MathPath data only when a
`StudentGuardian` record links:

```json
{
  "studentId": "...",
  "guardianUserId": "...",
  "relation": "parent"
}
```

The shared server access boundary is `utils/studentContext.js`. Parent-facing
MathPath routes must resolve the requested child through `resolveStudent(req,
studentId)` before reading or mutating child data.

## Allowed Access Paths

The following access paths are valid:

- Student self-access through the student user linked to the `Student`.
- Parent/guardian access through `StudentGuardian`.
- Tutor access through `TutorStudentLink`.
- Workspace staff access through an assigned `WorkspaceMember` relationship.
- Partner staff access through the partner access service.
- Admin/system access only where the route explicitly allows it.

No route should trust a client-supplied `studentId`, route param, query param,
or frontend `activeChild` value without server-side validation.

## Legacy Compatibility

`User.children` is legacy embedded profile data. It may remain for compatibility
with older learning-profile screens, but it is not an authorization source and
must not bypass `StudentGuardian`.

`/api/family/children` is the preferred guardian-backed child list for active
parent dashboards.

`/api/learning/children` is compatibility-only. It now reads guardian-linked
students for child listing/profile access. The legacy `self` fallback exists
only for accounts that do not reference a separate child `Student` record.

## Route Validation Rules

Parent-facing MathPath routes must:

1. Authenticate the user.
2. Check role if the route is parent-only or adult-only.
3. Resolve the requested student via `resolveStudent(req, studentId)`.
4. Use the resolved `student._id` for downstream queries and writes.
5. Avoid loading evidence, assignments, reports, diagnostics, worksheets, or
   paper-analysis records before access resolution.

For object routes, load the object only as needed to discover its `studentId`,
then immediately call `resolveStudent(req, object.studentId)` before returning
details or mutating the record.

## Frontend Active Child Rules

Frontend child selection is only a convenience layer. It is not an access
boundary.

Student-facing and parent-facing screens should:

- Populate selectable children from `/api/family/children` where possible.
- Pass the selected `studentId` to APIs that require child context.
- Clear or mask stale child-specific data while a new child is loading.
- Key cached child data by `studentId`.
- Never use `localStorage` or route params as proof of access.
- Validate any selected child against the guardian-backed child list.
- Clear stale selected-child values when the child is no longer linked.
- Ignore in-flight API responses if the selected child or route `studentId`
  changed before the response completed.
- Show a loading or empty state during child changes; never show one child's
  name with another child's assignments, worksheets, diagnostics, reports, or
  paper-analysis records.
- Treat direct child routes, such as `/parent/children/:studentId/progress`,
  as child switches. Route-param changes must clear old child data and ignore
  stale in-flight responses the same way selector-driven switches do.

`localStorage` and `sessionStorage` may remember workspace or UI preference
state, but active-child values are compatibility hints only. A stale child id in
browser storage or query params must be revalidated against `/api/family/children`
and server-side `StudentGuardian` checks.

## Tests

Regression tests should prove:

- A parent cannot access an unrelated student's MathPath progress.
- A parent cannot access unrelated diagnostic history/growth/recheck data.
- A parent cannot access unrelated assignments or recovery-pack teaching flow.
- A parent cannot review or assign practice from unrelated paper analysis.
- A parent cannot load unrelated reports or Success Centre evidence.
- Legacy `/api/learning/children` returns only guardian-linked children.
- Embedded `User.children` cannot bypass `StudentGuardian`.
- Browser child switching clears previous child data before rendering the next
  child.
- Late API responses for Child A do not overwrite Child B screens.
- Query params and route params cannot create mixed child UI states.
- Direct parent routes for progress, assignments, worksheets, report evidence,
  and paper analysis block unrelated students and never flash protected data.

## Current Coverage

This hardening pass adds focused negative tests around:

- `resolveStudent`
- diagnostics history/growth/recheck summary
- MathPath assignments and recovery-pack teaching flow
- paper-analysis review and assignment
- MathPath Success Centre parent/report views
- legacy learning children/profile reads
- parent child-switching browser QA for Parent Home, Success Centre, MathPath
  Dashboard, Worksheets, and Paper Analysis.
- parent direct child route browser QA for Child Progress, Success Centre
  report evidence, assignment lists, worksheet history/detail, and paper
  analysis detail.

## Remaining Expectations

New parent/tutor/teacher routes should include an isolation test whenever they
accept `studentId`, `assignmentId`, `worksheetId`, `diagnosticSessionId`,
`paperAnalysisId`, or report IDs from the client.
