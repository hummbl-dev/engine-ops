import os
# Optional import of Google Gemini SDK – may be unavailable in test environments
try:
    import google.generativeai as genai
except ImportError:  # pragma: no cover
    genai = None  # type: ignore
# OpenAI and Anthropic SDKs are optional for testing environments.
# They will be imported lazily inside their respective provider functions.


def get_gemini_provider(api_key=None):
    if genai is None:
        raise ImportError("google.generativeai library is not installed. Install it to use Gemini provider.")
    key = api_key or os.getenv("GOOGLE_API_KEY")
    if not key:
        raise ValueError("GOOGLE_API_KEY not found")
    genai.configure(api_key=key)
    return genai.GenerativeModel('models/gemini-2.5-flash')

def get_openai_provider(api_key=None):
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise ImportError("openai library is not installed. Install it to use OpenAI provider.") from exc
    return OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))

def get_anthropic_provider(api_key=None):
    try:
        from anthropic import Anthropic
    except ImportError as exc:
        raise ImportError("anthropic library is not installed. Install it to use Anthropic provider.") from exc
    return Anthropic(api_key=api_key or os.getenv("ANTHROPIC_API_KEY"))

def generate_content(provider_name, prompt, context=""):
    """Unified interface for the Federated Grid."""
    full_prompt = f"{context}\n\n{prompt}"
    
    if provider_name.lower() == 'gemini':
        model = get_gemini_provider()
        response = model.generate_content(full_prompt)
        return response.text
    
    elif provider_name.lower() == 'openai':
        client = get_openai_provider()
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": full_prompt}]
        )
        return response.choices[0].message.content
        
    elif provider_name.lower() == 'anthropic':
        client = get_anthropic_provider()
        response = client.messages.create(
            model="claude-3-opus-20240229",
            max_tokens=1024,
            messages=[{"role": "user", "content": full_prompt}]
        )
        return response.content[0].text
    
    else:
        raise ValueError(f"Unknown provider: {provider_name}")
