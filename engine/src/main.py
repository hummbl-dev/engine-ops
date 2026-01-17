import os
import re
from enum import Enum
from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from .adapter import generate_advice, generate_multi_advice, CouncilMember as AdapterCouncilMember
from .prompt_packs import (
    get_all_prompt_packs,
    get_prompt_pack,
    get_prompt_packs_by_category,
    get_pack_categories,
    search_prompts,
    get_featured_prompts,
    PromptCategory
)

app = FastAPI(
    title="HUMMBL Sovereign Engine",
    docs_url=None,  # Disable default docs to use custom route
    redoc_url=None
)


# -----------------------------------------------------------------------------
# Health & Monitoring Endpoints
# -----------------------------------------------------------------------------

@app.get("/health", tags=["Monitoring"])
async def health_check():
    """Health check endpoint for K8s readiness/liveness probes."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": "2025-11-25"
    }

@app.get("/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint."""
    from agentic_workflow.monitoring import get_metrics
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content=get_metrics())

# -----------------------------------------------------------------------------
# End Monitoring
# -----------------------------------------------------------------------------


# Serve static files (CSS)
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Override Swagger UI to inject Matrix theme
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """
    Custom Swagger UI with Matrix theme injection.
    """
    from fastapi.openapi.docs import get_swagger_ui_html
    
    html_response = get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{app.title} - Matrix Interface",
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css",
    )
    
    # Get the HTML content
    html_content = html_response.body.decode('utf-8')
    
    # Inject Matrix theme CSS
    matrix_css_injection = """
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        
        :root {
            --matrix-green: #00ff41;
            --matrix-dark-green: #00cc33;
            --matrix-bg: #000000;
            --matrix-bg-secondary: #0a0a0a;
            --matrix-border: #003300;
            --matrix-text: #00ff41;
            --matrix-text-dim: #00cc33;
            --matrix-error: #ff0040;
            --matrix-warning: #ffaa00;
            
            /* Theme intensity variables - Default to medium */
            --glow-intensity: 0.6;
            --rain-opacity: 0.02;
            --text-shadow-intensity: 0.6;
        }
        
        /* Theme intensity presets - Use html selector for higher specificity than :root */
        html.theme-subtle {
            --glow-intensity: 0.2 !important;
            --rain-opacity: 0.005 !important;
            --text-shadow-intensity: 0.2 !important;
        }
        
        html.theme-subtle * {
            --glow-intensity: 0.2 !important;
            --rain-opacity: 0.005 !important;
            --text-shadow-intensity: 0.2 !important;
        }
        
        html.theme-medium {
            --glow-intensity: 0.6 !important;
            --rain-opacity: 0.02 !important;
            --text-shadow-intensity: 0.6 !important;
        }
        
        html.theme-medium * {
            --glow-intensity: 0.6 !important;
            --rain-opacity: 0.02 !important;
            --text-shadow-intensity: 0.6 !important;
        }
        
        html.theme-intense {
            --glow-intensity: 1.5 !important;
            --rain-opacity: 0.08 !important;
            --text-shadow-intensity: 1.5 !important;
        }
        
        html.theme-intense * {
            --glow-intensity: 1.5 !important;
            --rain-opacity: 0.08 !important;
            --text-shadow-intensity: 1.5 !important;
        }
        
        * {
            font-family: 'JetBrains Mono', 'Courier New', monospace !important;
        }
        
        body {
            background: var(--matrix-bg) !important;
            color: var(--matrix-text) !important;
            font-family: 'JetBrains Mono', monospace !important;
        }
        
        .swagger-ui {
            background: var(--matrix-bg) !important;
            color: var(--matrix-text) !important;
        }
        
        .swagger-ui .topbar,
        .swagger-ui .info .title,
        .swagger-ui h1,
        .swagger-ui h2,
        .swagger-ui h3,
        .swagger-ui h4 {
            color: var(--matrix-green) !important;
            text-shadow: 
                0 0 calc(10px * var(--text-shadow-intensity, 0.7)) var(--matrix-green), 
                0 0 calc(20px * var(--text-shadow-intensity, 0.7)) var(--matrix-green) !important;
            transition: text-shadow 0.3s ease !important;
            font-weight: 700 !important;
        }
        
        .swagger-ui a {
            color: var(--matrix-green) !important;
            text-decoration: none !important;
        }
        
        .swagger-ui a:hover {
            color: var(--matrix-dark-green) !important;
            text-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        .swagger-ui .btn {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-green) !important;
            color: var(--matrix-green) !important;
            font-family: 'JetBrains Mono', monospace !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
            transition: all 0.3s ease !important;
        }
        
        .swagger-ui .btn:hover {
            background: var(--matrix-green) !important;
            color: var(--matrix-bg) !important;
            box-shadow: 0 0 calc(10px * var(--glow-intensity, 0.7)) var(--matrix-green) !important;
            transition: box-shadow 0.3s ease !important;
        }
        
        .swagger-ui .btn.execute {
            background: var(--matrix-green) !important;
            color: var(--matrix-bg) !important;
            border: 1px solid var(--matrix-green) !important;
        }
        
        .swagger-ui .btn.execute:hover {
            background: var(--matrix-dark-green) !important;
            box-shadow: 0 0 calc(15px * var(--glow-intensity, 0.7)) var(--matrix-green) !important;
            transition: box-shadow 0.3s ease !important;
        }
        
        .swagger-ui pre,
        .swagger-ui code,
        .swagger-ui .microlight,
        .swagger-ui .highlight-code {
            background: var(--matrix-bg-secondary) !important;
            color: var(--matrix-green) !important;
            border: 1px solid var(--matrix-border) !important;
            font-family: 'JetBrains Mono', monospace !important;
            text-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        .swagger-ui .opblock {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
            border-left: 3px solid var(--matrix-green) !important;
        }
        
        /* HTTP Method Buttons - Matrix Style */
        .swagger-ui .opblock.opblock-post .opblock-summary-method {
            background: var(--matrix-green) !important;
            color: var(--matrix-bg) !important;
            border: 1px solid var(--matrix-green) !important;
            text-shadow: none !important;
            box-shadow: 0 0 10px var(--matrix-green) !important;
        }
        
        .swagger-ui .opblock.opblock-get .opblock-summary-method {
            background: var(--matrix-dark-green) !important;
            color: var(--matrix-bg) !important;
            border: 1px solid var(--matrix-dark-green) !important;
            text-shadow: none !important;
            box-shadow: 0 0 10px var(--matrix-dark-green) !important;
        }
        
        .swagger-ui .opblock.opblock-put .opblock-summary-method,
        .swagger-ui .opblock.opblock-delete .opblock-summary-method,
        .swagger-ui .opblock.opblock-patch .opblock-summary-method {
            background: var(--matrix-bg-secondary) !important;
            color: var(--matrix-green) !important;
            border: 1px solid var(--matrix-green) !important;
            box-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        .swagger-ui .opblock.opblock-post {
            border-left-color: var(--matrix-green) !important;
        }
        
        .swagger-ui .opblock.opblock-get {
            border-left-color: var(--matrix-dark-green) !important;
        }
        
        /* Expandable/Collapsible Elements */
        .swagger-ui .opblock-summary {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .opblock-summary:hover {
            background: var(--matrix-bg) !important;
            border-color: var(--matrix-green) !important;
            box-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        .swagger-ui .opblock-summary-path,
        .swagger-ui .opblock-summary-description {
            color: var(--matrix-green) !important;
            text-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        /* Expand/Collapse Icons */
        .swagger-ui .opblock-summary-control {
            color: var(--matrix-green) !important;
        }
        
        .swagger-ui .arrow {
            border-color: var(--matrix-green) !important;
            border-width: 2px 2px 0 0 !important;
        }
        
        /* Chevron/Expand icons - Matrix green */
        .swagger-ui .opblock-summary-control svg,
        .swagger-ui .model-box-control svg,
        .swagger-ui .arrow {
            fill: var(--matrix-green) !important;
            color: var(--matrix-green) !important;
        }
        
        /* Schema section - Matrix theme */
        .swagger-ui .model-box {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
            border-left: 3px solid var(--matrix-green) !important;
            color: var(--matrix-text) !important;
        }
        
        .swagger-ui .model-box:hover {
            border-left-color: var(--matrix-green) !important;
            box-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        .swagger-ui .model-box-control {
            color: var(--matrix-green) !important;
        }
        
        .swagger-ui .model-title {
            color: var(--matrix-green) !important;
            text-shadow: 0 0 5px var(--matrix-green) !important;
            font-weight: 700 !important;
        }
        
        .swagger-ui .model-title__text {
            color: var(--matrix-green) !important;
        }
        
        .swagger-ui .model-jump-to-path {
            color: var(--matrix-text-dim) !important;
        }
        
        .swagger-ui .prop {
            border-bottom: 1px solid var(--matrix-border) !important;
            background: var(--matrix-bg) !important;
        }
        
        .swagger-ui .prop-name {
            color: var(--matrix-green) !important;
            text-shadow: 0 0 3px var(--matrix-green) !important;
        }
        
        .swagger-ui .prop-type {
            color: var(--matrix-text-dim) !important;
        }
        
        .swagger-ui .prop-format {
            color: var(--matrix-text-dim) !important;
        }
        
        /* Schema article containers */
        .swagger-ui article.model {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui article.model:hover {
            border-color: var(--matrix-green) !important;
            box-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        /* Schema expand buttons */
        .swagger-ui article.model .model-box-control {
            color: var(--matrix-green) !important;
        }
        
        /* All text in schema blocks */
        .swagger-ui .model-box span,
        .swagger-ui .model-box div,
        .swagger-ui .model-box p {
            color: var(--matrix-text-dim) !important;
        }
        
        .swagger-ui .model-box .model-title {
            color: var(--matrix-green) !important;
        }
        
        /* Force all grey backgrounds to Matrix theme */
        .swagger-ui article,
        .swagger-ui article.model,
        .swagger-ui .model-container {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
            border-left: 3px solid var(--matrix-green) !important;
        }
        
        /* Force all grey text to Matrix green/dim */
        .swagger-ui article *,
        .swagger-ui .model-container * {
            color: var(--matrix-text-dim) !important;
        }
        
        .swagger-ui article .model-title,
        .swagger-ui article .model-title__text,
        .swagger-ui article button {
            color: var(--matrix-green) !important;
        }
        
        /* Override any remaining grey */
        .swagger-ui [class*="grey"],
        .swagger-ui [style*="grey"],
        .swagger-ui [style*="gray"] {
            background: var(--matrix-bg-secondary) !important;
            color: var(--matrix-text-dim) !important;
            border-color: var(--matrix-border) !important;
        }
        
        /* Schema expand all buttons specifically */
        .swagger-ui article button.expand-methods,
        .swagger-ui article button[class*="expand"] {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-green) !important;
            color: var(--matrix-green) !important;
        }
        
        /* All buttons in schema section */
        .swagger-ui article button {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
            color: var(--matrix-green) !important;
        }
        
        .swagger-ui article button:hover {
            background: var(--matrix-green) !important;
            color: var(--matrix-bg) !important;
            box-shadow: 0 0 10px var(--matrix-green) !important;
        }
        
        /* Expand all buttons */
        .swagger-ui .btn.expand-methods,
        .swagger-ui .btn.expand-operation {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-green) !important;
            color: var(--matrix-green) !important;
        }
        
        .swagger-ui .btn.expand-methods:hover,
        .swagger-ui .btn.expand-operation:hover {
            background: var(--matrix-green) !important;
            color: var(--matrix-bg) !important;
            box-shadow: 0 0 10px var(--matrix-green) !important;
        }
        
        /* All grey elements to Matrix theme */
        .swagger-ui .opblock-description-wrapper,
        .swagger-ui .opblock-description,
        .swagger-ui .opblock-external-docs,
        .swagger-ui .opblock-external-docs-wrapper {
            background: var(--matrix-bg-secondary) !important;
            color: var(--matrix-text) !important;
            border-color: var(--matrix-border) !important;
        }
        
        /* Grey text to Matrix green */
        .swagger-ui .opblock-description p,
        .swagger-ui .opblock-description-wrapper p,
        .swagger-ui .opblock-external-docs-wrapper p {
            color: var(--matrix-text-dim) !important;
        }
        
        /* Response/Request sections */
        .swagger-ui .responses-wrapper,
        .swagger-ui .request-body,
        .swagger-ui .parameters {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .response-col_status,
        .swagger-ui .response-col_links {
            color: var(--matrix-green) !important;
        }
        
        /* Grey badges and labels */
        .swagger-ui .parameter__type,
        .swagger-ui .parameter__in,
        .swagger-ui .model-hint {
            background: var(--matrix-bg-secondary) !important;
            color: var(--matrix-green) !important;
            border: 1px solid var(--matrix-border) !important;
        }
        
        /* Grey dividers */
        .swagger-ui .opblock-tag-section {
            border-bottom: 1px solid var(--matrix-border) !important;
        }
        
        /* Any remaining grey backgrounds */
        .swagger-ui .opblock-body pre,
        .swagger-ui .opblock-body .highlight-code {
            background: var(--matrix-bg) !important;
            border: 1px solid var(--matrix-border) !important;
        }
        
        /* Grey expandable sections */
        .swagger-ui .opblock-body {
            background: var(--matrix-bg) !important;
            border-top: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .opblock-section {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .opblock-section-header {
            background: var(--matrix-bg-secondary) !important;
            border-bottom: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .opblock-section-header label {
            color: var(--matrix-green) !important;
        }
        
        /* Grey boxes and containers */
        .swagger-ui .scheme-container {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .btn-clear {
            background: transparent !important;
            border: 1px solid var(--matrix-green) !important;
            color: var(--matrix-green) !important;
        }
        
        .swagger-ui .btn-clear:hover {
            background: var(--matrix-green) !important;
            color: var(--matrix-bg) !important;
        }
        
        .swagger-ui .opblock-tag {
            color: var(--matrix-green) !important;
            border-bottom: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui input[type="text"],
        .swagger-ui input[type="email"],
        .swagger-ui input[type="password"],
        .swagger-ui textarea,
        .swagger-ui select {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
            color: var(--matrix-green) !important;
            font-family: 'JetBrains Mono', monospace !important;
        }
        
        .swagger-ui input[type="text"]:focus,
        .swagger-ui textarea:focus,
        .swagger-ui select:focus {
            border-color: var(--matrix-green) !important;
            box-shadow: 0 0 10px var(--matrix-green) !important;
            outline: none !important;
        }
        
        .swagger-ui table thead tr th {
            background: var(--matrix-bg-secondary) !important;
            color: var(--matrix-green) !important;
            border-bottom: 2px solid var(--matrix-green) !important;
        }
        
        .swagger-ui table tbody tr td {
            background: var(--matrix-bg) !important;
            color: var(--matrix-text) !important;
            border-bottom: 1px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .response-col_status {
            color: var(--matrix-green) !important;
            font-weight: 700 !important;
        }
        
        .swagger-ui .tab li {
            border-bottom: 2px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .tab li.active {
            border-bottom-color: var(--matrix-green) !important;
        }
        
        .swagger-ui .tab li button {
            color: var(--matrix-text-dim) !important;
        }
        
        .swagger-ui .tab li.active button {
            color: var(--matrix-green) !important;
            text-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        .swagger-ui .model-box {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
            color: var(--matrix-text) !important;
        }
        
        ::-webkit-scrollbar {
            width: 12px;
            background: var(--matrix-bg) !important;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--matrix-border) !important;
            border: 2px solid var(--matrix-bg) !important;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--matrix-green) !important;
        }
        
        .swagger-ui .loading {
            border-color: var(--matrix-border) !important;
            border-top-color: var(--matrix-green) !important;
        }
        
        .swagger-ui .error {
            color: var(--matrix-error) !important;
            text-shadow: 0 0 5px var(--matrix-error) !important;
        }
        
        .swagger-ui .success {
            color: var(--matrix-green) !important;
        }
        
        .swagger-ui .topbar {
            background: var(--matrix-bg-secondary) !important;
            border-bottom: 2px solid var(--matrix-green) !important;
            box-shadow: 0 2px 10px var(--matrix-green) !important;
        }
        
        .swagger-ui .info {
            background: var(--matrix-bg-secondary) !important;
            border: 1px solid var(--matrix-border) !important;
            color: var(--matrix-text) !important;
        }
        
        .swagger-ui .info .title {
            color: var(--matrix-green) !important;
            font-size: 2em !important;
            text-shadow: 0 0 15px var(--matrix-green) !important;
        }
        
        .swagger-ui .parameters-container {
            background: var(--matrix-bg-secondary) !important;
        }
        
        .swagger-ui .parameter__name {
            color: var(--matrix-green) !important;
            font-weight: 700 !important;
        }
        
        .swagger-ui .response {
            background: var(--matrix-bg-secondary) !important;
        }
        
        .swagger-ui .response-col_description {
            color: var(--matrix-text) !important;
        }
        
        .swagger-ui .microlight {
            background: var(--matrix-bg) !important;
        }
        
        .swagger-ui .microlight code {
            color: var(--matrix-green) !important;
        }
        
        .swagger-ui .arrow {
            border-color: var(--matrix-green) !important;
        }
        
        .swagger-ui .info .title small {
            background: var(--matrix-green) !important;
            color: var(--matrix-bg) !important;
            padding: 2px 8px !important;
            border-radius: 3px !important;
        }
        
        @keyframes glitch {
            0%, 100% { text-shadow: 0 0 10px var(--matrix-green), 0 0 20px var(--matrix-green); }
            50% { text-shadow: -2px 0 var(--matrix-error), 2px 0 var(--matrix-green); }
        }
        
        .swagger-ui .info .title:hover {
            animation: glitch 0.3s infinite;
        }
        
        /* Matrix code rain effect - Performance conscious */
        body::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 255, 65, var(--rain-opacity)) 2px,
                    rgba(0, 255, 65, var(--rain-opacity)) 4px
                ),
                repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 100px,
                    rgba(0, 255, 65, calc(var(--rain-opacity) * 0.5)) 100px,
                    rgba(0, 255, 65, calc(var(--rain-opacity) * 0.5)) 102px
                );
            pointer-events: none;
            z-index: -1;
            animation: matrixRain 30s linear infinite;
            will-change: background-position;
        }
        
        @keyframes matrixRain {
            0% { background-position: 0 0, 0 0; }
            100% { background-position: 0 100vh, 100px 0; }
        }
        
        /* Matrix rain background effect (fallback) */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 255, 65, var(--rain-opacity)) 2px,
                    rgba(0, 255, 65, var(--rain-opacity)) 4px
                );
            pointer-events: none;
            z-index: -2;
            opacity: 0.3;
        }
        
        /* Terminal cursor blink effect */
        .swagger-ui code::after,
        .swagger-ui pre::after {
            content: '_';
            animation: blink 1s infinite;
            color: var(--matrix-green);
            margin-left: 2px;
        }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
        
        /* Smooth transitions for all interactive elements */
        .swagger-ui * {
            transition: background-color 0.2s ease, 
                        color 0.2s ease, 
                        border-color 0.2s ease,
                        box-shadow 0.2s ease !important;
        }
        
        /* Enhanced hover effects */
        .swagger-ui .opblock:hover {
            transform: translateX(2px);
            box-shadow: 0 0 15px var(--matrix-green), 
                        -3px 0 0 var(--matrix-green) !important;
        }
        
        .swagger-ui article.model:hover {
            transform: translateX(2px);
            box-shadow: 0 0 10px var(--matrix-green) !important;
        }
        
        /* Better spacing and hierarchy */
        .swagger-ui .opblock {
            margin-bottom: 12px !important;
            padding: 12px !important;
        }
        
        .swagger-ui article.model {
            margin-bottom: 12px !important;
            padding: 12px !important;
        }
        
        .swagger-ui .opblock-summary {
            padding: 12px 16px !important;
        }
        
        /* Enhanced focus states for keyboard navigation */
        .swagger-ui button:focus,
        .swagger-ui a:focus,
        .swagger-ui input:focus,
        .swagger-ui textarea:focus {
            outline: 2px solid var(--matrix-green) !important;
            outline-offset: 2px !important;
            box-shadow: 0 0 10px var(--matrix-green) !important;
        }
        
        /* Terminal-style prompt indicator */
        .swagger-ui .info::before {
            content: '> ';
            color: var(--matrix-green);
            font-weight: 700;
            margin-right: 4px;
        }
        
        /* Glitch effect on title (more subtle) */
        @keyframes glitch {
            0%, 100% { 
                text-shadow: 0 0 10px var(--matrix-green), 0 0 20px var(--matrix-green); 
            }
            25% { 
                text-shadow: -1px 0 var(--matrix-error), 1px 0 var(--matrix-green);
                transform: translateX(-1px);
            }
            50% { 
                text-shadow: 1px 0 var(--matrix-error), -1px 0 var(--matrix-green);
                transform: translateX(1px);
            }
            75% { 
                text-shadow: -1px 0 var(--matrix-green), 1px 0 var(--matrix-dark-green);
            }
        }
        
        .swagger-ui .info .title:hover {
            animation: glitch 0.5s infinite;
        }
        
        /* Typing effect for code blocks */
        @keyframes typing {
            from { width: 0; }
            to { width: 100%; }
        }
        
        /* Enhanced scrollbar with glow */
        ::-webkit-scrollbar-thumb {
            background: var(--matrix-border) !important;
            border: 2px solid var(--matrix-bg) !important;
            box-shadow: 0 0 5px var(--matrix-green) inset !important;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--matrix-green) !important;
            box-shadow: 0 0 10px var(--matrix-green) !important;
        }
        
        /* Pulse effect on active elements */
        @keyframes pulse {
            0%, 100% { 
                box-shadow: 0 0 5px var(--matrix-green);
            }
            50% { 
                box-shadow: 0 0 20px var(--matrix-green), 0 0 30px var(--matrix-green);
            }
        }
        
        .swagger-ui .btn.execute:active,
        .swagger-ui .btn:active {
            animation: pulse 0.3s ease;
        }
        
        /* Better visual hierarchy with subtle borders */
        .swagger-ui .opblock-tag-section {
            border-bottom: 2px solid var(--matrix-border) !important;
            margin-bottom: 20px !important;
            padding-bottom: 10px !important;
        }
        
        /* Enhanced code block styling */
        .swagger-ui pre code {
            display: block;
            padding: 12px !important;
            line-height: 1.6 !important;
        }
        
        /* Terminal-style response boxes */
        .swagger-ui .response-col_description {
            font-family: 'JetBrains Mono', monospace !important;
            background: var(--matrix-bg) !important;
            padding: 8px !important;
            border: 1px solid var(--matrix-border) !important;
            border-radius: 2px !important;
        }
        
        .swagger-ui .wrapper,
        .swagger-ui section,
        .swagger-ui .scheme-container {
            background: var(--matrix-bg) !important;
            color: var(--matrix-text) !important;
        }
        
        .swagger-ui .prop-name,
        .swagger-ui .prop-type {
            color: var(--matrix-text-dim) !important;
        }
        
        .swagger-ui .prop-name {
            color: var(--matrix-green) !important;
        }
        
        /* Loading states with Matrix style */
        .swagger-ui .loading-container {
            border: 2px solid var(--matrix-green) !important;
            border-top-color: transparent !important;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        /* Enhanced request/response sections */
        .swagger-ui .request-body,
        .swagger-ui .responses-wrapper {
            border: 1px solid var(--matrix-border) !important;
            border-left: 3px solid var(--matrix-green) !important;
            background: var(--matrix-bg-secondary) !important;
            padding: 16px !important;
            margin: 12px 0 !important;
        }
        
        /* Terminal-style input fields */
        .swagger-ui input[type="text"]::placeholder,
        .swagger-ui textarea::placeholder {
            color: var(--matrix-text-dim) !important;
            opacity: 0.5 !important;
        }
        
        /* Better visual feedback on interactions */
        .swagger-ui .opblock-summary-control:active {
            transform: scale(0.95);
        }
        
        /* Enhanced schema property display */
        .swagger-ui .prop-row {
            padding: 8px 12px !important;
            border-left: 2px solid transparent !important;
        }
        
        .swagger-ui .prop-row:hover {
            border-left-color: var(--matrix-green) !important;
            background: var(--matrix-bg) !important;
        }
        
        /* Status code badges */
        .swagger-ui .response-col_status {
            font-weight: 700 !important;
            font-size: 1.1em !important;
            text-shadow: 0 0 8px var(--matrix-green) !important;
        }
        
        /* Enhanced tab styling */
        .swagger-ui .tab {
            border-bottom: 2px solid var(--matrix-border) !important;
        }
        
        .swagger-ui .tab li {
            margin-right: 8px !important;
        }
        
        .swagger-ui .tab li button {
            padding: 8px 16px !important;
            border-radius: 0 !important;
        }
        
        .swagger-ui .tab li.active button {
            border-bottom: 2px solid var(--matrix-green) !important;
        }
        
        /* Better spacing for readability */
        .swagger-ui .opblock-description-wrapper {
            margin: 12px 0 !important;
            padding: 12px !important;
            line-height: 1.6 !important;
        }
        
        /* Enhanced parameter display */
        .swagger-ui .parameter__name {
            font-size: 1.05em !important;
            letter-spacing: 0.5px !important;
        }
        
        /* Matrix-style badges */
        .swagger-ui .info .title small,
        .swagger-ui .parameter__in {
            background: var(--matrix-green) !important;
            color: var(--matrix-bg) !important;
            padding: 3px 8px !important;
            border-radius: 3px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
            box-shadow: 0 0 5px var(--matrix-green) !important;
        }
        
        /* Smooth expand/collapse animations */
        .swagger-ui .opblock-body {
            transition: max-height 0.3s ease, opacity 0.3s ease !important;
        }
        
        /* Enhanced JSON viewer */
        .swagger-ui .microlight {
            border-radius: 4px !important;
            overflow-x: auto !important;
        }
        
        .swagger-ui .microlight code {
            font-size: 0.9em !important;
            line-height: 1.5 !important;
        }
        
        /* Terminal prompt style for section headers */
        .swagger-ui .opblock-tag {
            position: relative;
            padding-left: 20px !important;
        }
        
        .swagger-ui .opblock-tag::before {
            content: '$ ';
            color: var(--matrix-green);
            position: absolute;
            left: 0;
            font-weight: 700;
        }
        
        /* Enhanced visual feedback */
        .swagger-ui .btn:not(:disabled):hover {
            transform: translateY(-1px);
        }
        
        .swagger-ui .btn:not(:disabled):active {
            transform: translateY(0);
        }
        
        /* Better contrast for important information */
        .swagger-ui .response-col_links {
            color: var(--matrix-text-dim) !important;
        }
        
        .swagger-ui .response-col_links a {
            color: var(--matrix-green) !important;
            text-decoration: underline !important;
        }
        
        .swagger-ui .response-col_links a:hover {
            text-shadow: 0 0 calc(5px * var(--text-shadow-intensity)) var(--matrix-green) !important;
        }
        
        /* Theme Controls */
        .matrix-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            gap: 10px;
            flex-direction: column;
            font-family: 'JetBrains Mono', monospace;
        }

        .matrix-controls-row {
            display: flex;
            gap: 10px;
        }
        
        .matrix-control-btn {
            background: var(--matrix-bg-secondary);
            border: 1px solid var(--matrix-green);
            color: var(--matrix-green);
            padding: 8px 12px;
            cursor: pointer;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.2s ease;
            box-shadow: 0 0 calc(5px * var(--glow-intensity)) var(--matrix-green);
        }
        
        .matrix-control-btn:hover {
            background: var(--matrix-green);
            color: var(--matrix-bg);
            box-shadow: 0 0 calc(10px * var(--glow-intensity)) var(--matrix-green);
        }
        
        .matrix-control-btn.active {
            background: var(--matrix-green);
            color: var(--matrix-bg);
        }
        
        /* Keyboard Shortcuts Modal */
        .matrix-shortcuts-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 20000;
            justify-content: center;
            align-items: center;
            font-family: 'JetBrains Mono', monospace;
        }
        
        .matrix-shortcuts-modal.active {
            display: flex;
        }
        
        .matrix-shortcuts-content {
            background: var(--matrix-bg-secondary);
            border: 2px solid var(--matrix-green);
            padding: 30px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 0 30px var(--matrix-green);
        }
        
        .matrix-shortcuts-content h2 {
            color: var(--matrix-green);
            text-shadow: 0 0 10px var(--matrix-green);
            margin-bottom: 20px;
            font-size: 24px;
        }
        
        .matrix-shortcuts-content .shortcut-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid var(--matrix-border);
            color: var(--matrix-text-dim);
        }
        
        .matrix-shortcuts-content .shortcut-key {
            color: var(--matrix-green);
            font-weight: 700;
            background: var(--matrix-bg);
            padding: 4px 8px;
            border: 1px solid var(--matrix-green);
            border-radius: 3px;
        }
        
        /* Prompt Packs Browser */
        .matrix-prompt-packs {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 600px;
            max-height: 400px;
            background: var(--matrix-bg-secondary);
            border: 2px solid var(--matrix-green);
            box-shadow: 0 0 30px var(--matrix-green);
            display: none;
            flex-direction: column;
            font-family: 'JetBrains Mono', monospace;
            z-index: 16000;
        }

        .matrix-prompt-packs.active {
            display: flex;
        }

        .matrix-prompt-packs-search {
            padding: 12px;
            border-bottom: 1px solid var(--matrix-border);
            display: flex;
            gap: 10px;
        }

        .matrix-prompt-packs-list {
            padding: 12px;
            flex: 1;
            overflow-y: auto;
            max-height: 300px;
        }

        .matrix-prompt-pack-item {
            margin-bottom: 12px;
            padding: 8px;
            border: 1px solid var(--matrix-border);
            border-left: 3px solid var(--matrix-green);
            background: var(--matrix-bg);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .matrix-prompt-pack-item:hover {
            border-color: var(--matrix-green);
            box-shadow: 0 0 10px var(--matrix-green);
        }

        .matrix-prompt-pack-title {
            color: var(--matrix-green);
            font-weight: 700;
            margin-bottom: 4px;
        }

        .matrix-prompt-pack-desc {
            color: var(--matrix-text-dim);
            font-size: 12px;
            margin-bottom: 4px;
        }

        .matrix-prompt-pack-meta {
            color: var(--matrix-text-dim);
            font-size: 11px;
        }

        .matrix-prompt-item {
            margin: 8px 0;
            padding: 6px;
            border-left: 2px solid var(--matrix-border);
            background: var(--matrix-bg);
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .matrix-prompt-item:hover {
            border-left-color: var(--matrix-green);
            background: var(--matrix-bg-secondary);
        }

        .matrix-prompt-item-title {
            color: var(--matrix-green);
            font-weight: 700;
            font-size: 13px;
        }

        .matrix-prompt-item-desc {
            color: var(--matrix-text-dim);
            font-size: 11px;
            margin-top: 2px;
        }

        /* Terminal Command Interface */
        .matrix-terminal {
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 400px;
            max-height: 300px;
            background: var(--matrix-bg-secondary);
            border: 2px solid var(--matrix-green);
            box-shadow: 0 0 20px var(--matrix-green);
            display: none;
            flex-direction: column;
            font-family: 'JetBrains Mono', monospace;
            z-index: 15000;
        }
        
        .matrix-terminal.active {
            display: flex;
        }
        
        .matrix-terminal-header {
            background: var(--matrix-bg);
            padding: 8px 12px;
            border-bottom: 1px solid var(--matrix-green);
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--matrix-green);
            font-size: 12px;
            text-transform: uppercase;
        }
        
        .matrix-terminal-close {
            background: none;
            border: none;
            color: var(--matrix-green);
            cursor: pointer;
            font-size: 16px;
            padding: 0;
            width: 20px;
            height: 20px;
        }
        
        .matrix-terminal-close:hover {
            color: var(--matrix-error);
        }
        
        .matrix-terminal-body {
            padding: 12px;
            flex: 1;
            overflow-y: auto;
            color: var(--matrix-text-dim);
            font-size: 12px;
            line-height: 1.6;
        }
        
        .matrix-terminal-prompt {
            color: var(--matrix-green);
            margin-right: 8px;
        }
        
        .matrix-terminal-input {
            background: transparent;
            border: none;
            color: var(--matrix-green);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            width: 100%;
            outline: none;
        }
        
        .matrix-terminal-input::placeholder {
            color: var(--matrix-text-dim);
            opacity: 0.5;
        }
        
        .matrix-terminal-line {
            margin-bottom: 8px;
        }
        
        .matrix-terminal-output {
            color: var(--matrix-text-dim);
        }
        
        .matrix-terminal-error {
            color: var(--matrix-error);
        }
        
        .matrix-terminal-success {
            color: var(--matrix-green);
        }
    </style>
    
    <!-- Theme Controls and Terminal -->
    <div class="matrix-controls">
        <div class="matrix-controls-row">
            <a href="/readme" class="matrix-control-btn" title="View README" style="text-decoration: none; display: inline-block;">README</a>
            <button class="matrix-control-btn" id="matrix-prompt-packs-btn" title="Browse Prompt Packs">PROMPTS</button>
        </div>
        <div class="matrix-controls-row">
            <button class="matrix-control-btn" id="matrix-theme-toggle" title="Toggle Theme Intensity">THEME: MEDIUM</button>
            <button class="matrix-control-btn" id="matrix-shortcuts-btn" title="Keyboard Shortcuts (?)">SHORTCUTS (?)</button>
        </div>
        <div class="matrix-controls-row">
            <button class="matrix-control-btn" id="matrix-terminal-btn" title="Terminal Interface (~)">TERMINAL (~)</button>
        </div>
    </div>
    
    <!-- Keyboard Shortcuts Modal -->
    <div class="matrix-shortcuts-modal" id="matrix-shortcuts-modal">
        <div class="matrix-shortcuts-content">
            <h2>KEYBOARD SHORTCUTS</h2>
            <div class="shortcut-item">
                <span>Toggle Terminal</span>
                <span class="shortcut-key">~</span>
            </div>
            <div class="shortcut-item">
                <span>Show Shortcuts</span>
                <span class="shortcut-key">?</span>
            </div>
            <div class="shortcut-item">
                <span>Toggle Theme</span>
                <span class="shortcut-key">T</span>
            </div>
            <div class="shortcut-item">
                <span>Close Modal</span>
                <span class="shortcut-key">ESC</span>
            </div>
            <div class="shortcut-item">
                <span>Execute Request</span>
                <span class="shortcut-key">CTRL+ENTER</span>
            </div>
            <div class="shortcut-item">
                <span>Open Prompt Packs</span>
                <span class="shortcut-key">P</span>
            </div>
            <div class="shortcut-item">
                <span>Focus Search</span>
                <span class="shortcut-key">/</span>
            </div>
        </div>
    </div>
    
    <!-- Prompt Packs Browser -->
    <div class="matrix-prompt-packs" id="matrix-prompt-packs">
        <div class="matrix-terminal-header">
            <span>PROMPT PACKS</span>
            <button class="matrix-terminal-close" id="matrix-prompt-packs-close">×</button>
        </div>
        <div class="matrix-prompt-packs-body" id="matrix-prompt-packs-body">
            <div class="matrix-prompt-packs-search">
                <input type="text" class="matrix-terminal-input" id="matrix-prompt-search" placeholder="Search prompts..." autocomplete="off">
                <select class="matrix-terminal-input" id="matrix-prompt-category">
                    <option value="">All Categories</option>
                    <option value="strategy">Strategy</option>
                    <option value="leadership">Leadership</option>
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                </select>
            </div>
            <div class="matrix-prompt-packs-list" id="matrix-prompt-packs-list">
                <div class="matrix-terminal-line">
                    <span class="matrix-terminal-prompt">></span>
                    <span class="matrix-terminal-output">Loading prompt packs...</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Terminal Command Interface -->
    <div class="matrix-terminal" id="matrix-terminal">
        <div class="matrix-terminal-header">
            <span>TERMINAL INTERFACE</span>
            <button class="matrix-terminal-close" id="matrix-terminal-close">×</button>
        </div>
        <div class="matrix-terminal-body" id="matrix-terminal-body">
            <div class="matrix-terminal-line">
                <span class="matrix-terminal-prompt">></span>
                <span class="matrix-terminal-output">HUMMBL Sovereign Engine Terminal v0.1.0</span>
            </div>
            <div class="matrix-terminal-line">
                <span class="matrix-terminal-prompt">></span>
                <span class="matrix-terminal-output">Type 'help' for available commands</span>
            </div>
            <div class="matrix-terminal-line" id="matrix-terminal-input-line">
                <span class="matrix-terminal-prompt">></span>
                <input type="text" class="matrix-terminal-input" id="matrix-terminal-input" placeholder="Enter command..." autocomplete="off">
            </div>
        </div>
    </div>
    
    <script>
        console.log('Script loaded, waiting for DOMContentLoaded...');

        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOMContentLoaded fired, initializing Matrix interface...');

            // Theme Intensity Toggle
            let currentTheme = 'medium';
            const themeToggle = document.getElementById('matrix-theme-toggle');
            const body = document.body;
            const html = document.documentElement;

            const themes = ['subtle', 'medium', 'intense'];
            const themeLabels = ['SUBTLE', 'MEDIUM', 'INTENSE'];

            function applyTheme(theme) {
                // Simple theme application
                const index = themes.indexOf(theme);
                themeToggle.textContent = `THEME: ${themeLabels[index]}`;
                console.log(`Theme changed to: ${theme}`);
            }
        
        themeToggle.addEventListener('click', () => {
            const currentIndex = themes.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % themes.length;
            currentTheme = themes[nextIndex];
            applyTheme(currentTheme);
        });
        
        // Initialize theme
        applyTheme('medium');
        
        // Keyboard Shortcuts Modal
        const shortcutsModal = document.getElementById('matrix-shortcuts-modal');
        const shortcutsBtn = document.getElementById('matrix-shortcuts-btn');
        
        shortcutsBtn.addEventListener('click', () => {
            shortcutsModal.classList.toggle('active');
        });
        
        // Prompt Packs Browser
        const promptPacks = document.getElementById('matrix-prompt-packs');
        const promptPacksBtn = document.getElementById('matrix-prompt-packs-btn');
        const promptPacksClose = document.getElementById('matrix-prompt-packs-close');
        const promptPacksList = document.getElementById('matrix-prompt-packs-list');
        const promptSearch = document.getElementById('matrix-prompt-search');
        const promptCategory = document.getElementById('matrix-prompt-category');

        console.log('Prompt packs elements found:', {
            promptPacks: !!promptPacks,
            promptPacksBtn: !!promptPacksBtn,
            promptPacksClose: !!promptPacksClose,
            promptPacksList: !!promptPacksList,
            promptSearch: !!promptSearch,
            promptCategory: !!promptCategory
        });

        // Terminal Interface
        const terminal = document.getElementById('matrix-terminal');
        const terminalBtn = document.getElementById('matrix-terminal-btn');
        const terminalClose = document.getElementById('matrix-terminal-close');
        const terminalInput = document.getElementById('matrix-terminal-input');
        const terminalBody = document.getElementById('matrix-terminal-body');
        
        terminalBtn.addEventListener('click', () => {
            terminal.classList.toggle('active');
            if (terminal.classList.contains('active')) {
                terminalInput.focus();
            }
        });
        
        if (promptPacksBtn) {
            promptPacksBtn.addEventListener('click', () => {
                console.log('Prompt packs button clicked');
                if (promptPacks) {
                    const wasActive = promptPacks.classList.contains('active');
                    promptPacks.classList.toggle('active');
                    const isActive = promptPacks.classList.contains('active');
                    console.log('Modal active class toggled from', wasActive, 'to', isActive);
                    console.log('Modal element:', promptPacks);
                    console.log('Modal computed style display:', window.getComputedStyle(promptPacks).display);
                    console.log('Modal bounding rect:', promptPacks.getBoundingClientRect());

                    if (isActive) {
                        console.log('Loading prompt packs...');
                        loadPromptPacks();
                    }
                } else {
                    console.error('Prompt packs modal not found');
                }
            });
            console.log('Prompt packs button event listener attached');
        } else {
            console.error('Prompt packs button not found');
        }

        promptPacksClose.addEventListener('click', () => {
            promptPacks.classList.remove('active');
        });

        promptSearch.addEventListener('input', filterPromptPacks);
        promptCategory.addEventListener('change', filterPromptPacks);

        terminalClose.addEventListener('click', () => {
            terminal.classList.remove('active');
        });
        
        // Terminal Commands
        const commands = {
            help: () => {
                return `Available commands:
  help          - Show this help message
  clear         - Clear terminal
  theme [mode]  - Set theme (subtle/medium/intense)
  prompts       - Open prompt packs browser
  endpoints     - List API endpoints
  version       - Show version info
  exit          - Close terminal`;
            },
            clear: () => {
                const lines = terminalBody.querySelectorAll('.matrix-terminal-line:not(#matrix-terminal-input-line)');
                lines.forEach(line => line.remove());
                return 'Terminal cleared.';
            },
            theme: (args) => {
                const mode = args[0] || 'medium';
                if (themes.includes(mode)) {
                    currentTheme = mode;
                    applyTheme(mode);
                    return `Theme set to ${mode.toUpperCase()}.`;
                }
                return `Invalid theme. Use: ${themes.join(', ')}`;
            },
            prompts: () => {
                promptPacks.classList.add('active');
                loadPromptPacks();
                return 'Opening prompt packs browser...';
            },
            endpoints: () => {
                return `API Endpoints:
  GET  /                      - Root endpoint
  POST /consult               - Consult council
  POST /consult/multi         - Consult multiple members
  GET  /prompt-packs          - List all prompt packs
  GET  /prompt-packs/{id}     - Get specific pack
  GET  /prompt-packs/search   - Search prompts
  POST /audit                 - Run constitutional audit`;
            },
            version: () => {
                return 'HUMMBL Sovereign Engine v0.1.0';
            },
            exit: () => {
                terminal.classList.remove('active');
                return 'Terminal closed.';
            }
        };
        
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const command = terminalInput.value.trim();
                terminalInput.value = '';
                
                if (command) {
                    const [cmd, ...args] = command.split(' ');
                    const handler = commands[cmd.toLowerCase()];
                    
                    const inputLine = document.createElement('div');
                    inputLine.className = 'matrix-terminal-line';
                    inputLine.innerHTML = `<span class="matrix-terminal-prompt">></span><span class="matrix-terminal-output">${command}</span>`;
                    terminalBody.insertBefore(inputLine, terminalBody.lastElementChild);
                    
                    if (handler) {
                        const output = handler(args);
                        const outputLine = document.createElement('div');
                        outputLine.className = 'matrix-terminal-line';
                        outputLine.innerHTML = `<span class="matrix-terminal-output">${output}</span>`;
                        terminalBody.insertBefore(outputLine, terminalBody.lastElementChild);
                    } else {
                        const errorLine = document.createElement('div');
                        errorLine.className = 'matrix-terminal-line';
                        errorLine.innerHTML = `<span class="matrix-terminal-error">Command not found: ${cmd}. Type 'help' for available commands.</span>`;
                        terminalBody.insertBefore(errorLine, terminalBody.lastElementChild);
                    }
                    
                    terminalBody.scrollTop = terminalBody.scrollHeight;
                }
            }
        });
        
        // Prompt Packs Functions
        async function loadPromptPacks() {
            console.log('loadPromptPacks called');
            if (!promptPacksList) {
                console.error('promptPacksList element not found');
                return;
            }
            try {
                console.log('Fetching /prompt-packs...');
                const response = await fetch('/prompt-packs');
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Data received:', data);

                displayPromptPacks(data.packs);
            } catch (error) {
                console.error('Failed to load prompt packs:', error);
                if (promptPacksList) {
                    promptPacksList.innerHTML = '<div class="matrix-terminal-line"><span class="matrix-terminal-error">Failed to load prompt packs: ' + error.message + '</span></div>';
                }
            }
        }

        function displayPromptPacks(packs) {
            console.log('displayPromptPacks called with', packs.length, 'packs');
            if (!promptPacksList) {
                console.error('promptPacksList element not found in displayPromptPacks');
                return;
            }

            promptPacksList.innerHTML = '';

            if (packs.length === 0) {
                promptPacksList.innerHTML = '<div class="matrix-terminal-line"><span class="matrix-terminal-output">No prompt packs found</span></div>';
                return;
            }

            packs.forEach(pack => {
                console.log('Creating pack element for:', pack.name);
                const packElement = document.createElement('div');
                packElement.className = 'matrix-prompt-pack-item';
                packElement.innerHTML = `
                    <div class="matrix-prompt-pack-title">${pack.name}</div>
                    <div class="matrix-prompt-pack-desc">${pack.description}</div>
                    <div class="matrix-prompt-pack-meta">${pack.category} • ${pack.prompt_count} prompts</div>
                `;

                packElement.addEventListener('click', () => {
                    console.log('Pack clicked:', pack.id);
                    loadPromptPackDetails(pack.id);
                });
                promptPacksList.appendChild(packElement);
            });
            console.log('Pack elements created and appended');
        }

        async function loadPromptPackDetails(packId) {
            try {
                const response = await fetch(`/prompt-packs/${packId}`);
                const pack = await response.json();

                displayPromptPackDetails(pack);
            } catch (error) {
                console.error('Failed to load prompt pack details:', error);
            }
        }

        function displayPromptPackDetails(pack) {
            promptPacksList.innerHTML = `
                <div class="matrix-terminal-line">
                    <span class="matrix-terminal-prompt">></span>
                    <span class="matrix-terminal-output" style="color: var(--matrix-green); font-weight: 700;">${pack.name}</span>
                </div>
                <div class="matrix-terminal-line">
                    <span class="matrix-terminal-output">${pack.description}</span>
                </div>
                <div class="matrix-terminal-line">
                    <span class="matrix-terminal-output" style="color: var(--matrix-text-dim); font-size: 12px;">${pack.category} • ${pack.prompts.length} prompts</span>
                </div>
                <div style="margin: 12px 0; border-top: 1px solid var(--matrix-border); padding-top: 8px;">
                    ${pack.prompts.map(prompt => `
                        <div class="matrix-prompt-item" onclick="usePrompt('${pack.id}', '${prompt.title}', '${prompt.topic.replace(/'/g, "\\'")}', '${prompt.member}')">
                            <div class="matrix-prompt-item-title">${prompt.title}</div>
                            <div class="matrix-prompt-item-desc">${prompt.description}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="matrix-terminal-line">
                    <button class="matrix-control-btn" onclick="loadPromptPacks()" style="margin-top: 8px;">← Back to Packs</button>
                </div>
            `;
        }

        function filterPromptPacks() {
            const searchTerm = promptSearch.value.toLowerCase();
            const categoryFilter = promptCategory.value;

            // This would need to be implemented with client-side filtering
            // For now, just reload with search if implemented on backend
            if (searchTerm || categoryFilter) {
                // Could implement client-side filtering here
                console.log('Filtering:', searchTerm, categoryFilter);
            }
        }

        // Global function for prompt selection
        window.usePrompt = function(packId, title, topic, member) {
            console.log('usePrompt called with:', { packId, title, topic, member });

            // Close the prompt packs modal
            const promptPacks = document.getElementById('matrix-prompt-packs');
            if (promptPacks) {
                promptPacks.classList.remove('active');
            }

            // Find the consult endpoint and expand it
            const consultEndpoint = document.querySelector('.opblock.opblock-post');
            if (consultEndpoint) {
                console.log('Found consult endpoint');

                // Expand the endpoint if collapsed
                if (!consultEndpoint.classList.contains('is-open')) {
                    const summaryControl = consultEndpoint.querySelector('.opblock-summary-control');
                    if (summaryControl) {
                        summaryControl.click();
                        console.log('Clicked to expand endpoint');
                    }
                }

                // Wait for the form to be visible, then populate it
                setTimeout(() => {
                    console.log('Attempting to populate form...');

                    // Try multiple selector strategies for the form fields
                    let topicTextarea = null;
                    let memberSelect = null;

                    // Strategy 1: Look within the endpoint body
                    const endpointBody = consultEndpoint.querySelector('.opblock-body');
                    if (endpointBody) {
                        topicTextarea = endpointBody.querySelector('textarea');
                        memberSelect = endpointBody.querySelector('select');
                        console.log('Strategy 1 - Found in endpoint body:', { topicTextarea: !!topicTextarea, memberSelect: !!memberSelect });
                    }

                    // Strategy 2: Look globally for form fields (more specific selectors)
                    if (!topicTextarea) {
                        topicTextarea = document.querySelector('textarea[placeholder*="topic"], textarea[placeholder*="Topic"]');
                        console.log('Strategy 2 - Found topic textarea globally:', !!topicTextarea);
                    }

                    if (!memberSelect) {
                        memberSelect = document.querySelector('select[placeholder*="member"], select[placeholder*="Member"]');
                        console.log('Strategy 2 - Found member select globally:', !!memberSelect);
                    }

                    // Strategy 3: Look for parameters by name
                    if (!topicTextarea) {
                        const topicParam = document.querySelector('.parameter__name');
                        if (topicParam && topicParam.textContent.toLowerCase().includes('topic')) {
                            topicTextarea = topicParam.closest('.parameter').querySelector('textarea, input');
                        }
                        console.log('Strategy 3 - Found topic by parameter name:', !!topicTextarea);
                    }

                    if (!memberSelect) {
                        const memberParam = Array.from(document.querySelectorAll('.parameter__name')).find(el =>
                            el.textContent.toLowerCase().includes('member')
                        );
                        if (memberParam) {
                            memberSelect = memberParam.closest('.parameter').querySelector('select');
                        }
                        console.log('Strategy 3 - Found member by parameter name:', !!memberSelect);
                    }

                    // Populate the fields if found
                    if (topicTextarea) {
                        topicTextarea.value = topic;
                        topicTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                        topicTextarea.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('Populated topic textarea with:', topic);
                    } else {
                        console.log('Could not find topic textarea');
                    }

                    if (memberSelect) {
                        memberSelect.value = member;
                        memberSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('Populated member select with:', member);
                    } else {
                        console.log('Could not find member select');
                    }

                    // Show success message
                    if (topicTextarea || memberSelect) {
                        console.log(`✅ Successfully populated form with prompt: ${title}`);
                    } else {
                        console.log(`❌ Could not populate form - fields not found for prompt: ${title}`);
                    }
                }, 500); // Give more time for the form to expand
            } else {
                console.log('Could not find consult endpoint');
            }
        };

            // Close the prompt packs modal
            promptPacks.classList.remove('active');

            // Show success message
            console.log(`Selected prompt: ${title} from ${packId}`);
        };

        // Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            // Toggle terminal with ~
            if (e.key === '~' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    terminal.classList.toggle('active');
                    if (terminal.classList.contains('active')) {
                        terminalInput.focus();
                    }
                }
            }
            
            // Show shortcuts with ?
            if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    shortcutsModal.classList.toggle('active');
                }
            }
            
            // Toggle theme with T
            if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    themeToggle.click();
                }
            }

            // Open prompt packs with P
            if (e.key === 'p' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const activeElement = document.activeElement;
                if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    promptPacksBtn.click();
                }
            }
            
            // Close modals with ESC
            if (e.key === 'Escape') {
                shortcutsModal.classList.remove('active');
                terminal.classList.remove('active');
            }
        });

        // Initialize immediately if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            initializeApp();
        }
        });
    </script>
    """
    
    # Inject CSS before closing head tag
    if '</head>' in html_content:
        html_content = html_content.replace('</head>', matrix_css_injection + '</head>')
    else:
        html_content = matrix_css_injection + html_content
    
    return HTMLResponse(content=html_content)

