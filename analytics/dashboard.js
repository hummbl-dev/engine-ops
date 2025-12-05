// Analytics Dashboard JavaScript

const API_BASE = 'http://localhost:3000';
let durationChart, typeChart;
let socket;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  initializeCharts();
  connectWebSocket();
  fetchMetrics();
  setInterval(fetchMetrics, 5000); // Update every 5 seconds
});

// Initialize Chart.js charts
function initializeCharts() {
  const durationCtx = document.getElementById('duration-chart').getContext('2d');
  durationChart = new Chart(durationCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Duration (ms)',
          data: [],
          borderColor: '#4f46e5',
          backgroundColor: 'rgba(79, 70, 229, 0.1)',
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
    },
  });

  const typeCtx = document.getElementById('type-chart').getContext('2d');
  typeChart = new Chart(typeCtx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

// Connect to WebSocket
function connectWebSocket() {
  socket = io(API_BASE);

  socket.on('connect', () => {
    updateConnectionStatus(true);
  });

  socket.on('disconnect', () => {
    updateConnectionStatus(false);
  });

  socket.on('optimization:complete', (data) => {
    console.log('Optimization complete:', data);
    fetchMetrics(); // Refresh metrics
  });
}

// Update connection status
function updateConnectionStatus(connected) {
  const statusIndicator = document.getElementById('connection-status');
  const statusText = document.getElementById('connection-text');

  if (connected) {
    statusIndicator.style.color = '#10b981';
    statusText.textContent = 'Connected';
  } else {
    statusIndicator.style.color = '#ef4444';
    statusText.textContent = 'Disconnected';
  }
}

// Fetch metrics from API
async function fetchMetrics() {
  try {
    const response = await fetch(`${API_BASE}/api/v1/metrics`);
    const data = await response.json();

    updateMetrics(data);
    updateCharts(data);
    updateRecentRequests(data.recent || []);
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
  }
}

// Update metric cards
function updateMetrics(data) {
  const { aggregated } = data;

  document.getElementById('total-requests').textContent = aggregated.totalRequests || 0;
  document.getElementById('cache-hit-rate').textContent =
    `${((aggregated.cacheHitRate || 0) * 100).toFixed(1)}%`;
  document.getElementById('avg-duration').textContent =
    `${(aggregated.averageDurationMs || 0).toFixed(0)}ms`;
  document.getElementById('p95-duration').textContent =
    `${(aggregated.p95DurationMs || 0).toFixed(0)}ms`;
}

// Update charts
function updateCharts(data) {
  const { aggregated, recent } = data;

  // Update duration chart
  if (recent && recent.length > 0) {
    durationChart.data.labels = recent.map((_, i) => `${i + 1}`);
    durationChart.data.datasets[0].data = recent.map((r) => r.durationMs);
    durationChart.update();
  }

  // Update type chart
  if (aggregated.requestsByType) {
    typeChart.data.labels = Object.keys(aggregated.requestsByType);
    typeChart.data.datasets[0].data = Object.values(aggregated.requestsByType);
    typeChart.update();
  }
}

// Update recent requests table
function updateRecentRequests(recent) {
  const tbody = document.querySelector('#recent-requests tbody');
  tbody.innerHTML = '';

  recent.forEach((req) => {
    const row = tbody.insertRow();
    row.insertCell(0).textContent = req.requestId;
    row.insertCell(1).textContent = req.type;
    row.insertCell(2).textContent = `${req.durationMs}ms`;
    row.insertCell(3).textContent = req.cacheHit ? '✓' : '✗';
    row.insertCell(4).textContent = new Date(req.timestamp).toLocaleTimeString();
  });
}
