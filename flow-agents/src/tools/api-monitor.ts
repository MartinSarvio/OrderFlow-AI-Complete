import { config, ENDPOINTS, type EndpointStatus } from '../config.js';

// ============================================================
// API Monitor Tool — Health checks for OrderFlow endpoints
// ============================================================

export interface EndpointResult {
  name: string;
  url: string;
  status: EndpointStatus;
  statusCode: number | null;
  responseTimeMs: number;
  error: string | null;
  critical: boolean;
  timestamp: string;
}

export interface DiagnosticsReport {
  timestamp: string;
  overallStatus: EndpointStatus;
  endpoints: EndpointResult[];
  healthyCount: number;
  degradedCount: number;
  downCount: number;
  totalChecked: number;
}

/**
 * Check a single endpoint's health
 */
export async function checkEndpoint(
  url: string,
  method: string = 'GET',
  headers: Record<string, string> = {},
  timeoutMs: number = config.responseTimeError
): Promise<{ statusCode: number | null; responseTimeMs: number; error: string | null }> {
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'FLOW-DebugAgent/1.0',
        ...headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseTimeMs = Math.round(performance.now() - start);

    return {
      statusCode: response.status,
      responseTimeMs,
      error: response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
    };
  } catch (err) {
    const responseTimeMs = Math.round(performance.now() - start);
    const error = err instanceof Error ? err.message : String(err);

    return {
      statusCode: null,
      responseTimeMs,
      error: error.includes('abort') ? `Timeout after ${timeoutMs}ms` : error,
    };
  }
}

/**
 * Determine endpoint status based on response
 */
function determineStatus(
  statusCode: number | null,
  responseTimeMs: number,
  error: string | null
): EndpointStatus {
  if (error || statusCode === null || statusCode >= 500) {
    return 'down';
  }
  if (statusCode >= 400 || responseTimeMs > config.responseTimeWarning) {
    return 'degraded';
  }
  return 'healthy';
}

/**
 * Check a single named endpoint from the ENDPOINTS config
 */
export async function checkNamedEndpoint(endpointName: string): Promise<EndpointResult | null> {
  const endpoint = ENDPOINTS.find(e => e.name === endpointName);
  if (!endpoint) return null;

  const result = await checkEndpoint(endpoint.url, endpoint.method, { ...endpoint.headers });
  const status = determineStatus(result.statusCode, result.responseTimeMs, result.error);

  return {
    name: endpoint.name,
    url: endpoint.url,
    status,
    statusCode: result.statusCode,
    responseTimeMs: result.responseTimeMs,
    error: result.error,
    critical: endpoint.critical,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Run full diagnostics on all configured endpoints
 */
export async function runFullDiagnostics(): Promise<DiagnosticsReport> {
  const results: EndpointResult[] = [];

  // Check all endpoints in parallel
  const checks = ENDPOINTS.map(async (endpoint) => {
    const result = await checkEndpoint(endpoint.url, endpoint.method, { ...endpoint.headers });
    const status = determineStatus(result.statusCode, result.responseTimeMs, result.error);

    return {
      name: endpoint.name,
      url: endpoint.url,
      status,
      statusCode: result.statusCode,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
      critical: endpoint.critical,
      timestamp: new Date().toISOString(),
    } satisfies EndpointResult;
  });

  const endpointResults = await Promise.allSettled(checks);

  for (const result of endpointResults) {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    }
  }

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const degradedCount = results.filter(r => r.status === 'degraded').length;
  const downCount = results.filter(r => r.status === 'down').length;

  // Overall status: worst of critical endpoints
  const criticalResults = results.filter(r => r.critical);
  let overallStatus: EndpointStatus = 'healthy';
  if (criticalResults.some(r => r.status === 'down')) {
    overallStatus = 'down';
  } else if (criticalResults.some(r => r.status === 'degraded')) {
    overallStatus = 'degraded';
  }

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    endpoints: results,
    healthyCount,
    degradedCount,
    downCount,
    totalChecked: results.length,
  };
}

/**
 * Format diagnostics report as human-readable string
 */
export function formatDiagnosticsReport(report: DiagnosticsReport): string {
  const statusEmoji = {
    healthy: '✅',
    degraded: '⚠️',
    down: '❌',
  };

  let output = `\n═══ FLOW Diagnostics Report ═══\n`;
  output += `Timestamp: ${report.timestamp}\n`;
  output += `Overall: ${statusEmoji[report.overallStatus]} ${report.overallStatus.toUpperCase()}\n`;
  output += `Summary: ${report.healthyCount} healthy, ${report.degradedCount} degraded, ${report.downCount} down\n`;
  output += `───────────────────────────────\n`;

  for (const ep of report.endpoints) {
    const emoji = statusEmoji[ep.status];
    const critical = ep.critical ? ' [CRITICAL]' : '';
    output += `${emoji} ${ep.name}${critical}\n`;
    output += `   Status: ${ep.status} | ${ep.responseTimeMs}ms`;
    if (ep.statusCode) output += ` | HTTP ${ep.statusCode}`;
    if (ep.error) output += `\n   Error: ${ep.error}`;
    output += `\n`;
  }

  output += `═══════════════════════════════\n`;
  return output;
}

/**
 * MCP tool definitions for the API Monitor
 */
export const apiMonitorTools = [
  {
    name: 'check_endpoint',
    description: 'Check health of a specific OrderFlow endpoint. Returns status code, response time, and any errors.',
    input_schema: {
      type: 'object' as const,
      properties: {
        endpoint_name: {
          type: 'string',
          description: `Name of the endpoint to check. Available: ${ENDPOINTS.map(e => e.name).join(', ')}`,
        },
        custom_url: {
          type: 'string',
          description: 'Optional custom URL to check instead of a named endpoint',
        },
      },
    },
  },
  {
    name: 'run_full_diagnostics',
    description: 'Run health checks on ALL critical OrderFlow endpoints. Returns a full diagnostics report with status, response times, and errors for each endpoint.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

/**
 * Handle MCP tool calls for the API Monitor
 */
export async function handleApiMonitorTool(
  toolName: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (toolName) {
    case 'check_endpoint': {
      if (input.custom_url) {
        const result = await checkEndpoint(input.custom_url as string);
        const status = determineStatus(result.statusCode, result.responseTimeMs, result.error);
        return JSON.stringify({ ...result, status }, null, 2);
      }
      if (input.endpoint_name) {
        const result = await checkNamedEndpoint(input.endpoint_name as string);
        if (!result) return JSON.stringify({ error: `Unknown endpoint: ${input.endpoint_name}` });
        return JSON.stringify(result, null, 2);
      }
      return JSON.stringify({ error: 'Provide endpoint_name or custom_url' });
    }

    case 'run_full_diagnostics': {
      const report = await runFullDiagnostics();
      return formatDiagnosticsReport(report) + '\n' + JSON.stringify(report, null, 2);
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
