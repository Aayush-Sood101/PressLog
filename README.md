# Newspaper Management System

A comprehensive web application for managing newspaper deliveries across university libraries, built with Next.js, Express, Clerk authentication, and Supabase.

## 🎯 Project Status: Phase 1 Complete

**Phase 1: Project Setup & Database Schema** - ✅ COMPLETED

### What's Been Set Up

1. ✅ Backend project structure with Express.js
2. ✅ Frontend project structure with Next.js (App Router)
3. ✅ All required dependencies installed
4. ✅ Database schema created
5. ✅ Environment file templates ready
6. ✅ Folder structure organized

---

## 📋 What You Need to Do Next

### Step 1: Configure Clerk Authentication

1. **Create Clerk Account**
   - Go to https://dashboard.clerk.com
   - Sign up and create a new application
   - Name it "Newspaper Management System"

2. **Get Clerk API Keys**
   - In Clerk Dashboard, go to "API Keys"
   - Copy the **Publishable Key** (starts with `pk_`)
   - Copy the **Secret Key** (starts with `sk_`)

3. **Create Backend .env File**
   - Copy `backend/.env.example` to `backend/.env`
   - Replace `your_clerk_secret_key_here` with your Clerk Secret Key
   - Replace `your_clerk_publishable_key_here` with your Clerk Publishable Key

4. **Create Frontend .env.local File**
   - Copy `frontend/.env.local.example` to `frontend/.env.local`
   - Replace `your_clerk_publishable_key_here` with your Clerk Publishable Key
   - Replace `your_clerk_secret_key_here` with your Clerk Secret Key

### Step 2: Configure Supabase Database

1. **Create Supabase Account**
   - Go to https://app.supabase.com
   - Sign up and create a new project
   - Name it "newspaper-management"
   - Create a strong database password and save it

2. **Get Supabase Credentials**
   - Go to Project Settings → API
   - Copy the **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - Copy the **service_role key** (found under "Project API keys")

3. **Update Backend .env File**
   - Replace `your_supabase_project_url` with your Supabase URL
   - Replace `your_supabase_service_role_key` with your service role key

4. **Execute Database Schema**
   - In Supabase Dashboard, click "SQL Editor" in the sidebar
   - Click "New Query"
   - Open `backend/database/schema.sql` from this project
   - Copy the entire SQL script
   - Paste it into the SQL Editor
   - Click "Run" to create all tables
   - Verify 4 tables were created: `universities`, `join_requests`, `newspapers`, `newspaper_entries`

### Step 3: Verify Setup

Check that you have:
- [ ] `backend/.env` file with all Clerk and Supabase keys filled in
- [ ] `frontend/.env.local` file with all Clerk keys filled in
- [ ] 4 tables created in Supabase (visible in Table Editor)
- [ ] All dependencies installed (check for `node_modules/` folders)

---

## 🚀 Next Phase

Once you've completed the steps above, you're ready for:

**Phase 2: Authentication & Onboarding**

This phase will implement:
- User sign-up and sign-in with Clerk
- Admin and user role selection
- University creation for admins
- Join request submission for users
- Role-based routing and middleware

Refer to `PHASE_2_AUTHENTICATION_AND_ONBOARDING.md` for detailed instructions.

---

## 📁 Project Structure

```
newspaper/
├── backend/                    # Express.js API
│   ├── config/                # Database and Clerk clients
│   ├── database/              # SQL schema
│   ├── middleware/            # Auth middleware
│   ├── routes/                # API routes
│   ├── utils/                 # Helper functions
│   ├── .env                   # Environment variables (create this)
│   ├── .env.example           # Template for .env
│   └── package.json           # Dependencies
│
├── frontend/                  # Next.js application
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   └── lib/              # API client
│   ├── .env.local            # Environment variables (create this)
│   ├── .env.local.example    # Template for .env.local
│   └── package.json          # Dependencies
│
├── PHASE_1_SETUP_AND_DATABASE.md
├── PHASE_2_AUTHENTICATION_AND_ONBOARDING.md
├── PHASE_3_BACKEND_API_DEVELOPMENT.md
├── PHASE_4_FRONTEND_USER_INTERFACE.md
└── PHASE_5_TESTING_DEPLOYMENT_PRODUCTION.md
```

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Clerk
- **Backend**: Express.js, Node.js, Clerk SDK
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Clerk
- **Reports**: ExcelJS
- **Deployment**: Vercel (frontend), Railway (backend)

---

## 📚 Documentation

Each phase has detailed documentation:

1. **PHASE_1_SETUP_AND_DATABASE.md** - Setup instructions (CURRENT)
2. **PHASE_2_AUTHENTICATION_AND_ONBOARDING.md** - Auth implementation
3. **PHASE_3_BACKEND_API_DEVELOPMENT.md** - Backend routes and logic
4. **PHASE_4_FRONTEND_USER_INTERFACE.md** - UI components and pages
5. **PHASE_5_TESTING_DEPLOYMENT_PRODUCTION.md** - Testing and deployment

---

## 🎓 Features

### For Admins
- Create and manage university
- Configure newspaper delivery schedules
- Set day-specific newspaper rates
- Approve/reject user join requests
- View calendar with all newspaper entries
- Mark newspaper deliveries
- Download detailed Excel reports

### For Users
- Join existing universities
- View monthly calendar of newspapers
- Mark newspapers as received/not received
- Track delivery history

---

## 🔐 Security

- JWT authentication via Clerk
- Role-based access control
- Row Level Security enabled on database
- Environment variables for sensitive data
- CORS protection
- Input validation and sanitization

---

## ⚡ Quick Start (After Configuration)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Then visit http://localhost:3000

---

## 🐛 Troubleshooting

### Dependencies not installing?
```bash
# Backend
cd backend && rm -rf node_modules package-lock.json && npm install

# Frontend
cd frontend && rm -rf node_modules package-lock.json && npm install
```

### Environment variables not loading?
- Ensure file is named exactly `.env` (backend) or `.env.local` (frontend)
- No spaces around `=` in .env files
- Restart development servers after changing .env files

### Database schema not executing?
- Check for syntax errors in SQL
- Ensure Supabase project is fully initialized
- Try running each `CREATE TABLE` statement individually

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section in relevant phase documentation
2. Verify all environment variables are correctly set
3. Check console logs for specific error messages
4. Ensure all dependencies are installed

---

## 📄 License

This project is for educational purposes.

---

**Ready to continue?** Open `PHASE_2_AUTHENTICATION_AND_ONBOARDING.md` once you've completed the Clerk and Supabase setup above.
