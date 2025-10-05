#!/usr/bin/env python3
"""
驗證2025年9月Payout數據腳本
檢查所有BEL是否都有完整的2025年9月payout數據
"""

import json
from datetime import datetime

def validate_september_payouts():
    """驗證2025年9月的payout數據完整性"""
    
    # 載入payout數據
    with open('/Users/abbydong/Documents/GitHub/BEL-PortalALL2/BEL-Admin/data/payouts.json', 'r', encoding='utf-8') as f:
        payout_data = json.load(f)
    
    print("=== 2025年9月Payout數據驗證 ===\n")
    
    total_bels = len(payout_data['belPayoutHistory'])
    bels_with_september = 0
    september_total_gross = 0
    september_total_net = 0
    
    missing_september = []
    invalid_data = []
    
    for bel_entry in payout_data['belPayoutHistory']:
        bel_id = bel_entry['belId']
        
        # 檢查是否有2025年9月的數據
        september_payouts = [
            payout for payout in bel_entry['payoutHistory']
            if payout.get('year') == 2025 and payout.get('month') == 9
        ]
        
        if not september_payouts:
            missing_september.append(bel_id)
            continue
        
        # 應該只有一個9月的payout記錄
        if len(september_payouts) > 1:
            invalid_data.append(f"{bel_id}: 有 {len(september_payouts)} 個9月記錄")
            continue
        
        september_payout = september_payouts[0]
        bels_with_september += 1
        
        # 驗證數據完整性
        required_fields = ['payoutId', 'date', 'grossPayout', 'wht', 'netPayout', 'status']
        missing_fields = [field for field in required_fields if field not in september_payout]
        
        if missing_fields:
            invalid_data.append(f"{bel_id}: 缺少字段 {missing_fields}")
            continue
        
        # 驗證日期格式
        if september_payout.get('date') != '2025-09-12':
            invalid_data.append(f"{bel_id}: 日期錯誤 {september_payout.get('date')}")
            continue
        
        # 驗證數值計算
        gross = september_payout.get('grossPayout', 0)
        wht = september_payout.get('wht', 0)
        net = september_payout.get('netPayout', 0)
        
        calculated_net = round(gross - wht, 2)
        if abs(calculated_net - net) > 0.01:  # 允許小數點誤差
            invalid_data.append(f"{bel_id}: Net計算錯誤 {net} != {calculated_net}")
            continue
        
        september_total_gross += gross
        september_total_net += net
        
        print(f"✓ {bel_id}: ${gross:.2f} (淨額: ${net:.2f})")
    
    # 顯示總結
    print(f"\n=== 驗證結果 ===")
    print(f"總BEL數量: {total_bels}")
    print(f"有9月數據的BEL: {bels_with_september}")
    print(f"缺少9月數據的BEL: {len(missing_september)}")
    print(f"數據錯誤的BEL: {len(invalid_data)}")
    
    if missing_september:
        print(f"\n缺少9月數據的BEL:")
        for bel_id in missing_september:
            print(f"  - {bel_id}")
    
    if invalid_data:
        print(f"\n數據錯誤:")
        for error in invalid_data:
            print(f"  - {error}")
    
    if bels_with_september == total_bels and not invalid_data:
        print(f"\n🎉 所有BEL都有完整的2025年9月payout數據！")
        print(f"9月總gross payout: ${september_total_gross:,.2f}")
        print(f"9月總net payout: ${september_total_net:,.2f}")
        print(f"平均每個BEL的net payout: ${september_total_net/bels_with_september:,.2f}")
    else:
        print(f"\n⚠️  數據驗證未通過，請檢查上述問題")
    
    return bels_with_september == total_bels and not invalid_data

if __name__ == "__main__":
    validate_september_payouts()