class CouncilMember(str, Enum):
    """Sovereign Council members based on v1.0 spec."""
    sun_tzu = "sun_tzu"
    marcus_aurelius = "marcus_aurelius"
    machiavelli = "machiavelli"
    plato = "plato"
    aristotle = "aristotle"
    carl_jung = "carl_jung"
    hypatia = "hypatia"
    ada_lovelace = "ada_lovelace"
    marie_curie = "marie_curie"
    benjamin_franklin = "benjamin_franklin"
    paulo_freire = "paulo_freire"
    dame_whina_cooper = "dame_whina_cooper"
    ibn_rushd = "ibn_rushd"

@app.get("/")
async def root():
    return {
        "message": "HUMMBL Sovereign Engine",
        "endpoints": {
            "/consult": "POST - Consult the council",
            "/consult/multi": "POST - Consult multiple council members",
            "/prompt-packs": "GET - List all prompt packs",
            "/prompt-packs/{id}": "GET - Get specific prompt pack",
            "/prompt-packs/categories": "GET - List categories",
            "/prompt-packs/categories/{cat}": "GET - Get packs by category",
            "/prompt-packs/featured": "GET - Get featured prompts",
            "/prompt-packs/search?q=term": "GET - Search prompts",
            "/audit": "POST - Run constitutional audit",
            "/docs": "GET - Interactive API documentation",
            "/readme": "GET - Project README",
            "/redoc": "GET - Alternative API documentation"
        }
    }

