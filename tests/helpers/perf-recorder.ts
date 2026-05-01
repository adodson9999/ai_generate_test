import fs from 'fs';
import path from 'path';

export type PerfSample = {
  operationId: string;
  path: string;
  method: string;
  latencyMs: number;
  timestamp: number;
};

export type PerfRunResult = {
  runId: string;
  timestamp: string;
  samples: PerfSample[];
};

const samples: PerfSample[] = [];

export function recordSample(operationId: string, apiPath: string, method: string, latencyMs: number) {
  samples.push({ operationId, path: apiPath, method, latencyMs, timestamp: Date.now() });
}

export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function flushResults(runId?: string): PerfRunResult {
  const id = runId || new Date().toISOString().replace(/[:.]/g, '-');
  const result: PerfRunResult = {
    runId: id,
    timestamp: new Date().toISOString(),
    samples: [...samples]
  };

  const dir = path.resolve(__dirname, '../../perf-results');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${id}.json`), JSON.stringify(result, null, 2));

  samples.length = 0; // clear
  return result;
}
