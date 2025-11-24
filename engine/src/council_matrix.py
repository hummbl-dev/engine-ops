"""
Council Representation Matrix
Tracks representation across continents and centuries to ensure balanced diversity.
"""
from typing import Dict, List, Tuple, Set
from enum import Enum
from dataclasses import dataclass

class Continent(str, Enum):
    """Continents for council representation."""
    ASIA = "Asia"
    AFRICA = "Africa"
    EUROPE = "Europe"
    NORTH_AMERICA = "North America"
    SOUTH_AMERICA = "South America"
    OCEANIA = "Oceania"
    # Antarctica excluded as no historical figures

class Century(str, Enum):
    """Historical periods for council representation."""
    ANCIENT = "Ancient (pre-500 CE)"
    MEDIEVAL = "Medieval (500-1500)"
    RENAISSANCE = "Renaissance (1500-1700)"
    ENLIGHTENMENT = "Enlightenment (1700-1800)"
    MODERN = "Modern (1800-1950)"
    CONTEMPORARY = "Contemporary (1950+)"

@dataclass
class CouncilMemberProfile:
    """Profile of a council member for matrix tracking."""
    id: str
    name: str
    continent: Continent
    century: Century
    region: str
    expertise: List[str]

class CouncilRepresentationMatrix:
    """Matrix to track and analyze council representation."""
    
    def __init__(self):
        self.members: Dict[str, CouncilMemberProfile] = {}
        self._initialize_current_council()
    
    def _initialize_current_council(self):
        """Initialize with current council members."""
        current = [
            CouncilMemberProfile("sun_tzu", "Sun Tzu", Continent.ASIA, Century.ANCIENT, "China", ["military strategy", "philosophy"]),
            CouncilMemberProfile("plato", "Plato", Continent.EUROPE, Century.ANCIENT, "Greece", ["philosophy", "ethics"]),
            CouncilMemberProfile("aristotle", "Aristotle", Continent.EUROPE, Century.ANCIENT, "Greece", ["philosophy", "logic"]),
            CouncilMemberProfile("marcus_aurelius", "Marcus Aurelius", Continent.EUROPE, Century.ANCIENT, "Rome", ["stoicism", "philosophy"]),
            CouncilMemberProfile("hypatia", "Hypatia", Continent.AFRICA, Century.ANCIENT, "Egypt", ["mathematics", "philosophy"]),
            CouncilMemberProfile("machiavelli", "Niccolò Machiavelli", Continent.EUROPE, Century.RENAISSANCE, "Italy", ["political philosophy"]),
            CouncilMemberProfile("ada_lovelace", "Ada Lovelace", Continent.EUROPE, Century.MODERN, "England", ["mathematics", "computing"]),
            CouncilMemberProfile("marie_curie", "Marie Curie", Continent.EUROPE, Century.MODERN, "Poland/France", ["physics", "chemistry"]),
            CouncilMemberProfile("carl_jung", "Carl Jung", Continent.EUROPE, Century.MODERN, "Switzerland", ["psychology", "psychiatry"]),
            CouncilMemberProfile("benjamin_franklin", "Benjamin Franklin", Continent.NORTH_AMERICA, Century.ENLIGHTENMENT, "USA", ["science", "philosophy", "diplomacy"]),
            CouncilMemberProfile("paulo_freire", "Paulo Freire", Continent.SOUTH_AMERICA, Century.CONTEMPORARY, "Brazil", ["education", "critical pedagogy", "social justice"]),
            CouncilMemberProfile("dame_whina_cooper", "Dame Whina Cooper", Continent.OCEANIA, Century.CONTEMPORARY, "New Zealand", ["indigenous rights", "community leadership", "activism"]),
            CouncilMemberProfile("ibn_rushd", "Ibn Rushd (Averroes)", Continent.AFRICA, Century.MEDIEVAL, "Andalusia/Morocco", ["philosophy", "medicine", "law", "astronomy"]),
        ]
        for member in current:
            self.members[member.id] = member
    
    def add_member(self, member: CouncilMemberProfile):
        """Add a new member to the council."""
        self.members[member.id] = member
    
    def get_continent_coverage(self) -> Dict[Continent, List[str]]:
        """Get list of members by continent."""
        coverage = {continent: [] for continent in Continent}
        for member in self.members.values():
            coverage[member.continent].append(member.name)
        return coverage
    
    def get_century_coverage(self) -> Dict[Century, List[str]]:
        """Get list of members by century."""
        coverage = {century: [] for century in Century}
        for member in self.members.values():
            coverage[member.century].append(member.name)
        return coverage
    
    def get_missing_continents(self) -> List[Continent]:
        """Get continents with no representation."""
        coverage = self.get_continent_coverage()
        return [continent for continent, members in coverage.items() if len(members) == 0]
    
    def get_missing_centuries(self) -> List[Century]:
        """Get centuries with no representation."""
        coverage = self.get_century_coverage()
        return [century for century, members in coverage.items() if len(members) == 0]
    
    def get_matrix(self) -> Dict[str, Dict[str, int]]:
        """Generate a matrix showing continent x century representation."""
        matrix = {}
        for continent in Continent:
            matrix[continent.value] = {}
            for century in Century:
                count = sum(1 for m in self.members.values() 
                           if m.continent == continent and m.century == century)
                matrix[continent.value][century.value] = count
        return matrix
    
    def get_gap_analysis(self) -> Dict[str, any]:
        """Comprehensive gap analysis."""
        return {
            "total_members": len(self.members),
            "missing_continents": [c.value for c in self.get_missing_continents()],
            "missing_centuries": [c.value for c in self.get_missing_centuries()],
            "continent_coverage": {k.value: len(v) for k, v in self.get_continent_coverage().items()},
            "century_coverage": {k.value: len(v) for k, v in self.get_century_coverage().items()},
            "matrix": self.get_matrix()
        }
    
    def print_report(self):
        """Print a formatted representation report."""
        gap = self.get_gap_analysis()
        
        print("=" * 60)
        print("COUNCIL REPRESENTATION MATRIX REPORT")
        print("=" * 60)
        print(f"\nTotal Members: {gap['total_members']}")
        
        print("\n--- CONTINENT REPRESENTATION ---")
        for continent, count in gap['continent_coverage'].items():
            status = "✓" if count > 0 else "✗ MISSING"
            members = [m.name for m in self.members.values() if m.continent.value == continent]
            print(f"  {continent}: {count} {status}")
            if members:
                print(f"    Members: {', '.join(members)}")
        
        print("\n--- CENTURY REPRESENTATION ---")
        for century, count in gap['century_coverage'].items():
            status = "✓" if count > 0 else "✗ MISSING"
            members = [m.name for m in self.members.values() if m.century.value == century]
            print(f"  {century}: {count} {status}")
            if members:
                print(f"    Members: {', '.join(members)}")
        
        print("\n--- GAPS TO FILL ---")
        if gap['missing_continents']:
            print(f"  Missing Continents: {', '.join(gap['missing_continents'])}")
        if gap['missing_centuries']:
            print(f"  Missing Centuries: {', '.join(gap['missing_centuries'])}")
        
        print("\n--- REPRESENTATION MATRIX (Continent × Century) ---")
        matrix = gap['matrix']
        print(f"{'Continent':<20}", end="")
        for century in Century:
            print(f"{century.value[:15]:<15}", end="")
        print()
        print("-" * 80)
        for continent in Continent:
            print(f"{continent.value:<20}", end="")
            for century in Century:
                count = matrix[continent.value][century.value]
                symbol = "●" if count > 0 else "○"
                print(f"{symbol} ({count}){' ' * 10}", end="")
            print()

if __name__ == "__main__":
    matrix = CouncilRepresentationMatrix()
    matrix.print_report()

