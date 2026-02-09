import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import type { ErrorPattern } from './error-collector.js';

// ============================================================
// Code Analyzer — Reads and understands the agent codebase
//                  to build intelligent context for the
//                  Agent Programmer's Claude Code session
// ============================================================

const SRC_DIR = join(process.cwd(), 'src');

// ── Types ────────────────────────────────────────────────────

export interface FileContext {
  path: string;            // Relative to flow-agents/ e.g. 'src/agents/workflow-agent.ts'
  absolutePath: string;    // Full filesystem path
  content: string;
  functions: string[];     // Names of exported functions
  imports: string[];       // Import statements
  interfaces: string[];    // Exported interfaces
  lineCount: number;
  lastModified: string;
  sizeBytes: number;
}

export interface AgentCodebase {
  agents: FileContext[];   // src/agents/*.ts
  tools: FileContext[];    // src/tools/*.ts
  hooks: FileContext[];    // src/hooks/*.ts
  config: FileContext | null;  // src/config.ts
  main: FileContext | null;    // src/main.ts
  totalFiles: number;
  totalLines: number;
}

// ── File Parsing ─────────────────────────────────────────────

/**
 * Parse a TypeScript file and extract metadata
 */
function parseTypeScriptFile(absolutePath: string): FileContext | null {
  try {
    if (!existsSync(absolutePath)) return null;

    const content = readFileSync(absolutePath, 'utf-8');
    const stat = statSync(absolutePath);
    const lines = content.split('\n');

    // Extract exported functions
    const functions: string[] = [];
    const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    // Also catch arrow function exports
    const arrowRegex = /export\s+(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
    while ((match = arrowRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }

    // Extract imports
    const imports: string[] = [];
    const importRegex = /^import\s+.*?from\s+['"](.+?)['"]/gm;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Extract exported interfaces
    const interfaces: string[] = [];
    const ifaceRegex = /export\s+(?:interface|type)\s+(\w+)/g;
    while ((match = ifaceRegex.exec(content)) !== null) {
      interfaces.push(match[1]);
    }

    const relPath = relative(join(SRC_DIR, '..'), absolutePath);

    return {
      path: relPath,
      absolutePath,
      content,
      functions,
      imports,
      interfaces,
      lineCount: lines.length,
      lastModified: stat.mtime.toISOString(),
      sizeBytes: stat.size,
    };
  } catch (err) {
    console.error(`[CodeAnalyzer] Failed to parse ${absolutePath}:`, err);
    return null;
  }
}

/**
 * Read all .ts files from a directory
 */
function readDirectory(dirPath: string): FileContext[] {
  const results: FileContext[] = [];

  if (!existsSync(dirPath)) return results;

  try {
    const files = readdirSync(dirPath)
      .filter(f => f.endsWith('.ts'))
      .sort();

    for (const file of files) {
      const parsed = parseTypeScriptFile(join(dirPath, file));
      if (parsed) results.push(parsed);
    }
  } catch {
    // Directory read failed
  }

  return results;
}

// ── Main Functions ───────────────────────────────────────────

/**
 * Load the entire agent codebase with metadata
 */
export function loadAgentCodebase(): AgentCodebase {
  const agents = readDirectory(join(SRC_DIR, 'agents'));
  const tools = readDirectory(join(SRC_DIR, 'tools'));
  const hooks = readDirectory(join(SRC_DIR, 'hooks'));
  const configFile = parseTypeScriptFile(join(SRC_DIR, 'config.ts'));
  const mainFile = parseTypeScriptFile(join(SRC_DIR, 'main.ts'));

  const allFiles = [...agents, ...tools, ...hooks];
  if (configFile) allFiles.push(configFile);
  if (mainFile) allFiles.push(mainFile);

  return {
    agents,
    tools,
    hooks,
    config: configFile,
    main: mainFile,
    totalFiles: allFiles.length,
    totalLines: allFiles.reduce((sum, f) => sum + f.lineCount, 0),
  };
}

/**
 * Get a compact summary of the codebase (no content, just metadata)
 */
export function getCodebaseSummary(codebase: AgentCodebase): string {
  const lines: string[] = [
    `FLOW Agent Codebase: ${codebase.totalFiles} files, ${codebase.totalLines} lines`,
    '',
    '## Agents:',
  ];

  for (const f of codebase.agents) {
    lines.push(`  ${basename(f.path)} (${f.lineCount} lines) — exports: ${f.functions.join(', ') || 'none'}`);
  }

  lines.push('', '## Tools:');
  for (const f of codebase.tools) {
    lines.push(`  ${basename(f.path)} (${f.lineCount} lines) — exports: ${f.functions.join(', ') || 'none'}`);
  }

  lines.push('', '## Hooks:');
  for (const f of codebase.hooks) {
    lines.push(`  ${basename(f.path)} (${f.lineCount} lines) — exports: ${f.functions.join(', ') || 'none'}`);
  }

  if (codebase.config) {
    lines.push('', `## Config: config.ts (${codebase.config.lineCount} lines)`);
  }
  if (codebase.main) {
    lines.push(`## Main: main.ts (${codebase.main.lineCount} lines)`);
  }

  return lines.join('\n');
}

// ── Context Building ─────────────────────────────────────────

/**
 * Given an error pattern, find the relevant files and build context
 */
export function getRelevantContext(error: ErrorPattern, codebase: AgentCodebase): string {
  const relevantFiles: FileContext[] = [];

  // 1. Direct file match
  if (error.affectedFile) {
    const allFiles = [...codebase.agents, ...codebase.tools, ...codebase.hooks];
    if (codebase.config) allFiles.push(codebase.config);
    if (codebase.main) allFiles.push(codebase.main);

    for (const f of allFiles) {
      if (f.path.includes(error.affectedFile) || error.affectedFile.includes(basename(f.path, '.ts'))) {
        relevantFiles.push(f);
      }
    }
  }

  // 2. Error type specific context
  switch (error.errorType) {
    case 'intent_miss':
      // Include sms-parser + config (SMS_PATTERNS)
      for (const f of codebase.tools) {
        if (f.path.includes('sms-parser')) relevantFiles.push(f);
      }
      if (codebase.config) relevantFiles.push(codebase.config);
      break;

    case 'api_failure':
      // Include api-monitor + supabase-query
      for (const f of codebase.tools) {
        if (f.path.includes('api-monitor') || f.path.includes('supabase-query')) {
          relevantFiles.push(f);
        }
      }
      break;

    case 'type_error':
    case 'parse_error':
      // Include the workflow agent (most complex, most likely source)
      for (const f of codebase.agents) {
        if (f.path.includes('workflow-agent')) relevantFiles.push(f);
      }
      break;

    case 'timeout':
      // Include supabase-query + api-monitor
      for (const f of codebase.tools) {
        if (f.path.includes('supabase-query') || f.path.includes('api-monitor')) {
          relevantFiles.push(f);
        }
      }
      break;
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = relevantFiles.filter(f => {
    if (seen.has(f.path)) return false;
    seen.add(f.path);
    return true;
  });

  // Build context string
  const parts: string[] = [];
  for (const f of unique) {
    parts.push(`--- ${f.path} (${f.lineCount} lines) ---`);
    parts.push(f.content);
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Build the complete prompt context for the Agent Programmer
 */
export function buildPromptContext(errors: ErrorPattern[], codebase: AgentCodebase): string {
  const parts: string[] = [];

  // 1. Codebase overview
  parts.push('## Codebase oversigt');
  parts.push(getCodebaseSummary(codebase));
  parts.push('');

  // 2. Error patterns (max 5 most important)
  const topErrors = errors.slice(0, 5);
  parts.push(`## Fejl fundet (${errors.length} total, viser top ${topErrors.length})`);
  parts.push('');

  for (let i = 0; i < topErrors.length; i++) {
    const err = topErrors[i];
    parts.push(`### Fejl ${i + 1}: [${err.severity.toUpperCase()}] ${err.errorType} (${err.frequency}x)`);
    parts.push(`Besked: ${err.message}`);
    if (err.affectedFile) parts.push(`Fil: ${err.affectedFile}`);
    if (err.affectedFunction) parts.push(`Funktion: ${err.affectedFunction}`);
    if (err.stackTrace) parts.push(`Stack: ${err.stackTrace.substring(0, 300)}`);
    parts.push(`Foerste gang: ${err.firstSeen}`);
    parts.push(`Seneste: ${err.lastSeen}`);
    parts.push('');
  }

  // 3. Relevant source code for top errors
  parts.push('## Relevant kildekode');
  parts.push('');

  const includedFiles = new Set<string>();
  for (const err of topErrors) {
    const context = getRelevantContext(err, codebase);
    // Only include files we haven't already included
    const contextFiles = context.split('---').filter(s => s.includes('.ts'));
    for (const cf of contextFiles) {
      const fileMatch = cf.match(/(src\/[\w/.-]+\.ts)/);
      if (fileMatch && !includedFiles.has(fileMatch[1])) {
        includedFiles.add(fileMatch[1]);
      }
    }
  }

  // Include full content for relevant files (max 5 files to avoid token overflow)
  const allFiles = [...codebase.agents, ...codebase.tools, ...codebase.hooks];
  if (codebase.config) allFiles.push(codebase.config);

  let fileCount = 0;
  for (const f of allFiles) {
    if (fileCount >= 5) break;
    const isRelevant = Array.from(includedFiles).some(inc => f.path.includes(inc) || inc.includes(basename(f.path, '.ts')));
    if (isRelevant) {
      parts.push(`--- ${f.path} ---`);
      // For very large files, truncate
      if (f.lineCount > 300) {
        const lines = f.content.split('\n');
        parts.push(lines.slice(0, 50).join('\n'));
        parts.push(`\n... [${f.lineCount - 100} linjer udeladt] ...\n`);
        parts.push(lines.slice(-50).join('\n'));
      } else {
        parts.push(f.content);
      }
      parts.push('');
      fileCount++;
    }
  }

  return parts.join('\n');
}

/**
 * Find files that import from a given module
 */
export function findDependents(moduleName: string, codebase: AgentCodebase): FileContext[] {
  const allFiles = [...codebase.agents, ...codebase.tools, ...codebase.hooks];
  if (codebase.config) allFiles.push(codebase.config);
  if (codebase.main) allFiles.push(codebase.main);

  return allFiles.filter(f =>
    f.imports.some(imp => imp.includes(moduleName))
  );
}

/**
 * Get the import graph for the codebase
 */
export function getImportGraph(codebase: AgentCodebase): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  const allFiles = [...codebase.agents, ...codebase.tools, ...codebase.hooks];
  if (codebase.config) allFiles.push(codebase.config);
  if (codebase.main) allFiles.push(codebase.main);

  for (const f of allFiles) {
    graph[basename(f.path, '.ts')] = f.imports
      .filter(imp => imp.startsWith('.') || imp.startsWith('../'))
      .map(imp => {
        const parts = imp.split('/');
        return parts[parts.length - 1].replace('.js', '');
      });
  }

  return graph;
}

// ── Standalone execution ─────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Code Analyzer (standalone test)...\n');

  const codebase = loadAgentCodebase();
  console.log(getCodebaseSummary(codebase));
  console.log('\n## Import Graph:');
  console.log(JSON.stringify(getImportGraph(codebase), null, 2));
  process.exit(0);
}
