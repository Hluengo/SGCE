import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const host = process.env.LH_HOST ?? '127.0.0.1';
const appPort = Number(process.env.LH_PORT ?? '4173');
const chromeDebugPort = Number(process.env.LH_CHROME_PORT ?? '9222');
const cliRoutesArg = process.argv.find((arg) => arg.startsWith('--routes='));
const cliRoutes = cliRoutesArg ? cliRoutesArg.replace('--routes=', '') : null;
const cliMinArg = process.argv.find((arg) => arg.startsWith('--min-performance='));
const cliMin = cliMinArg ? cliMinArg.replace('--min-performance=', '') : null;
const cliRunsArg = process.argv.find((arg) => arg.startsWith('--runs='));
const cliRuns = cliRunsArg ? Number(cliRunsArg.replace('--runs=', '')) : null;
const routes = (cliRoutes ?? process.env.LH_ROUTES ?? '/auth?next=%2F')
  .split(',')
  .map((route) => route.trim())
  .filter(Boolean);
const threshold = Number(cliMin ?? process.env.LH_MIN_PERFORMANCE ?? '90');
const runsPerRoute = Math.max(1, Number(cliRuns ?? process.env.LH_RUNS ?? '1'));
const reportDir = resolve('playwright', 'lighthouse');
const chromePath = process.env.CHROME_PATH ?? chromium.executablePath();
const chromeProfileDir = resolve(reportDir, `.chrome-profile-${Date.now()}`);

mkdirSync(reportDir, { recursive: true });
mkdirSync(chromeProfileDir, { recursive: true });

function wait(ms) {
  return new Promise((resolveWait) => setTimeout(resolveWait, ms));
}

async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      // no-op
    }
    await wait(1000);
  }
  throw new Error(`Timeout esperando servidor en ${url}`);
}

function startPreviewServer() {
  if (process.platform === 'win32') {
    return spawn(
      'cmd.exe',
      ['/c', 'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort'],
      { stdio: 'inherit', env: { ...process.env } }
    );
  }

  return spawn(
    'npm',
    ['run', 'preview', '--', '--host', host, '--port', String(appPort), '--strictPort'],
    { stdio: 'inherit', env: { ...process.env } }
  );
}

function startChrome() {
  return spawn(
    chromePath,
    [
      `--remote-debugging-port=${chromeDebugPort}`,
      `--user-data-dir=${chromeProfileDir}`,
      '--headless=new',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-features=TranslateUI',
      'about:blank'
    ],
    { stdio: 'ignore', env: { ...process.env } }
  );
}

function runLighthouse() {
  const results = [];

  for (const route of routes) {
    const targetUrl = `http://${host}:${appPort}${route}`;
    const safeRoute = route
      .replace(/[^\w-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();
    const routeKey = safeRoute || 'root';

    for (let run = 1; run <= runsPerRoute; run += 1) {
      const reportBase = resolve(
        reportDir,
        runsPerRoute > 1 ? `mobile-${routeKey}-run${run}` : `mobile-${routeKey}`
      );

      const lighthouseArgs = [
        'lighthouse',
        targetUrl,
        `--port=${chromeDebugPort}`,
        '--quiet',
        '--output=json',
        '--output=html',
        `--output-path=${reportBase}`,
        '--only-categories=performance,accessibility,best-practices,seo'
      ];

      const command = process.platform === 'win32'
        ? ['cmd.exe', ['/c', 'npx', ...lighthouseArgs]]
        : ['npx', lighthouseArgs];

      const result = spawnSync(command[0], command[1], {
        stdio: 'inherit',
        env: { ...process.env, CHROME_PATH: chromePath }
      });

      if (result.error) {
        throw result.error;
      }
      if (result.status !== 0) {
        throw new Error(`Lighthouse falló con exit code ${result.status ?? 'desconocido'}`);
      }

      results.push({ route, targetUrl, reportBase, run });
    }
  }

  return results;
}

function validateScores(results) {
  const byRoute = new Map();

  for (const result of results) {
    const items = byRoute.get(result.route) ?? [];
    items.push(result);
    byRoute.set(result.route, items);
  }

  for (const [route, routeRuns] of byRoute.entries()) {
    const runScores = [];
    for (const result of routeRuns) {
      const reportPath = `${result.reportBase}.report.json`;
      const report = JSON.parse(readFileSync(reportPath, 'utf-8'));
      const categories = report.categories ?? {};
      const scores = {
        performance: Math.round((categories.performance?.score ?? 0) * 100),
        accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
        seo: Math.round((categories.seo?.score ?? 0) * 100)
      };

      runScores.push(scores);
      console.log('[lighthouse-mobile] URL:', result.targetUrl, `(run ${result.run})`);
      console.log('[lighthouse-mobile] Scores:', scores);
      console.log('[lighthouse-mobile] HTML:', `${result.reportBase}.report.html`);
      console.log('[lighthouse-mobile] JSON:', reportPath);
    }

    const perfValues = runScores.map((score) => score.performance).sort((a, b) => a - b);
    const medianPerf = perfValues[Math.floor(perfValues.length / 2)];
    console.log('[lighthouse-mobile] Route median performance:', route, medianPerf, `(runs=${runScores.length})`);

    if (medianPerf < threshold) {
      throw new Error(`Performance móvil mediana ${medianPerf} < ${threshold} en ${route}`);
    }
  }
}

function terminate(proc) {
  if (!proc?.pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(proc.pid), '/t', '/f'], { stdio: 'ignore' });
    return;
  }
  proc.kill('SIGTERM');
}

const previewProc = startPreviewServer();
const chromeProc = startChrome();

try {
  await waitForServer(`http://${host}:${appPort}/`);
  await wait(1200);
  const results = runLighthouse();
  validateScores(results);
} finally {
  terminate(chromeProc);
  terminate(previewProc);
  try {
    rmSync(chromeProfileDir, { recursive: true, force: true });
  } catch {
    // On Windows, profile files can remain briefly locked by Chrome.
  }
}
