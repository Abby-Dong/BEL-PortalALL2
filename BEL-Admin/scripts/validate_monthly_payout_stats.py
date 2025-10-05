#!/usr/bin/env python3
"""
驗證修正後的2025年月度Payout統計
檢查每個月的數據是否與實際payout記錄一致
"""

import json
from datetime import datetime

def validate_monthly_payout_statistics():
    """驗證2025年每個月的payout統計"""
    
    # 載入數據
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/payouts.json', 'r', encoding='utf-8') as f:
        payout_data = json.load(f)
    
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json', 'r', encoding='utf-8') as f:
        bel_profiles = json.load(f)
    
    print("=== 2025年月度Payout統計驗證 ===\n")
    
    # 月份名稱映射
    month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    
    # 計算每個月的統計
    total_yearly_payout = 0
    monthly_stats = []
    
    for month_num in range(1, 13):  # 1-12月
        month_name = month_names[month_num - 1]
        
        # 計算該月的payout統計
        stats = calculate_month_stats_corrected(payout_data, bel_profiles, 2025, month_num)
        monthly_stats.append({
            'month': month_name,
            'month_num': month_num,
            'stats': stats
        })
        
        if stats['totalPayoutAmount'] > 0:
            total_yearly_payout += stats['totalPayoutAmount']
            print(f"{month_name:>12} 2025: Payout=${stats['totalPayoutAmount']:>10,.2f}, BELs={stats['activeBelCount']:>2}, Orders={stats['totalOrderCount']:>4}")
        else:
            print(f"{month_name:>12} 2025: 無數據")
    
    print(f"\n2025年總payout: ${total_yearly_payout:,.2f}")
    
    # 檢查9月vs8月的比較
    sep_stats = next((s for s in monthly_stats if s['month_num'] == 9), None)
    aug_stats = next((s for s in monthly_stats if s['month_num'] == 8), None)
    
    if sep_stats and aug_stats:
        print(f"\n=== 9月 vs 8月 比較 ===")
        payout_change = sep_stats['stats']['totalPayoutAmount'] - aug_stats['stats']['totalPayoutAmount']
        payout_percent = (payout_change / aug_stats['stats']['totalPayoutAmount']) * 100 if aug_stats['stats']['totalPayoutAmount'] > 0 else 0
        
        bel_change = sep_stats['stats']['activeBelCount'] - aug_stats['stats']['activeBelCount']
        order_change = sep_stats['stats']['totalOrderCount'] - aug_stats['stats']['totalOrderCount']
        order_percent = (order_change / aug_stats['stats']['totalOrderCount']) * 100 if aug_stats['stats']['totalOrderCount'] > 0 else 0
        
        print(f"Payout變化: ${payout_change:+,.2f} ({payout_percent:+.1f}%)")
        print(f"BEL變化: {bel_change:+d}")
        print(f"Orders變化: {order_change:+,} ({order_percent:+.1f}%)")
        
        # 預期前端顯示
        payout_trend = "Increased" if payout_change > 0 else "Decreased" if payout_change < 0 else "No change"
        bel_trend = "Increase" if bel_change > 0 else "Decrease" if bel_change < 0 else "No change"
        order_trend = "Increased" if order_change > 0 else "Decreased" if order_change < 0 else "No change"
        
        print(f"\n前端應顯示:")
        print(f"  Net Payout Amount: {payout_trend} in Sep. (MoM)")
        print(f"  Active BEL Count: {bel_trend} in Sep.")  
        print(f"  Total Orders: {order_trend} in Sep. (MoM)")
    
    # 驗證累計數據
    print(f"\n=== 累計統計驗證 ===")
    cumulative_payout = 0
    for month_data in monthly_stats:
        if month_data['stats']['totalPayoutAmount'] > 0:
            cumulative_payout += month_data['stats']['totalPayoutAmount']
            print(f"{month_data['month']:>12}: 月度=${month_data['stats']['totalPayoutAmount']:>10,.2f}, 累計=${cumulative_payout:>12,.2f}")

def calculate_month_stats_corrected(payout_data, bel_profiles, year, month):
    """使用修正後的邏輯計算月度統計（模擬前端修正後的計算）"""
    
    total_payout_amount = 0
    active_bel_ids = set()
    total_order_count = 0
    
    # 計算實際payout統計（使用payouts.json）
    for bel_entry in payout_data['belPayoutHistory']:
        month_payouts = [
            payout for payout in bel_entry['payoutHistory']
            if payout.get('year') == year and payout.get('month') == month
        ]
        
        if month_payouts:
            active_bel_ids.add(bel_entry['belId'])
            for payout in month_payouts:
                total_payout_amount += payout.get('netPayout', 0)
    
    # 計算order統計（使用belProfiles.json）
    month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December']
    month_name = month_names[month - 1]
    
    for leader in bel_profiles.get('leaderboard', []):
        monthly_data = leader.get('monthlyData', {})
        year_data = monthly_data.get(str(year), {})
        month_data = year_data.get(month_name, {})
        
        if month_data and month_data.get('orders'):
            total_order_count += month_data.get('orders', 0)
    
    # 計算BEL count（基於account creation date）
    active_bel_count = 0
    target_date = f"{year}-{month:02d}-31"  # 月末日期
    
    for leader in bel_profiles.get('leaderboard', []):
        creation_date = leader.get('accountCreatedDate')
        if creation_date and creation_date <= target_date:
            active_bel_count += 1
    
    return {
        'totalPayoutAmount': total_payout_amount,
        'activeBelCount': active_bel_count,
        'totalOrderCount': total_order_count
    }

if __name__ == "__main__":
    validate_monthly_payout_statistics()