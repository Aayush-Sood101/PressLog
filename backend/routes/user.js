const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { requireAuth, requireApproved } = require('../middleware/auth');
const { getDatesInMonth, formatDate, isValidMonthFormat, getDayName } = require('../utils/dateHelpers');

// All user routes require authentication and approved status
router.use(requireAuth, requireApproved);

/**
 * GET /api/newspapers
 * Get all newspapers for user's university
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
 * GET /api/newspaper-entries/:month
 * Get all newspaper entries for a specific month
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

    // Batch-fetch all rates for this month and university's newspapers
    const newspaperIds = [...new Set(filteredEntries.map(e => e.newspaper_id))];
    const { data: allRates } = await supabase
      .from('newspaper_rates')
      .select('newspaper_id, day_of_week, rate')
      .in('newspaper_id', newspaperIds)
      .eq('month', month);

    // Build a lookup map: "newspaperId:dayOfWeek" -> rate
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
 * GET /api/newspaper-entries/date/:date
 * Get all newspaper entries for a specific date
 */
router.get('/newspaper-entries/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { universityId } = req.user;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const month = date.substring(0, 7); // Extract YYYY-MM

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
      .eq('date', date);

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
      const clerkClient = require('../config/clerk');
      await Promise.all(
        clerkIds.map(async (clerkId) => {
          try {
            const user = await clerkClient.users.getUser(clerkId);
            emailMap.set(clerkId, user.emailAddresses[0]?.emailAddress || null);
          } catch (err) {
            emailMap.set(clerkId, null);
          }
        })
      );
    }

    const entriesWithDetails = filteredEntries.map(entry => {
      const dateObj = new Date(entry.date);
      const dayName = getDayName(dateObj);
      const rate = rateMap.get(`${entry.newspaper_id}:${dayName}`) || 0;
      const markedByEmail = entry.marked_by_clerk_id ? (emailMap.get(entry.marked_by_clerk_id) || null) : null;
      return { ...entry, rate, dayOfWeek: dayName, markedByEmail };
    });

    res.json({ entries: entriesWithDetails });
  } catch (error) {
    console.error('Error fetching newspaper entries for date:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/newspaper-entries
 * Mark a newspaper entry as received or not_received
 */
router.post('/newspaper-entries', async (req, res) => {
  try {
    const { entryId, status } = req.body;
    const { universityId, clerkId } = req.user;

    // Validate status
    if (!['received', 'not_received'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be received or not_received' });
    }

    if (!entryId) {
      return res.status(400).json({ error: 'Entry ID is required' });
    }

    // Verify the entry belongs to the user's university
    const { data: entry, error: fetchError } = await supabase
      .from('newspaper_entries')
      .select(`
        *,
        newspapers (
          university_id
        )
      `)
      .eq('id', entryId)
      .single();

    if (fetchError || !entry) {
      return res.status(404).json({ error: 'Newspaper entry not found' });
    }

    if (entry.newspapers?.university_id !== universityId) {
      return res.status(403).json({ error: 'You do not have permission to mark this entry' });
    }

    // Update the entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('newspaper_entries')
      .update({
        status,
        marked_by_clerk_id: clerkId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .select(`
        *,
        newspapers (
          id,
          name,
          university_id
        )
      `)
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return res.status(500).json({ error: 'Failed to update newspaper entry' });
    }

    res.json({
      message: `Entry marked as ${status}`,
      entry: updatedEntry,
    });
  } catch (error) {
    console.error('Error updating newspaper entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
