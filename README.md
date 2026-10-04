# EduLink

**EduLink** connects schools, parents, students, teachers and administrators on one platform. Parents follow their child's school life in real time: attendance, grades, homework, timetable, announcements, events, behaviour, documents, payments, transport and messages with the school.

The repository contains a working prototype of the whole product:

| Package | What it is |
| --- | --- |
| [`apps/mobile`](apps/mobile) | **Mobile app** (React Native + Expo Router + TypeScript) for parents, students, teachers and administrators. It also runs on the web. |
| [`apps/admin`](apps/admin) | **Web administration dashboard** (Next.js 16 + TypeScript), responsive. |
| [`packages/shared`](packages/shared) | Domain model, deterministic demo data, business logic (statistics, insights, RBAC, calendar, search, analytics) and tests. |
| [`packages/db`](packages/db) | **PostgreSQL** schema (deployed on **Railway**), row-level security, audit triggers, seeder and security test suite. |

<p align="center">
  <img src="docs/screenshots/parent-home.png" width="300" alt="Parent dashboard" />
</p>

---

## Demo accounts

All demo accounts use the password **`edulink2026`**. The login screen has one-tap shortcuts for each.

| Role | Login (e-mail) | Also works with |
| --- | --- | --- |
| Parent (Sarah 6ème B, Adam 3ème A) | `mohamed.benali@exemple.tn` | phone `98 123 456`, school ID `HZ-P-2041` |
| Student | `sarah.benali@eleve.horizon.edu.tn` | school ID `HZ-E-6B14` |
| Teacher (maths) | `leila.bensalem@horizon.edu.tn` | — |
| Administrator | `nadia.chaabane@horizon.edu.tn` | — |

The prototype runs on a **fixed demo clock, Monday 16 November 2026 at 16:45**, so every screen tells the same story:
- Sarah entered school at 08:05 and left at 16:32. Her bus is on its way home.
- The maths test is in two days.
- The parent-teacher meeting is on Friday.
- The authorisation for the Bardo museum trip is still to sign.
- The 10 November absence is still to be justified.

## Getting started

Requires Node 22+.

```bash
npm install

# Mobile app (Expo) — press "w" for web, or scan the QR code with Expo Go / a dev build
npm run mobile
npm run mobile:web

# Web administration dashboard → http://localhost:3001
npm run admin

# Quality
npm run typecheck
npm test
```

### Database (PostgreSQL on Railway)

The Railway project **`edulink`** contains:
- a **PostgreSQL** service;
- a **`db-setup`** job built from `packages/db/Dockerfile`. It applies the migrations, loads the demo data if the database is empty, and runs the security checks. It reads `${{Postgres.DATABASE_URL}}` and redeploys when `packages/db` or `packages/shared` change.

To run the same steps against any PostgreSQL 13+ database:

```bash
export DATABASE_URL=postgresql://user:password@host:5432/db   # Railway: Postgres → Connect → public URL
npm run db:setup        # migrate + seed (skipped when data exists) + verify RLS
npm run db:seed -- --force   # reset the demo dataset
```

The Railway run produced:

```
✓ 0001_schema.sql appliquée
✓ 0002_security.sql appliquée
✓ Données de démonstration chargées (14 comptes de démo, mot de passe « edulink2026 »).
✓ Un parent ne voit que ses deux enfants
✓ Un parent ne voit aucune note, présence ou paiement d'un autre élève
✓ Un parent ne peut pas ajouter de note
✓ Un parent peut justifier l'absence de son enfant, pas celle d'un autre
✓ Une enseignante voit ses classes autorisées uniquement
✓ Une enseignante peut noter un élève de sa classe (et cela est audité)
✓ Une enseignante ne peut pas publier une alerte critique à toute l'école
✓ Une élève ne voit que son propre dossier
✓ L'administration voit tout l'établissement et le journal d'audit
✓ Les messages ne sont visibles que des participants
✓ Sans identité, aucune donnée
Tous les contrôles de sécurité sont passés (11).
```

> The mobile and web apps currently run on the in-memory demo dataset from `packages/shared`. It is the same data that is seeded into PostgreSQL. The next step is an API service (NestJS or Fastify) on Railway that reads PostgreSQL through the `edulink_app` role (see *Security*). The data-access layer in `apps/mobile/src/store` is the single place to swap.

---

## Architecture

```
┌──────────────────────┐      ┌──────────────────────┐
│ apps/mobile (Expo)   │      │ apps/admin (Next.js) │
│ parent · student ·   │      │ direction / staff    │
│ teacher · admin      │      │                      │
└──────────┬───────────┘      └──────────┬───────────┘
           │   @edulink/shared (domain model, logic, demo data, RBAC)
           └──────────────┬──────────────┘
                          │  (next step: REST/WebSocket API with JWT)
                ┌─────────▼──────────┐
                │ PostgreSQL (Railway)│  packages/db
                │ RLS · audit · seed  │
                └─────────────────────┘
```