@app.get("/readme", include_in_schema=False)
async def readme(doc: str = "readme"):
    """
    Serve markdown files with Matrix theme styling.
    Supports: readme, user_guide, manifesto, and other .md files.
    """
    # Map doc parameter to actual file names
    doc_map = {
        "readme": "README.md",
        "user_guide": "USER_GUIDE.md",
        "manifesto": "MANIFESTO.md",
    }
    
    # Find the file in the project root (two levels up from src/)
    project_root = Path(__file__).parent.parent.parent
    filename = doc_map.get(doc.lower(), f"{doc.upper()}.md")
    file_path = project_root / filename
    
    # Fallback: try with .md extension if not found
    if not file_path.exists() and not filename.endswith('.md'):
        file_path = project_root / f"{filename}.md"
    
    # If still not found, try as-is
    if not file_path.exists():
        file_path = project_root / doc
    
    if not file_path.exists():
        return HTMLResponse(
            content=f"<html><body style='color: #00ff41; background: #000; font-family: monospace; padding: 20px;'>{filename} not found</body></html>",
            status_code=404
        )
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        readme_content = f.read()
    
    # Convert markdown to HTML (simple conversion for common elements)
    html_content = markdown_to_html(readme_content)
    
    # Wrap in Matrix-styled HTML
    matrix_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>HUMMBL Sovereign Engine - README</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
        <style>
            :root {{
                --matrix-green: #00ff41;
                --matrix-dark-green: #00cc33;
                --matrix-bg: #000000;
                --matrix-bg-secondary: #0a0a0a;
                --matrix-border: #003300;
                --matrix-text: #00ff41;
                --matrix-text-dim: #00cc33;
                --matrix-error: #ff0040;
                --matrix-warning: #ffaa00;
            }}
            
            * {{
                font-family: 'JetBrains Mono', 'Courier New', monospace !important;
            }}
            
            body {{
                background: var(--matrix-bg) !important;
                color: var(--matrix-text) !important;
                margin: 0;
                padding: 20px;
                line-height: 1.6;
            }}
            
            .container {{
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }}
            
            .header {{
                border-bottom: 2px solid var(--matrix-green);
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            
            .header h1 {{
                color: var(--matrix-green);
                text-shadow: 0 0 10px var(--matrix-green);
                margin: 0;
            }}
            
            .nav {{
                margin-top: 20px;
            }}
            
            .nav a {{
                color: var(--matrix-green);
                text-decoration: none;
                margin-right: 20px;
                padding: 5px 10px;
                border: 1px solid var(--matrix-border);
                transition: all 0.3s;
            }}
            
            .nav a:hover {{
                background: var(--matrix-green);
                color: var(--matrix-bg);
                box-shadow: 0 0 10px var(--matrix-green);
            }}
            
            /* Markdown content styling */
            h1, h2, h3, h4, h5, h6 {{
                color: var(--matrix-green);
                text-shadow: 0 0 5px var(--matrix-green);
                margin-top: 30px;
                margin-bottom: 15px;
            }}
            
            h1 {{
                font-size: 2.5em;
                border-bottom: 2px solid var(--matrix-border);
                padding-bottom: 10px;
            }}
            
            h2 {{
                font-size: 2em;
                border-bottom: 1px solid var(--matrix-border);
                padding-bottom: 5px;
            }}
            
            h3 {{
                font-size: 1.5em;
            }}
            
            p {{
                margin-bottom: 15px;
            }}
            
            code {{
                background: var(--matrix-bg-secondary);
                color: var(--matrix-green);
                padding: 2px 6px;
                border-radius: 3px;
                border: 1px solid var(--matrix-border);
                font-size: 0.9em;
            }}
            
            pre {{
                background: var(--matrix-bg-secondary);
                border: 1px solid var(--matrix-border);
                border-left: 3px solid var(--matrix-green);
                padding: 15px;
                overflow-x: auto;
                margin: 20px 0;
            }}
            
            pre code {{
                background: none;
                border: none;
                padding: 0;
            }}
            
            blockquote {{
                border-left: 3px solid var(--matrix-green);
                padding-left: 20px;
                margin: 20px 0;
                color: var(--matrix-text-dim);
            }}
            
            table {{
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
            }}
            
            table th, table td {{
                border: 1px solid var(--matrix-border);
                padding: 10px;
                text-align: left;
            }}
            
            table th {{
                background: var(--matrix-bg-secondary);
                color: var(--matrix-green);
                font-weight: bold;
            }}
            
            table tr:hover {{
                background: var(--matrix-bg-secondary);
            }}
            
            a {{
                color: var(--matrix-green);
                text-decoration: underline;
            }}
            
            a:hover {{
                color: var(--matrix-dark-green);
                text-shadow: 0 0 5px var(--matrix-green);
            }}
            
            ul, ol {{
                margin: 15px 0;
                padding-left: 30px;
            }}
            
            li {{
                margin: 5px 0;
            }}
            
            hr {{
                border: none;
                border-top: 1px solid var(--matrix-border);
                margin: 30px 0;
            }}
            
            /* Mermaid diagram styling */
            .mermaid {{
                background: var(--matrix-bg-secondary);
                border: 1px solid var(--matrix-border);
                border-left: 3px solid var(--matrix-green);
                padding: 20px;
                margin: 30px 0;
                overflow-x: auto;
                overflow-y: hidden;
                text-align: center;
            }}
            
            .mermaid svg {{
                max-width: 100%;
                height: auto;
            }}
            
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Sovereign Intelligence Engine</h1>
                <p style="margin: 10px 0; color: var(--matrix-text-dim); font-size: 0.9em;">Escape Digital Feudalism. Own Your AI.</p>
                <div class="nav">
                    <a href="/">API Root</a>
                    <a href="/docs">API Docs</a>
                    <a href="/readme">README</a>
                    <a href="/readme?doc=user_guide">User Guide</a>
                    <a href="/readme?doc=manifesto">Manifesto</a>
                </div>
            </div>
            <div class="content">
                {html_content}
            </div>
        </div>
        <script>
            mermaid.initialize({{
                startOnLoad: true,
                theme: 'dark',
                themeVariables: {{
                    primaryColor: '#00ff41',
                    primaryTextColor: '#00ff41',
                    primaryBorderColor: '#00cc33',
                    lineColor: '#00ff41',
                    secondaryColor: '#0a0a0a',
                    tertiaryColor: '#003300',
                    background: '#000000',
                    mainBkg: '#000000',
                    secondBkg: '#0a0a0a',
                    textColor: '#00ff41',
                    fontSize: '14px'
                }},
                flowchart: {{
                    useMaxWidth: true,
                    htmlLabels: true,
                    curve: 'basis'
                }}
            }});
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=matrix_html)

def markdown_to_html(markdown_text: str) -> str:
    """
    Convert markdown to HTML with basic formatting.
    Handles headers, code blocks, links, lists, tables.
    Mermaid diagrams are converted to renderable HTML.
    """
    html = markdown_text
    
    # Convert mermaid code blocks to renderable HTML divs FIRST (before other processing)
    # Use a placeholder format that won't be matched by any markdown regex
    # Using a format with no underscores or special chars that regex might match
    mermaid_placeholders: List[str] = []
    
    def convert_mermaid(match):
        mermaid_code = match.group(1).strip()
        placeholder = f'<MERMAIDPLACEHOLDER{len(mermaid_placeholders)}>'
        mermaid_placeholders.append(mermaid_code)
        return placeholder
    
    html = re.sub(
        r'```mermaid\s*\n(.*?)\n```',
        convert_mermaid,
        html,
        flags=re.DOTALL
    )
    
    # Convert regular code blocks (but not mermaid, which we already extracted)
    html = re.sub(
        r'```(\w+)?\s*\n(.*?)\n```',
        lambda m: f'<pre><code class="language-{m.group(1) or "text"}">{m.group(2)}</code></pre>',
        html,
        flags=re.DOTALL
    )
    
    # Convert inline code
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)
    
    # Convert headers - skip redundant H1 titles at the start
    # Remove the first two H1 titles if they're redundant (we have one in the header)
    lines = html.split('\n')
    h1_count = 0
    result_lines: List[str] = []
    for line in lines:
        # Skip the first two H1 titles if they contain "Sovereign Intelligence" or "Stack"
        if re.match(r'^#\s+', line):
            title_text = re.sub(r'^#\s+', '', line).strip()
            if h1_count < 2 and ('Sovereign Intelligence' in title_text or 'Stack' in title_text):
                h1_count += 1
                continue  # Skip this line
        result_lines.append(line)
    html = '\n'.join(result_lines)
    
    # Now convert remaining headers
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^#### (.*?)$', r'<h4>\1</h4>', html, flags=re.MULTILINE)
    html = re.sub(r'^##### (.*?)$', r'<h5>\1</h5>', html, flags=re.MULTILINE)
    html = re.sub(r'^###### (.*?)$', r'<h6>\1</h6>', html, flags=re.MULTILINE)
    
    # Convert links FIRST - before formatting that might break them
    def convert_link(match):
        link_text = match.group(1)
        link_url = match.group(2)
        
        # If it's a relative markdown file link, convert to our endpoint
        if link_url.endswith('.md') and not link_url.startswith('http'):
            # Remove .md extension and normalize
            endpoint = link_url.replace('.md', '').lower().strip()
            # Handle special cases - map common variations
            if 'user_guide' in endpoint or 'userguide' in endpoint or endpoint == 'user guide':
                return f'<a href="/readme?doc=user_guide">{link_text}</a>'
            elif 'manifesto' in endpoint:
                return f'<a href="/readme?doc=manifesto">{link_text}</a>'
            elif endpoint.startswith('docs/'):
                return f'<a href="#" onclick="alert(\'Documentation endpoint coming soon\'); return false;">{link_text}</a>'
            else:
                # Generic markdown file endpoint
                clean_endpoint = endpoint.replace('/', '_').replace(' ', '_').replace('-', '_')
                return f'<a href="/readme?doc={clean_endpoint}">{link_text}</a>'
        # External links
        elif link_url.startswith('http'):
            return f'<a href="{link_url}" target="_blank" rel="noopener noreferrer">{link_text}</a>'
        # Anchor links (with #)
        elif '#' in link_url and link_url.endswith('.md'):
            # Handle links like USER_GUIDE.md#section
            base = link_url.split('#')[0].replace('.md', '').lower().strip()
            anchor = '#' + link_url.split('#', 1)[1]
            if 'user_guide' in base or 'userguide' in base:
                return f'<a href="/readme?doc=user_guide{anchor}">{link_text}</a>'
            else:
                clean_base = base.replace('/', '_').replace(' ', '_').replace('-', '_')
                return f'<a href="/readme?doc={clean_base}{anchor}">{link_text}</a>'
        elif link_url.startswith('#'):
            return f'<a href="{link_url}">{link_text}</a>'
        # Relative paths (like /docs)
        elif link_url.startswith('/'):
            return f'<a href="{link_url}">{link_text}</a>'
        # Default: treat as external or leave as-is
        else:
            return f'<a href="{link_url}">{link_text}</a>'
    
    # Convert markdown links first
    html = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', convert_link, html)
    
    # Convert bold (links are already HTML, so they won't be affected)
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'__(.*?)__', r'<strong>\1</strong>', html)
    
    # Convert italic (links are already HTML, so they won't be affected)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    html = re.sub(r'_(.*?)_', r'<em>\1</em>', html)
    
    # Convert horizontal rules
    html = re.sub(r'^---$', r'<hr>', html, flags=re.MULTILINE)
    
    # Convert unordered lists
    lines = html.split('\n')
    in_list = False
    ul_result: List[str] = []
    for line in lines:
        if re.match(r'^[-*+] ', line):
            if not in_list:
                ul_result.append('<ul>')
                in_list = True
            content = re.sub(r'^[-*+] ', '', line)
            ul_result.append(f'<li>{content}</li>')
        else:
            if in_list:
                ul_result.append('</ul>')
                in_list = False
            ul_result.append(line)
    if in_list:
        ul_result.append('</ul>')
    html = '\n'.join(ul_result)
    
    # Convert ordered lists
    lines = html.split('\n')
    in_list = False
    list_num = 1
    ol_result: List[str] = []
    for line in lines:
        if re.match(r'^\d+\. ', line):
            if not in_list:
                ol_result.append('<ol>')
                in_list = True
                list_num = 1
            content = re.sub(r'^\d+\. ', '', line)
            ol_result.append(f'<li>{content}</li>')
        else:
            if in_list:
                ol_result.append('</ol>')
                in_list = False
            ol_result.append(line)
    if in_list:
        ol_result.append('</ol>')
    html = '\n'.join(ol_result)
    
    # Convert paragraphs (lines that aren't already HTML tags)
    # Skip lines that contain Mermaid placeholders - they'll be replaced later
    lines = html.split('\n')
    result: List[str] = []
    current_para: List[str] = []
    for line in lines:
        line_stripped = line.strip()
        # Skip empty lines
        if not line_stripped:
            if current_para:
                result.append('<p>' + ' '.join(current_para) + '</p>')
                current_para = []
            result.append('')
        # If line contains a Mermaid placeholder, keep it as-is on its own line
        elif 'MERMAIDPLACEHOLDER' in line or line.strip().startswith('<MERMAIDPLACEHOLDER'):
            if current_para:
                result.append('<p>' + ' '.join(current_para) + '</p>')
                current_para = []
            result.append(line)  # Keep placeholder as-is
        elif line_stripped.startswith('<'):
            if current_para:
                result.append('<p>' + ' '.join(current_para) + '</p>')
                current_para = []
            result.append(line)
        else:
            current_para.append(line)
    if current_para:
        result.append('<p>' + ' '.join(current_para) + '</p>')
    html = '\n'.join(result)
    
    # Convert tables (basic support)
    html = re.sub(
        r'\|(.+)\|\n\|[-:]+\|\n((?:\|.+\|\n?)+)',
        lambda m: convert_table(m.group(1), m.group(2)),
        html
    )
    
    # Restore Mermaid placeholders as actual Mermaid divs
    # Do this AFTER all other processing to ensure they're not modified
    if mermaid_placeholders:
        for i, mermaid_code in enumerate(mermaid_placeholders):
            placeholder = f'<MERMAIDPLACEHOLDER{i}>'
            if placeholder in html:
                # Don't escape - Mermaid needs the raw code
                # Ensure it's on its own line to avoid paragraph wrapping
                mermaid_html = f'\n<div class="mermaid">\n{mermaid_code}\n</div>\n'
                html = html.replace(placeholder, mermaid_html)
    
    return html

