# Tian OS Copy Audit - 2026-06-02

This pass focused on visible UI copy that made Tian OS feel like a generic LMS. Internal schema names, API fields, route names, and stable data contracts were left unchanged unless the wording leaked directly into the interface.

## Copy Changes

| File path | Current copy | Issue | Recommended replacement | Status |
| --- | --- | --- | --- | --- |
| `frontend/src/pages/student/mathpath/MathPathHome.jsx` | `Courses` | Student MathPath page sounded like a course catalogue. | `Learning Paths` | Changed |
| `frontend/src/pages/student/mathpath/FractionsLearningPathPage.jsx` | `Current Course` | Fractions is a skill path, not an LMS course. | `Current Skill Path` | Changed |
| `frontend/src/pages/student/StudentDashboard.jsx` | `Current Course` | Homepage card used LMS wording. | `Current Skill Path` | Changed |
| `frontend/src/pages/student/StudentDashboard.jsx` | `lessons completed` | Progress is skill mastery, not lesson completion. | `skills progressing` | Changed |
| `frontend/src/pages/student/StudentAssignments.jsx` | `Your assignments` | Student-facing work should feel like targeted practice. | `Your Practice Tasks` | Changed |
| `frontend/src/pages/student/StudentAssignments.jsx` | `Unable to load assignments` | Same assignment wording. | `Unable to load practice tasks` | Changed |
| `frontend/src/pages/student/StudentAssignments.jsx` | `No assignments yet` | Empty state felt like school admin/LMS language. | `No practice tasks yet` | Changed |
| `frontend/src/pages/parent/ParentHome.jsx` | `Assignments` | Parent card should emphasize practice set for the child. | `Practice Tasks` | Changed |
| `frontend/src/pages/parent/ParentHome.jsx` | `View assignments` | Same assignment wording. | `View practice tasks` | Changed |
| `frontend/src/pages/parent/ChildNav.jsx` | `Assignments` | Parent child tab should match practice task wording. | `Practice Tasks` | Changed |
| `frontend/src/pages/parent/ChildAssignments.jsx` | `Couldn't load assignments` | Same assignment wording. | `Couldn't load practice tasks` | Changed |
| `frontend/src/pages/parent/ChildAssignments.jsx` | `No assignments yet` | Same assignment wording. | `No practice tasks yet` | Changed |
| `frontend/src/pages/parent/AssignPractice.jsx` | `View assignments` | Success CTA should match parent nav language. | `View practice tasks` | Changed |
| `frontend/src/components/LifeLab/screens/TutorViewScreen.jsx` | `Manage student assignments` | LifeLab is activity-based, not assignment-led. | `Manage student activities` | Changed |
| `frontend/src/components/LifeLab/screens/TutorViewScreen.jsx` | `No Assignments Yet` | LifeLab empty state should use activity language. | `No Activities Assigned Yet` | Changed |
| `frontend/src/components/LifeLab/screens/ClassOverviewScreen.jsx` | `Assignment progress` | LifeLab class view should emphasize activity progress. | `Activity progress` | Changed |
| `frontend/src/components/LifeLab/screens/ClassOverviewScreen.jsx` | `No assignments yet` | Same LifeLab activity language. | `No activities assigned yet` | Changed |
| `frontend/src/pages/student/science/ScienceTopics.jsx` | `Lesson` | Student Science CTA sounded like an LMS lesson. | `Learn` | Changed |
| `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx` | `Suggested Assignments` | Tutor MathPath should frame work as targeted practice/intervention. | `Suggested Practice` | Changed |
| `frontend/src/pages/tutor/TutorMathPathDashboardPage.jsx` | `No assignment suggestions yet` | Same assignment wording. | `No practice suggestions yet` | Changed |

## Left For Later Or Accepted

| File path / area | Current copy or term | Reason left unchanged |
| --- | --- | --- |
| MathPath internals such as `courseProgress`, `CurrentCourseCard`, `CourseArt` | Internal variable/component names | Not visible UI. Renaming would be code cleanup, not copywriting. |
| Assignment APIs/models/routes | `assignment`, `assignments` | Stable backend data contract. Visible labels were changed to practice tasks where safe. |
| Tutor lesson preparation and notes | `lesson`, `lesson notes`, `Plan lesson` | Tutor services involve real tutoring lessons, so the word is accurate. |
| Tutor training pages | `Training modules`, `Approved modules` | These are actual formal tutor training/certification units. |
| Parent/tutor profile grade fields | `Grade`, `Grades` | Refers to school grade levels, not assessment marks. |
| Curriculum references and SG/MOE mapping | `curriculum` | Correct when referring to formal syllabus/curriculum alignment. |
| Product modules surfaced from assignment records | `a.module`, `rec.module` | Backend module names such as MathPath and Science Adaptive Revision are product identifiers. |

## Recommended Copy Principles

- Use `Learning Path`, `Skill Path`, `Practice`, `Checkpoint`, `Mistake Review`, and `Mastery Progress` for MathPath.
- Use `Activity`, `Investigation`, `Journal`, and `Real-life task` for LifeLab.
- Use `Practice Task` for parent/teacher/tutor-set student work.
- Keep `lesson` only where it refers to actual tutoring sessions or teacher-facing lesson preparation.
- Keep `module` only where it is an internal product identifier or formal training structure.