- **Shared domain** (`packages/shared`): the typed model mirrors the SQL schema. Statistics (attendance rate, weighted averages, trends), "smart" features (AI-style summary, constructive risk alerts, daily digest, weekly summary, the "À ne pas manquer" priority list), calendar aggregation, grouped search, admin analytics and RBAC are pure functions, unit-tested with `node:test`.
- **Mobile app** (`apps/mobile/src`):
  - `app/` holds the Expo Router routes (one file per screen; `(tabs)` is the 5-item bottom navigation).
  - `store/AppStore.tsx` is the session, preferences and every mutation. Mutations fan notifications out to the right families, simulating FCM/APNs.
  - `components/` is the UI kit: typography, cards, chips, status pills, progress rings, charts, skeletons, bottom sheets, signature pad and calendar.
  - `i18n/` has the French, English and Arabic dictionaries, type-checked for completeness.
  - `theme/` holds the design tokens and light/dark themes.
  - `services/` covers authentication, secure storage and PDF generation.
- **Admin dashboard** (`apps/admin/src`): App Router pages under `(app)/` behind a session guard, with a client store over the same shared data, SVG charts and an accessible table/drawer/modal kit.
- **Database** (`packages/db/migrations`):
  - `0001_schema.sql` covers all entities from the brief (Schools, Users, Parents, Students, Teachers, Administrators, Classes, Subjects, StudentParents, TeacherClasses, Attendance, Grades, Exams, Homework, Timetables, Announcements, Events, EventParticipants, Messages, Conversations, Documents, ReportCards, Payments, TransportRoutes, Buses, Notifications, TeacherFeedback, Appointments, Clubs, ClubRegistrations). It adds acknowledgements, signatures, sessions, push tokens, canteen data and the audit log.
  - `0002_security.sql` holds the RBAC and RLS policies, secure functions and audit triggers.

## Security & privacy

- **Row-level security in PostgreSQL**, so it is enforced even if the API has a bug. The API sets `role edulink_app` and `app.user_id` from the verified JWT on every request. Policies then guarantee that:
  - parents only see their own children;
  - teachers only see the classes they teach, and never payments;
  - students only see their own record;
  - messages are visible to conversation participants only;
  - the audit log is admin-read-only and append-only.
- **Narrow write paths**: parents can only justify absences, through the `app.justify_absence()` security-definer function. Teachers can only publish class-scoped, non-critical announcements and grade their own classes.
- **Audit triggers** record every write to grades, attendance, announcements, payments, documents, report cards and parent/teacher links, with the actor's identity.
- **Credentials**: scrypt password hashing with a per-user salt. The app locks login after 5 failed attempts. Sessions are short and the token is kept in the iOS Keychain or Android Keystore (`expo-secure-store`). Optional Face ID / fingerprint unlock and auto-lock.
- **No cross-family exposure**:
  - class averages are anonymous aggregates;
  - transport shows only the family's own stop;
  - search is scoped to the user's children;
  - the teacher roster refuses unauthorised classes.
- The admin dashboard sends strict security headers (`X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`) and `noindex`.

## Product coverage

