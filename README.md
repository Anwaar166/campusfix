# CampusFix — Smart Campus Issue & Maintenance Portal

![CampusFix Banner](https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1200&q=80)

**CampusFix** is a centralized, transparent campus issue-reporting and maintenance-management platform. It replaces scattered reports in informal messaging groups and paper logs with a searchable, community-prioritized, and auditable facilities workflow.

---

## 🌟 Key Features

1. **Duplicate-Aware Issue Submission**:
   - As students/staff enter building, category, or title details, CampusFix performs real-time similarity checks to detect existing reports and prompts users to upvote existing issues instead of creating duplicates.

2. **Community Upvoting & Prioritization**:
   - Campus members can upvote open issues to express collective urgency and community impact. Unique per-user voting is enforced directly by PostgreSQL database constraints.

3. **Auditable Workflow Timeline**:
   - Every status transition (`Open` → `In Progress` → `Resolved` → `Closed` / `Rejected`), crew assignment, priority change, or technician progress note is recorded chronologically in an immutable audit timeline.

4. **Administrative Command Center & Triage**:
   - Authorized facilities administrators can filter and triage reports, assign specialized maintenance teams (IT, Electrical, Plumbing, Labs, Operations) and lead technicians, document resolution summaries, or record formal rejection reasons.

5. **Reporter Verification Feedback**:
   - Once an issue is marked resolved, the original reporter receives an in-app alert and can submit 1–5 star ratings, verify whether the fix is working, and leave feedback.

6. **Institutional Operational Analytics**:
   - Facilities dashboard with KPI cards (Total, Open, In-Progress, Resolved, Average & Median resolution times in hours), breakdown charts by category and building hotspots, urgency distributions, and one-click CSV report export.

7. **Database-Level Row Level Security (RLS)**:
   - Authorization is enforced by PostgreSQL RLS policies in Supabase, preventing role tampering and unauthorized modifications.

---

## 👥 Demo Personas (Instant Access)

The application includes one-click instant authentication buttons on `/login`, `/signup`, and the homepage:

| Role | Demo Email | Password | Responsibilities |
|---|---|---|---|
| **Administrator** | `admin@campusfix.edu` | `CampusFix2026!` | Facilities triage, team assignment, status transitions, analytics, config management |
| **Student** | `student@campusfix.edu` | `CampusFix2026!` | Alex Rivera: Issue reporting, campus feed, community upvoting, personal submissions |
| **Faculty / Staff** | `faculty@campusfix.edu` | `CampusFix2026!` | Dr. Sarah Chen: Academic lab and lecture hall issue reporting, upvoting, feedback |
| **Maintenance Lead** | `maintenance@campusfix.edu` | `CampusFix2026!` | Marcus Vance: Facilities technician, work orders, progress updates, completion notes |

---

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server & Client Components, Route Middleware)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Lucide React](https://lucide.dev/) icons
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security, Triggers & Views)
- **Authentication**: Supabase Auth with server-side cookie management (`@supabase/ssr`)
- **Deployment**: [Vercel](https://vercel.com/) with automated GitHub CI/CD

---

## 🗄 Database Schema Overview

- `profiles`: User identity, display names, departments, and roles (`student`, `faculty`, `admin`, `maintenance`). Protected against unauthorized role modification.
- `buildings`: Campus facilities directory (e.g., Science & Engineering Complex, Academic Library, Computing Tower).
- `categories`: Maintenance classifications (`IT & Wi-Fi`, `Electrical`, `Plumbing`, `Lab Equipment`, `Furniture`).
- `maintenance_teams`: Specialized dispatch crews (Network Services, Power Crew, Plumbing Crew, Lab Ops).
- `issues`: Campus maintenance tickets tracking location, urgency, status, assignments, duplicate links, resolution summaries, and timestamps.
- `issue_upvotes`: Community votes enforcing unique `(issue_id, user_id)`.
- `issue_updates`: Chronological immutable audit history of comments, assignments, and status transitions.
- `notifications`: User-specific in-app notifications for ticket assignment and resolution events.
- `issue_feedback`: Post-resolution reporter ratings and completion verifications.
- `issues_with_counts`: High-performance security-invoker SQL view aggregating upvote totals and joined metadata.

---

## 🚀 Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Anwaar166/campusfix.git
   cd campusfix
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tofdmmwgbgnqgkytbvbc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🔒 Security Highlights

- **No Secrets in Client Code**: Only the public publishable anon key is utilized on client boundaries; administrative and sensitive actions are verified via database RLS.
- **Role Elevation Guard**: PostgreSQL triggers block any non-admin user from altering their own `role` column in `profiles`.
- **Ownership Verification**: Reporters can only edit or delete their own issues while the status remains `Open`. Once triaged or in progress, status transitions can only be authorized by administrators or assigned maintenance staff.

---

## 📄 License

MIT © CampusFix Team
