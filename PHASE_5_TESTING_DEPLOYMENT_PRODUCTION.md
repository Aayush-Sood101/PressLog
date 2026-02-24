# Phase 5: Testing, Deployment & Production

## Overview
This phase covers comprehensive testing, production deployment, environment configuration, and ongoing maintenance. By the end of this phase, you'll have a fully deployed, production-ready Newspaper Management System.

---

## 5.1 Comprehensive Testing

### Unit Testing Setup

#### Backend Unit Tests
Create `backend/tests/dateHelpers.test.js`:

```javascript
const { getDatesInMonth, getDayName, formatDate, isValidMonthFormat } = require('../utils/dateHelpers');

describe('Date Helpers', () => {
  test('getDatesInMonth returns correct number of dates', () => {
    const dates = getDatesInMonth('2026-02');
    expect(dates.length).toBe(28); // February 2026 has 28 days
  });

  test('getDayName returns correct day', () => {
    const date = new Date('2026-02-24');
    expect(getDayName(date)).toBe('Tuesday');
  });

  test('formatDate returns correct format', () => {
    const date = new Date('2026-02-24');
    expect(formatDate(date)).toBe('2026-02-24');
  });

  test('isValidMonthFormat validates correctly', () => {
    expect(isValidMonthFormat('2026-02')).toBe(true);
    expect(isValidMonthFormat('2026-2')).toBe(false);
    expect(isValidMonthFormat('26-02')).toBe(false);
  });
});
```

Install testing dependencies:
```bash
cd backend
npm install --save-dev jest supertest
```

Add test script to `backend/package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### Integration Testing

#### Backend API Tests
Create `backend/tests/api.test.js`:

```javascript
const request = require('supertest');
const app = require('../server'); // Export app from server.js

describe('API Endpoints', () => {
  test('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('GET /api/onboarding/universities returns list', async () => {
    const response = await request(app).get('/api/onboarding/universities');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.universities)).toBe(true);
  });
});
```

### Frontend E2E Testing

#### Playwright Setup
```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

Create `frontend/tests/e2e/onboarding.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test('admin onboarding flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Click sign up
  await page.click('text=Sign Up');
  
  // Fill in sign up form (adjust selectors based on Clerk UI)
  await page.fill('input[name="emailAddress"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'TestPassword123!');
  await page.click('button[type="submit"]');
  
  // Wait for redirect to onboarding
  await expect(page).toHaveURL(/.*onboarding/);
  
  // Select admin role
  await page.click('text=I\'m an Admin');
  
  // Enter university name
  await page.fill('input[placeholder*="university"]', 'Test University');
  await page.click('text=Create University');
  
  // Should redirect to admin dashboard
  await expect(page).toHaveURL(/.*admin/);
});
```

### Manual Testing Checklist

#### Admin Flow
- [ ] Sign up as admin
- [ ] Create university
- [ ] Access admin dashboard
- [ ] Configure newspapers for current month
- [ ] See all 4 tabs (Calendar, Configure, Requests, Reports)
- [ ] Approve a join request
- [ ] Mark newspaper entries
- [ ] Download Excel report
- [ ] Verify report data is correct

#### User Flow
- [ ] Sign up as user
- [ ] Submit join request
- [ ] See waiting page
- [ ] After approval, access dashboard
- [ ] View calendar with configured newspapers
- [ ] Mark newspapers as received/not received
- [ ] Navigate between months
- [ ] Verify status updates persist

#### Security Testing
- [ ] Unauthenticated users redirected to sign-in
- [ ] Users without role redirected to onboarding
- [ ] Pending users cannot access dashboard
- [ ] Users can only see their university's data
- [ ] API endpoints reject invalid tokens
- [ ] Admin routes reject non-admin users

---

## 5.2 Production Environment Setup

### Environment Variables for Production

#### Backend Production .env
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_xxxxx
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
```

#### Frontend Production .env.production
```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
```

### Clerk Production Setup

1. **Switch to Production Instance**
   - Go to Clerk Dashboard
   - Create a new "Production" instance or switch existing to production
   - Get production API keys (start with `pk_live_` and `sk_live_`)

2. **Configure Production Domains**
   - Add production frontend URL to allowed redirect URLs
   - Add production backend URL to allowed origins
   - Example: `https://newspaper-app.vercel.app`