| # | Requirement | Where |
| --- | --- | --- |
| 1 | Roles: parent, student, teacher, administrator | `ROLE_PERMISSIONS`, role-aware tabs and homes |
| 2, 24, 29 | Parent dashboard and priority system, in the specified order | `features/home/ParentHome.tsx` |
| 3, 4, 41 | Attendance with calendar, stats, justification and upload; real-time notifications; QR/RFID/NFC check-in | `app/attendance/*`, `app/admin/checkin.tsx` |
| 5, 6, 7 | Grades, subject detail with comments, analytics with charts and a constructive summary, report cards with PDF | `app/grades/*`, `app/analytics.tsx`, `app/report-cards.tsx` |
| 8, 9, 10 | Homework (to do / done / late, attachments, student completion), timetable (today / week, pastel subjects), exams with revision docs and reminders | `app/homework/*`, `app/timetable.tsx`, `app/exams.tsx` |
| 11, 12, 14, 42 | News, events with RSVP and e-signed authorisation, announcements, emergency alerts with "J'ai lu l'information" and acknowledgement tracking | `app/news/*`, `app/events/*`, `app/announcements.tsx`, `app/admin/emergency.tsx` |
| 13 | Smart calendar with filters | `app/(tabs)/calendar.tsx` |
| 15, 16, 17 | Secure messaging (categories, attachments, read receipts, school-controlled policy and voice switch), appointments, non-punitive observations | `app/(tabs)/messages.tsx`, `app/chat/[id].tsx`, `app/appointments.tsx`, `app/behavior.tsx` |
| 18, 19, 20, 21, 22 | Documents with e-signature, payments, transport (live and privacy-preserving), canteen and allergies, clubs | `app/documents.tsx`, `app/payments.tsx`, `app/transport.tsx`, `app/canteen.tsx`, `app/clubs.tsx` |
| 23, 25, 26 | Notification centre and preferences, universal grouped search, multi-child switcher | `app/notifications.tsx`, `app/search.tsx`, `components/ChildSwitcher.tsx` |
| 27, 32, 33 | French / Arabic (full RTL) / English, light / dark / system, large text, screen-reader labels, status never shown by colour alone | `i18n/*`, `theme/*`, `components/*` |
| 28, 37 | Five-item bottom navigation; profile and settings | `components/TabBar.tsx`, `app/(tabs)/profile.tsx`, `app/settings/*` |
| 34, 35, 36 | Security; splash, onboarding, login (e-mail / phone / school ID), forgot password, activation, biometrics | `packages/db`, `app/index.tsx`, `app/onboarding.tsx`, `app/login.tsx`, `app/activate.tsx` |
| 38 | Web admin dashboard (KPIs, analytics, students, parents, teachers, classes, attendance, announcements, events, payments, transport, push, settings, audit) | `apps/admin` |
| 39 | Teacher interface: today's classes, quick actions, rapid roll call, grades, homework, messages | `features/home/TeacherHome.tsx`, `app/teacher/*` |
| 40 | Daily digest, weekly summary, constructive risk alerts | `packages/shared/src/logic/insights.ts`, `app/digest.tsx` |
| 43 | Demo data: Sarah Ben Ali, 6ème B, École Internationale Horizon, 15.4 / 20, 96%, the specified teachers and subjects | `packages/shared/src/demo` (asserted by tests) |
| 44 | Animations: fade/rise entrances, animated rings, counters and charts, badge pulse, tab-bar spring, pull-to-refresh with skeletons, calendar transitions; honours "reduce motion" | `components/animated.tsx` |
| 45, 46 | Expo + TypeScript, Next.js admin, PostgreSQL, JWT/RLS-ready architecture, full entity model | this repository |
| 47 | Working flows for parent, teacher and admin (below) | — |

### End-to-end flows verified in a real browser

- **Parent**: login → dashboard → switch child → attendance → justify absence → grades → homework → event RSVP and signature → messages.
- **Teacher**: login → today's classes → roll call (4ème B) → grade entry for 6ème B (Sarah 18.5) → homework → message a parent. Logging back in as the parent shows the new grade and the notification badge going up.
- **Administrator** (mobile): KPIs → emergency alert with acknowledgement tracking → QR check-in kiosk that syncs to the parent app.
- **Administrator** (web): login → dashboard → students (search and detail drawer) → classes → emergency announcement → event → analytics → settings → audit log.

## Screenshots

| | |
| --- | --- |
| ![Academics](docs/screenshots/parent-academics.png) | ![Events & calendar](docs/screenshots/parent-events-calendar.png) |
| ![Messages](docs/screenshots/parent-messages-appointments.png) | ![Services](docs/screenshots/parent-services.png) |
| ![Teacher](docs/screenshots/teacher-flow.png) | ![Admin mobile](docs/screenshots/admin-mobile.png) |
| ![Arabic RTL](docs/screenshots/arabic-rtl.png) | ![Dark mode](docs/screenshots/dark-mode.png) |

![Admin dashboard](docs/screenshots/admin-dashboard.png)

## Design system

- **Palette**:
  - primary Deep Education Blue `#2563EB`, secondary teal `#14B8A6`;
  - success `#22C55E`, warning `#F59E0B`, error `#EF4444`;
  - background `#F6F8FC`, cards `#FFFFFF`, text `#172033` / `#667085`;
  - accents: purple for academics, orange for events, green for attendance, blue for communication.
- **Type**: Plus Jakarta Sans. Arabic falls back to the platform font.
- **Shapes and spacing**: 14–20 px radii, soft shadows, generous spacing, 44 px minimum touch targets.
- **Dark mode** uses its own contrast-checked palette.

## Roadmap

1. API service on Railway (NestJS): JWT + refresh rotation against `users.password_hash`, the RLS context per request, WebSocket channel for live attendance, transport and messages.
2. Push delivery: store device tokens in `push_tokens`, then send through FCM and APNs.
3. Object storage for documents and signed download URLs, and an online payment provider.
4. EAS builds for iOS and Android; camera-based QR scanning (`expo-camera`) for the kiosk.
