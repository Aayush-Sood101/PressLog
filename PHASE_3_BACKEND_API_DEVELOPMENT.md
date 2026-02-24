# Phase 3: Backend API Development

## Overview
This phase implements all backend API routes for admin and user functionality, including join request management, newspaper configuration, entry marking, and Excel report generation. By the end of this phase, you'll have a complete REST API for the entire application.

---

## 3.1 Create Date Helper Utilities

### Date Manipulation Functions
Create `backend/utils/dateHelpers.js`:

```javascript
const { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } = require('date-fns');

/**
 * Get all dates in a month
 * @param {string} monthString - Format: YYYY-MM
 * @returns {Array} Array of date objects
 */
const getDatesInMonth = (monthString) => {
  const [year, month] = monthString.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  
  return eachDayOfInterval({ start, end });
};

/**
 * Get day name from date
 * @param {Date} date 
 * @returns {string} Day name (Monday, Tuesday, etc.)
 */
const getDayName = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[getDay(date)];
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date 
 * @returns {string}
 */
const formatDate = (date) => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Validate month string format
 * @param {string} monthString 
 * @returns {boolean}
 */
const isValidMonthFormat = (monthString) => {
  return /^\d{4}-\d{2}$/.test(monthString);
};

module.exports = {
  getDatesInMonth,
  getDayName,
  formatDate,
  isValidMonthFormat,
};
```

**Explanation:**
- `getDatesInMonth`: Returns all calendar dates in a given month
- `getDayName`: Converts date to day name (Monday, Tuesday, etc.)
- `formatDate`: Formats date to YYYY-MM-DD for database storage
- `isValidMonthFormat`: Validates month string format (YYYY-MM)

---

## 3.2 Create Admin Routes

### Admin API Endpoints
Create `backend/routes/admin.js`:

