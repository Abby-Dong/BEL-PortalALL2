#!/usr/bin/env python3
"""
驗證BEL數據更新效果的腳本
"""

import json

def validate_updates():
    """驗證數據更新效果"""
    
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print("=== BEL數據更新驗證報告 ===\n")
    
    # 統計級別分佈
    level_stats = {}
    september_2025_count = 0
    low_season_analysis = {"March": [], "April": [], "July": []}
    
    for bel in data["leaderboard"]:
        level = bel["level"]
        level_stats[level] = level_stats.get(level, 0) + 1
        
        monthly_data = bel.get("monthlyData", {})
        
        # 檢查2025年9月數據
        september_data = monthly_data.get("2025", {}).get("September", {})
        if september_data.get("clicks", 0) > 0:
            september_2025_count += 1
        
        # 分析淡季數據
        for year in ["2024", "2025"]:
            year_data = monthly_data.get(year, {})
            for month in ["March", "April", "July"]:
                month_data = year_data.get(month, {})
                if month_data.get("clicks", 0) > 0:
                    low_season_analysis[month].append({
                        "id": bel["id"],
                        "level": level,
                        "year": year,
                        "clicks": month_data.get("clicks", 0),
                        "orders": month_data.get("orders", 0),
                        "revenue": month_data.get("revenue", 0)
                    })
    
    # 報告級別統計
    print("1. 級別統計:")
    total_bels = sum(level_stats.values())
    for level, count in sorted(level_stats.items()):
        percentage = (count / total_bels) * 100
        print(f"   {level}: {count} 個BEL ({percentage:.1f}%)")
    print(f"   總計: {total_bels} 個BEL\n")
    
    # 報告9月數據完整性
    print("2. 2025年9月數據完整性:")
    print(f"   有數據的BEL: {september_2025_count}/{total_bels}")
    completion_rate = (september_2025_count / total_bels) * 100
    print(f"   完成度: {completion_rate:.1f}%\n")
    
    # 分析各級別的數據範圍
    print("3. 各級別9月數據範圍分析:")
    level_ranges = {}
    for bel in data["leaderboard"]:
        level = bel["level"]
        september_data = bel.get("monthlyData", {}).get("2025", {}).get("September", {})
        if september_data.get("clicks", 0) > 0:
            if level not in level_ranges:
                level_ranges[level] = {"clicks": [], "orders": [], "revenue": []}
            level_ranges[level]["clicks"].append(september_data["clicks"])
            level_ranges[level]["orders"].append(september_data["orders"])
            level_ranges[level]["revenue"].append(september_data["revenue"])
    
    for level in sorted(level_ranges.keys()):
        ranges = level_ranges[level]
        print(f"   {level}:")
        print(f"     Clicks: {min(ranges['clicks'])}-{max(ranges['clicks'])} (平均: {sum(ranges['clicks'])//len(ranges['clicks'])})")
        print(f"     Orders: {min(ranges['orders'])}-{max(ranges['orders'])} (平均: {sum(ranges['orders'])//len(ranges['orders'])})")
        print(f"     Revenue: {min(ranges['revenue'])}-{max(ranges['revenue'])} (平均: {sum(ranges['revenue'])//len(ranges['revenue'])})")
    
    print("\n4. 淡季數據調降效果:")
    for month in ["March", "April", "July"]:
        month_data = low_season_analysis[month]
        if month_data:
            avg_clicks = sum(d["clicks"] for d in month_data) // len(month_data)
            avg_orders = sum(d["orders"] for d in month_data) // len(month_data)
            avg_revenue = sum(d["revenue"] for d in month_data) // len(month_data)
            print(f"   {month}: {len(month_data)} 筆數據")
            print(f"     平均 Clicks: {avg_clicks}, Orders: {avg_orders}, Revenue: {avg_revenue}")
    
    print("\n=== 驗證完成 ===")

if __name__ == "__main__":
    validate_updates()