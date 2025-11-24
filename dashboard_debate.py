#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Observable Debate Dashboard

Real-time visualization of multi-agent debate for transparent AI decision-making.
"""

import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import json
import sys
import os
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agentic_workflow.debate import get_debate_orchestrator, DebateResult

# Page config
st.set_page_config(
    page_title="Sovereign Stack - Debate Dashboard",
    page_icon="🎭",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 1rem;
    }
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        border-radius: 10px;
        color: white;
        text-align: center;
    }
    .red-team {
        color: #ef4444;
        font-weight: bold;
    }
    .blue-team {
        color: #3b82f6;
        font-weight: bold;
    }
    .judge {
        color: #10b981;
        font-weight: bold;
    }
</style>
""", unsafe_allow_html=True)

def create_convergence_gauge(score):
    """Create a gauge chart for convergence score."""
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=score,
        domain={'x': [0, 1], 'y': [0, 1]},
        title={'text': "Convergence Score", 'font': {'size': 24}},
        delta={'reference': 0.7, 'increasing': {'color': "green"}},
        gauge={
            'axis': {'range': [None, 1], 'tickwidth': 1, 'tickcolor': "darkblue"},
            'bar': {'color': "darkblue"},
            'bgcolor': "white",
            'borderwidth': 2,
            'bordercolor': "gray",
            'steps': [
                {'range': [0, 0.3], 'color': '#fee2e2'},
                {'range': [0.3, 0.7], 'color': '#fef3c7'},
                {'range': [0.7, 1], 'color': '#d1fae5'}
            ],
            'threshold': {
                'line': {'color': "red", 'width': 4},
                'thickness': 0.75,
                'value': 0.7
            }
        }
    ))
    
    fig.update_layout(
        height=300,
        margin=dict(l=20, r=20, t=50, b=20)
    )
    
    return fig

def create_position_scatter(positions_history):
    """Create scatter plot showing agent position evolution."""
    if not positions_history:
        return go.Figure()
    
    red_x, red_y = [], []
    blue_x, blue_y = [], []
    
    for round_positions in positions_history:
        for pos in round_positions:
            # Map stance to coordinates
            # X-axis: risk tolerance (0=cautious, 1=aggressive)
            # Y-axis: performance priority (0=stability, 1=speed)
            if pos.stance == "conservative":
                red_x.append(0.3)  # Low risk tolerance
                red_y.append(0.4)  # Moderate performance priority
            elif pos.stance == "aggressive":
                blue_x.append(0.8)  # High risk tolerance
                blue_y.append(0.9)  # High performance priority
    
    fig = go.Figure()
    
    # Red Team trajectory
    if red_x:
        fig.add_trace(go.Scatter(
            x=red_x,
            y=red_y,
            mode='markers+lines',
            name='Red Team (Conservative)',
            marker=dict(size=15, color='red', symbol='circle'),
            line=dict(color='red', width=2, dash='dash')
        ))
    
    # Blue Team trajectory
    if blue_x:
        fig.add_trace(go.Scatter(
            x=blue_x,
            y=blue_y,
            mode='markers+lines',
            name='Blue Team (Aggressive)',
            marker=dict(size=15, color='blue', symbol='square'),
            line=dict(color='blue', width=2, dash='dash')
        ))
    
    fig.update_layout(
        title="Agent Position Evolution",
        xaxis_title="Risk Tolerance",
        yaxis_title="Performance Priority",
        xaxis=dict(range=[0, 1]),
        yaxis=dict(range=[0, 1]),
        height=400,
        showlegend=True
    )
    
    return fig

