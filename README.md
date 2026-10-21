# Akademi

See [HUONG_DAN_CHUC_NANG.md](./HUONG_DAN_CHUC_NANG.md) for the Vietnamese feature guide, screen-to-file mapping, and modification guidance.

## Data persistence

Business data is read from and written to the generic resource API through
`src/data/apiClient.js`. The client loads its endpoint settings from
`public/api-config.json`, which is served as `/api-config.json` during local
development and copied into the production build. Configure `schoolYearsUrl`,
`schoolYearsUpdateUrl` (ending in `/api/resources/SchoolYears/dataID`), and
`classesUrl` there. The school-year update endpoint replaces `dataID` with the
record `_id`; all other resources use the `classesUrl` host and API query
parameters. This file is delivered to browsers, so only use API keys that are
intended to be public.

Resource names and readable business key fields are centralized in
`src/data/resourceConfig.js`: `SchoolYears` (`schoolYearKey`), `Classes`
(`classKey`), `Subjects` (`subjectKey`), `Teachers` (`teacherKey`), `Students` (`studentKey`),
`Users` (`accountKey`),
`StudentEnrollments` (`enrollmentKey`), `Grades` (`gradeKey`),
`StudentTranscripts` (`transcriptKey`), `Notices` (`noticeKey`),
`ExtracurricularActivities` (`activityKey`), `Books` (`bookKey`),
`BookLoans` (`loanKey`), `TimetableLessons` (`lessonKey`),
`TimetableSettings` (`timetableSettingsKey`), and `ClassPromotionPlans`
(`promotionPlanKey`). The API generates `_id`; the application uses each
resource-specific field for readable references and `_id` for API updates and
deletes. Those resources must already exist on the API. The application does not create,
rename, delete, or seed resources, and does not fill an empty remote collection
with demo records. Startup reports API/configuration errors instead of switching
to browser storage. Operations spanning multiple records are sequential; a
failure reports the completed portion because the API does not promise
transactions or bulk operations.

Business data saved by older versions in browser storage is not automatically
uploaded; review and migrate any needed legacy records separately before
retiring that data.

The only application `localStorage` value is `akademi.current-school-year`.
It stores the user's selected year as a UI preference when the API does not
identify a current year; school-year records and their `isCurrent` business
state remain API-owned.

`Users` account records use `accountKey`, `username`, `password`, and `role`
(`principal`, `teacher`, or `student`). The `Roles` resource stores one record per `roleKey`, with `menuAccess` mapping
menu keys to `hide`, `read`, or `edit`.
Unconfigured menus default to `hide`. The principal can edit this mapping on the
Phân quyền screen; hidden menus are removed from navigation, and direct URL
access renders no app content, shows an access-denied message, then redirects
to the dashboard. Read-only routes render their content but disable interaction
inside the page. On the timetable, `read` keeps the school-year, class, and
teacher selectors available for querying while hiding schedule settings and
lesson add/edit controls. `edit` enables those controls.
Principal and teacher accounts link to
`Teachers` by `teacherKey`; student accounts link to `Students` by `studentKey`.
The login form checks credentials against records loaded from the API; no
username or password is bundled in the application. The generic resource API
returns account records to the browser, so this is only suitable for a demo.
Never store real passwords in this resource; production authentication needs a
backend that stores password hashes and issues authenticated sessions/tokens.
Creating a student also creates a `Users` account linked by `studentKey`. The
username is the normalized given name plus initials of surname/middle names
(`Nguyễn Văn Nam` becomes `namnv`); collisions get the first available numeric
suffix (`namnv1`, `namnv2`, ...). The initial demo password is the student's
business key (student code).
Creating a teacher similarly creates a `Users` account linked by `teacherKey`;
its initial password is the teacher's business key (teacher code).
`Subjects` is the source catalog used by grade entry, grade summaries, report
cards, transcripts, and timetable lesson subjects. A subject record uses
`subjectKey`, `name`, optional `gradeLevels`, and optional `isActive`. Teacher
records store `subjectKeys` that reference `Subjects.subjectKey`; teacher lists
display the resolved subject names. Principal accounts do not need subject
assignments. Create the `Subjects` API resource and import its records from
`mockapi/sample-data.json` before starting the app; the application does not
create resources on the API. The principal manages subject names and
descriptions from the Môn học menu. A subject can be deleted only if it has no
teacher assignments or grade records, preserving existing references.
The account icon opens the linked personal profile. Students and teachers can
edit their own profile there; their management routes remain blocked, and the
self-service form provides no navigation back to management lists.
