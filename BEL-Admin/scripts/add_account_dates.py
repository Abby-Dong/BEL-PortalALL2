#!/usr/bin/env python3
"""
Script to add accountCreatedDate to all BEL profiles based on business logic:
- 21 people joined before July 2025 (random dates in 2024)
- 3 people joined in August 2025
- 2 people joined in September 2025 (already set)
"""

import json
import random
from datetime import datetime, timedelta

def generate_random_date(start_date, end_date):
    """Generate a random date between start_date and end_date"""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randrange(days_between)
    return start_date + timedelta(days=random_days)

def main():
    # Read the current belProfiles.json
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Define date ranges
    early_joiners_start = datetime(2024, 1, 1)
    early_joiners_end = datetime(2025, 6, 30)  # Before July 2025
    
    august_joiners_start = datetime(2025, 8, 1)
    august_joiners_end = datetime(2025, 8, 31)
    
    # Keep track of counts
    early_count = 0
    august_count = 0
    september_count = 0
    already_has_date = 0
    
    for bel in data['leaderboard']:
        # Skip if already has accountCreatedDate
        if 'accountCreatedDate' in bel:
            already_has_date += 1
            if '2025-09' in bel['accountCreatedDate']:
                september_count += 1
            continue
        
        # Assign dates based on business logic
        if early_count < 21:
            # Early joiners (before July 2025)
            random_date = generate_random_date(early_joiners_start, early_joiners_end)
            bel['accountCreatedDate'] = random_date.strftime('%Y-%m-%d')
            early_count += 1
        elif august_count < 3:
            # August 2025 joiners
            random_date = generate_random_date(august_joiners_start, august_joiners_end)
            bel['accountCreatedDate'] = random_date.strftime('%Y-%m-%d')
            august_count += 1
        else:
            # Default to early joiner if we somehow have more
            random_date = generate_random_date(early_joiners_start, early_joiners_end)
            bel['accountCreatedDate'] = random_date.strftime('%Y-%m-%d')
    
    # Write back to file
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Account dates added successfully!")
    print(f"Early joiners (before July 2025): {early_count}")
    print(f"August 2025 joiners: {august_count}")
    print(f"September 2025 joiners: {september_count}")
    print(f"Already had dates: {already_has_date}")
    print(f"Total BELs: {len(data['leaderboard'])}")

if __name__ == "__main__":
    main()