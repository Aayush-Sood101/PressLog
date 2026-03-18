const { verifyToken, clerkClient } = require('@clerk/clerk-sdk-node');

/**
 * Middleware to verify Clerk JWT token
 * Attaches user info to req.user
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in again.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Clerk JWT token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Fetch fresh user data from Clerk API (has latest publicMetadata)
    const clerkUser = await clerkClient.users.getUser(payload.sub);

    // Attach user info to request
    req.user = {
      clerkId: payload.sub,
      role: clerkUser.publicMetadata?.role,
      universityId: clerkUser.publicMetadata?.universityId,
      status: clerkUser.publicMetadata?.status,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Session expired. Please refresh the page and try again.' });
  }
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required. Your account needs admin role.'
    });
  }
  next();
};

/**
 * Middleware to require approved status
 */
const requireApproved = (req, res, next) => {
  if (req.user.status === 'pending') {
    return res.status(403).json({ error: 'Your account is pending approval. Please wait for admin approval.' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireApproved,
};
