import { createClient } from '@supabase/supabase-js';
import dns from 'dns';
import { promisify } from 'util';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);

/**
 * Domain Verification API
 * POST /api/domains/verify
 *
 * Verifies DNS configuration for custom domains
 * Called by cron job or manual user trigger
 *
 * Request body:
 * - domain_id: UUID (optional - verify specific domain)
 * - hostname: string (optional - verify by hostname)
 *
 * Response:
 * {
 *   success: boolean,
 *   domain: { id, hostname, status },
 *   checks: { cname: boolean, txt: boolean },
 *   message: string
 * }
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle GET for batch verification (cron job)
    if (req.method === 'GET') {
      return await handleBatchVerification(supabase, res);
    }

    // Handle POST for single domain verification
    if (req.method === 'POST') {
      const { domain_id, hostname } = req.body || {};
      return await handleSingleVerification(supabase, res, domain_id, hostname);
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    console.error('Domain verification error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}

/**
 * Verify a single domain
 */
async function handleSingleVerification(supabase, res, domainId, hostname) {
  // Find domain
  let query = supabase.from('domain_mappings').select('*');

  if (domainId) {
    query = query.eq('id', domainId);
  } else if (hostname) {
    query = query.eq('hostname', hostname);
  } else {
    return res.status(400).json({ error: 'domain_id or hostname required' });
  }

  const { data: domain, error } = await query.single();

  if (error || !domain) {
    return res.status(404).json({ error: 'Domain not found' });
  }

  // Perform verification
  const result = await verifyDomain(supabase, domain);

  return res.status(200).json({
    success: result.success,
    domain: {
      id: domain.id,
      hostname: domain.hostname,
      status: result.newStatus
    },
    checks: result.checks,
    message: result.message
  });
}

/**
 * Batch verify pending domains (for cron job)
 */
async function handleBatchVerification(supabase, res) {
  // Get pending domains using our function
  const { data: pendingDomains, error } = await supabase
    .rpc('get_pending_domains', { p_limit: 50 });

  if (error) {
    console.error('Error fetching pending domains:', error);
    return res.status(500).json({ error: 'Failed to fetch pending domains' });
  }

  if (!pendingDomains || pendingDomains.length === 0) {
    return res.status(200).json({
      success: true,
      processed: 0,
      message: 'No pending domains'
    });
  }

  // Verify each domain
  const results = [];
  for (const domain of pendingDomains) {
    // Get full domain data
    const { data: fullDomain } = await supabase
      .from('domain_mappings')
      .select('*')
      .eq('id', domain.domain_id)
      .single();

    if (fullDomain) {
      const result = await verifyDomain(supabase, fullDomain);
      results.push({
        hostname: domain.hostname,
        status: result.newStatus,
        success: result.success
      });
    }
  }

  return res.status(200).json({
    success: true,
    processed: results.length,
    results
  });
}

/**
 * Verify domain DNS and update status
 */
async function verifyDomain(supabase, domain) {
  const checks = {
    cname: false,
    txt: false
  };

  let newStatus = domain.status;
  let message = '';
  let errorMessage = null;

  try {
    // Step 1: Check CNAME record
    const cnameResult = await checkCname(domain.hostname, domain.dns_target);
    checks.cname = cnameResult.valid;

    if (!checks.cname) {
      // CNAME not configured yet
      newStatus = 'pending_dns';
      message = `CNAME not found. Please add: ${domain.hostname} → ${domain.dns_target}`;
      errorMessage = cnameResult.error;
    } else {
      // Step 2: CNAME is valid, check if we need TXT validation
      if (domain.status === 'pending_dns' || domain.status === 'pending_validation') {
        // Check TXT record for additional validation (optional)
        if (domain.validation_record && domain.validation_value) {
          const txtResult = await checkTxt(domain.validation_record, domain.validation_value);
          checks.txt = txtResult.valid;
        } else {
          checks.txt = true; // No TXT validation required
        }

        if (checks.txt) {
          // DNS is fully verified, proceed to cert request
          newStatus = 'pending_cert';
          message = 'DNS verified. SSL certificate being provisioned...';

          // In production, trigger SSL cert request here
          // For now, simulate quick cert issuance
          if (process.env.NODE_ENV !== 'production') {
            newStatus = 'active';
            message = 'Domain verified and activated!';
          }
        } else {
          newStatus = 'pending_validation';
          message = 'CNAME verified. Waiting for TXT validation record.';
        }
      } else if (domain.status === 'pending_cert') {
        // Check if cert is ready (would query Vercel/Cloudflare API)
        // For now, simulate success
        newStatus = 'active';
        message = 'SSL certificate issued. Domain is now active!';
      } else if (domain.status === 'active') {
        // Already active, just verify still valid
        message = 'Domain is active and verified.';
      }
    }
  } catch (err) {
    console.error(`DNS check error for ${domain.hostname}:`, err);
    errorMessage = err.message;

    // Only mark as error after many failed attempts
    if (domain.check_count > 10) {
      newStatus = 'error';
      message = 'Verification failed after multiple attempts.';
    } else {
      message = 'DNS check failed. Will retry.';
    }
  }

  // Update domain status in database
  await supabase.rpc('update_domain_status', {
    p_domain_id: domain.id,
    p_status: newStatus,
    p_error_message: errorMessage
  });

  return {
    success: checks.cname,
    checks,
    newStatus,
    message
  };
}

/**
 * Check if CNAME record points to correct target
 */
async function checkCname(hostname, expectedTarget) {
  try {
    const records = await resolveCname(hostname);

    // Check if any CNAME record matches our target
    const valid = records.some(record =>
      record.toLowerCase().includes(expectedTarget.toLowerCase().replace(/\.$/, ''))
    );

    return { valid, records };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { valid: false, error: 'No CNAME record found' };
    }
    throw err;
  }
}

/**
 * Check if TXT record contains validation token
 */
async function checkTxt(recordName, expectedValue) {
  try {
    const records = await resolveTxt(recordName);

    // TXT records are arrays of arrays
    const flatRecords = records.flat();
    const valid = flatRecords.some(record =>
      record.includes(expectedValue)
    );

    return { valid, records: flatRecords };
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
      return { valid: false, error: 'No TXT record found' };
    }
    throw err;
  }
}
