const PERMISSIONS = {
  ADMIN: ['all', 'ADMIN'],
  SENIOR_TL: [
    'SENIOR_TL',
    'read:team',
    'write:team',
    'read:attendance',
    'read:reports',
    'manage:team',
  ],
  TL: ['TL', 'read:team', 'write:team', 'read:attendance'],
  CAPTAIN: ['CAPTAIN', 'read:team'],
  INTERN: ['INTERN', 'read:own_profile'],
};

// By using '...requirements', we can accept multiple arguments (like in the previous code)
function rbac(...requirements) {
  return (req, reply, done) => {
    const userRole = req.user?.role;
    const allowedActions = PERMISSIONS[userRole] || [];

    // If the user is ADMIN, let them proceed directly
    if (allowedActions.includes('all')) {
      return done();
    }

    // Check if any of the passed requirements matches an allowed action.
    // Role names are included explicitly in each permission set, so there
    // is no fallback bypass based on req.user.role.
    const hasPermission = requirements.some((reqItem) =>
      allowedActions.includes(reqItem)
    );

    if (hasPermission) {
      return done();
    }

    return reply.status(403).send({ error: 'Forbidden' });
  };
}

module.exports = rbac;
