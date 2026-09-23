const Agent = require('../models/Agent');

function subdomainMiddleware(req, res, next) {
  const host = req.headers.host || '';
  // Strip port if present
  const hostname = host.split(':')[0].toLowerCase();
  const parts = hostname.split('.');

  // Check if subdomain is present
  // Examples:
  // agents.ngglobalmp.in -> ['agents', 'ngglobalmp', 'in']
  // vikram.ngglobalmp.in -> ['vikram', 'ngglobalmp', 'in']
  // agents.localhost -> ['agents', 'localhost']
  // vikram.localhost -> ['vikram', 'localhost']

  let subdomain = null;
  if (hostname.endsWith('localhost') && parts.length > 1) {
    subdomain = parts[0];
  } else if (parts.length > 2) {
    subdomain = parts[0];
  }

  // Handle 'agents' or 'agent' subdomain
  if (subdomain === 'agents' || subdomain === 'agent') {
    req.isAgentPortal = true;
    res.locals.isAgentPortal = true;

    // If accessing root of agents subdomain, redirect/rewrite to agent dashboard or login
    if (req.path === '/') {
      return res.redirect('/agent/dashboard');
    }
    return next();
  }

  // Handle agent custom subdomain e.g. [username].ngglobalmp.in or [username].localhost
  const reserved = ['www', 'admin', 'api', 'mail', 'app', 'portal', 'agents', 'agent', 'static'];
  if (subdomain && !reserved.includes(subdomain)) {
    const agent = Agent.findByUsername(subdomain);
    if (agent && agent.status === 'active') {
      req.subdomainAgent = agent;
      res.locals.subdomainAgent = agent;

      // If at root of agent subdomain, rewrite or redirect to their agency landing page
      if (req.path === '/') {
        return res.redirect(`/agency/${agent.username}`);
      }
    }
  }

  next();
}

module.exports = subdomainMiddleware;
