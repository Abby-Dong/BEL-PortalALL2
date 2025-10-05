# BEL數據更新和Modal表格優化

## 最新更新

### 1. Payouts & Orders 頁面統計卡片彈出窗口
- ✅ 為Payouts & Orders頁面的三個統計卡片添加彈出窗口功能
- ✅ 使用與Sales Performance Dashboard相同的樣式和邏輯
- ✅ 支持的統計指標：
  - **Net Payout Amount ($)** - 淨支出金額（非累計型）
  - **Active BEL Count (#)** - 活躍BEL數量（累計型，隱藏Monthly Value行）
  - **Total Orders (#)** - 總訂單數（非累計型）
- ✅ 每個彈出窗口包含：
  - 12個月線圖趨勢
  - 月度數據表格（Period Change、Monthly Value、Cumulative Total）
  - 與Dashboard統計卡片完全一致的視覺效果

### 2. BEL數據完整性更新
- ✅ 確保所有BEL都有2025年9月的數據
- ✅ 根據級別設定適當的數據範圍：
  - **Leader**: Clicks: 800-1200, Orders: 25-40, Revenue: $20k-35k
  - **Exploder**: Clicks: 500-800, Orders: 15-25, Revenue: $12k-20k
  - **Enabler**: Clicks: 300-500, Orders: 8-15, Revenue: $6k-12k
  - **Builder**: Clicks: 150-300, Orders: 4-8, Revenue: $3k-6k
- ✅ 調降3、4、7月的數據以營造淡旺季差別：
  - 3月：調降30%
  - 4月：調降25%
  - 7月：調降20%

### 3. Modal表格優化
- ✅ 添加第三列「Cumulative Total」並設置灰色背景
- ✅ **針對BEL count隱藏Monthly Value行**
  - BEL count是累計型指標，Monthly Value對此指標沒有意義
  - 現在BEL count的Modal只顯示：
    1. **Period Change** - 每月變化量
    2. **Cumulative Total** - 累計總數（灰色背景）
- ✅ 其他指標（Revenue、Orders、Clicks等）仍顯示完整的三行

## 功能說明

### 累計型 vs 非累計型指標

**累計型指標（如BEL Count）：**
- 只顯示 Period Change 和 Cumulative Total
- Monthly Value被隱藏，因為對累計型指標沒有意義

**非累計型指標（如Revenue、Orders、Clicks）：**
- 顯示完整的三行：Period Change、Monthly Value、Cumulative Total
- Monthly Value顯示當月實際數值
- Cumulative Total顯示累計總和

### 表格結構示例

#### BEL Count Modal（累計型）：
```
| Metric           | Jan | Feb | Mar | ... |
|------------------|-----|-----|-----|-----|
| Period Change    | ↗ 5 | ↗ 3 | ↘ 2 | ... |
| Cumulative Total | 125 | 128 | 126 | ... |
```

#### Revenue Modal（非累計型）：
```
| Metric           | Jan    | Feb    | Mar    | ... |
|------------------|--------|--------|--------|-----|
| Period Change    | ↗ $5k  | ↗ $3k  | ↘ $2k  | ... |
| Monthly Value    | $25k   | $28k   | $26k   | ... |
| Cumulative Total | $25k   | $53k   | $79k   | ... |
```

## 測試文件

- `test_modal_table.html` - 基本Modal表格測試
- `test_bel_count_hidden.html` - BEL Count隱藏Monthly Value功能測試
- `test_payouts_popup.html` - Payouts & Orders頁面彈出窗口功能測試

## Payouts & Orders 彈出窗口功能

### 統計卡片配置
```javascript
// 三個統計卡片的數據類型映射
const cardsData = [
    {
        title: 'Net Payout Amount ($)',
        statType: 'payoutAmount',    // 非累計型
        // ... 其他配置
    },
    {
        title: 'Active BEL Count (#)',
        statType: 'activeBelCount',  // 累計型（隱藏Monthly Value）
        // ... 其他配置
    },
    {
        title: 'Total Orders (#)',
        statType: 'totalOrders',     // 非累計型
        // ... 其他配置
    }
];
```

### 彈出窗口示例

#### Net Payout Amount Modal（非累計型）：
```
| Metric           | Jan    | Feb    | Mar    | ... |
|------------------|--------|--------|--------|-----|
| Period Change    | ↗ $2.5k| ↗ $1.8k| ↘ $0.8k| ... |
| Monthly Value    | $12.5k | $14.3k | $13.5k | ... |
| Cumulative Total | $12.5k | $26.8k | $40.3k | ... |
```

#### Active BEL Count Modal（累計型）：
```
| Metric           | Jan | Feb | Mar | ... |
|------------------|-----|-----|-----|-----|
| Period Change    | ↗ 5 | ↗ 3 | ↘ 2 | ... |
| Cumulative Total | 125 | 128 | 126 | ... |
```
*注意：Monthly Value行已隱藏，因為對累計型指標沒有意義*

## 技術實現

### Dashboard Modal代碼邏輯
```javascript
// 判斷是否為累計型指標
const isCumulative = ['belCount'].includes(statType);

// 設置Monthly Value行的隱藏屬性
{
    key: 'value', 
    label: 'Monthly Value',
    getData: (data) => data.formattedValue,
    getSortValue: (data) => data.value || 0,
    isHidden: isCumulative  // 為累計型指標隱藏此行
}

// 過濾隱藏的行
const bodyRows = metrics
    .filter(metric => !metric.isHidden)  // 過濾掉被標記為隱藏的行
    .map(metric => { ... });
```

### Payouts & Orders Modal代碼邏輯
```javascript
// ContentManager中添加的新函數
setupPayoutStatsCardEventListeners() {
    // 為Payouts統計卡片添加點擊事件監聽器
    const statCards = document.querySelectorAll('#payouts-order .clickable-stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', (e) => {
            const statType = card.getAttribute('data-stat-type');
            const statTitle = card.getAttribute('data-stat-title');
            this.openPayoutStatsModal(statType, statTitle);
        });
    });
}

// 計算Payouts月度統計數據
calculatePayoutMonthlyStatsForYear(year, region, statType) {
    // 根據年份和地區計算每月的Payout統計數據
    // 支持payoutAmount、activeBelCount、totalOrders三種指標
}

// 生成Payouts表格HTML
generatePayoutTransposedTableHTML(monthlyData, statType) {
    // 使用與Dashboard相同的邏輯生成表格
    // 累計型指標隱藏Monthly Value行
}
```

## 級別統計
- **Exploder**: 3 個BEL
- **Builder**: 11 個BEL  
- **Enabler**: 8 個BEL
- **Leader**: 2 個BEL
- **Explorer**: 2 個BEL
- **總計**: 26 個BEL

## 文件位置
- 主要邏輯: `src/js/app.js` (generateTransposedTableHTML函數)
- 數據更新腳本: `scripts/update_bel_data.py`
- 驗證腳本: `scripts/validate_bel_updates.py`
- 數據文件: `data/belProfiles.json`