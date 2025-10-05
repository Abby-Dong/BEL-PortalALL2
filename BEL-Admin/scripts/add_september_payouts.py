#!/usr/bin/env python3
"""
添加2025年9月Payout數據腳本
根據BEL的級別和8月份的數據來生成9月份的合理數據
"""

import json
import random
from typing import Dict, Any

def load_bel_profiles():
    """載入BEL個人資料以獲取級別信息"""
    try:
        with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/belProfiles.json', 'r', encoding='utf-8') as f:
            profiles = json.load(f)
            # 創建BEL ID到級別的映射
            level_map = {}
            for bel in profiles.get('leaderboard', []):
                level_map[bel['id']] = bel['level']
            return level_map
    except Exception as e:
        print(f"無法載入BEL個人資料: {e}")
        return {}

def calculate_september_payout(bel_id: str, august_data: Dict, bel_level: str) -> Dict[str, Any]:
    """根據8月數據和BEL級別計算9月的payout數據"""
    
    # 級別係數 - 不同級別的表現差異
    level_multipliers = {
        'Leader': (1.05, 1.15),     # Leader級別表現較好
        'Exploder': (0.95, 1.10),  # Exploder級別中等表現
        'Enabler': (0.85, 1.05),   # Enabler級別穩定表現  
        'Builder': (0.80, 1.00),   # Builder級別基礎表現
        'Explorer': (0.75, 0.95)   # Explorer級別較低表現
    }
    
    # 獲取級別係數範圍，如果級別未知使用默認值
    min_mult, max_mult = level_multipliers.get(bel_level, (0.85, 1.05))
    
    # 9月份通常是旺季開始，基礎增長係數
    september_factor = random.uniform(1.02, 1.12)
    
    # 級別隨機係數
    level_factor = random.uniform(min_mult, max_mult)
    
    # 總體係數
    total_factor = september_factor * level_factor
    
    # 基於8月數據計算9月數據
    august_gross = august_data.get('grossPayout', 1000.0)
    
    # 計算9月的gross payout
    september_gross = round(august_gross * total_factor, 2)
    
    # WHT通常是gross payout的20%
    september_wht = round(september_gross * 0.20, 2)
    
    # Net payout = gross - wht
    september_net = round(september_gross - september_wht, 2)
    
    # 生成唯一的payout ID
    payout_id = f"PO-2025-{bel_id[-3:]}-09"
    
    return {
        "payoutId": payout_id,
        "year": 2025,
        "month": 9,
        "date": "2025-09-12",
        "grossPayout": september_gross,
        "wht": september_wht,
        "netPayout": september_net,
        "status": "Completed"
    }

def add_september_payouts():
    """為所有BEL添加2025年9月的payout數據"""
    
    # 載入BEL級別信息
    level_map = load_bel_profiles()
    print(f"載入了 {len(level_map)} 個BEL的級別信息")
    
    # 載入payout數據
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/payouts.json', 'r', encoding='utf-8') as f:
        payout_data = json.load(f)
    
    updated_count = 0
    skipped_count = 0
    
    for bel_entry in payout_data['belPayoutHistory']:
        bel_id = bel_entry['belId']
        bel_level = level_map.get(bel_id, 'Builder')  # 默認為Builder級別
        
        # 檢查是否已經有2025年9月的數據
        has_september = any(
            payout.get('year') == 2025 and payout.get('month') == 9
            for payout in bel_entry['payoutHistory']
        )
        
        if has_september:
            print(f"BEL {bel_id} 已經有2025年9月數據，跳過")
            skipped_count += 1
            continue
        
        # 找到2025年8月的數據作為基準
        august_data = None
        for payout in bel_entry['payoutHistory']:
            if payout.get('year') == 2025 and payout.get('month') == 8:
                august_data = payout
                break
        
        if not august_data:
            # 如果沒有8月數據，使用最近的數據或默認值
            if bel_entry['payoutHistory']:
                august_data = bel_entry['payoutHistory'][-1]
            else:
                august_data = {'grossPayout': 1000.0}
            print(f"BEL {bel_id} 沒有2025年8月數據，使用 {august_data.get('grossPayout', 1000)} 作為基準")
        
        # 生成9月數據
        september_payout = calculate_september_payout(bel_id, august_data, bel_level)
        
        # 添加到payoutHistory
        bel_entry['payoutHistory'].append(september_payout)
        
        print(f"為BEL {bel_id} ({bel_level}) 添加9月數據: ${september_payout['netPayout']:.2f}")
        updated_count += 1
    
    # 保存更新後的數據
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/payouts.json', 'w', encoding='utf-8') as f:
        json.dump(payout_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n=== 更新完成 ===")
    print(f"已更新: {updated_count} 個BEL")
    print(f"已跳過: {skipped_count} 個BEL (已有9月數據)")
    print(f"總計: {updated_count + skipped_count} 個BEL")
    
    # 顯示級別統計
    level_stats = {}
    for bel_id, level in level_map.items():
        level_stats[level] = level_stats.get(level, 0) + 1
    
    print(f"\n級別統計:")
    for level, count in sorted(level_stats.items()):
        print(f"  {level}: {count} 個BEL")

if __name__ == "__main__":
    add_september_payouts()