```javascript
const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const clerkClient = require('../config/clerk');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { getDatesInMonth, getDayName, formatDate, isValidMonthFormat } = require('../utils/dateHelpers');

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

/**
 * GET /api/admin/join-requests
 * Get all pending join requests for admin's university
 */
router.get('/join-requests', async (req, res) => {
  try {
    const { universityId } = req.user;

    const { data: requests, error } = await supabase
      .from('join_requests')
      .select(`
        *,
        universities (
          name
        )
      `)
      .eq('university_id', universityId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch join requests' });
    }

    // Fetch user details from Clerk for each request
    const requestsWithUserInfo = await Promise.all(
      requests.map(async (request) => {
        try {
          const user = await clerkClient.users.getUser(request.user_clerk_id);
          return {
            ...request,
            userEmail: user.emailAddresses[0]?.emailAddress,
            userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
          };
        } catch (err) {
          console.error('Error fetching user:', err);
          return {
            ...request,
            userEmail: 'Unknown',
            userName: 'Unknown',
          };
        }
      })
    );

    res.json({ requests: requestsWithUserInfo });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/join-requests/:id
 * Approve or reject a join request
 */
router.patch('/join-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const { universityId } = req.user;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
    }

    // Get the join request
    const { data: request, error: fetchError } = await supabase
      .from('join_requests')
      .select('*')
      .eq('id', id)
      .eq('university_id', universityId) // Ensure admin owns this university
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Join request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request has already been processed' });
    }

    // Update join request status
    const { error: updateError } = await supabase
      .from('join_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Database error:', updateError);
      return res.status(500).json({ error: 'Failed to update join request' });
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(request.user_clerk_id, {
      publicMetadata: {
        role: 'user',
        universityId: status === 'approved' ? universityId : null,
        status: status,
      },
    });

    res.json({ 
      message: `Join request ${status} successfully`,
      status,
    });
  } catch (error) {
    console.error('Error updating join request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/newspapers
 * Configure newspapers for a month with day-of-week rates
 * This auto-generates entries for each day in the month
 */
router.post('/newspapers', async (req, res) => {
  try {
    const { month, rates } = req.body;
    const { universityId } = req.user;

    // Validate input
    if (!month || !isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ error: 'Rates must be an object with day names as keys' });
    }

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const validRates = {};

    // Validate rates for each day of week
    for (const day of daysOfWeek) {
      const rate = parseFloat(rates[day]);
      if (isNaN(rate) || rate < 0) {
        return res.status(400).json({ error: `Invalid rate for ${day}` });
      }
      validRates[day] = rate;
    }

    // Check if newspapers already configured for this month
    const { data: existingNewspapers } = await supabase
      .from('newspapers')
      .select('*')
      .eq('university_id', universityId)
      .eq('month', month);

    if (existingNewspapers && existingNewspapers.length > 0) {
      return res.status(400).json({ 
        error: 'Newspapers already configured for this month. Delete existing configuration first.' 
      });
    }

    // Create newspaper configurations for each day of week
    const newspaperInserts = daysOfWeek.map(day => ({
      university_id: universityId,
      month: month,
      day_of_week: day,
      rate: validRates[day],
    }));

    const { data: insertedNewspapers, error: newspaperError } = await supabase
      .from('newspapers')
      .insert(newspaperInserts)
      .select();

    if (newspaperError) {
      console.error('Database error:', newspaperError);
      return res.status(500).json({ error: 'Failed to create newspaper configurations' });
    }

    // Create a map of day names to newspaper IDs
    const newspaperMap = {};
    insertedNewspapers.forEach(np => {
      newspaperMap[np.day_of_week] = np.id;
    });

    // Generate entries for each day in the month
    const dates = getDatesInMonth(month);
    const entryInserts = dates.map(date => {
      const dayName = getDayName(date);
      return {
        university_id: universityId,
        date: formatDate(date),
        newspaper_id: newspaperMap[dayName],
        status: 'unmarked',
      };
    });

    const { error: entryError } = await supabase
      .from('newspaper_entries')
      .insert(entryInserts);

    if (entryError) {
      console.error('Database error:', entryError);
      // Rollback newspaper configurations
      await supabase
        .from('newspapers')
        .delete()
        .eq('university_id', universityId)
        .eq('month', month);
      
      return res.status(500).json({ error: 'Failed to create newspaper entries' });
    }

    res.status(201).json({
      message: 'Newspapers configured successfully',
      newspapers: insertedNewspapers,
      entriesCreated: entryInserts.length,
    });
  } catch (error) {
    console.error('Error configuring newspapers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/newspapers/:month
 * Get newspaper configurations for a specific month
 */
router.get('/newspapers/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const { data: newspapers, error } = await supabase
      .from('newspapers')
      .select('*')
      .eq('university_id', universityId)
      .eq('month', month)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch newspapers' });
    }

    // Convert array to object with day names as keys
    const rates = {};
    newspapers.forEach(np => {
      rates[np.day_of_week] = parseFloat(np.rate);
    });

    res.json({ 
      month,
      newspapers,
      rates,
      configured: newspapers.length > 0,
    });
  } catch (error) {
    console.error('Error fetching newspapers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/newspaper-entries/:month
 * Get all newspaper entries for a specific month
 */
router.get('/newspaper-entries/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Get start and end dates of the month
    const dates = getDatesInMonth(month);
    const startDate = formatDate(dates[0]);
    const endDate = formatDate(dates[dates.length - 1]);

    const { data: entries, error } = await supabase
      .from('newspaper_entries')
      .select(`
        *,
        newspapers (
          day_of_week,
          rate
        )
      `)
      .eq('university_id', universityId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch newspaper entries' });
    }

    res.json({ entries });
  } catch (error) {
    console.error('Error fetching newspaper entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/report/:month
 * Generate and download Excel report for a month
 */
router.get('/report/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Get university name
    const { data: university } = await supabase
      .from('universities')
      .select('name')
      .eq('id', universityId)
      .single();

    // Get all entries for the month
    const dates = getDatesInMonth(month);
    const startDate = formatDate(dates[0]);
    const endDate = formatDate(dates[dates.length - 1]);

    const { data: entries, error } = await supabase
      .from('newspaper_entries')
      .select(`
        *,
        newspapers (
          day_of_week,
          rate
        )
      `)
      .eq('university_id', universityId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch newspaper entries' });
    }

    // Fetch marked by user emails
    const entriesWithUserInfo = await Promise.all(
      entries.map(async (entry) => {
        let markedByEmail = '-';
        if (entry.marked_by_clerk_id) {
          try {
            const user = await clerkClient.users.getUser(entry.marked_by_clerk_id);
            markedByEmail = user.emailAddresses[0]?.emailAddress || '-';
          } catch (err) {
            console.error('Error fetching user:', err);
          }
        }
        return { ...entry, markedByEmail };
      })
    );

    // Generate Excel report
    const reportGenerator = require('../utils/reportGenerator');
    const buffer = await reportGenerator.generateMonthlyReport(
      entriesWithUserInfo,
      university?.name || 'Unknown University',
      month
    );

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="newspaper-report-${month}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

**Explanation:**
- **GET /join-requests**: Lists pending join requests with user details from Clerk
- **PATCH /join-requests/:id**: Approves/rejects join request and updates Clerk metadata
- **POST /newspapers**: Creates newspaper configurations and auto-generates daily entries for the month
- **GET /newspapers/:month**: Retrieves newspaper rates for a specific month
- **GET /newspaper-entries/:month**: Gets all entries for a month with newspaper details
- **GET /report/:month**: Generates and downloads Excel report

---

## 3.3 Create User Routes

### User API Endpoints
Create `backend/routes/user.js`:

```javascript
const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { requireAuth, requireApproved } = require('../middleware/auth');
const { getDatesInMonth, formatDate, isValidMonthFormat } = require('../utils/dateHelpers');

