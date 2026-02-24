# Phase 1: Project Setup & Database Schema

## Overview
This phase covers the initial project setup, environment configuration, and database schema creation. By the end of this phase, you'll have a working development environment with a properly structured database.

---

## 1.1 Project Structure Setup

### Create Project Directory Structure
```bash
mkdir newspaper
cd newspaper
mkdir backend frontend 
```

### Initialize Backend (Express + Node.js)
```bash
cd backend
npm init -y
```

Install backend dependencies:
```bash
npm install express cors dotenv @clerk/clerk-sdk-node @supabase/supabase-js exceljs date-fns
npm install --save-dev nodemon
```

**Package Explanation:**
- `express` - Web framework for building REST API
- `cors` - Enable Cross-Origin Resource Sharing
- `dotenv` - Environment variable management
- `@clerk/clerk-sdk-node` - Clerk authentication SDK for backend
- `@supabase/supabase-js` - Supabase client for database operations
- `exceljs` - Excel file generation for reports
- `date-fns` - Date manipulation utilities
- `nodemon` - Auto-restart server during development

### Initialize Frontend (Next.js App Router)
```bash
cd ../frontend
npx create-next-app@latest . --app --tailwind --eslint --no-src-dir
```

When prompted:
- TypeScript: No
- ESLint: Yes
- Tailwind CSS: Yes
- Use `src/` directory: No
- App Router: Yes
- Customize default import alias: No

Install frontend dependencies:
```bash
npm install @clerk/nextjs axios date-fns
```

**Package Explanation:**
- `@clerk/nextjs` - Clerk authentication for Next.js
- `axios` - HTTP client for API calls
- `date-fns` - Date formatting and manipulation

---

## 1.2 Environment Configuration

### Backend Environment Variables
Create `backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Supabase Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Important Notes:**
- Never commit `.env` files to version control
- Service role key has elevated permissions - keep it secure
- Get Clerk keys from: https://dashboard.clerk.com
- Get Supabase keys from: https://app.supabase.com/project/_/settings/api

### Frontend Environment Variables
Create `frontend/.env.local`:
```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Update Backend package.json Scripts
Edit `backend/package.json`:
```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

---

## 1.3 Create Clerk Application

### Steps to Set Up Clerk:

1. **Go to Clerk Dashboard**
   - Visit https://dashboard.clerk.com
   - Sign up or log in

2. **Create New Application**
   - Click "Add Application"
   - Name it "Newspaper Management System"
   - Select authentication methods: Email/Password (minimum)

3. **Configure Public Metadata**
   - Go to "Users & Authentication" → "Metadata"
   - Public metadata will store: `role`, `universityId`, `status`

4. **Get API Keys**
   - Go to "API Keys" section
   - Copy "Publishable Key" (starts with `pk_`)
   - Copy "Secret Key" (starts with `sk_`)
   - Paste them into your `.env` files

5. **Configure Allowed Redirect URLs**
   - Go to "Paths" section
   - Add allowed redirect URLs:
     - `http://localhost:3000`
     - `http://localhost:3000/onboarding`
     - `http://localhost:3000/admin`
     - `http://localhost:3000/dashboard`

---

## 1.4 Create Supabase Project

### Steps to Set Up Supabase:

1. **Go to Supabase Dashboard**
   - Visit https://app.supabase.com
   - Sign up or log in

2. **Create New Project**
   - Click "New Project"
   - Choose your organization
   - Project Name: "newspaper-management"
   - Database Password: Create a strong password (save it!)
   - Region: Choose closest to your location
   - Wait for project to initialize (~2 minutes)

3. **Get API Keys**
   - Go to "Project Settings" → "API"
   - Copy "Project URL" (e.g., `https://xxxxx.supabase.co`)
   - Copy "service_role" key (under "Project API keys")
   - Paste them into `backend/.env`

4. **Important Security Note**
   - The service_role key bypasses Row Level Security (RLS)
   - Only use it in backend, never expose to frontend
   - We'll enable RLS on tables for additional security

---

## 1.5 Database Schema Creation

### Create Database Schema File
Create `backend/database/schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Universities Table
CREATE TABLE universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    admin_clerk_id VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Join Requests Table
CREATE TABLE join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_clerk_id VARCHAR(255) NOT NULL,
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_clerk_id, university_id)
);

-- Newspapers Table
CREATE TABLE newspapers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    rate DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(university_id, month, day_of_week)
);

-- Newspaper Entries Table
CREATE TABLE newspaper_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    newspaper_id UUID REFERENCES newspapers(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'unmarked' CHECK (status IN ('received', 'not_received', 'unmarked')),
    marked_by_clerk_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(university_id, date)
);

-- Indexes for better query performance
CREATE INDEX idx_join_requests_university ON join_requests(university_id);
CREATE INDEX idx_join_requests_status ON join_requests(status);
CREATE INDEX idx_newspapers_university_month ON newspapers(university_id, month);
CREATE INDEX idx_newspaper_entries_university_date ON newspaper_entries(university_id, date);
CREATE INDEX idx_newspaper_entries_date ON newspaper_entries(date);

-- Enable Row Level Security
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE newspapers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newspaper_entries ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be managed through backend JWT verification
-- For now, we'll use the service_role key which bypasses RLS
```

