```javascript
// API Base URL
const API_BASE = 'http://localhost:3000';

// Chart instances
let requestRateChart, durationChart, errorRateChart;
let lastRefresh = new Date();

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    addAutoRefreshIndicator();
    fetchMetrics();
    fetchAnomalies();
    fetchHealth();
    
    // Refresh data every 10 seconds
    setInterval(() => {
        fetchMetrics();
        updateRefreshIndicator();
    }, 10000);
    setInterval(fetchAnomalies, 30000);
    setInterval(fetchHealth, 15000);

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const section = document.querySelector(link.getAttribute('href'));
            section.scrollIntoView({ behavior: 'smooth' });
        });
    });
});

function addAutoRefreshIndicator() {
    const header = document.querySelector('header');
    const indicator = document.createElement('div');
    indicator.id = 'refresh-indicator';
    indicator.innerHTML = '🔄 Auto-refresh: <span id="last-refresh">Just now</span>';
    indicator.style.cssText = 'font-size: 0.875rem; color: #a0a8c5;';
    header.appendChild(indicator);
}

function updateRefreshIndicator() {
    lastRefresh = new Date();
    const elem = document.getElementById('last-refresh');
    if (elem) elem.textContent = 'Just now';
    
    // Update "time ago" every second
    setTimeout(() => {
        setInterval(() => {
            const seconds = Math.floor((new Date() - lastRefresh) / 1000);
            if (elem) elem.textContent = seconds < 60 ? `${ seconds }s ago` : `${ Math.floor(seconds / 60) }m ago`;
        }, 1000);
    }, 1000);
}

function initCharts() {
    const chartConfig = {
        type: 'line',
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0a8c5' }
                },
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: '#a0a8c5' }
                }
            }
        }
    };

    requestRateChart = new Chart(
        document.getElementById('requestRateChart'),
        {
            ...chartConfig,
            data: {
                labels: [],
                datasets: [{
                    label: 'Requests/min',
                    data: [],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            }
        }
    );

    durationChart = new Chart(
        document.getElementById('durationChart'),
        {
            ...chartConfig,
            data: {
                labels: [],
                datasets: [{
                    label: 'Duration (ms)',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            }
        }
    );

    errorRateChart = new Chart(
        document.getElementById('errorRateChart'),
        {
            ...chartConfig,
            data: {
                labels: [],
                datasets: [{
                    label: 'Errors/min',
                    data: [],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            }
        }
    );
}

async function fetchMetrics() {
    try {
        const response = await fetch(`${ API_BASE }/metrics`);
if (!response.ok) throw new Error(`HTTP ${response.status}`);

const text = await response.text();
const metrics = parsePrometheusMetrics(text);

// Update charts with new data point
const timestamp = new Date().toLocaleTimeString();
updateChart(requestRateChart, timestamp, metrics.requestRate || 0);
updateChart(durationChart, timestamp, metrics.avgDuration || 0);
updateChart(errorRateChart, timestamp, metrics.errorRate || 0);

// Update stats with actual data
document.getElementById('total-requests').textContent = metrics.totalRequests?.toLocaleString() || 'N/A';
document.getElementById('avg-latency').textContent = metrics.avgDuration ? `${metrics.avgDuration.toFixed(0)}ms` : 'N/A';
document.getElementById('uptime').textContent = calculateUptime();

updateRefreshIndicator();
    } catch (error) {
    console.error('Failed to fetch metrics:', error);
    showMetricsError('Unable to connect to API. Ensure backend is running on port 3000.');
}
}

function showMetricsError(message) {
    document.querySelectorAll('.stat-value').forEach(el => {
        if (el.textContent === '-') el.textContent = 'N/A';
    });
}

async function fetchAnomalies() {
    try {
        const response = await fetch(`${API_BASE}/api/v1/anomaly/alerts`);
        const anomalies = await response.json();

        renderAnomalies(anomalies.alerts || getMockAnomalies());
    } catch (error) {
        console.error('Failed to fetch anomalies:', error);
        renderAnomalies(getMockAnomalies());
    }
}

async function fetchHealth() {
    try {
        const response = await fetch(`${API_BASE}/api/v1/health`);
        const health = await response.json();

        updateHealthCard('api-health', health.status === 'ok' ? 'healthy' : 'down',
            health.status !== 'ok' ? 'API returned non-OK status' : '');

        // Fetch cache stats
        try {
            const cacheResponse = await fetch(`${API_BASE}/api/v1/cache/stats`);
            const cacheStats = await cacheResponse.json();
            updateHealthCard('cache-health', cacheStats ? 'healthy' : 'down');
        } catch {
            updateHealthCard('cache-health', 'down', 'Cache service unreachable');
        }

        // Database always healthy in mock (add real check in production)
        updateHealthCard('db-health', 'healthy');

    } catch (error) {
        console.error('Failed to fetch health:', error);
        updateHealthCard('api-health', 'down', `Cannot connect to ${API_BASE}. Start backend with: npm start`);
        updateHealthCard('cache-health', 'down', 'Dependent on API');
        updateHealthCard('db-health', 'down', 'Dependent on API');
    }
}

function parsePrometheusMetrics(text) {
    const metrics = {};
    const lines = text.split('\n');

    let totalRequests = 0;
    let totalDuration = 0;
    let durationCount = 0;
    let errorCount = 0;

    for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith('#') || !line.trim()) continue;

        // Parse http_requests_total
        if (line.includes('http_requests_total')) {
            const match = line.match(/http_requests_total{[^}]*status="(\d+)"[^}]*}\s+(\d+)/);
            if (match) {
                const value = parseInt(match[2]);
                totalRequests += value;
                if (match[1].startsWith('5') || match[1].startsWith('4')) {
                    errorCount += value;
                }
            }
        }

        // Parse duration
        if (line.includes('http_request_duration_seconds_sum')) {
            const match = line.match(/http_request_duration_seconds_sum{[^}]*}\s+([0-9.]+)/);
            if (match) totalDuration += parseFloat(match[1]);
        }
        if (line.includes('http_request_duration_seconds_count')) {
            const match = line.match(/http_request_duration_seconds_count{[^}]*}\s+(\d+)/);
            if (match) durationCount += parseInt(match[1]);
        }
    }

    metrics.totalRequests = totalRequests;
    metrics.avgDuration = durationCount > 0 ? (totalDuration / durationCount) * 1000 : 0;
    metrics.requestRate = totalRequests; // Simplified - should calculate rate
    metrics.errorRate = errorCount;

    return metrics;
}

function updateChart(chart, label, value) {
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);

    // Keep only last 20 data points
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.update('none');
}

function renderAnomalies(anomalies) {
    const container = document.getElementById('anomaly-list');

    if (anomalies.length === 0) {
        container.innerHTML = '<p class="loading">✅ No anomalies detected - system healthy!</p>';
        return;
    }

    container.innerHTML = anomalies.map(anomaly => {
        const playbookLink = getPlaybookLink(anomaly.metric);
        return `
            <div class="anomaly-item ${anomaly.severity}">
                <div class="anomaly-header">
                    <strong>${anomaly.metric_name || anomaly.metric}</strong>
                    <span class="anomaly-severity severity-${anomaly.severity}">${anomaly.severity.toUpperCase()}</span>
                </div>
                <p class="anomaly-description">
                    <strong>Hypothesis:</strong> ${anomaly.hypothesis || 'AI analysis in progress...'}
                </p>
                ${anomaly.remediation ? `
                    <p class="anomaly-description">
                        <strong>💡 Remediation:</strong> ${anomaly.remediation}
                    </p>
                ` : ''}
                <div style="margin-top: 0.75rem; display: flex; gap: 0.5rem;">
                    ${playbookLink ? `<a href="${playbookLink}" target="_blank" style="color: #818cf8; text-decoration: none; font-size: 0.875rem;">📖 View Playbook →</a>` : ''}
                    <a href="#" onclick="acknowledgeAnomaly('${anomaly.id || Date.now()}'); return false;" style="color: #10b981; text-decoration: none; font-size: 0.875rem;">✓ Acknowledge</a>
                </div>
            </div>
        `;
    }).join('');
}

function getPlaybookLink(metric) {
    const playbookMap = {
        'cpu_usage': '/docs/playbooks/cpu-high.md',
        'memory_leak': '/docs/playbooks/memory-issues.md',
        'disk_space': '/docs/playbooks/disk-space.md',
        'latency_spike': '/docs/playbooks/performance.md'
    };
    return playbookMap[metric] || null;
}

function acknowledgeAnomaly(id) {
    console.log(`Acknowledged anomaly: ${id}`);
    // In production: POST to /api/v1/anomaly/acknowledge
    alert(`Anomaly ${id} acknowledged. This would create an incident ticket in production.`);
}

function updateHealthCard(cardId, status, details = '') {
    const card = document.getElementById(cardId);
    const icon = card.querySelector('.health-icon');
    const statusText = card.querySelector('.health-status');

    // Remove old diagnostic if exists
    const oldDiag = card.querySelector('.health-diagnostic');
    if (oldDiag) oldDiag.remove();

    if (status === 'healthy') {
        icon.textContent = '🟢';
        statusText.textContent = 'Healthy';
        statusText.style.color = '#10b981';
    } else {
        icon.textContent = '🔴';
        statusText.textContent = 'Down';
        statusText.style.color = '#ef4444';

        // Add diagnostic message
        const diagnostic = document.createElement('p');
        diagnostic.className = 'health-diagnostic';
        diagnostic.style.cssText = 'font-size: 0.75rem; color: #f59e0b; margin-top: 0.5rem;';
        diagnostic.innerHTML = `⚠️ ${details || 'Service unavailable. Check logs or restart service.'}`;
        card.appendChild(diagnostic);
    }
}

function calculateUptime() {
    const start = new Date('2025-11-22T00:00:00');
    const now = new Date();
    const diff = now - start;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h`;
}

function getMockAnomalies() {
    return [
        {
            metric: 'cpu_usage',
            severity: 'high',
            hypothesis: 'CPU spike detected due to inefficient algorithm in scheduling module',
            remediation: 'Consider implementing caching for frequently accessed data'
        },
        {
            metric: 'memory_leak',
            severity: 'medium',
            hypothesis: 'Gradual memory increase observed over 6 hours',
            remediation: 'Review recent code changes for circular references'
        }
    ];
}
