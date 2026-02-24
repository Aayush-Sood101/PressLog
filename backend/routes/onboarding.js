const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const clerkClient = require('../config/clerk');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/onboarding/admin
 * Create university and update Clerk metadata
 */
router.post('/admin', requireAuth, async (req, res) => {
  try {
    const { universityName } = req.body;
    const { clerkId } = req.user;

    if (!universityName || universityName.trim() === '') {
      return res.status(400).json({ error: 'University name is required' });
    }

    // Check if admin already has a university
    const { data: existingUniversity } = await supabase
      .from('universities')
      .select('*')
      .eq('admin_clerk_id', clerkId)
      .single();

    if (existingUniversity) {
      return res.status(400).json({ error: 'You have already created a university' });
    }

    // Create university
    const { data: university, error: dbError } = await supabase
      .from('universities')
      .insert([
        {
          name: universityName.trim(),
          admin_clerk_id: clerkId,
        }
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to create university' });
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: 'admin',
        universityId: university.id,
      },
    });

    res.status(201).json({
      message: 'University created successfully',
      university,
    });
  } catch (error) {
    console.error('Admin onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/onboarding/user
 * Submit join request for a university
 */
router.post('/user', requireAuth, async (req, res) => {
  try {
    const { universityId } = req.body;
    const { clerkId } = req.user;

    if (!universityId) {
      return res.status(400).json({ error: 'University ID is required' });
    }

    // Verify university exists
    const { data: university, error: universityError } = await supabase
      .from('universities')
      .select('*')
      .eq('id', universityId)
      .single();

    if (universityError || !university) {
      return res.status(404).json({ error: 'University not found' });
    }

    // Check if user already has a join request
    const { data: existingRequest } = await supabase
      .from('join_requests')
      .select('*')
      .eq('user_clerk_id', clerkId)
      .eq('university_id', universityId)
      .single();

    if (existingRequest) {
      return res.status(400).json({ 
        error: 'You have already submitted a request for this university',
        status: existingRequest.status
      });
    }

    // Create join request
    const { data: joinRequest, error: requestError } = await supabase
      .from('join_requests')
      .insert([
        {
          user_clerk_id: clerkId,
          university_id: universityId,
          status: 'pending',
        }
      ])
      .select()
      .single();

    if (requestError) {
      console.error('Database error:', requestError);
      return res.status(500).json({ error: 'Failed to create join request' });
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(clerkId, {
      publicMetadata: {
        role: 'user',
        universityId: universityId,
        status: 'pending',
      },
    });

    res.status(201).json({
      message: 'Join request submitted successfully',
      joinRequest,
    });
  } catch (error) {
    console.error('User onboarding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/onboarding/universities
 * Get list of all universities for user onboarding
 */
router.get('/universities', async (req, res) => {
  try {
    const { data: universities, error } = await supabase
      .from('universities')
      .select('id, name, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch universities' });
    }

    res.json({ universities });
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