### Execute Schema in Supabase

1. **Open SQL Editor**
   - Go to Supabase Dashboard
   - Click "SQL Editor" in left sidebar
   - Click "New Query"

2. **Run the Schema**
   - Copy the entire content of `schema.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl/Cmd + Enter
   - Verify success message appears

3. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - You should see 4 tables:
     - universities
     - join_requests
     - newspapers
     - newspaper_entries

---

## 1.6 Backend Folder Structure

Create the following directory structure:

```
backend/
├── config/
│   ├── database.js      # Supabase client initialization
│   └── clerk.js         # Clerk client initialization
├── database/
│   └── schema.sql       # Database schema (created above)
├── middleware/
│   └── auth.js          # JWT verification & role-based middleware
├── routes/
│   ├── onboarding.js    # Onboarding endpoints
│   ├── admin.js         # Admin-only endpoints
│   └── user.js          # User endpoints
├── utils/
│   ├── dateHelpers.js   # Date manipulation functions
│   └── reportGenerator.js # Excel report generation
├── .env
├── .gitignore
├── package.json
└── server.js            # Main Express application
```

### Create .gitignore
Create `backend/.gitignore`:
```
node_modules/
.env
.DS_Store
*.log
```

---

## 1.7 Frontend Folder Structure

Your Next.js structure should look like:

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.js           # Root layout with ClerkProvider
│   │   ├── page.js             # Landing page
│   │   ├── sign-in/
│   │   │   └── [[...sign-in]]/
│   │   │       └── page.js     # Clerk sign-in
│   │   ├── sign-up/
│   │   │   └── [[...sign-up]]/
│   │   │       └── page.js     # Clerk sign-up
│   │   ├── onboarding/
│   │   │   └── page.js         # Role selection & onboarding
│   │   ├── waiting/
│   │   │   └── page.js         # Pending approval page
│   │   ├── dashboard/
│   │   │   └── page.js         # User calendar dashboard
│   │   └── admin/
│   │       └── page.js         # Admin dashboard
│   ├── lib/
│   │   └── api.js              # Axios API client
│   └── middleware.js           # Clerk auth middleware
├── .env.local
├── .gitignore
├── next.config.mjs
└── package.json
```

### Create .gitignore
Create `frontend/.gitignore`:
```
node_modules/
.next/
.env.local
.env*.local
.DS_Store
*.log
out/
build/
```

---

## 1.8 Verification Checklist

Before moving to Phase 2, verify:

- [ ] Backend dependencies installed (`node_modules` exists in backend/)
- [ ] Frontend dependencies installed (`node_modules` exists in frontend/)
- [ ] Clerk application created and API keys added to `.env` files
- [ ] Supabase project created and API keys added to `backend/.env`
- [ ] Database schema executed successfully in Supabase SQL Editor
- [ ] All 4 tables visible in Supabase Table Editor (universities, join_requests, newspapers, newspaper_entries)
- [ ] Backend folder structure created with all directories
- [ ] Frontend folder structure matches Next.js App Router conventions
- [ ] `.gitignore` files created in both backend and frontend
- [ ] Environment variables properly configured in both `.env` files

---

## 1.9 Expected Outcome

At the end of Phase 1, you should have:

1. ✅ Complete project structure with backend and frontend folders
2. ✅ All dependencies installed
3. ✅ Clerk authentication service configured
4. ✅ Supabase database with proper schema and tables
5. ✅ Environment variables configured
6. ✅ Project ready for development in Phase 2

---

## Next Steps

Proceed to **Phase 2: Authentication & Onboarding** where you'll:
- Configure Clerk authentication
- Build onboarding flows for admin and user roles
- Implement role-based routing
- Create sign-in/sign-up pages

---

## Troubleshooting

### Issue: npm install fails
**Solution:** Ensure you have Node.js v18+ installed. Run `node --version` to check.

### Issue: Supabase schema execution fails
**Solution:** Check for syntax errors. Run each CREATE TABLE statement individually to identify the problematic query.

### Issue: Environment variables not loading
**Solution:** Restart your development server after changing `.env` files.

### Issue: Can't see Supabase tables
**Solution:** Refresh the Table Editor page. Sometimes it takes a moment for new tables to appear.
