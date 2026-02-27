<div align="center">

# 📰 Newspaper Management System

### A Modern Solution for University Library Newspaper Delivery Tracking

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=for-the-badge&logo=clerk)](https://clerk.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

<br />

*A full-stack web application that streamlines newspaper delivery management for university libraries with real-time tracking, role-based access control, and comprehensive reporting.*

<br />

[Getting Started](#-getting-started) •
[Features](#-features) •
[Tech Stack](#-tech-stack) •
[API Reference](#-api-reference) •
[Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Frontend Routes](#-frontend-routes)
- [Authentication & Authorization](#-authentication--authorization)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Excel Reports](#-excel-reports)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

The **Newspaper Management System** is a comprehensive solution designed specifically for university libraries to efficiently manage their newspaper subscriptions and track daily deliveries. 

### Why This System?

University libraries often struggle with:
- 📊 **Tracking multiple newspaper subscriptions** across different days
- 💰 **Managing varying rates** for weekdays vs weekends
- 📝 **Generating accurate billing reports** for accounting
- 👥 **Coordinating between multiple staff members** for marking deliveries

This system solves all these problems with an intuitive, modern interface and powerful backend.

### Key Highlights

| Feature | Benefit |
|---------|---------|
| 🎯 **Day-Specific Pricing** | Set different rates for each day (e.g., Sunday editions cost more) |
| 📅 **Monthly Configuration** | Configure newspapers once per month with auto-generated daily entries |
| 📈 **Real-time Statistics** | See delivery rates, missing papers, and total costs at a glance |
| 📑 **Excel Export** | Generate detailed matrix-format reports for accounting |
| 🔐 **Role-Based Access** | Admins manage settings; Users mark deliveries |
| 🚀 **Modern Stack** | Built with Next.js 16, React 19, and Express 5 |

---

## ✨ Features

### 👑 Admin Features

<table>
<tr>
<td width="50%">

#### 🏛️ University Management
- Create and configure your university organization
- Single admin per university for security
- Manage all university-level settings

#### 📰 Newspaper Management
- Add unlimited newspaper subscriptions
- Edit newspaper names anytime
- Delete newspapers (cascades to all related data)
- View all newspapers in a clean list

</td>
<td width="50%">

#### 💵 Rate Configuration
- Set day-specific rates (Mon-Sun)
- Configure rates per month for flexibility
- Copy rates from one month to another
- Update existing rate configurations

#### 👥 User Management
- View pending join requests
- Approve or reject users with one click
- Users receive automatic access upon approval

</td>
</tr>
<tr>
<td width="50%">

#### ✅ Delivery Marking
- Mark newspapers as received/not received
- Navigate to any date easily
- See who marked each entry
- Bulk viewing in calendar mode

</td>
<td width="50%">

#### 📊 Reporting
- Download detailed Excel reports
- Matrix format: Newspapers × Dates
- Color-coded cells for status
- Summary statistics included
- Total amount calculations

</td>
</tr>
</table>

### 👤 User Features

<table>
<tr>
<td width="50%">

#### 🔍 University Discovery
- Browse all available universities
- Submit join requests
- Track request status

</td>
<td width="50%">

#### 📅 Daily Operations
- View newspapers for any date
- Mark as received/not received
- See daily statistics
- Navigate dates easily

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| ![Next.js](https://img.shields.io/badge/-Next.js-000000?style=flat-square&logo=next.js) **Next.js** | `16.1.6` | React framework with App Router |
| ![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black) **React** | `19.2.3` | UI component library |
| ![Tailwind](https://img.shields.io/badge/-Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) **Tailwind CSS** | `4.x` | Utility-first CSS framework |
| ![Clerk](https://img.shields.io/badge/-Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white) **@clerk/nextjs** | `6.14.0` | Authentication & user management |
| ![Axios](https://img.shields.io/badge/-Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) **Axios** | `1.6.5` | HTTP client |
| ![date-fns](https://img.shields.io/badge/-date--fns-770C56?style=flat-square) **date-fns** | `3.0.6` | Date manipulation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| ![Express](https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express) **Express.js** | `5.2.1` | Web server framework |
| ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white) **@supabase/supabase-js** | `2.39.0` | PostgreSQL database client |
| ![Clerk](https://img.shields.io/badge/-Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white) **@clerk/clerk-sdk-node** | `5.0.0` | Backend authentication |
| ![ExcelJS](https://img.shields.io/badge/-ExcelJS-217346?style=flat-square&logo=microsoft-excel&logoColor=white) **ExcelJS** | `4.4.0` | Excel report generation |

### Infrastructure

| Service | Purpose |
|---------|---------|
| ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white) **Supabase** | PostgreSQL database hosting |
| ![Clerk](https://img.shields.io/badge/-Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white) **Clerk** | Authentication provider |
| ![Vercel](https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel) **Vercel** | Frontend hosting |
| ![Render](https://img.shields.io/badge/-Render-46E3B7?style=flat-square&logo=render&logoColor=white) **Render** | Backend hosting |

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│   │   Landing    │    │    Admin     │    │  Dashboard   │              │
│   │    Page      │    │    Panel     │    │    (User)    │              │
│   │     (/)      │    │   (/admin)   │    │ (/dashboard) │              │
│   └──────────────┘    └──────────────┘    └──────────────┘              │
│          │                   │                   │                       │
│          └───────────────────┼───────────────────┘                       │
│                              │                                           │
│                    ┌─────────▼─────────┐                                │
│                    │   Next.js App     │                                │
│                    │   (App Router)    │                                │
│                    │                   │                                │
│                    │ • Clerk Provider  │                                │
│                    │ • Route Guards    │                                │
│                    │ • API Client      │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
└──────────────────────────────┼───────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │     HTTP/HTTPS      │
                    │     (REST API)      │
                    └──────────┬──────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────────┐
│                              │           SERVER LAYER                    │
├──────────────────────────────┼───────────────────────────────────────────┤
│                    ┌─────────▼─────────┐                                │
│                    │   Express.js      │                                │
│                    │     Server        │                                │
│                    └─────────┬─────────┘                                │
│                              │                                           │
│     ┌────────────────────────┼────────────────────────┐                 │
│     │                        │                        │                 │
│     ▼                        ▼                        ▼                 │
│ ┌─────────┐           ┌─────────────┐          ┌───────────┐           │
│ │  CORS   │           │    Auth     │          │  Routes   │           │
│ │Middleware│          │ Middleware  │          │  Handler  │           │
│ └─────────┘           │             │          │           │           │
│                       │• requireAuth│          │• /onboard │           │
│                       │• requireAdmin          │• /admin   │           │
│                       │• requireApproved       │• /api     │           │
│                       └─────────────┘          └───────────┘           │
│                              │                        │                 │
│                              └────────────┬───────────┘                 │
│                                           │                             │
└───────────────────────────────────────────┼─────────────────────────────┘
                                            │
┌───────────────────────────────────────────┼─────────────────────────────┐
│                              DATA LAYER   │                             │
├───────────────────────────────────────────┼─────────────────────────────┤
│                                           │                             │
│    ┌──────────────────┐         ┌─────────▼─────────┐                  │
│    │                  │         │                   │                  │
│    │   Clerk API      │◄───────►│  Supabase         │                  │
│    │                  │         │  PostgreSQL       │                  │
│    │ • User Data      │         │                   │                  │
│    │ • JWT Tokens     │         │ • universities    │                  │
│    │ • Metadata       │         │ • newspapers      │                  │
│    │                  │         │ • newspaper_rates │                  │
│    └──────────────────┘         │ • newspaper_entries                  │
│                                 │ • join_requests   │                  │
│                                 │                   │                  │
│                                 └───────────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Action → Next.js Middleware → Clerk Auth Check → API Request
                                                           │
                                                           ▼
Express Server ← JWT Verification ← Clerk SDK ← Backend Auth Middleware
       │
       ▼
Route Handler → Supabase Query → Database → Response
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  ┌──────────────────────┐            ┌──────────────────────┐               │
│  │    UNIVERSITIES      │            │    JOIN_REQUESTS     │               │
│  ├──────────────────────┤            ├──────────────────────┤               │
│  │ id          UUID PK  │◄───────────│ university_id   FK   │               │
│  │ name        VARCHAR  │            │ id              UUID │               │
│  │ admin_clerk_id       │            │ user_clerk_id        │               │
│  │ created_at  TIMESTAMP│            │ status   ENUM        │               │
│  └──────────┬───────────┘            │   • pending          │               │
│             │                        │   • approved         │               │
│             │ 1:N                    │   • rejected         │               │
│             │                        │ created_at           │               │
│             │                        │ updated_at           │               │
│             ▼                        └──────────────────────┘               │
│  ┌──────────────────────┐                                                    │
│  │     NEWSPAPERS       │                                                    │
│  ├──────────────────────┤                                                    │
│  │ id          UUID PK  │───────────────────────────┐                       │
│  │ university_id   FK   │                           │                       │
│  │ name        VARCHAR  │                           │                       │
│  │ created_at           │                           │                       │
│  │ updated_at           │                           │                       │
│  └──────────┬───────────┘                           │                       │
│             │                                       │                       │
│             │ 1:N                                   │ 1:N                   │
│             │                                       │                       │
│             ▼                                       ▼                       │
│  ┌──────────────────────┐            ┌──────────────────────┐               │
│  │   NEWSPAPER_RATES    │            │  NEWSPAPER_ENTRIES   │               │
│  ├──────────────────────┤            ├──────────────────────┤               │
│  │ id          UUID PK  │            │ id          UUID PK  │               │
│  │ newspaper_id    FK   │            │ newspaper_id    FK   │               │
│  │ month      CHAR(7)   │            │ date           DATE  │               │
│  │   (YYYY-MM format)   │            │ status        ENUM   │               │
│  │ day_of_week  ENUM    │            │   • received         │               │
│  │   • Monday           │            │   • not_received     │               │
│  │   • Tuesday          │            │   • unmarked         │               │
│  │   • ...              │            │ marked_by_clerk_id   │               │
│  │   • Sunday           │            │ created_at           │               │
│  │ rate       DECIMAL   │            │ updated_at           │               │
│  │ created_at           │            └──────────────────────┘               │
│  │ updated_at           │                                                    │
│  └──────────────────────┘                                                    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Table Descriptions

#### `universities`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `name` | VARCHAR(255) | University name, must be unique |
| `admin_clerk_id` | VARCHAR(255) | Clerk ID of the admin user |
| `created_at` | TIMESTAMP | When the university was created |

#### `join_requests`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_clerk_id` | VARCHAR(255) | Clerk ID of requesting user |
| `university_id` | UUID | Foreign key to universities |
| `status` | ENUM | `pending`, `approved`, or `rejected` |
| `created_at` | TIMESTAMP | When request was submitted |
| `updated_at` | TIMESTAMP | When request was processed |

#### `newspapers`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `university_id` | UUID | Foreign key to universities |
| `name` | VARCHAR(255) | Newspaper name (unique per university) |
| `created_at` | TIMESTAMP | When newspaper was added |
| `updated_at` | TIMESTAMP | Last modification time |

#### `newspaper_rates`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `newspaper_id` | UUID | Foreign key to newspapers |
| `month` | CHAR(7) | Month in `YYYY-MM` format |
| `day_of_week` | ENUM | `Monday` through `Sunday` |
| `rate` | DECIMAL(10,2) | Price for that day |
| `created_at` | TIMESTAMP | When rate was configured |
| `updated_at` | TIMESTAMP | Last rate update |

#### `newspaper_entries`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `newspaper_id` | UUID | Foreign key to newspapers |
| `date` | DATE | Specific date for entry |
| `status` | ENUM | `received`, `not_received`, or `unmarked` |
| `marked_by_clerk_id` | VARCHAR(255) | Who marked this entry |
| `created_at` | TIMESTAMP | When entry was created |
| `updated_at` | TIMESTAMP | When status was last changed |

### Indexes

```sql
-- Performance optimization indexes
CREATE INDEX idx_join_requests_university ON join_requests(university_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
CREATE INDEX idx_newspapers_university ON newspapers(university_id);
CREATE INDEX idx_newspaper_rates_newspaper_month ON newspaper_rates(newspaper_id, month);
CREATE INDEX idx_newspaper_entries_newspaper ON newspaper_entries(newspaper_id);
CREATE INDEX idx_newspaper_entries_date ON newspaper_entries(date);
```

---

## 📡 API Reference

### Base URL

```
Development: http://localhost:5000
Production:  https://your-backend.onrender.com
```

### Authentication

All protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <clerk_jwt_token>
```

---

### 🔓 Onboarding Endpoints

<details>
<summary><code>GET</code> <code>/api/onboarding/universities</code> - List all universities</summary>

#### Description
Returns a list of all universities available for users to join.

#### Authentication
None required (public endpoint)

#### Response

```json
{
  "universities": [
    {
      "id": "uuid-string",
      "name": "Example University",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ]
}
```

</details>

<details>
<summary><code>POST</code> <code>/api/onboarding/admin</code> - Create university (Admin)</summary>

#### Description
Creates a new university and assigns the current user as admin.

#### Authentication
Required (Clerk JWT)

#### Request Body

```json
{
  "universityName": "My University"
}
```

#### Response

```json
{
  "message": "University created successfully",
  "university": {
    "id": "uuid-string",
    "name": "My University",
    "admin_clerk_id": "user_xxx",
    "created_at": "2026-02-27T10:30:00Z"
  }
}
```

#### Errors

| Status | Message |
|--------|---------|
| 400 | University name is required |
| 400 | You have already created a university |

</details>

<details>
<summary><code>POST</code> <code>/api/onboarding/user</code> - Submit join request</summary>

#### Description
Submits a request to join an existing university.

#### Authentication
Required (Clerk JWT)

#### Request Body

```json
{
  "universityId": "uuid-string"
}
```

#### Response

```json
{
  "message": "Join request submitted successfully",
  "joinRequest": {
    "id": "uuid-string",
    "user_clerk_id": "user_xxx",
    "university_id": "uuid-string",
    "status": "pending",
    "created_at": "2026-02-27T10:30:00Z"
  }
}
```

</details>

---

### 👑 Admin Endpoints

<details>
<summary><code>GET</code> <code>/api/admin/join-requests</code> - Get pending requests</summary>

#### Description
Returns all pending join requests for the admin's university.

#### Authentication
Required (Admin only)

#### Response

```json
{
  "requests": [
    {
      "id": "uuid-string",
      "user_clerk_id": "user_xxx",
      "university_id": "uuid-string",
      "status": "pending",
      "created_at": "2026-02-27T10:30:00Z",
      "userName": "John Doe",
      "userEmail": "john@example.com"
    }
  ]
}
```

</details>

<details>
<summary><code>PATCH</code> <code>/api/admin/join-requests/:id</code> - Approve/Reject request</summary>

#### Description
Updates the status of a join request.

#### Authentication
Required (Admin only)

#### Request Body

```json
{
  "status": "approved"  // or "rejected"
}
```

#### Response

```json
{
  "message": "Join request approved successfully",
  "status": "approved"
}
```

</details>

<details>
<summary><code>POST</code> <code>/api/admin/newspapers</code> - Create newspaper</summary>

#### Description
Adds a new newspaper to the university.

#### Authentication
Required (Admin only)

#### Request Body

```json
{
  "name": "Times of India"
}
```

#### Response

```json
{
  "newspaper": {
    "id": "uuid-string",
    "university_id": "uuid-string",
    "name": "Times of India",
    "created_at": "2026-02-27T10:30:00Z"
  }
}
```

</details>

<details>
<summary><code>GET</code> <code>/api/admin/newspapers</code> - List newspapers</summary>

#### Description
Returns all newspapers for the admin's university.

#### Authentication
Required (Admin only)

#### Response

```json
{
  "newspapers": [
    {
      "id": "uuid-string",
      "university_id": "uuid-string",
      "name": "Times of India",
      "created_at": "2026-02-27T10:30:00Z"
    }
  ]
}
```

</details>

<details>
<summary><code>DELETE</code> <code>/api/admin/newspapers/:id</code> - Delete newspaper</summary>

#### Description
Deletes a newspaper and all associated rates and entries.

#### Authentication
Required (Admin only)

#### Response

```json
{
  "message": "Newspaper deleted successfully"
}
```

</details>

<details>
<summary><code>POST</code> <code>/api/admin/newspapers/:id/configure</code> - Configure rates</summary>

#### Description
Sets up rates for a newspaper for a specific month. Also generates daily entries automatically.

#### Authentication
Required (Admin only)

#### Request Body

```json
{
  "month": "2026-02",
  "rates": {
    "Monday": 10.00,
    "Tuesday": 10.00,
    "Wednesday": 10.00,
    "Thursday": 10.00,
    "Friday": 10.00,
    "Saturday": 15.00,
    "Sunday": 20.00
  }
}
```

#### Response

```json
{
  "message": "Newspaper configured successfully",
  "rates": [...],
  "entriesCreated": 28
}
```

</details>

<details>
<summary><code>GET</code> <code>/api/admin/newspapers/:id/rates/:month</code> - Get rates</summary>

#### Description
Gets the configured rates for a newspaper for a specific month.

#### Authentication
Required (Admin only)

#### Response

```json
{
  "newspaperId": "uuid-string",
  "newspaperName": "Times of India",
  "month": "2026-02",
  "rates": {
    "Monday": 10.00,
    "Tuesday": 10.00,
    "Wednesday": 10.00,
    "Thursday": 10.00,
    "Friday": 10.00,
    "Saturday": 15.00,
    "Sunday": 20.00
  },
  "configured": true
}
```

</details>

<details>
<summary><code>PUT</code> <code>/api/admin/newspapers/:id/rates/:month</code> - Update rates</summary>

#### Description
Updates the rates for a newspaper for a specific month.

#### Authentication
Required (Admin only)

#### Request Body

```json
{
  "rates": {
    "Monday": 12.00,
    "Tuesday": 12.00,
    "Wednesday": 12.00,
    "Thursday": 12.00,
    "Friday": 12.00,
    "Saturday": 18.00,
    "Sunday": 25.00
  }
}
```

</details>

<details>
<summary><code>GET</code> <code>/api/admin/all-rates/:month</code> - Get all rates overview</summary>

#### Description
Returns rates for all newspapers for a specific month.

#### Authentication
Required (Admin only)

#### Response

```json
{
  "month": "2026-02",
  "newspapers": [
    {
      "id": "uuid-string",
      "name": "Times of India",
      "configured": true,
      "rates": {
        "Monday": 10.00,
        ...
      }
    }
  ]
}
```

</details>

<details>
<summary><code>POST</code> <code>/api/admin/copy-rates</code> - Copy rates between months</summary>

#### Description
Copies all newspaper configurations from one month to another.

#### Authentication
Required (Admin only)

#### Request Body

```json
{
  "sourceMonth": "2026-01",
  "targetMonth": "2026-02"
}
```

#### Response

```json
{
  "message": "Rates copied from 2026-01 to 2026-02",
  "newspapersCopied": ["Times of India", "The Hindu"],
  "count": 2,
  "entriesCreated": 56,
  "skipped": 0
}
```

</details>

<details>
<summary><code>GET</code> <code>/api/admin/newspaper-entries/:month</code> - Get monthly entries</summary>

#### Description
Returns all newspaper entries for a specific month.

#### Authentication
Required (Admin only)

#### Response

```json
{
  "entries": [
    {
      "id": "uuid-string",
      "newspaper_id": "uuid-string",
      "date": "2026-02-01",
      "status": "received",
      "marked_by_clerk_id": "user_xxx",
      "rate": 15.00,
      "dayOfWeek": "Saturday",
      "newspapers": {
        "id": "uuid-string",
        "name": "Times of India"
      }
    }
  ]
}
```

</details>

<details>
<summary><code>GET</code> <code>/api/admin/report/:month</code> - Download Excel report</summary>

#### Description
Generates and downloads an Excel report for the specified month.

#### Authentication
Required (Admin only)

#### Response
Binary file download (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

</details>

---

### 👤 User Endpoints

<details>
<summary><code>GET</code> <code>/api/newspapers</code> - List newspapers</summary>

#### Description
Returns all newspapers for the user's university.

#### Authentication
Required (Approved user)

#### Response

```json
{
  "newspapers": [
    {
      "id": "uuid-string",
      "name": "Times of India"
    }
  ]
}
```

</details>

<details>
<summary><code>GET</code> <code>/api/newspaper-entries/:month</code> - Get monthly entries</summary>

#### Description
Returns all entries for a specific month.

#### Authentication
Required (Approved user)

</details>

<details>
<summary><code>GET</code> <code>/api/newspaper-entries/date/:date</code> - Get entries for date</summary>

#### Description
Returns entries for a specific date (format: `YYYY-MM-DD`).

#### Authentication
Required (Approved user)

#### Response

```json
{
  "entries": [
    {
      "id": "uuid-string",
      "newspaper_id": "uuid-string",
      "date": "2026-02-27",
      "status": "unmarked",
      "rate": 10.00,
      "dayOfWeek": "Friday",
      "newspapers": {
        "name": "Times of India"
      }
    }
  ]
}
```

</details>

<details>
<summary><code>POST</code> <code>/api/newspaper-entries</code> - Mark entry</summary>

#### Description
Marks a newspaper entry as received or not received.

#### Authentication
Required (Approved user)

#### Request Body

```json
{
  "entryId": "uuid-string",
  "status": "received"  // or "not_received"
}
```

#### Response

```json
{
  "message": "Entry marked as received",
  "entry": {
    "id": "uuid-string",
    "status": "received",
    ...
  }
}
```

</details>

---

## 🖥️ Frontend Routes

### Route Overview

| Route | Component | Description | Access Level |
|-------|-----------|-------------|--------------|
| `/` | `page.js` | Landing page with hero section | 🌐 Public |
| `/sign-in` | Clerk | Authentication page | 🌐 Public |
| `/sign-up` | Clerk | Registration page | 🌐 Public |
| `/onboarding` | `onboarding/page.js` | Role selection & setup | 🔐 Authenticated (no role) |
| `/waiting` | `waiting/page.js` | Pending approval screen | 👤 User (pending) |
| `/dashboard` | `dashboard/page.js` | User marking interface | ✅ Approved users |
| `/admin` | `admin/page.js` | Full admin panel | 👑 Admin only |

### Admin Panel Tabs

The `/admin` page contains a tabbed interface with 5 sections:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Admin Panel                                  │
├─────────┬──────────┬─────────────┬───────────┬─────────────────────┤
│  ✅     │   📅     │    ⚙️       │    👥     │        📊           │
│  Mark   │ Calendar │  Configure  │ Requests  │      Reports        │
├─────────┴──────────┴─────────────┴───────────┴─────────────────────┤
│                                                                      │
│  Tab Content Area                                                    │
│                                                                      │
│  • Mark: Quick marking for any date                                 │
│  • Calendar: Monthly overview of all entries                        │
│  • Configure: Newspaper & rate management                           │
│  • Requests: User approval management                               │
│  • Reports: Excel download functionality                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

The system uses Clerk's `publicMetadata` to store user roles and status:

```typescript
interface UserMetadata {
  role: 'admin' | 'user';
  universityId: string;  // UUID of the user's university
  status?: 'pending' | 'approved' | 'rejected';  // Only for users
}
```

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION FLOW                              │
└──────────────────────────────────────────────────────────────────────────────┘

     ┌─────────┐         ┌─────────────┐         ┌──────────────┐
     │  User   │────────►│   Sign Up   │────────►│  Onboarding  │
     │ Arrives │         │  (Clerk)    │         │    Page      │
     └─────────┘         └─────────────┘         └──────┬───────┘
                                                        │
                              ┌──────────────────────────┼──────────────────────┐
                              │                         │                      │
                              ▼                         ▼                      ▼
                    ┌─────────────────┐      ┌─────────────────┐     ┌────────────────┐
                    │  Choose Admin   │      │  Choose User    │     │  Already Has   │
                    │                 │      │                 │     │  Role? Redirect│
                    └────────┬────────┘      └────────┬────────┘     └────────────────┘
                             │                        │
                             ▼                        ▼
                    ┌─────────────────┐      ┌─────────────────┐
                    │ Create          │      │ Select          │
                    │ University      │      │ University      │
                    └────────┬────────┘      └────────┬────────┘
                             │                        │
                             ▼                        ▼
                    ┌─────────────────┐      ┌─────────────────┐
                    │ Set Metadata:   │      │ Submit Join     │
                    │ role: 'admin'   │      │ Request         │
                    │ universityId    │      └────────┬────────┘
                    └────────┬────────┘               │
                             │                        ▼
                             │               ┌─────────────────┐
                             │               │ Set Metadata:   │
                             │               │ role: 'user'    │
                             │               │ status: pending │
                             │               └────────┬────────┘
                             │                        │
                             ▼                        ▼
                    ┌─────────────────┐      ┌─────────────────┐
                    │   /admin        │      │   /waiting      │
                    │   (Admin Panel) │      │   (Await OK)    │
                    └─────────────────┘      └────────┬────────┘
                                                      │
                                             Admin Approves
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │ Update Metadata │
                                             │ status: approved│
                                             └────────┬────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │  /dashboard     │
                                             │  (User Panel)   │
                                             └─────────────────┘
```

### Middleware Stack

#### Backend Middleware

```javascript
// 1. requireAuth - Verifies Clerk JWT
const requireAuth = async (req, res, next) => {
  // Extracts and verifies Bearer token
  // Fetches user metadata from Clerk
  // Attaches user info to req.user
};

// 2. requireAdmin - Checks admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// 3. requireApproved - Checks approved status
const requireApproved = (req, res, next) => {
  if (req.user.status === 'pending') {
    return res.status(403).json({ error: 'Account pending approval' });
  }
  next();
};
```

#### Frontend Middleware (Next.js)

```javascript
// middleware.js - Protects routes based on metadata
export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  
  // Route protection logic
  // Redirects based on role and status
});
```

---

## 📁 Project Structure

```
newspaper/
│
├── 📂 backend/                          # Express.js API Server
│   │
│   ├── 📂 config/                       # Configuration files
│   │   ├── 📄 clerk.js                  # Clerk client initialization
│   │   └── 📄 database.js               # Supabase client setup
│   │
│   ├── 📂 database/                     # Database files
│   │   ├── 📄 schema.sql                # Main database schema
│   │   └── 📄 migration_v2.sql          # Schema migrations
│   │
│   ├── 📂 middleware/                   # Express middleware
│   │   └── 📄 auth.js                   # Authentication middleware
│   │                                    # • requireAuth
│   │                                    # • requireAdmin  
│   │                                    # • requireApproved
│   │
│   ├── 📂 routes/                       # API route handlers
│   │   ├── 📄 admin.js                  # Admin endpoints (1200+ lines)
│   │   │                                # • Join request management
│   │   │                                # • Newspaper CRUD
│   │   │                                # • Rate configuration
│   │   │                                # • Report generation
│   │   │
│   │   ├── 📄 onboarding.js             # Onboarding endpoints
│   │   │                                # • University listing
│   │   │                                # • Admin/User onboarding
│   │   │
│   │   └── 📄 user.js                   # User endpoints
│   │                                    # • Newspaper viewing
│   │                                    # • Entry marking
│   │
│   ├── 📂 utils/                        # Utility functions
│   │   ├── 📄 dateHelpers.js            # Date manipulation
│   │   │                                # • getDatesInMonth()
│   │   │                                # • getDayName()
│   │   │                                # • formatDate()
│   │   │
│   │   ├── 📄 reportGenerator.js        # Excel (list format)
│   │   └── 📄 reportGeneratorMatrix.js  # Excel (matrix format)
│   │
│   ├── 📄 server.js                     # Express entry point
│   ├── 📄 package.json                  # Dependencies
│   └── 📄 render.yaml                   # Render deployment config
│
├── 📂 frontend/                         # Next.js Application
│   │
│   ├── 📂 public/                       # Static assets
│   │
│   ├── 📂 src/
│   │   │
│   │   ├── 📂 app/                      # Next.js App Router
│   │   │   │
│   │   │   ├── 📄 globals.css           # Global styles & Tailwind
│   │   │   ├── 📄 layout.js             # Root layout (Clerk Provider)
│   │   │   ├── 📄 page.js               # Landing page (/)
│   │   │   │
│   │   │   ├── 📂 admin/
│   │   │   │   └── 📄 page.js           # Admin panel (1300+ lines)
│   │   │   │                            # • Multi-tab interface
│   │   │   │                            # • Calendar view
│   │   │   │                            # • Configuration forms
│   │   │   │
│   │   │   ├── 📂 dashboard/
│   │   │   │   └── 📄 page.js           # User dashboard
│   │   │   │                            # • Date navigation
│   │   │   │                            # • Entry marking
│   │   │   │
│   │   │   ├── 📂 onboarding/
│   │   │   │   └── 📄 page.js           # Onboarding flow
│   │   │   │                            # • Role selection
│   │   │   │                            # • University setup
│   │   │   │
│   │   │   ├── 📂 waiting/
│   │   │   │   └── 📄 page.js           # Pending approval
│   │   │   │
│   │   │   ├── 📂 sign-in/
│   │   │   │   └── 📂 [[...sign-in]]/
│   │   │   │       └── 📄 page.js       # Clerk sign-in
│   │   │   │
│   │   │   └── 📂 sign-up/
│   │   │       └── 📂 [[...sign-up]]/
│   │   │           └── 📄 page.js       # Clerk sign-up
│   │   │
│   │   ├── 📂 lib/
│   │   │   └── 📄 api.js                # API client (Axios)
│   │   │                                # • onboardingApi
│   │   │                                # • adminApi
│   │   │                                # • userApi
│   │   │
│   │   └── 📄 middleware.js             # Next.js route protection
│   │
│   ├── 📄 package.json                  # Dependencies
│   ├── 📄 next.config.mjs               # Next.js config
│   ├── 📄 postcss.config.mjs            # PostCSS config
│   └── 📄 vercel.json                   # Vercel deployment config
│
└── 📄 README.md                         # This file
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | ≥ 18.0.0 | `node --version` |
| npm | ≥ 9.0.0 | `npm --version` |
| Git | Any | `git --version` |

You'll also need accounts on:
- [Clerk](https://clerk.com) - Authentication
- [Supabase](https://supabase.com) - Database

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/your-username/newspaper.git
cd newspaper

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Set Up Clerk

1. **Create Application**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Click "Create Application"
   - Name it "Newspaper Management System"
   - Enable Email authentication

2. **Get API Keys**
   - Navigate to "API Keys" in the sidebar
   - Copy your keys:
     - `Publishable Key` (starts with `pk_test_` or `pk_live_`)
     - `Secret Key` (starts with `sk_test_` or `sk_live_`)

### Step 3: Set Up Supabase

1. **Create Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Name it "newspaper-management"
   - Choose a strong database password
   - Select your region

2. **Get Credentials**
   - Go to Settings → API
   - Copy:
     - `Project URL` (e.g., `https://xxxxx.supabase.co`)
     - `service_role` key (under "Project API keys")

3. **Create Tables**
   - Go to SQL Editor
   - Create a new query
   - Paste the contents of `backend/database/schema.sql`
   - Click "Run"

### Step 4: Configure Environment Variables

**Backend** - Create `backend/.env`:

```env
# Server
PORT=5000

# Clerk
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# CORS
FRONTEND_URL=http://localhost:3000
```

**Frontend** - Create `frontend/.env.local`:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Clerk Routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Step 5: Run Development Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
> Server starts at http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
> App available at http://localhost:3000

### Step 6: Test the Application

1. Open http://localhost:3000
2. Click "Get Started"
3. Create an account
4. Choose "Admin" role
5. Create a university
6. Add newspapers and configure rates
7. Start marking deliveries!

---

## ⚙️ Configuration

### Environment Variables Reference

#### Backend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port (default: 5000) | `5000` |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret | `sk_test_xxx` |
| `CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key | `pk_test_xxx` |
| `SUPABASE_URL` | Yes | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Yes | Supabase service role key | `eyJhbGci...` |
| `FRONTEND_URL` | Yes | Frontend URL for CORS | `http://localhost:3000` |

#### Frontend Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key | `pk_test_xxx` |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key | `sk_test_xxx` |
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL | `http://localhost:5000` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Sign-in route | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Sign-up route | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | Post sign-in redirect | `/onboarding` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | Post sign-up redirect | `/onboarding` |

---

## 📊 Excel Reports

### Report Format

The system generates Excel reports in a **matrix format** for easy analysis:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    📊 NEWSPAPER DELIVERY REPORT                                  │
│                       Example University                                         │
│                       Month: February 2026                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────────┐          │
│  │  NEWSPAPER   │  1  │  2  │  3  │  4  │  5  │ ... │ 28  │ TOTAL   │          │
│  │              │ Sat │ Sun │ Mon │ Tue │ Wed │     │ Sat │  (₹)    │          │
│  ├──────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────────┤          │
│  │              │     │     │     │     │     │     │     │         │          │
│  │ Times of     │ 15  │  0  │ 10  │ 10  │ 10  │ ... │ 15  │  280.00 │          │
│  │ India        │ ██  │ ░░  │ ██  │ ██  │ ██  │     │ ██  │         │          │
│  │              │     │     │     │     │     │     │     │         │          │
│  ├──────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────────┤          │
│  │              │     │     │     │     │     │     │     │         │          │
│  │ The Hindu    │ 12  │  0  │  8  │  8  │  8  │ ... │ 12  │  224.00 │          │
│  │              │ ██  │ ░░  │ ██  │ ██  │ ██  │     │ ██  │         │          │
│  │              │     │     │     │     │     │     │     │         │          │
│  ├──────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────────┤          │
│  │              │     │     │     │     │     │     │     │         │          │
│  │ Deccan       │ 10  │  0  │  7  │  0  │  7  │ ... │ 10  │  168.00 │          │
│  │ Herald       │ ██  │ ░░  │ ██  │ ░░  │ ██  │     │ ██  │         │          │
│  │              │     │     │     │     │     │     │     │         │          │
│  └──────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────────┘          │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────┐             │
│  │  📈 SUMMARY                                                     │             │
│  ├────────────────────────────────────────────────────────────────┤             │
│  │  Total Newspaper-Days:        84                                │             │
│  │  Received:                    72  ████████████████▓▓            │             │
│  │  Not Received:                10  ████                          │             │
│  │  Unmarked:                     2  █                             │             │
│  │  Delivery Rate:            85.71%                               │             │
│  │  Total Amount (Received):  ₹672.00                              │             │
│  └────────────────────────────────────────────────────────────────┘             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Legend:
  ██ GREEN  = Received (shows rate amount)
  ░░ RED    = Not Received (shows 0)
  ▒▒ GRAY   = No entry configured
```

### Color Coding

| Cell Color | Meaning | Value Shown |
|------------|---------|-------------|
| 🟢 Green (`#C6EFCE`) | Newspaper received | Rate amount (e.g., ₹15) |
| 🔴 Red (`#FFC7CE`) | Not received | 0 |
| ⬜ Gray (`#F0F0F0`) | Not configured | - |

### Report Contents

1. **Header Section**
   - University name
   - Report month
   - Generation timestamp

2. **Data Matrix**
   - Rows: One per newspaper
   - Columns: One per day + Total column
   - Values: Rate if received, 0 if not received

3. **Summary Section**
   - Total newspaper-days tracked
   - Count by status (received/not received/unmarked)
   - Delivery rate percentage
   - Total monetary value received

---

## 🌐 Deployment

### Frontend Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Import your GitHub repository
   - Select `frontend` as the root directory

3. **Configure Environment Variables**
   
   Add these in Vercel's project settings:
   
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your production Clerk key |
   | `CLERK_SECRET_KEY` | Your production Clerk secret |
   | `NEXT_PUBLIC_API_URL` | Your backend URL (e.g., `https://your-api.onrender.com`) |

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Backend Deployment (Render)

1. **Create Web Service**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   
   | Setting | Value |
   |---------|-------|
   | Name | `newspaper-api` |
   | Root Directory | `backend` |
   | Build Command | `npm install` |
   | Start Command | `npm start` |

3. **Add Environment Variables**
   
   | Variable | Value |
   |----------|-------|
   | `CLERK_SECRET_KEY` | Production Clerk secret |
   | `CLERK_PUBLISHABLE_KEY` | Production Clerk publishable key |
   | `SUPABASE_URL` | Your Supabase URL |
   | `SUPABASE_KEY` | Your Supabase service role key |
   | `FRONTEND_URL` | Your Vercel frontend URL |

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment

### Post-Deployment Checklist

- [ ] Update Clerk to production instance
- [ ] Verify CORS is working (frontend can call backend)
- [ ] Test authentication flow end-to-end
- [ ] Create a test university and newspaper
- [ ] Verify Excel report downloads
- [ ] Set up monitoring/alerts (optional)

---

## 🔧 Troubleshooting

### Common Issues & Solutions

<details>
<summary><strong>❌ "Authentication required" error</strong></summary>

**Cause:** Invalid or missing Clerk API keys

**Solutions:**
1. Check that `CLERK_SECRET_KEY` is correct in backend `.env`
2. Ensure the key matches your Clerk project
3. Restart the backend server after changing `.env`

```bash
# Verify backend is using correct key
cd backend
cat .env | grep CLERK
```

</details>

<details>
<summary><strong>❌ "Admin access required" error</strong></summary>

**Cause:** User doesn't have admin role in Clerk metadata

**Solutions:**
1. Check user metadata in Clerk Dashboard
2. Verify onboarding completed successfully
3. Clear browser cookies and re-authenticate

</details>

<details>
<summary><strong>❌ Database connection failed</strong></summary>

**Cause:** Invalid Supabase credentials

**Solutions:**
1. Verify `SUPABASE_URL` format: `https://xxxxx.supabase.co`
2. Ensure using `service_role` key (not `anon` key)
3. Check if Supabase project is active

</details>

<details>
<summary><strong>❌ CORS errors in browser</strong></summary>

**Cause:** Frontend URL not in CORS whitelist

**Solutions:**
1. Add frontend URL to `FRONTEND_URL` in backend `.env`
2. For local development, ensure it's `http://localhost:3000`
3. Restart backend server

```javascript
// backend/server.js - CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
];
```

</details>

<details>
<summary><strong>❌ Entries not generating after configuration</strong></summary>

**Cause:** Rate configuration failed silently

**Solutions:**
1. Check browser console for errors
2. Verify rates were saved (check Configure tab)
3. Ensure month format is `YYYY-MM`

</details>

<details>
<summary><strong>❌ Excel report download fails</strong></summary>

**Cause:** No entries exist for the selected month

**Solutions:**
1. Ensure newspapers are configured for that month
2. Check that entries exist in the database
3. Verify backend has `exceljs` installed

</details>

### Debug Mode

Enable detailed logging in backend:

```javascript
// backend/middleware/auth.js
console.log('[Auth] User authenticated:', {
  clerkId: payload.sub,
  role: clerkUser.publicMetadata?.role,
  universityId: clerkUser.publicMetadata?.universityId,
  status: clerkUser.publicMetadata?.status,
});
```

### Reset Commands

```bash
# Reset backend dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Reset frontend dependencies
cd frontend
rm -rf node_modules package-lock.json .next
npm install

# Clear Next.js cache
cd frontend
rm -rf .next
npm run dev
```

---

## 📄 License

This project is for **educational purposes**.

---

<div align="center">

### Built with ❤️ by Aayush Sood

**[Next.js](https://nextjs.org/)** • **[Express](https://expressjs.com/)** • **[Clerk](https://clerk.com/)** • **[Supabase](https://supabase.com/)** • **[Tailwind CSS](https://tailwindcss.com/)**

</div>
