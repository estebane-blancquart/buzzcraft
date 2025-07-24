/**
 * COMMIT 67 - Panel Settings
 * 
 * FAIT QUOI : Gestion équipe avec rôles granulaires et invitations collaboratives
 * REÇOIT : teamId: string, members?: object[], permissions?: object
 * RETOURNE : { team: object, members: object[], roles: object[], invitations: object[] }
 * ERREURS : TeamError si équipe invalide, MemberError si membre introuvable, PermissionError si permissions insuffisantes
 */

export async function createTeamManager(teamId, members = [], permissions = {}) {
  if (!teamId || typeof teamId !== 'string') {
    throw new Error('TeamError: TeamId requis string');
  }

  if (!Array.isArray(members)) {
    throw new Error('TeamError: Members doit être array');
  }

  if (typeof permissions !== 'object') {
    throw new Error('TeamError: Permissions doit être object');
  }

  try {
    const team = await getTeamInfo(teamId);
    const teamMembers = members.length > 0 ? members : await getTeamMembers(teamId);
    const availableRoles = getAvailableRoles();
    const pendingInvitations = await getPendingInvitations(teamId);

    return {
      team,
      members: teamMembers,
      roles: availableRoles,
      invitations: pendingInvitations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`TeamError: Création gestionnaire équipe échouée: ${error.message}`);
  }
}

