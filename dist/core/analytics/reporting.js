'use strict';
/**
 * Reporting Module
 *
 * Generates automated reports for cost and usage.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.ReportGenerator = void 0;
class ReportGenerator {
  /**
   * Generate a cost report
   */
  generateReport(estimate, recommendations, config) {
    if (config.format === 'json') {
      return JSON.stringify({ estimate, recommendations }, null, 2);
    }
    if (config.format === 'html') {
      return `
        <html>
          <body>
            <h1>Cost Report</h1>
            <p>Total Cost: ${estimate.currency} ${estimate.totalCost}</p>
            <ul>
              <li>CPU: ${estimate.cpuCost}</li>
              <li>Memory: ${estimate.memoryCost}</li>
              <li>Storage: ${estimate.storageCost}</li>
            </ul>
            ${config.includeRecommendations ? this.renderHtmlRecommendations(recommendations) : ''}
          </body>
        </html>
      `;
    }
    // Default to text
    let report = `COST REPORT\n===========\n`;
    report += `Total Cost: ${estimate.currency} ${estimate.totalCost}\n`;
    report += `Breakdown:\n`;
    report += `  - CPU: ${estimate.cpuCost}\n`;
    report += `  - Memory: ${estimate.memoryCost}\n`;
    report += `  - Storage: ${estimate.storageCost}\n`;
    if (config.includeRecommendations && recommendations.length > 0) {
      report += `\nRECOMMENDATIONS\n===============\n`;
      recommendations.forEach((rec) => {
        report += `[${rec.severity.toUpperCase()}] ${rec.message} (Savings: ${rec.estimatedSavings})\n`;
      });
    }
    return report;
  }
  renderHtmlRecommendations(recommendations) {
    if (recommendations.length === 0) return '';
    return `
      <h2>Recommendations</h2>
      <ul>
        ${recommendations.map((rec) => `<li><strong>${rec.severity.toUpperCase()}</strong>: ${rec.message}</li>`).join('')}
      </ul>
    `;
  }
}
exports.ReportGenerator = ReportGenerator;