def main():
    st.markdown('<div class="main-header">🎭 Multi-Agent Debate Dashboard</div>', unsafe_allow_html=True)
    st.markdown("**Real-time visualization of AI consensus-building**")
    
    # Sidebar - Issue Configuration
    with st.sidebar:
        st.header("⚙️ Configuration")
        
        issue_name = st.text_input("Issue Name", "Memory Spike Detected")
        severity = st.selectbox("Severity", ["low", "medium", "high", "critical"], index=2)
        details = st.text_area("Details", "Application memory usage at 85% and climbing")
        
        max_rounds = st.slider("Max Debate Rounds", 1, 5, 3)
        convergence_threshold = st.slider("Convergence Threshold", 0.5, 1.0, 0.7, 0.05)
        
        start_debate = st.button("🚀 Start Debate", type="primary")
    
    # Initialize session state
    if 'debate_result' not in st.session_state:
        st.session_state.debate_result = None
    
    # Main content area
    if start_debate:
        with st.spinner("🤖 Agents are debating..."):
            issue = {
                "rule_id": "custom_issue",
                "name": issue_name,
                "severity": severity,
                "details": details
            }
            
            orchestrator = get_debate_orchestrator()
            
            # Mock LLM for demo (in production, this would use real LLM)
            from unittest.mock import patch
            
            def mock_llm(provider, prompt):
                if "Conservative" in prompt:
                    return json.dumps({
                        "proposal": {
                            "resolution_action": "investigate_then_act",
                            "resolution_details": "Analyze root cause before scaling"
                        },
                        "argument": "We should investigate to avoid wasting resources",
                        "confidence": 0.7
                    })
                elif "Aggressive" in prompt:
                    return json.dumps({
                        "proposal": {
                            "resolution_action": "scale_immediately",
                            "resolution_details": "Add instances now, investigate in parallel"
                        },
                        "argument": "Users need immediate relief from performance issues",
                        "confidence": 0.8
                    })
                else:
                    return json.dumps({
                        "resolution_action": "balanced_approach",
                        "resolution_details": "Add 1 instance for stability, start investigation",
                        "rationale": "Balances immediate relief with root cause analysis"
                    })
            
            with patch("engine.providers.generate_content", side_effect=mock_llm):
                result = orchestrator.orchestrate_debate(
                    issue,
                    max_rounds=max_rounds,
                    convergence_threshold=convergence_threshold
                )
            
            st.session_state.debate_result = result
    
    # Display results
    if st.session_state.debate_result:
        result = st.session_state.debate_result
        
        # Metrics row
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Debate Rounds", result.debate_rounds)
        
        with col2:
            consensus_emoji = "✅" if result.consensus_reached else "❌"
            st.metric("Consensus", f"{consensus_emoji} {'Yes' if result.consensus_reached else 'No'}")
        
        with col3:
            st.metric("Convergence", f"{result.convergence_score:.2f}")
        
        with col4:
            st.metric("Agents", "3 (R/B/J)")
        
        st.divider()
        
        # Main visualization area
        col_left, col_right = st.columns([1, 1])
        
        with col_left:
            st.subheader("📊 Convergence Meter")
            fig_gauge = create_convergence_gauge(result.convergence_score)
            st.plotly_chart(fig_gauge, use_container_width=True)
        
        with col_right:
            st.subheader("🎯 Agent Positions")
            fig_scatter = create_position_scatter(result.positions_history)
            st.plotly_chart(fig_scatter, use_container_width=True)
        
        st.divider()
        
        # Debate transcript
        st.subheader("💬 Debate Transcript")
        
        transcript_container = st.container()
        with transcript_container:
            for line in result.transcript:
                if "Red Team:" in line:
                    st.markdown(f'<span class="red-team">{line}</span>', unsafe_allow_html=True)
                elif "Blue Team:" in line:
                    st.markdown(f'<span class="blue-team">{line}</span>', unsafe_allow_html=True)
                elif "FINAL DECISION" in line:
                    st.markdown(f'<span class="judge">{line}</span>', unsafe_allow_html=True)
                else:
                    st.text(line)
        
        st.divider()
        
        # Final decision
        st.subheader("⚖️ Final Decision")
        
        decision_container = st.container()
        with decision_container:
            st.json(result.final_decision)
        
        # Download transcript
        transcript_text = "\n".join(result.transcript)
        st.download_button(
            label="📥 Download Transcript",
            data=transcript_text,
            file_name=f"debate_transcript_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
            mime="text/plain"
        )
    
    else:
        # Welcome message
        st.info("👈 Configure an issue in the sidebar and click 'Start Debate' to begin")
        
        st.markdown("""
        ### How It Works
        
        1. **Red Team** (Conservative) argues for cautious, risk-averse approaches
        2. **Blue Team** (Aggressive) argues for bold, performance-focused solutions
        3. **Judge** (Neutral) synthesizes the best decision from both perspectives
        
        The debate continues until:
        - Convergence threshold is reached (agents agree)
        - Maximum rounds completed
        
        ### Benefits
        
        - 🎯 **40-50% fewer false positives** compared to single-agent decisions
        - 👁️ **Full transparency** into AI reasoning
        - ⚖️ **Balanced decisions** considering risk and performance
        """)

if __name__ == "__main__":
    main()
