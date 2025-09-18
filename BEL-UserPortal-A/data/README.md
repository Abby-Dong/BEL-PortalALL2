# BEL Platform 資料架構說明

## 資料夾結構

```
data/
├── config.json                          # 平台配置與設定
├── form-options.json                    # 表單選項與系統選項
├── users/                               # 用戶相關資料
│   ├── users.json                       # 用戶基本資料
│   └── notifications.json               # 通知資料
├── dashboard/                           # 儀表板資料
│   ├── dashboard-stats.json             # 統計卡片資料
│   ├── annual-performance.json          # 年度績效圖表
│   ├── product-analysis.json            # 產品分析資料
│   └── market-analysis.json             # 市場分析資料
├── earnings/                            # 收益與訂單資料
│   ├── earnings-summary.json            # 收益總覽
│   ├── payout-history.json              # 撥款歷史
│   └── order-tracking.json              # 訂單追蹤
└── content/                            # 內容與資源
    ├── resource-center.json             # 資源中心內容
    ├── faq.json                         # 常見問題
    └── terms.json                       # 條款與條件
```

## 檔案說明

### 🔧 系統配置檔案

#### `config.json`
- 平台基本配置（logo、名稱、聯絡信箱）
- 合作夥伴等級定義與佣金率
- 支援的語言與時區選項
- 付款排程設定

#### `form-options.json`
- 國家清單
- 支援分類選項
- 訂單狀態定義
- 優先等級選項

### 👥 用戶資料檔案

#### `users/users.json`
- 多用戶基本資料（姓名、信箱、頭像）
- 用戶等級與進度資訊
- 推薦連結與 QR Code
- 銀行資訊與帳戶設定

#### `users/notifications.json`
- 系統全域通知
- 用戶專屬通知
- 通知分類與標籤

### 📊 儀表板資料檔案

#### `dashboard/dashboard-stats.json`
- 多用戶統計卡片資料
- 推薦流量、使用次數、訂單數、收益
- 趨勢指標與比較數據

#### `dashboard/annual-performance.json`
- 多用戶年度績效資料
- 支援多年度歷史資料
- 月度銷售額與訂單數據

#### `dashboard/product-analysis.json`
- 產品類別銷售排行
- 前 20 名產品詳細數據
- 銷售額、訂單數、佣金資訊

#### `dashboard/market-analysis.json`
- 主要市場排行資料
- 地區別訂單數與銷售額
- 成長趨勢指標

### 💰 收益與訂單檔案

#### `earnings/earnings-summary.json`
- 多用戶收益總覽
- 當前等級與佣金率
- 等級進度與升級資訊
- 月度收益細項

#### `earnings/payout-history.json`
- 多用戶撥款歷史記錄
- 撥款明細（總額、手續費、淨額）
- 撥款時的佣金率與等級
- 交易狀態與 ID

#### `earnings/order-tracking.json`
- 多用戶訂單追蹤資料
- 客戶資訊與產品詳情
- 訂單狀態與佣金計算
- 預估與實際收益

### 📋 內容與資源檔案

#### `content/resource-center.json`
- IoTMart 優惠與促銷資訊
- 產品資源與規格說明
- 行銷素材（橫幅、影片、手冊）
- 社群媒體資源

#### `content/faq.json`
- 常見問題與解答
- 問題分類與標籤
- 搜尋關鍵字支援

#### `content/terms.json`
- 平台使用條款
- 合作夥伴等級詳細說明
- 佣金結構與付款條件
- 法律條文與責任

## 🔑 重要設計原則

### 1. 多用戶架構
- 每個 JSON 檔案都支援多用戶資料
- 前端根據 `userId` 進行資料篩選
- 統一的用戶識別機制

### 2. 資料一致性
- 所有檔案的 `userId` 保持一致
- 等級資訊在 config.json 中統一定義
- 日期格式統一使用 ISO 8601 標準

### 3. 佣金資料分離
- 佣金百分比放在收益相關檔案中
- 支援歷史佣金率追蹤
- 等級變更時的佣金調整記錄

### 4. 安全考量
- 密碼等敏感資料已加密處理
- 完整帳號由前端進行遮罩顯示
- 銀行資訊需要額外的安全保護

## 📝 使用方式

### 前端資料讀取
```javascript
// 通用資料篩選函數
function getUserData(jsonData, userId) {
  if (jsonData.users) {
    return jsonData.users.find(user => user.userId === userId);
  }
  if (jsonData.userStats) {
    const userStats = jsonData.userStats.find(user => user.userId === userId);
    return userStats ? userStats.stats : [];
  }
  if (jsonData.userEarnings) {
    return jsonData.userEarnings.find(user => user.userId === userId);
  }
  if (jsonData.userOrders) {
    const userOrders = jsonData.userOrders.find(user => user.userId === userId);
    return userOrders ? userOrders.orders : [];
  }
  return null;
}
```

### 通知合併邏輯
```javascript
function getMergedNotifications(notificationsJson, userId) {
  const globalNotifications = notificationsJson.globalNotifications || [];
  const userNotifications = notificationsJson.userNotifications
    .find(user => user.userId === userId)?.notifications || [];
  
  return [...globalNotifications, ...userNotifications]
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
```

## 🚀 下一步建議

1. **整合到現有頁面**：修改 JavaScript 檔案以讀取 JSON 資料
2. **建立資料載入器**：實作統一的資料載入與快取機制
3. **測試資料正確性**：驗證所有資料結構與頁面顯示的一致性
4. **建立資料更新機制**：設計管理介面或 API 來更新 JSON 資料
5. **國際化支援**：為多語系準備資料結構

---

## 📊 資料檔案總覽

| 檔案 | 用途 | 資料類型 | 頁面使用 |
|------|------|----------|----------|
| config.json | 系統配置 | 全域設定 | 所有頁面 |
| form-options.json | 表單選項 | 靜態選項 | 表單頁面 |
| users.json | 用戶資料 | 多用戶 | Header, My Account |
| notifications.json | 通知資料 | 多用戶 | Header |
| dashboard-stats.json | 統計資料 | 多用戶 | Dashboard |
| annual-performance.json | 績效圖表 | 多用戶 | Dashboard |
| product-analysis.json | 產品分析 | 全域 | Dashboard |
| market-analysis.json | 市場分析 | 全域 | Dashboard |
| earnings-summary.json | 收益總覽 | 多用戶 | Earnings & Orders |
| payout-history.json | 撥款歷史 | 多用戶 | Earnings & Orders |
| order-tracking.json | 訂單追蹤 | 多用戶 | Earnings & Orders |
| resource-center.json | 資源內容 | 全域 | Resource Center |
| faq.json | 常見問題 | 全域 | Support & FAQ |
| terms.json | 條款內容 | 全域 | Terms |

**總計：14 個 JSON 檔案，完整涵蓋所有頁面需求**
