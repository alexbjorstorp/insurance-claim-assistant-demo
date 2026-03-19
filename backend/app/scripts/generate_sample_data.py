#!/usr/bin/env python3
"""
Generate a sample Excel file with demo case data for import testing.
"""
import pandas as pd
from datetime import date, timedelta
from pathlib import Path

# Sample case data
cases_data = [
    {
        "case_number": "CLM-2026-101",
        "claim_number": "CLAIM-101",
        "policy_number": "POL-20001",
        "status": "new",
        "priority": "high",
        "sla_risk": "medium",
        "incident_date": (date.today() - timedelta(days=7)).isoformat(),
        "report_date": (date.today() - timedelta(days=5)).isoformat(),
        "due_date": (date.today() + timedelta(days=10)).isoformat(),
        "claimant_name": "Alice Johnson",
        "claimant_contact": "alice.johnson@email.com",
        "description": "Water damage to residential property from burst pipe",
        "category": "Property",
        "subcategory": "Water Damage",
        "claim_amount": 12500.00,
        "estimated_reserve": 15000.00,
    },
    {
        "case_number": "CLM-2026-102",
        "claim_number": "CLAIM-102",
        "policy_number": "POL-20002",
        "status": "in_progress",
        "priority": "critical",
        "sla_risk": "high",
        "incident_date": (date.today() - timedelta(days=2)).isoformat(),
        "report_date": (date.today() - timedelta(days=1)).isoformat(),
        "due_date": (date.today() + timedelta(days=2)).isoformat(),
        "claimant_name": "Robert Chen",
        "claimant_contact": "robert.chen@email.com",
        "description": "Major auto accident with multiple injuries",
        "category": "Auto",
        "subcategory": "Collision",
        "claim_amount": 85000.00,
        "estimated_reserve": 95000.00,
    },
    {
        "case_number": "CLM-2026-103",
        "claim_number": "CLAIM-103",
        "policy_number": "POL-20003",
        "status": "pending_review",
        "priority": "medium",
        "sla_risk": "low",
        "incident_date": (date.today() - timedelta(days=45)).isoformat(),
        "report_date": (date.today() - timedelta(days=40)).isoformat(),
        "due_date": (date.today() + timedelta(days=20)).isoformat(),
        "claimant_name": "Maria Garcia",
        "claimant_contact": "maria.garcia@email.com",
        "description": "Workplace injury - back strain from lifting",
        "category": "Workers Comp",
        "subcategory": "Injury",
        "claim_amount": 8500.00,
        "estimated_reserve": 10000.00,
    },
    {
        "case_number": "CLM-2026-104",
        "claim_number": "CLAIM-104",
        "policy_number": "POL-20004",
        "status": "new",
        "priority": "low",
        "sla_risk": "none",
        "incident_date": (date.today() - timedelta(days=20)).isoformat(),
        "report_date": (date.today() - timedelta(days=18)).isoformat(),
        "due_date": (date.today() + timedelta(days=30)).isoformat(),
        "claimant_name": "David Williams",
        "claimant_contact": "david.williams@email.com",
        "description": "Minor property damage - fence damaged by falling tree",
        "category": "Property",
        "subcategory": "Storm Damage",
        "claim_amount": 2500.00,
        "estimated_reserve": 3000.00,
    },
    {
        "case_number": "CLM-2026-105",
        "claim_number": "CLAIM-105",
        "policy_number": "POL-20005",
        "status": "in_progress",
        "priority": "high",
        "sla_risk": "medium",
        "incident_date": (date.today() - timedelta(days=10)).isoformat(),
        "report_date": (date.today() - timedelta(days=8)).isoformat(),
        "due_date": (date.today() + timedelta(days=7)).isoformat(),
        "claimant_name": "Sarah Thompson",
        "claimant_contact": "sarah.thompson@email.com",
        "description": "Theft of business equipment and inventory",
        "category": "Commercial",
        "subcategory": "Theft",
        "claim_amount": 45000.00,
        "estimated_reserve": 50000.00,
    },
]

def generate_sample_excel():
    """Generate sample Excel file."""
    output_dir = Path(__file__).parent.parent.parent / "data"
    output_dir.mkdir(exist_ok=True)
    
    output_file = output_dir / "sample_cases.xlsx"
    
    # Create DataFrame
    df = pd.DataFrame(cases_data)
    
    # Write to Excel
    df.to_excel(output_file, index=False, engine='openpyxl')
    
    print(f"✓ Sample Excel file created: {output_file}")
    print(f"  - {len(cases_data)} sample cases")
    print(f"\nTo import this file:")
    print(f"  docker-compose exec backend python -m app.scripts.import_excel")

if __name__ == "__main__":
    generate_sample_excel()