def convert_table(header_row: str, data_rows: str) -> str:
    """Convert markdown table to HTML table."""
    headers: List[str] = [h.strip() for h in header_row.split('|') if h.strip()]
    rows: List[List[str]] = []
    for row_line in data_rows.strip().split('\n'):
        cells: List[str] = [c.strip() for c in row_line.split('|') if c.strip()]
        if cells:
            rows.append(cells)
    
    html_parts: List[str] = ['<table>\n<thead>\n<tr>']
    for header in headers:
        html_parts.append(f'<th>{header}</th>')
    html_parts.append('</tr>\n</thead>\n<tbody>')
    
    for table_row in rows:
        html_parts.append('\n<tr>')
        for cell in table_row:
            html_parts.append(f'<td>{cell}</td>')
        html_parts.append('</tr>')
    
    html_parts.append('\n</tbody>\n</table>')
    return ''.join(html_parts)

class CouncilRequest(BaseModel):
    topic: str
    member: CouncilMember

class MultiCouncilRequest(BaseModel):
    topic: str
    members: List[CouncilMember]
    context: Optional[str] = None

@app.post("/consult")
async def consult_council(request: CouncilRequest):
    print(f"Consulting {request.member.value} on {request.topic}")
    
    try:
        # Use the real adapter with Gemini instead of canned responses
        advice = await generate_advice(
            topic=request.topic,
            member=AdapterCouncilMember(request.member.value)
        )
    except Exception as e:
        # Fallback to template on error
        print(f"Error generating advice: {e}")
        advice = f"Strategic guidance on {request.topic}. Consider the terrain and timing carefully."
    
    return {
        "member": request.member.value,
        "advice": advice
    }