3. **Update Environment Variables**
   - Use production keys in deployment platforms
   - Never commit production keys to git

### Supabase Production Setup

1. **Production Database**
   - Your Supabase project is already in production mode
   - Ensure connection pooling is enabled for better performance

2. **Database Backups**
   - Enable automatic backups in Supabase dashboard
   - Configure backup schedule (daily recommended)

3. **Row Level Security Policies** (Optional)
   Since we're using service_role key, RLS is bypassed. For additional security:

```sql
-- Example RLS policy for universities table
CREATE POLICY "Users can view their university"
ON universities FOR SELECT
USING (admin_clerk_id = auth.jwt() ->> 'sub');
```

---

## 5.3 Backend Deployment (Railway)

### Railway Setup

1. **Sign Up for Railway**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select your newspaper repository

3. **Configure Service**
   - Railway will detect Node.js automatically
   - Set root directory to `backend/`
   - Set build command: `npm install`
   - Set start command: `npm start`

4. **Add Environment Variables**
   - Go to project settings → Variables
   - Add all variables from production .env:
     - `PORT`: 5000
     - `NODE_ENV`: production
     - `CLERK_SECRET_KEY`: your production key
     - `CLERK_PUBLISHABLE_KEY`: your production key
     - `SUPABASE_URL`: your Supabase URL
     - `SUPABASE_SERVICE_ROLE_KEY`: your service key
     - `ALLOWED_ORIGINS`: your frontend URL

5. **Deploy**
   - Push to GitHub
   - Railway will automatically deploy
   - Get your backend URL (e.g., `https://newspaper-backend.railway.app`)

### Alternative: Render

1. **Create Account** at https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Configure**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add Environment Variables** in dashboard
5. **Deploy**

---

## 5.4 Frontend Deployment (Vercel)

### Vercel Setup

1. **Sign Up for Vercel**
   - Visit https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Root Directory: `frontend/`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Add Environment Variables**
   - Go to project settings → Environment Variables
   - Add production variables:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
     - `NEXT_PUBLIC_API_URL` (your Railway backend URL)

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy
   - Get your frontend URL (e.g., `https://newspaper-app.vercel.app`)

6. **Custom Domain** (Optional)
   - Go to project settings → Domains
   - Add your custom domain
   - Configure DNS records as instructed

### Update CORS in Backend

After deployment, update backend CORS configuration:

Edit `backend/server.js`:
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
```

Add to Railway environment variables:
```
ALLOWED_ORIGINS=https://newspaper-app.vercel.app,https://www.newspaper-app.vercel.app
```

---

## 5.5 Post-Deployment Configuration

### Update Clerk Redirect URLs

1. Go to Clerk Dashboard → Paths
2. Add production URLs:
   - `https://newspaper-app.vercel.app`
   - `https://newspaper-app.vercel.app/onboarding`
   - `https://newspaper-app.vercel.app/admin`
   - `https://newspaper-app.vercel.app/dashboard`

### Test Production Deployment

1. **Visit Your App**
   - Open production URL
   - Test sign up/sign in

2. **Complete Flow Test**
   - Sign up as admin
   - Create university
   - Configure newspapers
   - Sign up as user
   - Approve user
   - Mark newspapers
   - Download report

3. **Check Logs**
   - Railway: View logs in dashboard
   - Vercel: View logs in dashboard
   - Look for errors or warnings

---

## 5.6 Monitoring & Logging

### Backend Monitoring

#### Add Logging Middleware
Edit `backend/server.js`:

```javascript
// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
});
```

#### Error Tracking with Sentry (Optional)

```bash
npm install @sentry/node
```

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

### Database Monitoring

1. **Supabase Dashboard**
   - Monitor query performance
   - Check table sizes
   - View slow queries

2. **Set Up Alerts**
   - Database size warnings
   - Connection pool exhaustion
   - Query timeout alerts

---

## 5.7 Performance Optimization

### Backend Optimizations

1. **Database Indexing** (Already done in schema)
   - Ensure indexes on frequently queried columns
   - Monitor slow queries

2. **Caching** (Optional)
   ```bash
   npm install redis
   ```

3. **Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

   ```javascript
   const rateLimit = require('express-rate-limit');

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });

   app.use('/api', limiter);
   ```

### Frontend Optimizations

