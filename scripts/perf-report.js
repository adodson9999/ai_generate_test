const fs = require('fs');
const path = require('path');

const resultsDir = path.resolve(__dirname, '../perf-results');

if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json')).sort();

if (files.length === 0) {
  const html = '<!DOCTYPE html><html><body><h1>Performance Trend</h1><p>No history yet. Run <code>npm run test:perf</code> to generate data.</p></body></html>';
  fs.writeFileSync(path.join(resultsDir, 'trend.html'), html);
  console.log('No perf data found. Wrote placeholder trend.html');
  process.exit(0);
}

const runs = files.map(f => JSON.parse(fs.readFileSync(path.join(resultsDir, f), 'utf8'))).slice(-30);
const operationIds = [...new Set(runs.flatMap(r => r.samples.map(s => s.operationId)))];

const datasets = operationIds.map((opId, idx) => {
  const colors = ['#FF6384','#36A2EB','#FFCE56','#4BC0C0','#9966FF','#FF9F40'];
  const color = colors[idx % colors.length];
  const data = runs.map(run => {
    const raw = run.samples.filter(s => s.operationId === opId).map(s => s.latencyMs);
    if (raw.length === 0) return null;
    const measured = raw.slice(5).sort((a,b) => a-b);
    if (measured.length === 0) return null;
    const p95idx = Math.ceil(0.95 * measured.length) - 1;
    return Number(measured[Math.max(0, p95idx)].toFixed(0));
  });
  return { label: opId, data, borderColor: color, backgroundColor: color + '33', fill: false, tension: 0.3 };
});

const labels = runs.map((r, i) => 'Run ' + (i + 1));

const html = [
  '<!DOCTYPE html>',
  '<html>',
  '<head>',
  '  <title>Performance Trend</title>',
  '  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"></script>',
  '  <style>body{font-family:system-ui;margin:2rem;background:#1a1a2e;color:#e0e0e0}canvas{max-width:900px;margin:0 auto;display:block}h1{text-align:center;color:#e94560}</style>',
  '</head>',
  '<body>',
  '  <h1>API Performance Trend (p95 latency, ms)</h1>',
  '  <canvas id="chart"></canvas>',
  '  <script>',
  '    new Chart(document.getElementById("chart"), {',
  '      type: "line",',
  '      data: { labels: ' + JSON.stringify(labels) + ', datasets: ' + JSON.stringify(datasets) + ' },',
  '      options: {',
  '        scales: { y: { beginAtZero: true, title: { display: true, text: "p95 (ms)", color: "#e0e0e0" }, grid: { color: "#333" }, ticks: { color: "#e0e0e0" } }, x: { grid: { color: "#333" }, ticks: { color: "#e0e0e0" } } },',
  '        plugins: { legend: { labels: { color: "#e0e0e0" } } }',
  '      }',
  '    });',
  '  </script>',
  '</body>',
  '</html>'
].join('\n');

fs.writeFileSync(path.join(resultsDir, 'trend.html'), html);
console.log('Wrote trend.html with ' + runs.length + ' runs and ' + operationIds.length + ' endpoints.');