export async function validateMemberPermissions(member, action, resource, teamContext = {}) {
  if (!member || typeof member !== 'object') {
    throw new Error('MemberError: Member requis object');
  }

  if (!action || typeof action !== 'string') {
    throw new Error('PermissionError: Action requis string');
  }

  if (!resource || typeof resource !== 'string') {
    throw new Error('PermissionError: Resource requis string');
  }

  if (typeof teamContext !== 'object') {
    throw new Error('TeamError: TeamContext doit être object');
  }

  try {
    const memberRole = member.role || 'viewer';
    const rolePermissions = await getRolePermissions(memberRole);
    
    // Validation permission directe
    const directPermission = checkDirectPermission(rolePermissions, action, resource);
    
    // Validation permission contextuelle
    const contextualPermission = checkContextualPermission(
      member, 
      action, 
      resource, 
      teamContext
    );

    const hasPermission = directPermission || contextualPermission;

    return {
      allowed: hasPermission,
      member: member.id,
      memberRole,
      action,
      resource,
      checks: {
        direct: directPermission,
        contextual: contextualPermission
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`PermissionError: Validation permissions échouée: ${error.message}`);
  }
}

export async function inviteTeamMembers(teamId, invitations, inviterMember, options = {}) {
  if (!teamId || typeof teamId !== 'string') {
    throw new Error('TeamError: TeamId requis string');
  }

  if (!Array.isArray(invitations)) {
    throw new Error('TeamError: Invitations doit être array');
  }

  if (!inviterMember || typeof inviterMember !== 'object') {
    throw new Error('MemberError: InviterMember requis object');
  }

  const sendEmail = options.sendEmail !== false;

  try {
    // Validation permissions inviteur
    const canInvite = await validateMemberPermissions(
      inviterMember, 
      'invite', 
      'members', 
      { teamId }
    );
    
    if (!canInvite.allowed) {
      throw new Error('PermissionError: Permissions insuffisantes pour inviter des membres');
    }

    const results = [];
    const successfulInvitations = [];
    const failedInvitations = [];

    for (const invitation of invitations) {
      try {
        // Validation invitation
        const validationResult = await validateInvitation(invitation, teamId);
        if (!validationResult.valid) {
          failedInvitations.push({
            invitation,
            error: validationResult.issues.join(', ')
          });
          continue;
        }

        // Création invitation
        const inviteResult = await createInvitation(teamId, invitation, inviterMember);

        // Envoi email si demandé
        if (sendEmail) {
          await sendInvitationEmail(inviteResult.invitation);
        }

        successfulInvitations.push(inviteResult.invitation);
        results.push({
          email: invitation.email,
          status: 'sent',
          invitationId: inviteResult.invitation.id
        });
      } catch (inviteError) {
        failedInvitations.push({
          invitation,
          error: inviteError.message
        });
        results.push({
          email: invitation.email,
          status: 'failed',
          error: inviteError.message
        });
      }
    }

    return {
      invited: true,
      teamId,
      inviterMember: inviterMember.id,
      results,
      successful: successfulInvitations,
      failed: failedInvitations,
      totalInvited: successfulInvitations.length,
      totalFailed: failedInvitations.length,
      emailsSent: sendEmail,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`TeamError: Invitation membres échouée: ${error.message}`);
  }
}

export async function getTeamStatus(teamId, options = {}) {
  if (!teamId || typeof teamId !== 'string') {
    throw new Error('TeamError: TeamId requis string');
  }

  try {
    const team = await getTeamInfo(teamId);
    const members = await getTeamMembers(teamId);
    const invitations = await getPendingInvitations(teamId);
    
    const activeMembers = members.filter(m => m.status === 'active').length;
    const pendingMembers = invitations.length;
    const totalMembers = activeMembers + pendingMembers;

    const status = activeMembers > 0 ? 'active' : 'empty';

    return {
      status,
      teamId,
      teamName: team.name,
      activeMembers,
      pendingMembers,
      totalMembers,
      lastActivity: team.lastActivity || new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      teamId,
      issues: [`status_check_failed: ${error.message}`],
      timestamp: new Date().toISOString()
    };
  }
}

// Helper functions
async function getTeamInfo(teamId) {
  return {
    id: teamId,
    name: 'Équipe BuzzCraft',
    description: 'Équipe de développement principale',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    lastActivity: new Date(Date.now() - 3600000).toISOString()
  };
}

async function getTeamMembers(teamId) {
  return [
    {
      id: 'user_1',
      email: 'admin@buzzcraft.dev',
      name: 'Admin User',
      role: 'admin',
      status: 'active',
      joinedAt: new Date(Date.now() - 86400000 * 20).toISOString()
    },
    {
      id: 'user_2',
      email: 'dev@buzzcraft.dev',
      name: 'Dev User',
      role: 'developer',
      status: 'active',
      joinedAt: new Date(Date.now() - 86400000 * 15).toISOString()
    }
  ];
}

function getAvailableRoles() {
  return [
    {
      id: 'viewer',
      name: 'Viewer',
      permissions: ['read']
    },
    {
      id: 'editor',
      name: 'Editor',
      permissions: ['read', 'write']
    },
    {
      id: 'developer',
      name: 'Developer',
      permissions: ['read', 'write', 'deploy']
    },
    {
      id: 'admin',
      name: 'Admin',
      permissions: ['read', 'write', 'deploy', 'manage_team']
    }
  ];
}

async function getPendingInvitations(teamId) {
  return [
    {
      id: 'inv_123',
      email: 'newuser@example.com',
      role: 'editor',
      invitedBy: 'user_1',
      invitedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: 'pending'
    }
  ];
}

async function getRolePermissions(role) {
  const roles = getAvailableRoles();
  const roleInfo = roles.find(r => r.id === role);
  return roleInfo ? roleInfo.permissions : ['read'];
}

function checkDirectPermission(permissions, action, resource) {
  const actionMap = {
    'read': 'read',
    'write': 'write',
    'deploy': 'deploy',
    'invite': 'manage_team'
  };
  
  const requiredPermission = actionMap[action] || action;
  return permissions.includes(requiredPermission);
}

function checkContextualPermission(member, action, resource, context) {
  if (action === 'write' && resource === 'profile' && context.targetMember === member.id) {
    return true;
  }
  
  return false;
}

async function validateInvitation(invitation, teamId) {
  const issues = [];
  
  if (!invitation.email || !isValidEmail(invitation.email)) {
    issues.push('invalid_email');
  }
  
  if (!invitation.role || !getAvailableRoles().find(r => r.id === invitation.role)) {
    issues.push('invalid_role');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

async function createInvitation(teamId, invitation, inviter) {
  const invitationId = 'inv_' + Math.random().toString(36).substr(2, 9);
  
  return {
    invitation: {
      id: invitationId,
      teamId,
      email: invitation.email,
      role: invitation.role,
      invitedBy: inviter.id,
      invitedAt: new Date().toISOString(),
      status: 'pending'
    }
  };
}

async function sendInvitationEmail(invitation) {
  return { sent: true, invitationId: invitation.id };
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// panels/settings/team : Panel Settings (commit 67)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
