const Agent = require('../models/Agent');

function subdomainMiddleware(req, res, next) {
  const host = req.headers.host || '';
  // Strip port if present
  const hostname = host.split(':')[0].toLowerCase();
  const parts = hostname.split('.');

  // Check if subdomain is present
  // Examples:
  // admin.ngglobalmp.in -> ['admin', 'ngglobalmp', 'in']
  // agents.ngglobalmp.in -> ['agents', 'ngglobalmp', 'in']
  // apex-global.ngglobalmp.in -> ['apex-global', 'ngglobalmp', 'in']
  // apex-global.localhost -> ['apex-global', 'localhost']

  let subdomain = null;
  if (hostname.endsWith('localhost') && parts.length > 1) {
    subdomain = parts[0];
  } else if (parts.length > 2) {
    subdomain = parts[0];
  }

  // 1. Handle 'admin' subdomain: admin.yourdomain.com or admin.localhost
  if (subdomain === 'admin') {
    req.isAdminPortal = true;
    res.locals.isAdminPortal = true;

    // If accessing root of admin subdomain, redirect to admin dashboard
    if (req.path === '/') {
      return res.redirect('/admin/dashboard');
    }
    return next();
  }

  // 2. Handle 'agents' or 'agent' subdomain: agents.yourdomain.com or agents.localhost
  if (subdomain === 'agents' || subdomain === 'agent') {
    req.isAgentPortal = true;
    res.locals.isAgentPortal = true;

    // If accessing root of agents subdomain, redirect to agent dashboard or login
    if (req.path === '/') {
      return res.redirect('/agent/dashboard');
    }
    return next();
  }

  // 3. Handle agent custom subdomain: [username].yourdomain.com or [username].localhost
  const reserved = ['www', 'admin', 'api', 'mail', 'app', 'portal', 'agents', 'agent', 'static'];
  if (subdomain && !reserved.includes(subdomain)) {
    const agent = Agent.findByUsername(subdomain);
    if (agent && agent.status === 'active') {
      req.subdomainAgent = agent;
      res.locals.subdomainAgent = agent;

      // Handle root access on agent's named subdomain:
      if (req.path === '/') {
        // If the logged-in agent matches this subdomain, open their private Dashboard
        if (req.agent && req.agent.id === agent.id) {
          return res.redirect('/agent/dashboard');
        }
        // Otherwise, open their branded public agency intake page for candidates
        return res.redirect(`/agency/${agent.username}`);
      }

      // If user accesses /dashboard on the agent's subdomain
      if (req.path === '/dashboard') {
        return res.redirect('/agent/dashboard');
      }
    }
  }

  next();
}

module.exports = subdomainMiddleware;
