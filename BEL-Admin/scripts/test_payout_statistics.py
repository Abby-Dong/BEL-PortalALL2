#!/usr/bin/env python3
"""
測試Payout統計計算的準確性
檢查9月和8月的數據是否能正確被系統讀取和統計
"""

import json
from datetime import datetime

def test_payout_statistics():
    """測試payout統計計算"""
    
    # 載入數據
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/payouts.json', 'r', encoding='utf-8') as f:
        payout_data = json.load(f)
    
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json', 'r', encoding='utf-8') as f:
        bel_profiles = json.load(f)
    
    print("=== Payout統計數據測試 ===\n")
    
    # 計算9月(2025-09)統計
    september_stats = calculate_month_stats(payout_data, bel_profiles, 2025, 9)
    print("2025年9月統計:")
    print(f"  Net Payout Amount: ${september_stats['totalPayoutAmount']:,.2f}")
    print(f"  Active BEL Count: {september_stats['activeBelCount']}")
    print(f"  Total Order Count: {september_stats['totalOrderCount']:,}")
    
    # 計算8月(2025-08)統計
    august_stats = calculate_month_stats(payout_data, bel_profiles, 2025, 8)
    print(f"\n2025年8月統計:")
    print(f"  Net Payout Amount: ${august_stats['totalPayoutAmount']:,.2f}")
    print(f"  Active BEL Count: {august_stats['activeBelCount']}")
    print(f"  Total Order Count: {august_stats['totalOrderCount']:,}")
    
    # 計算MoM變化
    payout_growth = september_stats['totalPayoutAmount'] - august_stats['totalPayoutAmount']
    bel_growth = september_stats['activeBelCount'] - august_stats['activeBelCount']
    order_growth = september_stats['totalOrderCount'] - august_stats['totalOrderCount']
    
    print(f"\n=== 9月 vs 8月 MoM變化 ===")
    print(f"Net Payout Amount變化: ${payout_growth:,.2f} ({payout_growth/august_stats['totalPayoutAmount']*100:+.1f}%)" if august_stats['totalPayoutAmount'] > 0 else "N/A")
    print(f"Active BEL Count變化: {bel_growth:+d} ({bel_growth/august_stats['activeBelCount']*100:+.1f}%)" if august_stats['activeBelCount'] > 0 else "N/A")
    print(f"Total Order Count變化: {order_growth:+,} ({order_growth/august_stats['totalOrderCount']*100:+.1f}%)" if august_stats['totalOrderCount'] > 0 else "N/A")
    
    # 檢查數據完整性
    print(f"\n=== 數據完整性檢查 ===")
    
    # 檢查有9月payout數據的BEL
    bels_with_sep_payout = 0
    bels_with_aug_payout = 0
    
    for bel_entry in payout_data['belPayoutHistory']:
        has_sep = any(p.get('year') == 2025 and p.get('month') == 9 for p in bel_entry['payoutHistory'])
        has_aug = any(p.get('year') == 2025 and p.get('month') == 8 for p in bel_entry['payoutHistory'])
        
        if has_sep:
            bels_with_sep_payout += 1
        if has_aug:
            bels_with_aug_payout += 1
    
    print(f"有9月payout數據的BEL: {bels_with_sep_payout}")
    print(f"有8月payout數據的BEL: {bels_with_aug_payout}")
    
    # 檢查有9月order數據的BEL
    bels_with_sep_orders = 0
    bels_with_aug_orders = 0
    
    for leader in bel_profiles.get('leaderboard', []):
        monthly_data = leader.get('monthlyData', {})
        year_2025 = monthly_data.get('2025', {})
        
        sep_data = year_2025.get('September')
        aug_data = year_2025.get('August')
        
        if sep_data and sep_data.get('orders', 0) > 0:
            bels_with_sep_orders += 1
        if aug_data and aug_data.get('orders', 0) > 0:
            bels_with_aug_orders += 1
    
    print(f"有9月order數據的BEL: {bels_with_sep_orders}")
    print(f"有8月order數據的BEL: {bels_with_aug_orders}")

def calculate_month_stats(payout_data, bel_profiles, year, month):
    """計算特定月份的統計數據"""
    
    total_payout_amount = 0
    active_bel_ids = set()
    total_order_count = 0
    
    # 計算payout統計
    for bel_entry in payout_data['belPayoutHistory']:
        month_payouts = [
            payout for payout in bel_entry['payoutHistory']
            if payout.get('year') == year and payout.get('month') == month
        ]
        
        if month_payouts:
            active_bel_ids.add(bel_entry['belId'])
            for payout in month_payouts:
                total_payout_amount += payout.get('netPayout', 0)
    
    # 計算order統計
    month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    month_name = month_names[month - 1]
    
    for leader in bel_profiles.get('leaderboard', []):
        monthly_data = leader.get('monthlyData', {})
        year_data = monthly_data.get(str(year), {})
        month_data = year_data.get(month_name, {})
        
        if month_data and month_data.get('orders'):
            total_order_count += month_data.get('orders', 0)
    
    return {
        'totalPayoutAmount': total_payout_amount,
        'activeBelCount': len(active_bel_ids),
        'totalOrderCount': total_order_count
    }

if __name__ == "__main__":
    test_payout_statistics()