const Agent = require('../models/Agent');
const agentController = require('../controllers/agentController');

function subdomainMiddleware(req, res, next) {
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  const port = (req.headers.host || '').split(':')[1];
  const portSuffix = port ? `:${port}` : '';
  const proto = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';

  const isLocal = host === 'localhost' || host.endsWith('.localhost');
  const isIpOrRender = /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.endsWith('.onrender.com');

  let subdomain = null;
  let rootDomain = host;

  if (isLocal) {
    const parts = host.split('.');
    if (parts.length > 1) {
      subdomain = parts[0];
    }
    rootDomain = `localhost${portSuffix}`;
  } else if (!isIpOrRender) {
    const parts = host.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
      rootDomain = parts.slice(1).join('.');
    } else {
      subdomain = null;
      rootDomain = host;
    }
  }

  // 1. Handle 'admin' subdomain: admin.ngglobalmp.in or admin.localhost
  if (subdomain === 'admin') {
    req.isAdminPortal = true;
    res.locals.isAdminPortal = true;

    // If accessing root of admin subdomain, redirect to admin dashboard
    if (req.path === '/') {
      return res.redirect('/admin/dashboard');
    }

    // If consumer tries to access general jobs directory on admin subdomain, redirect to main site
    if (req.path === '/jobs' || req.path.startsWith('/jobs/')) {
      return res.redirect(`${proto}://${rootDomain}${req.originalUrl}`);
    }

    return next();
  }

  // 2. Handle 'agents' or 'agent' subdomain: agents.ngglobalmp.in or agents.localhost
  if (subdomain === 'agents' || subdomain === 'agent') {
    req.isAgentPortal = true;
    res.locals.isAgentPortal = true;

    // If accessing root of agents subdomain:
    if (req.path === '/') {
      if (req.agent) {
        if (!isLocal && !isIpOrRender && req.agent.username) {
          return res.redirect(`${proto}://${req.agent.username}.${rootDomain}/agent/dashboard`);
        }
        return res.redirect('/agent/dashboard');
      }
      return res.redirect('/agent/login');
    }

    // Redirect general public consumer paths to main portal
    if (req.path === '/jobs' || req.path.startsWith('/jobs/')) {
      return res.redirect(`${proto}://${rootDomain}${req.originalUrl}`);
    }

    return next();
  }

  // 3. Handle agent custom subdomain: [username].ngglobalmp.in or [username].localhost
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
        // Otherwise, render their branded public agency intake page directly on this subdomain
        req.params.username = agent.username;
        return agentController.showAgencyProfile(req, res, next);
      }

      // Handle public candidate submission on agent's subdomain
      if (req.path === '/apply' && req.method === 'POST') {
        req.params.username = agent.username;
        return agentController.handlePublicCandidateApplication(req, res, next);
      }

      if (req.path === '/apply' && req.method === 'GET') {
        req.params.username = agent.username;
        return agentController.showAgencyProfile(req, res, next);
      }

      // If user accesses /dashboard on the agent's subdomain
      if (req.path === '/dashboard') {
        return res.redirect('/agent/dashboard');
      }

      return next();
    }
  }

  // 4. Main Apex Public Site (ngglobalmp.in or www.ngglobalmp.in)
  // In production with custom domain, seamlessly route portal paths to their dedicated subdomains
  if (!isLocal && !isIpOrRender && (subdomain === null || subdomain === 'www')) {
    // Redirect /admin and /admin/* to admin.ngglobalmp.in
    if (req.path === '/admin') {
      return res.redirect(302, `${proto}://admin.${rootDomain}/admin/dashboard`);
    }
    if (req.path.startsWith('/admin/')) {
      return res.redirect(302, `${proto}://admin.${rootDomain}${req.originalUrl}`);
    }

    // Redirect /agent and /agent/* to agents.ngglobalmp.in
    if (req.path === '/agent') {
      return res.redirect(302, `${proto}://agents.${rootDomain}/agent/dashboard`);
    }
    if (req.path.startsWith('/agent/')) {
      return res.redirect(302, `${proto}://agents.${rootDomain}${req.originalUrl}`);
    }

    // Redirect /agency/:username to [username].ngglobalmp.in
    const agencyMatch = req.path.match(/^\/agency\/([a-zA-Z0-9_-]+)/);
    if (agencyMatch && agencyMatch[1]) {
      const targetAgent = Agent.findByUsername(agencyMatch[1]);
      if (targetAgent && targetAgent.status === 'active') {
        return res.redirect(302, `${proto}://${targetAgent.username}.${rootDomain}/`);
      }
    }
  }

  next();
}

module.exports = subdomainMiddleware;
