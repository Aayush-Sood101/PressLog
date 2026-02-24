const { verifyToken } = require('@clerk/clerk-sdk-node');

/**
 * Middleware to verify Clerk JWT token
 * Attaches user info to req.user
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Clerk JWT token
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Attach user info to request
    req.user = {
      clerkId: payload.sub,
      role: payload.publicMetadata?.role,
      universityId: payload.publicMetadata?.universityId,
      status: payload.publicMetadata?.status,
    };

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

/**
 * Middleware to require approved status
 */
const requireApproved = (req, res, next) => {
  if (req.user.status === 'pending') {
    return res.status(403).json({ error: 'Forbidden: Approval pending' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireApproved,
};
