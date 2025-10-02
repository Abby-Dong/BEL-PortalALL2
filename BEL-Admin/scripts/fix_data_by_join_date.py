#!/usr/bin/env python3
"""
Fix BEL profiles data to ensure no data exists before their account creation date
"""

import json
from datetime import datetime

def load_json(filepath):
    """Load JSON file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, filepath):
    """Save JSON file with proper formatting"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_month_index(month_name):
    """Convert month name to index (0-11)"""
    month_mapping = {
        'January': 0, 'February': 1, 'March': 2, 'April': 3,
        'May': 4, 'June': 5, 'July': 6, 'August': 7,
        'September': 8, 'October': 9, 'November': 10, 'December': 11
    }
    return month_mapping.get(month_name, -1)

def fix_bel_data():
    """Fix BEL data to match account creation dates"""
    filepath = '/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json'
    
    # Load the data
    data = load_json(filepath)
    
    if 'leaderboard' not in data:
        print("No leaderboard data found")
        return
    
    print(f"Processing {len(data['leaderboard'])} BEL profiles...")
    
    for bel in data['leaderboard']:
        if 'accountCreatedDate' not in bel:
            print(f"Warning: {bel.get('name', 'Unknown')} has no accountCreatedDate")
            continue
            
        account_date = datetime.strptime(bel['accountCreatedDate'], '%Y-%m-%d')
        account_year = account_date.year
        account_month = account_date.month
        
        print(f"Processing {bel['name']} (joined: {bel['accountCreatedDate']})")
        
        if 'monthlyData' not in bel:
            continue
            
        # Process each year in monthlyData
        for year_str, year_data in bel['monthlyData'].items():
            year_int = int(year_str)
            
            # Process each month in the year
            for month_name, month_data in year_data.items():
                month_index = get_month_index(month_name)
                if month_index == -1:
                    continue
                    
                month_int = month_index + 1  # Convert to 1-12
                
                # Check if this month is before the account creation date
                current_date = datetime(year_int, month_int, 1)
                join_month_start = datetime(account_year, account_month, 1)
                
                if current_date < join_month_start:
                    # Clear data for months before joining
                    month_data['clicks'] = 0
                    month_data['orders'] = 0
                    month_data['revenue'] = 0
                    print(f"  Cleared data for {year_str} {month_name}")
    
    # Save the updated data
    save_json(data, filepath)
    print("Data fixing completed!")

if __name__ == "__main__":
    fix_bel_data()