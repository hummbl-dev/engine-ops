"""
Prompt Packs System for Engine-Ops

Pre-built prompt collections organized by category and use case.
Provides curated prompts that users can easily access and customize.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum


class PromptCategory(Enum):
    """Categories for organizing prompt packs."""
    STRATEGY = "strategy"
    LEADERSHIP = "leadership"
    PHILOSOPHY = "philosophy"
    BUSINESS = "business"
    PERSONAL = "personal"
    CREATIVE = "creative"
    TECHNICAL = "technical"


@dataclass
class PromptPack:
    """A collection of related prompts."""
    id: str
    name: str
    description: str
    category: PromptCategory
    prompts: List[Dict[str, str]]
    author: str = "Engine-Ops Team"
    version: str = "1.0.0"


# Pre-built prompt packs
STRATEGY_PACK = PromptPack(
    id="strategy_basics",
    name="Strategic Planning Fundamentals",
    description="Essential prompts for strategic thinking and planning",
    category=PromptCategory.STRATEGY,
    prompts=[
        {
            "title": "SWOT Analysis",
            "topic": "Conduct a comprehensive SWOT analysis for my current situation. What are my key strengths, weaknesses, opportunities, and threats?",
            "member": "sun_tzu",
            "description": "Classic strategic analysis framework"
        },
        {
            "title": "Competitive Positioning",
            "topic": "How should I position myself against my competitors? What are the key terrain advantages I should seek?",
            "member": "sun_tzu",
            "description": "Strategic positioning and competitive advantage"
        },
        {
            "title": "Risk Assessment",
            "topic": "What are the major risks in my current plan? How can I prepare for unexpected developments?",
            "member": "machiavelli",
            "description": "Risk analysis and contingency planning"
        },
        {
            "title": "Long-term Vision",
            "topic": "What should my long-term vision be? How do I balance immediate needs with future goals?",
            "member": "marcus_aurelius",
            "description": "Strategic foresight and vision setting"
        }
    ]
)

LEADERSHIP_PACK = PromptPack(
    id="leadership_essentials",
    name="Leadership & Management",
    description="Prompts for effective leadership and team management",
    category=PromptCategory.LEADERSHIP,
    prompts=[
        {
            "title": "Team Motivation",
            "topic": "How can I best motivate and inspire my team? What leadership qualities should I cultivate?",
            "member": "marcus_aurelius",
            "description": "Inspiring and motivating teams"
        },
        {
            "title": "Conflict Resolution",
            "topic": "How should I handle conflicts within my team? What principles guide effective mediation?",
            "member": "sun_tzu",
            "description": "Managing team conflicts and disputes"
        },
        {
            "title": "Decision Making",
            "topic": "How do I make difficult decisions that affect others? What factors should I consider?",
            "member": "machiavelli",
            "description": "Ethical decision-making under pressure"
        },
        {
            "title": "Change Management",
            "topic": "How should I lead my team through organizational change? What resistance should I anticipate?",
            "member": "benjamin_franklin",
            "description": "Leading through transitions and change"
        }
    ]
)

PERSONAL_DEVELOPMENT_PACK = PromptPack(
    id="personal_growth",
    name="Personal Development & Growth",
    description="Prompts for self-improvement and personal philosophy",
    category=PromptCategory.PERSONAL,
    prompts=[
        {
            "title": "Self-Discipline",
            "topic": "How can I develop greater self-discipline? What habits should I cultivate for long-term success?",
            "member": "marcus_aurelius",
            "description": "Building personal discipline and habits"
        },
        {
            "title": "Resilience Building",
            "topic": "How do I build resilience in the face of adversity? What mindset shifts are necessary?",
            "member": "marcus_aurelius",
            "description": "Developing mental toughness and resilience"
        },
        {
            "title": "Wisdom Seeking",
            "topic": "What wisdom should I seek in my current life stage? How do I distinguish true wisdom from mere knowledge?",
            "member": "ibn_rushd",
            "description": "Pursuing deeper understanding and wisdom"
        },
        {
            "title": "Purpose Discovery",
            "topic": "How do I discover my true purpose? What questions should I ask myself about meaning and direction?",
            "member": "paulo_freire",
            "description": "Finding personal purpose and meaning"
        }
    ]
)

BUSINESS_PACK = PromptPack(
    id="business_strategy",
    name="Business Strategy & Operations",
    description="Prompts for business planning and operational excellence",
    category=PromptCategory.BUSINESS,
    prompts=[
        {
            "title": "Market Entry",
            "topic": "How should I enter this new market? What strategic positioning will give me the best advantage?",
            "member": "sun_tzu",
            "description": "Strategic market entry and positioning"
        },
        {
            "title": "Negotiation Tactics",
            "topic": "What negotiation tactics should I employ in this business deal? How do I balance firmness with flexibility?",
            "member": "machiavelli",
            "description": "Business negotiation and deal-making"
        },
        {
            "title": "Innovation Strategy",
            "topic": "How should I approach innovation in my organization? What balance between stability and change is optimal?",
            "member": "benjamin_franklin",
            "description": "Fostering innovation while maintaining stability"
        },
        {
            "title": "Crisis Management",
            "topic": "How should I respond to this business crisis? What principles guide effective crisis leadership?",
            "member": "sun_tzu",
            "description": "Managing business crises and emergencies"
        }
    ]
)

CREATIVE_PACK = PromptPack(
    id="creative_problem_solving",
    name="Creative Problem Solving",
    description="Prompts for innovative thinking and creative challenges",
    category=PromptCategory.CREATIVE,
    prompts=[
        {
            "title": "Innovation Mindset",
            "topic": "How can I cultivate a more innovative mindset? What barriers to creativity should I overcome?",
            "member": "benjamin_franklin",
            "description": "Developing creative thinking habits"
        },
        {
            "title": "Problem Reframing",
            "topic": "How should I reframe this seemingly intractable problem? What new perspectives might reveal solutions?",
            "member": "ibn_rushd",
            "description": "Seeing problems from new angles"
        },
        {
            "title": "Creative Constraints",
            "topic": "How can I use constraints as fuel for creativity rather than limitations? What opportunities do restrictions create?",
            "member": "sun_tzu",
            "description": "Turning limitations into creative advantages"
        },
        {
            "title": "Visionary Thinking",
            "topic": "How do I develop visionary thinking? What separates visionaries from mere planners?",
            "member": "paulo_freire",
            "description": "Developing visionary leadership"
        }
    ]
)


# Registry of all available prompt packs
PROMPT_PACKS_REGISTRY: Dict[str, PromptPack] = {
    "strategy_basics": STRATEGY_PACK,
    "leadership_essentials": LEADERSHIP_PACK,
    "personal_growth": PERSONAL_DEVELOPMENT_PACK,
    "business_strategy": BUSINESS_PACK,
    "creative_problem_solving": CREATIVE_PACK,
}


def get_prompt_pack(pack_id: str) -> Optional[PromptPack]:
    """Get a specific prompt pack by ID."""
    return PROMPT_PACKS_REGISTRY.get(pack_id)


def get_prompt_packs_by_category(category: PromptCategory) -> List[PromptPack]:
    """Get all prompt packs in a specific category."""
    return [pack for pack in PROMPT_PACKS_REGISTRY.values() if pack.category == category]


def get_all_prompt_packs() -> List[PromptPack]:
    """Get all available prompt packs."""
    return list(PROMPT_PACKS_REGISTRY.values())


def get_pack_categories() -> List[PromptCategory]:
    """Get all available prompt pack categories."""
    return list(PromptCategory)


def search_prompts(query: str) -> List[Dict[str, str]]:
    """Search for prompts containing the query string."""
    results = []
    for pack in PROMPT_PACKS_REGISTRY.values():
        for prompt in pack.prompts:
            if (query.lower() in prompt["title"].lower() or
                query.lower() in prompt["topic"].lower() or
                query.lower() in prompt["description"].lower()):
                results.append({
                    "pack_id": pack.id,
                    "pack_name": pack.name,
                    "category": pack.category.value,
                    **prompt
                })
    return results


def get_featured_prompts() -> List[Dict[str, str]]:
    """Get a curated selection of featured prompts from different categories."""
    featured = []

    # One prompt from each category
    categories = [PromptCategory.STRATEGY, PromptCategory.LEADERSHIP,
                 PromptCategory.PERSONAL, PromptCategory.BUSINESS]

    for category in categories:
        packs = get_prompt_packs_by_category(category)
        if packs:
            # Take first prompt from first pack in category
            pack = packs[0]
            if pack.prompts:
                featured.append({
                    "pack_id": pack.id,
                    "pack_name": pack.name,
                    "category": pack.category.value,
                    **pack.prompts[0]
                })

    return featured