@app.post("/consult/multi")
async def consult_multi_council(request: MultiCouncilRequest):
    """Consult multiple council members simultaneously."""
    print(f"Consulting {len(request.members)} members on {request.topic}")
    
    try:
        # Convert to adapter enum types
        adapter_members = [AdapterCouncilMember(m.value) for m in request.members]
        
        # Generate advice from all members in parallel
        advice_dict = await generate_multi_advice(
            topic=request.topic,
            members=adapter_members,
            context=request.context
        )
        
        # Get persona names for better response
        from .persona_loader import persona_loader
        
        response = {}
        for member_enum in request.members:
            persona = persona_loader.get_by_enum(member_enum.value)
            member_name = persona.name if persona else member_enum.value
            response[member_enum.value] = {
                "name": member_name,
                "advice": advice_dict.get(member_enum.value, "No advice available")
            }
        
        return {
            "topic": request.topic,
            "members": response,
            "count": len(request.members)
        }
    except Exception as e:
        print(f"Error in multi-consultation: {e}")
        import traceback
        traceback.print_exc()
        return {
            "error": str(e),
            "topic": request.topic,
            "members": {}
        }

@app.get("/graph")
async def get_relationship_graph():
    """Get relationship graph as JSON."""
    from .relationship_graph import relationship_graph
    return relationship_graph.to_json()

