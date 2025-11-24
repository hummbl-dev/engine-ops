import streamlit as st
import requests

st.set_page_config(page_title="Mission Control", layout="wide")
st.title("🚀 Sovereign Stack: Mission Control")

with st.sidebar:
    st.header("Configuration")
    provider = st.selectbox("Select Node", ["Gemini", "OpenAI", "Anthropic"])
    auto_approve = st.checkbox("Auto-Approve Workflows", value=False)

st.subheader("Transmission")
prompt = st.text_area("Input Signal")

if st.button("Transmit"):
    with st.spinner("Materializing..."):
        try:
            res = requests.post("http://localhost:8000/ignite", json={
                "provider": provider,
                "prompt": prompt
            })
            if res.status_code == 200:
                st.success("Payload Delivered")
                st.code(res.json()['payload'])
            else:
                st.error(f"Engine Failure: {res.status_code}")
        except Exception as e:
            st.error(f"Connection Lost: {e}")
