#!/usr/bin/env python3
"""
更新BEL資料腳本：
1. 確保每個BEL都有2025年9月的數據
2. 根據級別設定適當的數據範圍
3. 調降3、4、7月的數據營造淡旺季差別
"""

import json
import random
from typing import Dict, Any

# 各級別的基礎數據範圍
LEVEL_RANGES = {
    "Leader": {
        "clicks": (800, 1200),
        "orders": (25, 40),
        "revenue": (20000, 35000)
    },
    "Exploder": {
        "clicks": (500, 800),
        "orders": (15, 25),
        "revenue": (12000, 20000)
    },
    "Enabler": {
        "clicks": (300, 500),
        "orders": (8, 15),
        "revenue": (6000, 12000)
    },
    "Builder": {
        "clicks": (150, 300),
        "orders": (4, 8),
        "revenue": (3000, 6000)
    }
}

# 淡季月份調降係數
SLOW_MONTHS_FACTOR = {
    "March": 0.7,    # 3月調降30%
    "April": 0.75,   # 4月調降25%
    "July": 0.8      # 7月調降20%
}

def generate_monthly_data(level: str, month: str, base_factor: float = 1.0) -> Dict[str, int]:
    """根據級別和月份生成數據"""
    ranges = LEVEL_RANGES.get(level, LEVEL_RANGES["Builder"])
    
    # 應用淡季調降係數
    month_factor = SLOW_MONTHS_FACTOR.get(month, 1.0)
    total_factor = base_factor * month_factor
    
    clicks = int(random.randint(ranges["clicks"][0], ranges["clicks"][1]) * total_factor)
    orders = int(random.randint(ranges["orders"][0], ranges["orders"][1]) * total_factor)
    revenue = int(random.randint(ranges["revenue"][0], ranges["revenue"][1]) * total_factor)
    
    return {
        "clicks": clicks,
        "orders": orders,
        "revenue": revenue
    }

def update_bel_profiles():
    """更新BEL資料"""
    # 讀取現有資料
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated_count = 0
    
    for bel in data["leaderboard"]:
        level = bel["level"]
        monthly_data = bel.get("monthlyData", {})
        
        # 確保有2024和2025年的數據結構
        if "2024" not in monthly_data:
            monthly_data["2024"] = {}
        if "2025" not in monthly_data:
            monthly_data["2025"] = {}
        
        # 更新2024年的淡季月份數據
        for month in ["March", "April", "July"]:
            if month in monthly_data["2024"]:
                # 重新生成調降後的數據
                monthly_data["2024"][month] = generate_monthly_data(level, month)
        
        # 確保2025年有9月數據（包括檢查是否為空數據）
        september_data = monthly_data.get("2025", {}).get("September", {})
        if ("September" not in monthly_data["2025"] or 
            september_data.get("clicks", 0) == 0 and 
            september_data.get("orders", 0) == 0 and 
            september_data.get("revenue", 0) == 0):
            monthly_data["2025"]["September"] = generate_monthly_data(level, "September")
            updated_count += 1
        
        # 更新2025年的淡季月份數據
        for month in ["March", "April", "July"]:
            if month in monthly_data["2025"]:
                monthly_data["2025"][month] = generate_monthly_data(level, month)
        
        bel["monthlyData"] = monthly_data
    
    # 寫回文件
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"已更新 {updated_count} 個BEL的9月數據")
    print("已調降所有BEL的3、4、7月數據以營造淡旺季差別")
    
    # 顯示級別統計
    level_stats = {}
    for bel in data["leaderboard"]:
        level = bel["level"]
        level_stats[level] = level_stats.get(level, 0) + 1
    
    print("\n級別統計:")
    for level, count in level_stats.items():
        print(f"  {level}: {count} 個BEL")

if __name__ == "__main__":
    update_bel_profiles()