@app.get("/graph/dot")
async def get_relationship_graph_dot():
    """Get relationship graph as Graphviz DOT format."""
    from .relationship_graph import relationship_graph
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(relationship_graph.to_dot(), media_type="text/plain")

@app.get("/prompt-packs")
async def get_prompt_packs():
    """Get all available prompt packs."""
    packs = get_all_prompt_packs()
    return {
        "packs": [
            {
                "id": pack.id,
                "name": pack.name,
                "description": pack.description,
                "category": pack.category.value,
                "prompt_count": len(pack.prompts),
                "author": pack.author,
                "version": pack.version
            }
            for pack in packs
        ],
        "total": len(packs)
    }

@app.get("/prompt-packs/{pack_id}")
async def get_prompt_pack_by_id(pack_id: str):
    """Get a specific prompt pack by ID."""
    pack = get_prompt_pack(pack_id)
    if not pack:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Prompt pack '{pack_id}' not found")

    return {
        "id": pack.id,
        "name": pack.name,
        "description": pack.description,
        "category": pack.category.value,
        "author": pack.author,
        "version": pack.version,
        "prompts": pack.prompts
    }

@app.get("/prompt-packs/categories/{category}")
async def get_prompt_packs_by_category_endpoint(category: str):
    """Get prompt packs by category."""
    try:
        category_enum = PromptCategory(category)
    except ValueError:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=f"Invalid category '{category}'. Valid categories: {[c.value for c in PromptCategory]}")

    packs = get_prompt_packs_by_category(category_enum)
    return {
        "category": category,
        "packs": [
            {
                "id": pack.id,
                "name": pack.name,
                "description": pack.description,
                "prompt_count": len(pack.prompts)
            }
            for pack in packs
        ],
        "total": len(packs)
    }

@app.get("/prompt-packs/categories")
async def get_categories():
    """Get all available prompt pack categories."""
    return {
        "categories": [cat.value for cat in get_pack_categories()]
    }

@app.get("/prompt-packs/featured")
async def get_featured():
    """Get featured prompts from different categories."""
    return {
        "featured": get_featured_prompts(),
        "total": len(get_featured_prompts())
    }

@app.get("/prompt-packs/search")
async def search_prompts_endpoint(q: str):
    """Search for prompts containing the query string."""
    if not q or len(q.strip()) < 2:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters long")

    results = search_prompts(q.strip())
    return {
        "query": q,
        "results": results,
        "total": len(results)
    }

@app.post("/audit")
async def run_constitutional_audit(data: dict):
    text = data.get("draft_text", "").lower()
    if "you must" in text or "solution" in text:
        return {"passed": False, "reason": "Violation of Agency: Prescriptive language detected."}
    return {"passed": True, "reason": "Agency Preserved."}
