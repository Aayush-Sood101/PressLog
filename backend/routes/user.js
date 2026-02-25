const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { requireAuth, requireApproved } = require('../middleware/auth');
const { getDatesInMonth, formatDate, isValidMonthFormat } = require('../utils/dateHelpers');

// All user routes require authentication and approved status
router.use(requireAuth, requireApproved);

/**
 * GET /api/newspapers/:month
 * Get newspaper configurations (rates) for a specific month
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

    // Convert array to object with day names as keys for easy lookup
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
      .select('*')
      .eq('id', entryId)
      .eq('university_id', universityId)
      .single();

    if (fetchError || !entry) {
      return res.status(404).json({ error: 'Newspaper entry not found' });
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
          day_of_week,
          rate
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
