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
