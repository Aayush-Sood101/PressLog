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
 * Create a new newspaper for the university
 */
router.post('/newspapers', async (req, res) => {
  try {
    const { name } = req.body;
    const { universityId } = req.user;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Newspaper name is required' });
    }

    const { data: newspaper, error } = await supabase
      .from('newspapers')
      .insert({
        university_id: universityId,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Newspaper with this name already exists' });
      }
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create newspaper' });
    }

    res.status(201).json({ newspaper });
  } catch (error) {
    console.error('Error creating newspaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/newspapers
 * Get all newspapers for admin's university
 */
router.get('/newspapers', async (req, res) => {
  try {
    const { universityId } = req.user;

    const { data: newspapers, error } = await supabase
      .from('newspapers')
      .select('*')
      .eq('university_id', universityId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch newspapers' });
    }

    res.json({ newspapers });
  } catch (error) {
    console.error('Error fetching newspapers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/newspapers/:id
 * Delete a newspaper (cascades to rates and entries)
 */
router.delete('/newspapers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { universityId } = req.user;

    // Verify ownership
    const { data: newspaper } = await supabase
      .from('newspapers')
      .select('*')
      .eq('id', id)
      .eq('university_id', universityId)
      .single();

    if (!newspaper) {
      return res.status(404).json({ error: 'Newspaper not found' });
    }

    const { error } = await supabase
      .from('newspapers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to delete newspaper' });
    }

    res.json({ message: 'Newspaper deleted successfully' });
  } catch (error) {
    console.error('Error deleting newspaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/newspapers/:id/configure
 * Configure rates for a newspaper for a specific month
 */
router.post('/newspapers/:id/configure', async (req, res) => {
  try {
    const { id: newspaperId } = req.params;
    const { month, rates } = req.body;
    const { universityId } = req.user;

    // Validate input
    if (!month || !isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ error: 'Rates must be an object with day names as keys' });
    }

    // Verify newspaper ownership
    const { data: newspaper } = await supabase
      .from('newspapers')
      .select('*')
      .eq('id', newspaperId)
      .eq('university_id', universityId)
      .single();

    if (!newspaper) {
      return res.status(404).json({ error: 'Newspaper not found' });
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

    // Check if rates already exist for this newspaper/month
    const { data: existingRates } = await supabase
      .from('newspaper_rates')
      .select('*')
      .eq('newspaper_id', newspaperId)
      .eq('month', month);

    if (existingRates && existingRates.length > 0) {
      return res.status(400).json({ 
        error: 'This newspaper is already configured for this month. Delete the configuration first.' 
      });
    }

    // Insert rates
    const rateInserts = daysOfWeek.map(day => ({
      newspaper_id: newspaperId,
      month: month,
      day_of_week: day,
      rate: validRates[day],
    }));

    const { data: insertedRates, error: ratesError } = await supabase
      .from('newspaper_rates')
      .insert(rateInserts)
      .select();

    if (ratesError) {
      console.error('Database error:', ratesError);
      return res.status(500).json({ error: 'Failed to save newspaper rates' });
    }

    // Generate daily entries for this newspaper for the month
    const dates = getDatesInMonth(month);
    const entryInserts = dates.map(date => {
      const dayName = getDayName(date);
      return {
        newspaper_id: newspaperId,
        date: formatDate(date),
        status: 'unmarked',
      };
    });

    const { error: entryError } = await supabase
      .from('newspaper_entries')
      .insert(entryInserts);

    if (entryError) {
      console.error('Database error:', entryError);
      // Rollback rates
      await supabase
        .from('newspaper_rates')
        .delete()
        .eq('newspaper_id', newspaperId)
        .eq('month', month);
      
      return res.status(500).json({ error: 'Failed to create newspaper entries' });
    }

    res.status(201).json({
      message: 'Newspaper configured successfully',
      rates: insertedRates,
      entriesCreated: entryInserts.length,
    });
  } catch (error) {
    console.error('Error configuring newspaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/newspapers/:id/rates/:month
 * Get rates for a newspaper for a specific month
 */
router.get('/newspapers/:id/rates/:month', async (req, res) => {
  try {
    const { id: newspaperId, month } = req.params;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Verify newspaper ownership
    const { data: newspaper } = await supabase
      .from('newspapers')
      .select('*')
      .eq('id', newspaperId)
      .eq('university_id', universityId)
      .single();

    if (!newspaper) {
      return res.status(404).json({ error: 'Newspaper not found' });
    }

    const { data: rates, error } = await supabase
      .from('newspaper_rates')
      .select('*')
      .eq('newspaper_id', newspaperId)
      .eq('month', month)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch rates' });
    }

    // Convert to object with day names as keys
    const ratesObj = {};
    rates.forEach(r => {
      ratesObj[r.day_of_week] = parseFloat(r.rate);
    });

    res.json({
      newspaperId,
      newspaperName: newspaper.name,
      month,
      rates: ratesObj,
      configured: rates.length > 0,
    });
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/all-rates/:month
 * Get rates for ALL newspapers for a specific month
 */
router.get('/all-rates/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Get all newspapers for the university
    const { data: newspapers, error: npError } = await supabase
      .from('newspapers')
      .select('id, name')
      .eq('university_id', universityId)
      .order('name', { ascending: true });

    if (npError) {
      console.error('Database error:', npError);
      return res.status(500).json({ error: 'Failed to fetch newspapers' });
    }

    if (!newspapers || newspapers.length === 0) {
      return res.json({ month, newspapers: [] });
    }

    const newspaperIds = newspapers.map(n => n.id);

    // Get all rates for these newspapers for the month
    const { data: rates, error: ratesError } = await supabase
      .from('newspaper_rates')
      .select('*')
      .in('newspaper_id', newspaperIds)
      .eq('month', month);

    if (ratesError) {
      console.error('Database error:', ratesError);
      return res.status(500).json({ error: 'Failed to fetch rates' });
    }

    // Group rates by newspaper
    const result = newspapers.map(np => {
      const npRates = rates.filter(r => r.newspaper_id === np.id);
      const ratesObj = {};
      npRates.forEach(r => {
        ratesObj[r.day_of_week] = parseFloat(r.rate);
      });
      return {
        id: np.id,
        name: np.name,
        configured: npRates.length > 0,
        rates: ratesObj,
      };
    });

    res.json({ month, newspapers: result });
  } catch (error) {
    console.error('Error fetching all rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/newspapers/:id/rates/:month
 * Update rates for a newspaper for a specific month
 */
router.put('/newspapers/:id/rates/:month', async (req, res) => {
  try {
    const { id: newspaperId, month } = req.params;
    const { rates } = req.body;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    if (!rates || typeof rates !== 'object') {
      return res.status(400).json({ error: 'Rates must be an object with day names as keys' });
    }

    // Verify newspaper ownership
    const { data: newspaper } = await supabase
      .from('newspapers')
      .select('*')
      .eq('id', newspaperId)
      .eq('university_id', universityId)
      .single();

    if (!newspaper) {
      return res.status(404).json({ error: 'Newspaper not found' });
    }

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const validRates = {};
    for (const day of daysOfWeek) {
      const rate = parseFloat(rates[day]);
      if (isNaN(rate) || rate < 0) {
        return res.status(400).json({ error: `Invalid rate for ${day}` });
      }
      validRates[day] = rate;
    }

    // Delete existing rates for this newspaper/month
    await supabase
      .from('newspaper_rates')
      .delete()
      .eq('newspaper_id', newspaperId)
      .eq('month', month);

    // Insert new rates
    const rateInserts = daysOfWeek.map(day => ({
      newspaper_id: newspaperId,
      month: month,
      day_of_week: day,
      rate: validRates[day],
    }));

    const { error: ratesError } = await supabase
      .from('newspaper_rates')
      .insert(rateInserts)
      .select();

    if (ratesError) {
      console.error('Database error:', ratesError);
      return res.status(500).json({ error: 'Failed to update rates' });
    }

    res.json({
      message: 'Rates updated successfully',
      newspaperId,
      month,
      rates: validRates,
    });
  } catch (error) {
    console.error('Error updating rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/copy-rates
 * Copy newspaper rates from one month to another (creates entries too)
 */
router.post('/copy-rates', async (req, res) => {
  try {
    const { sourceMonth, targetMonth } = req.body;
    const { universityId } = req.user;

    if (!isValidMonthFormat(sourceMonth) || !isValidMonthFormat(targetMonth)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    if (sourceMonth === targetMonth) {
      return res.status(400).json({ error: 'Source and target months must be different' });
    }

    // Get all newspapers for the university
    const { data: newspapers, error: npError } = await supabase
      .from('newspapers')
      .select('id, name')
      .eq('university_id', universityId);

    if (npError || !newspapers || newspapers.length === 0) {
      return res.status(400).json({ error: 'No newspapers found for your university' });
    }

    const newspaperIds = newspapers.map(n => n.id);

    // Get source month rates
    const { data: sourceRates, error: srcError } = await supabase
      .from('newspaper_rates')
      .select('*')
      .in('newspaper_id', newspaperIds)
      .eq('month', sourceMonth);

    if (srcError) {
      console.error('Database error:', srcError);
      return res.status(500).json({ error: 'Failed to fetch source month rates' });
    }

    if (!sourceRates || sourceRates.length === 0) {
      return res.status(400).json({ error: `No rates configured for ${sourceMonth}` });
    }

    // Find which newspapers have source rates
    const sourceNewspaperIds = [...new Set(sourceRates.map(r => r.newspaper_id))];

    // Check which newspapers already have target month rates
    const { data: existingTargetRates } = await supabase
      .from('newspaper_rates')
      .select('newspaper_id')
      .in('newspaper_id', sourceNewspaperIds)
      .eq('month', targetMonth);

    const alreadyConfiguredIds = new Set((existingTargetRates || []).map(r => r.newspaper_id));

    // Filter to only newspapers that don't already have target month rates
    const ratesToCopy = sourceRates.filter(r => !alreadyConfiguredIds.has(r.newspaper_id));

    if (ratesToCopy.length === 0) {
      return res.status(400).json({ error: `All newspapers are already configured for ${targetMonth}` });
    }

    // Insert copied rates
    const rateInserts = ratesToCopy.map(r => ({
      newspaper_id: r.newspaper_id,
      month: targetMonth,
      day_of_week: r.day_of_week,
      rate: r.rate,
    }));

    const { error: insertError } = await supabase
      .from('newspaper_rates')
      .insert(rateInserts);

    if (insertError) {
      console.error('Database error:', insertError);
      return res.status(500).json({ error: 'Failed to copy rates' });
    }

    // Generate entries for each copied newspaper
    const copiedNewspaperIds = [...new Set(ratesToCopy.map(r => r.newspaper_id))];
    const dates = getDatesInMonth(targetMonth);
    let totalEntriesCreated = 0;

    for (const npId of copiedNewspaperIds) {
      // Check if entries already exist
      const { data: existingEntries } = await supabase
        .from('newspaper_entries')
        .select('id')
        .eq('newspaper_id', npId)
        .gte('date', `${targetMonth}-01`)
        .lte('date', `${targetMonth}-31`)
        .limit(1);

      if (existingEntries && existingEntries.length > 0) continue;

      const entryInserts = dates.map(date => ({
        newspaper_id: npId,
        date: formatDate(date),
        status: 'unmarked',
      }));

      const { error: entryError } = await supabase
        .from('newspaper_entries')
        .insert(entryInserts);

      if (!entryError) {
        totalEntriesCreated += entryInserts.length;
      }
    }

    const copiedNewspaperNames = newspapers
      .filter(n => copiedNewspaperIds.includes(n.id))
      .map(n => n.name);

    res.status(201).json({
      message: `Rates copied from ${sourceMonth} to ${targetMonth}`,
      newspapersCopied: copiedNewspaperNames,
      count: copiedNewspaperIds.length,
      entriesCreated: totalEntriesCreated,
      skipped: alreadyConfiguredIds.size,
    });
  } catch (error) {
    console.error('Error copying rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/newspaper-entries/:month
 * Get all newspaper entries for a specific month (all newspapers)
 */
router.get('/newspaper-entries/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const { universityId } = req.user;

    if (!isValidMonthFormat(month)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    const dates = getDatesInMonth(month);
    const startDate = formatDate(dates[0]);
    const endDate = formatDate(dates[dates.length - 1]);

    const { data: entries, error } = await supabase
      .from('newspaper_entries')
      .select(`
        *,
        newspapers (
          id,
          name,
          university_id
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch newspaper entries' });
    }

    // Filter by university (since entries don't have university_id directly)
    const filteredEntries = entries.filter(e => e.newspapers?.university_id === universityId);

    // Batch-fetch all rates for this month
    const newspaperIds = [...new Set(filteredEntries.map(e => e.newspaper_id))];
    const { data: allRates } = await supabase
      .from('newspaper_rates')
      .select('newspaper_id, day_of_week, rate')
      .in('newspaper_id', newspaperIds)
      .eq('month', month);

    const rateMap = new Map();
    (allRates || []).forEach(r => {
      rateMap.set(`${r.newspaper_id}:${r.day_of_week}`, parseFloat(r.rate));
    });

    const entriesWithRates = filteredEntries.map(entry => {
      const date = new Date(entry.date);
      const dayName = getDayName(date);
      const rate = rateMap.get(`${entry.newspaper_id}:${dayName}`) || 0;
      return { ...entry, rate, dayOfWeek: dayName };
    });

    res.json({ entries: entriesWithRates });
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
          id,
          name,
          university_id
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('newspapers(name)', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch newspaper entries' });
    }

    // Filter by university
    const filteredEntries = entries.filter(e => e.newspapers?.university_id === universityId);

    // Batch-fetch all rates for this month
    const newspaperIds = [...new Set(filteredEntries.map(e => e.newspaper_id))];
    const { data: allRates } = await supabase
      .from('newspaper_rates')
      .select('newspaper_id, day_of_week, rate')
      .in('newspaper_id', newspaperIds)
      .eq('month', month);

    const rateMap = new Map();
    (allRates || []).forEach(r => {
      rateMap.set(`${r.newspaper_id}:${r.day_of_week}`, parseFloat(r.rate));
    });

    // Batch-fetch Clerk users for marked entries
    const clerkIds = [...new Set(filteredEntries.filter(e => e.marked_by_clerk_id).map(e => e.marked_by_clerk_id))];
    const emailMap = new Map();
    if (clerkIds.length > 0) {
      await Promise.all(
        clerkIds.map(async (clerkId) => {
          try {
            const user = await clerkClient.users.getUser(clerkId);
            emailMap.set(clerkId, user.emailAddresses[0]?.emailAddress || '-');
          } catch (err) {
            emailMap.set(clerkId, '-');
          }
        })
      );
    }

    const entriesWithDetails = filteredEntries.map(entry => {
      const date = new Date(entry.date);
      const dayName = getDayName(date);
      const rate = rateMap.get(`${entry.newspaper_id}:${dayName}`) || 0;
      const markedByEmail = entry.marked_by_clerk_id ? (emailMap.get(entry.marked_by_clerk_id) || '-') : '-';
      return { ...entry, rate, dayOfWeek: dayName, markedByEmail };
    });

    // Generate Excel report (matrix format)
    const reportGenerator = require('../utils/reportGeneratorMatrix');
    const buffer = await reportGenerator.generateMatrixReport(
      entriesWithDetails,
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