1. **Image Optimization**
   - Use Next.js Image component
   - Optimize static assets

2. **Code Splitting**
   - Next.js does this automatically
   - Use dynamic imports for large components

3. **Analytics** (Optional)
   ```bash
   npm install @vercel/analytics
   ```

---

## 5.8 Backup & Recovery

### Database Backups

1. **Automatic Backups**
   - Enabled in Supabase dashboard
   - Daily backups retained for 7 days

2. **Manual Backup**
   ```bash
   # Export database
   pg_dump -h db.your-project.supabase.co -U postgres -d postgres > backup.sql
   ```

3. **Recovery Plan**
   - Document restoration process
   - Test backup restoration regularly

### Code Backups

- Use GitHub for version control
- Tag production releases
- Maintain staging branch

---

## 5.9 Maintenance Tasks

### Daily
- [ ] Monitor error logs
- [ ] Check application health endpoints
- [ ] Review user signups and activity

### Weekly
- [ ] Review database performance
- [ ] Check security vulnerabilities (`npm audit`)
- [ ] Monitor disk usage and costs

### Monthly
- [ ] Review and update dependencies
- [ ] Test backup restoration process
- [ ] Review user feedback and feature requests
- [ ] Check for Clerk/Supabase service updates

---

## 5.10 Security Best Practices

### Code Security

1. **Keep Dependencies Updated**
   ```bash
   npm audit fix
   npm update
   ```

2. **Environment Variables**
   - Never commit .env files
   - Rotate secrets regularly
   - Use different keys for dev/prod

3. **Input Validation**
   - Validate all user inputs
   - Sanitize data before database queries
   - Use parameterized queries (Supabase does this)

### API Security

1. **HTTPS Only**
   - Enforce HTTPS in production
   - Use secure cookies

2. **CORS Configuration**
   - Restrict to known origins
   - Don't use wildcard (`*`) in production

3. **Rate Limiting**
   - Implement on all public endpoints
   - Prevent brute force attacks

---

## 5.11 Scaling Considerations

### When to Scale

- More than 1000 daily active users
- Database queries > 100ms average
- Memory usage > 80%
- CPU usage consistently high

### Scaling Options

1. **Vertical Scaling**
   - Upgrade Railway plan
   - Increase Supabase database size

2. **Horizontal Scaling**
   - Use Railway's autoscaling
   - Add read replicas to Supabase

3. **Caching Layer**
   - Implement Redis for frequently accessed data
   - Cache API responses

---

## 5.12 Final Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Production environment variables configured
- [ ] Clerk production keys set up
- [ ] Supabase production database ready
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] SSL certificates active (automatic with Vercel/Railway)
- [ ] Custom domain configured (if applicable)
- [ ] Error monitoring set up
- [ ] Backup system tested

### Post-Launch
- [ ] First admin user created successfully
- [ ] First university created
- [ ] First user can join and be approved
- [ ] Newspapers can be configured
- [ ] Entries can be marked
- [ ] Reports can be downloaded
- [ ] All features tested in production
- [ ] Contact information for support set up
- [ ] Documentation updated with production URLs

---

## 5.13 Troubleshooting Production Issues

### Common Issues

#### "API request failed" errors
**Solution:** Check CORS settings and API URL in environment variables

#### "Invalid token" errors
**Solution:** Verify Clerk keys match between frontend and backend

#### Database connection errors
**Solution:** Check Supabase service key and URL, verify IP allowlist

#### Slow performance
**Solution:** Check database indexes, implement caching, optimize queries

#### Deployment failures
**Solution:** Check build logs, verify package.json scripts, ensure dependencies are listed

---

## Congratulations! 🎉

You have successfully completed all 5 phases of the Newspaper Management System development:

1. ✅ **Phase 1**: Project setup and database schema
2. ✅ **Phase 2**: Authentication and onboarding
3. ✅ **Phase 3**: Backend API development
4. ✅ **Phase 4**: Frontend user interface
5. ✅ **Phase 5**: Testing, deployment, and production

Your application is now live and ready to use!

### Next Steps

- Monitor application usage and performance
- Gather user feedback
- Implement feature requests
- Maintain and update dependencies
- Scale as needed

### Support Resources

- Clerk Documentation: https://clerk.com/docs
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Express Documentation: https://expressjs.com

Good luck with your Newspaper Management System! 📰