// All user routes require authentication and approved status
router.use(requireAuth, requireApproved);

/**
 * GET /api/newspapers/:month
 * Get newspaper schedule for a specific month
 */
router.get('/newspapers/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const { data: newspapers, error } = await supabase
      .from('newspapers')
      .select('*')
      .eq('university_id', universityId)
      .eq('month', month)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch newspapers' });
    }

    res.json({ newspapers, configured: newspapers.length > 0 });
  } catch (error) {
    console.error('Error fetching newspapers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/newspaper-entries/:month
 * Get user's marked entries for a specific month
 */
router.get('/newspaper-entries/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Get start and end dates of the month
    const dates = getDatesInMonth(month);
    const startDate = formatDate(dates[0]);
    const endDate = formatDate(dates[dates.length - 1]);

    const { data: entries, error } = await supabase
      .from('newspaper_entries')
      .select(`
        *,
        newspapers (
          day_of_week,
          rate
        )
      `)
      .eq('university_id', universityId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch newspaper entries' });
    }

    res.json({ entries });
  } catch (error) {
    console.error('Error fetching newspaper entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/newspaper-entries
 * Mark a newspaper entry as received or not_received
 */
router.post('/newspaper-entries', async (req, res) => {
  try {
    const { date, status } = req.body;
    const { universityId, clerkId } = req.user;

    // Validate input
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    if (!['received', 'not_received'].includes(status)) {
      return res.status(400).json({ error: 'Status must be received or not_received' });
    }

    // Verify entry exists for this university and date
    const { data: existingEntry, error: fetchError } = await supabase
      .from('newspaper_entries')
      .select('*')
      .eq('university_id', universityId)
      .eq('date', date)
      .single();

    if (fetchError || !existingEntry) {
      return res.status(404).json({ error: 'Newspaper entry not found for this date' });
    }

    // Update entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('newspaper_entries')
      .update({
        status: status,
        marked_by_clerk_id: clerkId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingEntry.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return res.status(500).json({ error: 'Failed to update newspaper entry' });
    }

    res.json({
      message: 'Newspaper entry updated successfully',
      entry: updatedEntry,
    });
  } catch (error) {
    console.error('Error updating newspaper entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

**Explanation:**
- **GET /newspapers/:month**: Returns newspaper schedule for user's university
- **GET /newspaper-entries/:month**: Gets all entries for a month (for calendar view)
- **POST /newspaper-entries**: Marks a specific date's newspaper as received/not received

---

## 3.4 Create Report Generator

### Excel Report Generation
Create `backend/utils/reportGenerator.js`:

```javascript
const ExcelJS = require('exceljs');
const { format } = require('date-fns');

/**
 * Generate Excel report for monthly newspaper entries
 * @param {Array} entries - Array of newspaper entry objects
 * @param {string} universityName - Name of the university
 * @param {string} month - Month in YYYY-MM format
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function generateMonthlyReport(entries, universityName, month) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Newspaper Report');

  // Set worksheet properties
  worksheet.properties.defaultRowHeight = 20;

  // Add title
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Newspaper Delivery Report - ${universityName}`;
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add month info
  worksheet.mergeCells('A2:F2');
  const monthCell = worksheet.getCell('A2');
  monthCell.value = `Month: ${month}`;
  monthCell.font = { size: 12, bold: true };
  monthCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Add empty row
  worksheet.addRow([]);

  // Add headers
  const headerRow = worksheet.addRow([
    'Date',
    'Day',
    'Newspaper Rate',
    'Status',
    'Marked By',
    'Updated At'
  ]);

  // Style headers
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  worksheet.columns = [
    { width: 15 }, // Date
    { width: 12 }, // Day
    { width: 15 }, // Rate
    { width: 15 }, // Status
    { width: 25 }, // Marked By
    { width: 20 }, // Updated At
  ];

  // Add data rows
  let totalReceived = 0;
  let totalNotReceived = 0;
  let totalUnmarked = 0;
  let totalAmount = 0;

  entries.forEach(entry => {
    const date = new Date(entry.date);
    const dayName = entry.newspapers?.day_of_week || '-';
    const rate = entry.newspapers?.rate ? parseFloat(entry.newspapers.rate) : 0;
    const status = entry.status || 'unmarked';
    const markedBy = entry.markedByEmail || '-';
    const updatedAt = entry.updated_at 
      ? format(new Date(entry.updated_at), 'yyyy-MM-dd HH:mm')
      : '-';

    // Count statuses
    if (status === 'received') totalReceived++;
    else if (status === 'not_received') totalNotReceived++;
    else totalUnmarked++;

    // Calculate total amount for received newspapers
    if (status === 'received') {
      totalAmount += rate;
    }

    const row = worksheet.addRow([
      format(date, 'yyyy-MM-dd'),
      dayName,
      rate.toFixed(2),
      status.replace('_', ' ').toUpperCase(),
      markedBy,
      updatedAt
    ]);

    // Color code status
    const statusCell = row.getCell(4);
    if (status === 'received') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFC6EFCE' } // Light green
      };
      statusCell.font = { color: { argb: 'FF006100' } }; // Dark green
    } else if (status === 'not_received') {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFC7CE' } // Light red
      };
      statusCell.font = { color: { argb: 'FF9C0006' } }; // Dark red
    } else {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' } // Light yellow
      };
      statusCell.font = { color: { argb: 'FF9C6500' } }; // Dark yellow
    }

    // Center align status
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Add empty row
  worksheet.addRow([]);

  // Add summary
  const summaryStartRow = worksheet.lastRow.number + 1;
  
  worksheet.mergeCells(`A${summaryStartRow}:B${summaryStartRow}`);
  const summaryTitleCell = worksheet.getCell(`A${summaryStartRow}`);
  summaryTitleCell.value = 'Summary:';
  summaryTitleCell.font = { bold: true, size: 12 };

  worksheet.addRow(['Total Days:', entries.length]);
  worksheet.addRow(['Received:', totalReceived]);
  worksheet.addRow(['Not Received:', totalNotReceived]);
  worksheet.addRow(['Unmarked:', totalUnmarked]);
  worksheet.addRow(['Total Amount (Received):', `₹${totalAmount.toFixed(2)}`]);

  // Calculate delivery rate
  const deliveryRate = entries.length > 0 
    ? ((totalReceived / entries.length) * 100).toFixed(2)
    : 0;
  worksheet.addRow(['Delivery Rate:', `${deliveryRate}%`]);

  // Style summary section
  for (let i = summaryStartRow + 1; i <= worksheet.lastRow.number; i++) {
    const row = worksheet.getRow(i);
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { horizontal: 'left' };
  }

  // Add borders to all cells
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 3) { // Skip title rows
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    }
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = {
  generateMonthlyReport,
};
```

**Explanation:**
- Creates professional Excel report with ExcelJS
- Includes title, headers with styling, and data rows
- Color-codes status (green for received, red for not received, yellow for unmarked)
- Adds summary section with totals and delivery rate
- Calculates total amount for received newspapers
- Returns buffer for streaming to response

---

## 3.5 Update Server with New Routes

### Update Main Server File
Edit `backend/server.js`:

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const onboardingRoutes = require('./routes/onboarding');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

app.use('/api/onboarding', onboardingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Changes:**
- Added admin and user route imports
- Mounted admin routes at `/api/admin`
- Mounted user routes at `/api` (user routes don't need prefix since they share namespace)

---

## 3.6 Testing Backend APIs

### Start Backend Server
```bash
cd backend
npm run dev
```

### Test with Postman or cURL

#### 1. Test Admin - Create Newspapers
```bash
# Replace YOUR_ADMIN_TOKEN with actual Clerk JWT
curl -X POST http://localhost:5000/api/admin/newspapers \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "month": "2026-03",
    "rates": {
      "Monday": 10.50,
      "Tuesday": 10.50,
      "Wednesday": 10.50,
      "Thursday": 10.50,
      "Friday": 10.50,
      "Saturday": 12.00,
      "Sunday": 12.00
    }
  }'
```

Expected Response:
```json
{
  "message": "Newspapers configured successfully",
  "newspapers": [...],
  "entriesCreated": 31
}
```

#### 2. Test Admin - Get Join Requests
```bash
curl -X GET http://localhost:5000/api/admin/join-requests \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### 3. Test Admin - Approve Join Request
```bash
curl -X PATCH http://localhost:5000/api/admin/join-requests/REQUEST_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

#### 4. Test User - Get Newspaper Entries
```bash
curl -X GET http://localhost:5000/api/newspaper-entries/2026-03 \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

#### 5. Test User - Mark Entry
```bash
curl -X POST http://localhost:5000/api/newspaper-entries \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-03-01",
    "status": "received"
  }'
```

#### 6. Test Admin - Download Report
```bash
curl -X GET http://localhost:5000/api/admin/report/2026-03 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  --output report.xlsx
```

### Verify in Supabase

After running the above tests:

1. **Check newspapers table**:
   - Should have 7 rows (one for each day of week)
   - Each with correct rate

2. **Check newspaper_entries table**:
   - Should have 31 rows (for March 2026)
   - Each with unmarked status initially
   - Some marked as received/not_received after testing

3. **Check join_requests table**:
   - Should show approved status after approval

---

## 3.7 API Documentation Summary

### Admin Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/admin/join-requests | Get pending join requests | Admin |
| PATCH | /api/admin/join-requests/:id | Approve/reject join request | Admin |
| POST | /api/admin/newspapers | Configure newspapers for a month | Admin |
| GET | /api/admin/newspapers/:month | Get newspaper config for month | Admin |
| GET | /api/admin/newspaper-entries/:month | Get all entries for month | Admin |
| GET | /api/admin/report/:month | Download Excel report | Admin |

### User Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/newspapers/:month | Get newspaper schedule | User/Admin (approved) |
| GET | /api/newspaper-entries/:month | Get entries for month | User/Admin (approved) |
| POST | /api/newspaper-entries | Mark entry as received/not received | User/Admin (approved) |

### Onboarding Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/onboarding/admin | Create university | Authenticated |
| POST | /api/onboarding/user | Submit join request | Authenticated |
| GET | /api/onboarding/universities | List all universities | Public |

---

## 3.8 Verification Checklist

- [ ] All utility files created (dateHelpers.js, reportGenerator.js)
- [ ] Admin routes implemented (admin.js)
- [ ] User routes implemented (user.js)
- [ ] Server.js updated with new routes
- [ ] Backend starts without errors
- [ ] Can create newspaper configuration via API
- [ ] Newspaper entries auto-generated for all days in month
- [ ] Can approve/reject join requests via API
- [ ] Clerk metadata updates when join request approved
- [ ] Can mark newspaper entries as received/not_received
- [ ] Excel report downloads successfully
- [ ] Report contains correct data and formatting

---

## 3.9 Expected Outcome

At the end of Phase 3, you should have:

1. ✅ Complete backend API with all endpoints
2. ✅ Admin functionality for managing join requests and newspapers
3. ✅ User functionality for marking newspaper entries
4. ✅ Excel report generation with professional formatting
5. ✅ Date helper utilities for month calculations
6. ✅ Auto-generation of daily entries when newspapers configured
7. ✅ Role-based access control via middleware
8. ✅ Proper error handling and validation

---

## Next Steps

Proceed to **Phase 4: Frontend User Interface** where you'll:
- Create user dashboard with calendar view
- Create admin dashboard with all management features
- Implement newspaper entry marking UI
- Build join request management interface
- Add report download functionality

---

## Troubleshooting

### Issue: "Newspapers already configured" error
**Solution:** Delete existing configurations from `newspapers` table in Supabase for that month.

### Issue: Excel report download fails
**Solution:** Check that ExcelJS is installed: `npm list exceljs`

### Issue: Entries not created after configuring newspapers
**Solution:** Check backend console for database errors. Verify foreign key constraints.

### Issue: Metadata not updating after approval
**Solution:** Verify `CLERK_SECRET_KEY` is correct and has permission to update user metadata.

### Issue: Date calculations incorrect
**Solution:** Ensure date-fns is installed and month format is YYYY-MM.
