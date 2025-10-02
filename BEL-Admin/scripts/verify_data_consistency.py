#!/usr/bin/env python3
"""
Verify that BEL data matches their account creation dates
"""

import json
from datetime import datetime

def verify_data():
    """Verify BEL data consistency"""
    filepath = '/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json'
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    month_mapping = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12
    }
    
    issues = []
    
    for bel in data['leaderboard']:
        if 'accountCreatedDate' not in bel:
            issues.append(f"{bel['name']}: Missing accountCreatedDate")
            continue
            
        account_date = datetime.strptime(bel['accountCreatedDate'], '%Y-%m-%d')
        
        if 'monthlyData' not in bel:
            continue
            
        # Check each year and month
        for year_str, year_data in bel['monthlyData'].items():
            year_int = int(year_str)
            
            for month_name, month_data in year_data.items():
                month_int = month_mapping[month_name]
                current_date = datetime(year_int, month_int, 1)
                join_month_start = datetime(account_date.year, account_date.month, 1)
                
                # Check if there's data before joining
                if current_date < join_month_start:
                    if (month_data['clicks'] > 0 or 
                        month_data['orders'] > 0 or 
                        month_data['revenue'] > 0):
                        issues.append(f"{bel['name']}: Has data in {year_str} {month_name} before joining ({bel['accountCreatedDate']})")
    
    if issues:
        print("Data issues found:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ All BEL data is consistent with their account creation dates!")
        
        # Print summary statistics
        total_bel = len(data['leaderboard'])
        joined_before_2025 = len([b for b in data['leaderboard'] if b['accountCreatedDate'] < '2025-01-01'])
        joined_2025_aug = len([b for b in data['leaderboard'] if b['accountCreatedDate'].startswith('2025-08')])
        joined_2025_sep = len([b for b in data['leaderboard'] if b['accountCreatedDate'].startswith('2025-09')])
        
        print(f"\n📊 Summary:")
        print(f"  Total BELs: {total_bel}")
        print(f"  Joined before 2025: {joined_before_2025}")
        print(f"  Joined August 2025: {joined_2025_aug}")
        print(f"  Joined September 2025: {joined_2025_sep}")

if __name__ == "__main__":
    verify_data()