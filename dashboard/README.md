# Admin Dashboard

Real-time monitoring dashboard for Engine Ops SREs.

## Features

- **📊 Metrics Visualization** - Request rate, latency (p95), error rate
- **🚨 Anomaly Alerts** - AI-detected issues with remediation suggestions
- **💚 System Health** - API, cache, database status monitoring
- **🔄 Auto-Refresh** - Real-time updates every 10 seconds

## Tech Stack

- Pure HTML/CSS/JavaScript (no framework)
- Chart.js for visualizations
- Prometheus metrics integration

## Running Locally

```bash
cd dashboard
npm start
# Dashboard: http://localhost:3001
```

**Backend Required:** Ensure Engine Ops API is running on port 3000 for live data.

## File Structure

- `public/index.html` - Main dashboard layout
- `public/styles.css` - Premium dark mode styling
- `public/app.js` - Data fetching and chart rendering
- `package.json` - http-server configuration

## UI Design

- Dark mode with purple/blue gradients
- Card-based layout with micro-animations
- Responsive grid adapting to screen size
- Deep links to playbooks from anomaly cards
