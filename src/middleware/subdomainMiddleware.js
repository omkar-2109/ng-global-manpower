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

    // If accessing agent routes on admin subdomain, redirect cleanly to agents portal
    if (req.path === '/agent' || req.path.startsWith('/agent/')) {
      return res.redirect(`${proto}://agents.${rootDomain}${req.originalUrl}`);
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

  // 3. Main Apex Public Site (ngglobalmp.in or www.ngglobalmp.in)
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

    // Note: Public agency profiles remain hosted on apex domain at /agency/:username (no vanity subdomains)
  }

  next();
}

module.exports = subdomainMiddleware;
