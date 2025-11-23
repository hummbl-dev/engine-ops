"""Adapter module for generating advice using Google Gemini with persona-specific instructions."""
import os
import asyncio
from typing import Optional
from enum import Enum
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file in the engine directory
import pathlib
env_path = pathlib.Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class CouncilMember(str, Enum):
    """Sovereign Council members based on v1.0 spec."""
    sun_tzu = "sun_tzu"
    marcus_aurelius = "marcus_aurelius"
    machiavelli = "machiavelli"

# Persona instructions (The "World Bible")
PERSONA_INSTRUCTIONS = {
    CouncilMember.sun_tzu: """You are Sun Tzu, the ancient Chinese military strategist and philosopher.

Core Principles:
- Know yourself and know your enemy
- The supreme art of war is to subdue the enemy without fighting
- Appear weak when you are strong, and strong when you are weak
- All warfare is based on deception
- Attack when they are unprepared, appear where you are not expected
- Consider terrain, timing, and the element of surprise

Your advice should focus on: strategic positioning, timing, deception, and understanding the battlefield.
Do not use prescriptive language like "you must" or "solution" - instead, offer guidance that preserves agency.""",

    CouncilMember.marcus_aurelius: """You are Marcus Aurelius, the Stoic philosopher-emperor of Rome.

Core Principles:
- You have power over your mind, not outside events
- The impediment to action advances action. What stands in the way becomes the way
- Focus on what is within your control, accept what is not
- Act with virtue regardless of circumstances
- External things are not the problem; it's your judgment of them

Your advice should focus on: internal control, stoic acceptance, virtue, and finding strength through adversity.
Do not use prescriptive language like "you must" or "solution" - instead, offer guidance that preserves agency.""",

    CouncilMember.machiavelli: """You are Niccolò Machiavelli, the Renaissance political philosopher.

Core Principles:
- It is better to be feared than loved, if you cannot be both
- Men judge generally more by the eye than by the hand
- Maintain your reputation carefully—appearances matter more than reality
- Never attempt to win by force what can be won by deception
- The ends justify the means when survival is at stake

Your advice should focus on: power dynamics, reputation management, strategic ruthlessness, and maintaining control.
Do not use prescriptive language like "you must" or "solution" - instead, offer guidance that preserves agency."""
}

def _generate_advice_sync(topic: str, member: CouncilMember, context: Optional[str] = None) -> str:
    """
    Synchronous helper function to generate advice using Google Gemini.
    This runs in a thread pool to avoid blocking the async event loop.
    """
    # Initialize Gemini (using API key from environment)
    api_key = os.getenv('GOOGLE_AI_API_KEY')
    if not api_key:
        raise ValueError("GOOGLE_AI_API_KEY environment variable not set. Please add it to your .env file.")
    
    try:
        genai.configure(api_key=api_key)
        # Use gemini-2.5-pro for best quality, or gemini-2.5-flash for faster/cheaper
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        # Build the system prompt
        persona = PERSONA_INSTRUCTIONS[member]
        
        prompt = f"""{persona}

The user is asking about: {topic}
{f"Additional context: {context}" if context else ""}

Provide strategic advice in the style of this council member. Be concise but profound (2-4 sentences).
Remember: Do not use prescriptive language like "you must" or "solution" - preserve the user's agency.
"""
        
        response = model.generate_content(prompt)
        if not response or not response.text:
            raise ValueError("Empty response from Gemini API")
        return response.text.strip()
    except Exception as e:
        # Log the full error for debugging
        import traceback
        print(f"Adapter error in _generate_advice_sync: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        raise

async def generate_advice(topic: str, member: CouncilMember, context: Optional[str] = None) -> str:
    """
    Generate advice using Google Gemini with persona-specific instructions.
    This is an async wrapper that runs the sync Gemini call in a thread pool with timeout.
    
    Args:
        topic: The topic/question to address
        member: The council member to consult
        context: Optional additional context
    
    Returns:
        Generated advice string
    """
    try:
        # Run the sync Gemini call in a thread pool with a 30-second timeout
        advice = await asyncio.wait_for(
            asyncio.to_thread(_generate_advice_sync, topic, member, context),
            timeout=30.0
        )
        return advice
    except asyncio.TimeoutError:
        print("Gemini API call timed out after 30 seconds")
        return f"Regarding {topic}, {member.value} advises: Consider the strategic implications carefully. The terrain and timing matter greatly."
    except Exception as e:
        import traceback
        print(f"Error generating advice: {type(e).__name__}: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return f"Regarding {topic}, {member.value} advises: Consider the strategic implications carefully. The terrain and timing matter greatly."
