# BEL Portal 說明文件

## 專案簡介

本專案為「BEL Portal」的前端網頁，主要提供 IoTMart 會員專屬的儀表板、帳戶管理、收益查詢、訂單追蹤、資源中心與支援 FAQ 等功能。整體設計以現代化 UI/UX 為主，並支援響應式設計，適合桌面與行動裝置瀏覽。

**⚠️ 專案架構已完成解構！** 原本的單一 HTML 檔案已成功分離為多個獨立頁面和組件。

## 主要功能

- **Dashboard 儀表板**：顯示會員歡迎訊息、等級、推薦連結、統計卡片、年度績效圖表、產品銷售分析、主要市場排行等。
- **My Account 我的帳戶**：會員個人資料與撥款資訊檢視與編輯，帳號設定（如密碼、語言切換）。
- **Earnings & Orders 收益與訂單**：收益總覽、收益明細、訂單追蹤、收益圖表、日期篩選與排序。
- **Resource Center 資源中心**：IoTMart 優惠、產品資源、行銷素材等分類瀏覽。
- **Support & FAQ 支援與常見問題**：聯絡客服、常見問題集。
- **Terms & Conditions 條款說明**：平台使用條款。

## 技術架構

- 純 HTML5 + CSS3 + JavaScript（無框架）
- 使用 [Font Awesome](https://fontawesome.com/) 圖示
- 圖表繪製：Chart.js
- 日期選擇：flatpickr
- 響應式設計，支援手機與桌機

## 檔案說明

### 主要頁面檔案 ✅
- `index.html`：首頁 Dashboard 儀表板
- `my-account.html`：我的帳戶頁面

earnings-orders.html：收益與訂單

5. **安全考量**：
   - 銀行資訊等敏感資料需要額外的加密保護
   - API 呼叫時需要適當的驗證機制
   - 前端顯示資料時進行適當的資料清理

## 💻 **前端實作建議**

### 資料篩選函數
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

// 使用範例
const currentUserId = 'USER_001';
const userData = getUserData(usersJson, currentUserId);
const userStats = getUserData(dashboardStatsJson, currentUserId);
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
```urce-center.html`：資源中心頁面
- `support-faq.html`：支援與常見問題頁面
- `terms.html`：條款說明頁面

### 共用資源 ✅
- `css/styles.css`：主樣式檔案（已從原檔案提取）
- `js/common.js`：共用 JavaScript 功能（導航、通知、表單等）
- `js/charts.js`：圖表相關功能（Chart.js 整合）
- `components/header.html`：共用頁首組件
- `components/sidebar.html`：共用側邊欄組件

### 詳細架構

#### **HTML 頁面分離**
- **index.html (Dashboard)**：儀表板頁面，包含統計卡片、年度績效圖表、產品銷售分析
- **my-account.html**：個人資料管理、撥款資訊、帳號設定
- **earnings-orders.html**：收益總覽、撥款歷史、訂單追蹤
- **resource-center.html**：IoTMart 優惠、產品資源、行銷素材
- **support-faq.html**：聯絡客服、常見問題集
- **terms.html**：平台使用條款

#### **CSS 樣式檔案** (`css/styles.css`)
- CSS 變數定義（顏色、尺寸等）
- 全域樣式重置與基礎樣式
- 響應式佈局樣式
- 各組件專屬樣式（sidebar、header、cards、tables 等）
- 行動裝置適配樣式

#### **JavaScript 檔案**
- **common.js**：共用功能（導航、通知、用戶設定、複製按鈕等）
- **charts.js**：圖表渲染功能（Chart.js 整合）
- 各頁面專屬的小型 JS 功能直接嵌入頁面

#### **組件檔案**
- **components/header.html**：共用頁首，包含用戶資訊、通知等
- **components/sidebar.html**：共用側邊欄，包含導航選單

### 舊檔案（參考用）
- `BELPlatform-20250828-Final.html`：原始單一檔案版本（已成功解構，保留作為參考）

## 解構完成狀態

✅ **已完成解構工作！**

### 完成項目：
1. **CSS 分離**：所有樣式已提取到 `css/styles.css`
2. **JavaScript 分離**：功能已分為 `js/common.js` 和 `js/charts.js`
3. **頁面分離**：6 個獨立 HTML 頁面已建立
4. **組件提取**：Header 和 Sidebar 組件已獨立

### 檔案架構：
```
BELPlatform/
├── index.html                          # Dashboard 首頁
├── my-account.html                      # 我的帳戶
├── earnings-orders.html                 # 收益與訂單
├── resource-center.html                 # 資源中心
├── support-faq.html                     # 支援與 FAQ
├── terms.html                           # 條款說明
├── css/
│   └── styles.css                       # 全域樣式
├── js/
│   ├── common.js                        # 共用功能
│   └── charts.js                        # 圖表功能
├── components/
│   ├── header.html                      # 頁首組件
│   └── sidebar.html                     # 側邊欄組件
├── README.md                            # 專案說明
└── BELPlatform-20250828-Final.html     # 原始檔案（參考）
```

## 適用對象

- IoTMart 會員、合作夥伴、代理商等專屬平台使用者。

## 使用方式

1. 在瀏覽器中開啟 `index.html` 開始使用
2. 各頁面可透過側邊欄導航切換
3. 所有功能均為前端靜態展示

## 注意事項

- 本專案為前端靜態頁面，無後端 API 連接
- 所有資料為靜態假資料，需串接後端 API 才能正式運作
- 圖表需要 Chart.js 和 flatpickr 的 CDN 支援
- 響應式設計支援行動裝置瀏覽

## 補充說明

### 儀表板功能
- **等級與里程碑**：顯示會員目前的等級與升級所需的條件。
- **推薦連結與 QR Code**：提供會員專屬的推薦連結與 QR Code，方便分享。
- **統計卡片**：包括推薦流量、使用次數、總訂單數與收益等數據。
- **年度績效圖表**：以折線圖顯示每月銷售額與訂單數量。
- **產品銷售分析**：包含產品類別銷售排行與前 20 名產品的詳細數據。
- **市場分析**：顯示前 5 大市場的訂單數與銷售額。

### 收益與訂單功能
- **收益總覽**：顯示總收益、待撥款金額與已撥款金額。
- **撥款歷史**：提供撥款明細表與圖表視圖切換功能。
- **訂單追蹤**：顯示訂單狀態與金額，並支援日期篩選。

### 資源中心功能
- **資源分類**：提供 IoTMart 優惠與產品資源的分類篩選。
- **行銷素材**：包括產品圖片、影片與橫幅等素材，供會員下載使用。

## 資料結構分析

為了將前端網頁資料與程式碼分離，以下整理各頁面所需的資料結構，未來可透過 JSON 檔案進行資料管理。

**🔑 重要設計原則：** 每個 JSON 檔案都設計為多用戶架構，前端根據用戶 ID (`userId`) 進行資料篩選和顯示。

### 共用資料 (Global Data)

#### 1. 用戶資料 (`users.json`)
```json
{
  "users": [
    {
      "userId": "USER_001",
      "name": "Maxwell Walker",
      "email": "Maxwell.Walker@example.com",
      "avatar": "https://irp.cdn-website.com/56869327/dms3rep/multi/AVATAR-G.png",
      "level": {
        "name": "Explorer",
        "icon": "fas fa-rocket",
        "progress": {
          "current": 35,
          "target": 50,
          "remaining": 15
        }
      },
      "referralInfo": {
        "link": "https://www.iotmart.com/en-en/?ref=A8C1E3F",
        "id": "A8C1E3F",
        "qrCode": "https://irp.cdn-website.com/56869327/dms3rep/multi/IoTMart-qr-code-3+1.png"
      },
      "bankInfo": {
        "bankName": "Bank of America",
        "swiftCode": "BOFAUS3N",
        "accountNumber": "123456789012345"
      },
      "accountSettings": {
        "password": {
          "lastChanged": "July 30, 2021",
          "encrypted": "hashedPasswordValue"
        },
        "language": "English",
        "timezone": "UTC-7",
        "emailNotifications": true,
        "smsNotifications": false
      }
    },
    {
      "userId": "USER_002",
      "name": "Sarah Chen",
      "email": "sarah.chen@example.com",
      "avatar": "https://irp.cdn-website.com/56869327/dms3rep/multi/AVATAR-F.png",
      "level": {
        "name": "Leader", 
        "icon": "fas fa-crown",
        "progress": {
          "current": 65,
          "target": 100,
          "remaining": 35
        }
      },
      "referralInfo": {
        "link": "https://www.iotmart.com/en-en/?ref=B9D2F4G",
        "id": "B9D2F4G",
        "qrCode": "https://irp.cdn-website.com/56869327/dms3rep/multi/IoTMart-qr-code-2.png"
      },
      "bankInfo": {
        "bankName": "Chase Bank",
        "swiftCode": "CHASUS33",
        "accountNumber": "987654321098765"
      },
      "accountSettings": {
        "password": {
          "lastChanged": "August 15, 2025",
          "encrypted": "hashedPasswordValue2"
        },
        "language": "Traditional Chinese",
        "timezone": "UTC+8",
        "emailNotifications": true,
        "smsNotifications": true
      }
    }
  ]
}
```

**說明**：
- 每個用戶都有唯一的 `userId` 作為識別碼
- 前端根據當前登入用戶的 ID 篩選顯示資料
- `level`: 用戶等級資訊
- `accountNumber`: 完整帳號，前端顯示時進行遮罩處理

#### 2. 通知資料 (`notifications.json`)
```json
{
  "globalNotifications": [
    {
      "id": 1,
      "title": "Platform Maintenance Scheduled",
      "date": "2025-08-30",
      "tag": {
        "text": "System",
        "type": "system"
      },
      "targetUsers": "all"
    }
  ],
  "userNotifications": [
    {
      "userId": "USER_001",
      "notifications": [
        {
          "id": 1,
          "title": "September Earnings Payout Postponed",
          "date": "2025-08-26",
          "tag": {
            "text": "Important",
            "type": "important"
          }
        },
        {
          "id": 2,
          "title": "ADAM Remote I/O Series are now available for promotion",
          "date": "2025-08-25",
          "tag": {
            "text": "New Campaign",
            "type": "new-product"
          }
        }
      ]
    },
    {
      "userId": "USER_002",
      "notifications": [
        {
          "id": 1,
          "title": "Congratulations! You've reached Leader level",
          "date": "2025-08-20",
          "tag": {
            "text": "Achievement",
            "type": "achievement"
          }
        }
      ]
    }
  ]
}
```

### 首頁資料 (Dashboard - `index.html`)

#### 3. 統計卡片資料 (`dashboard-stats.json`)
```json
{
  "userStats": [
    {
      "userId": "USER_001",
      "stats": [
        {
          "title": "Referral Link Traffic",
          "value": "1280",
          "icon": "fas fa-mouse-pointer",
          "trend": {
            "direction": "positive",
            "percentage": "+6.5%",
            "text": "Since last month"
          }
        },
        {
          "title": "Referral ID Usage", 
          "value": "142",
          "icon": "fas fa-tags",
          "trend": {
            "direction": "negative",
            "percentage": "-0.10%",
            "text": "Since last month"
          }
        },
        {
          "title": "Total Orders Count",
          "value": "35", 
          "icon": "fas fa-shopping-cart",
          "trend": {
            "direction": "negative",
            "percentage": "-0.2%",
            "text": "Since last month"
          }
        },
        {
          "title": "Rebate Earnings",
          "value": "$8,500",
          "icon": "fas fa-dollar-sign", 
          "trend": {
            "direction": "positive",
            "percentage": "+11.8%",
            "text": "Since last month"
          }
        }
      ]
    },
    {
      "userId": "USER_002",
      "stats": [
        {
          "title": "Referral Link Traffic",
          "value": "2180",
          "icon": "fas fa-mouse-pointer",
          "trend": {
            "direction": "positive",
            "percentage": "+12.3%",
            "text": "Since last month"
          }
        },
        {
          "title": "Referral ID Usage", 
          "value": "285",
          "icon": "fas fa-tags",
          "trend": {
            "direction": "positive",
            "percentage": "+8.2%",
            "text": "Since last month"
          }
        },
        {
          "title": "Total Orders Count",
          "value": "72", 
          "icon": "fas fa-shopping-cart",
          "trend": {
            "direction": "positive",
            "percentage": "+15.6%",
            "text": "Since last month"
          }
        },
        {
          "title": "Rebate Earnings",
          "value": "$18,750",
          "icon": "fas fa-dollar-sign", 
          "trend": {
            "direction": "positive",
            "percentage": "+22.1%",
            "text": "Since last month"
          }
        }
      ]
    }
  ]
}
```

#### 4. 年度績效圖表資料 (`annual-performance.json`)
```json
{
  "userPerformance": [
    {
      "userId": "USER_001",
      "yearlyData": {
        "2025": {
          "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
          "salesData": [1200, 1900, 1500, 2200, 1800, 2500, 2100, 2800],
          "ordersData": [8, 12, 10, 15, 12, 18, 14, 20]
        },
        "2024": {
          "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          "salesData": [1000, 1400, 1200, 1800, 1500, 2000, 1700, 2200, 1900, 2300, 2000, 2400],
          "ordersData": [6, 9, 8, 12, 10, 14, 11, 15, 13, 16, 14, 17]
        }
      }
    },
    {
      "userId": "USER_002",
      "yearlyData": {
        "2025": {
          "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
          "salesData": [2800, 3200, 2900, 3800, 3400, 4200, 3800, 4500],
          "ordersData": [18, 22, 19, 28, 24, 32, 28, 35]
        },
        "2024": {
          "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          "salesData": [1800, 2200, 2000, 2800, 2400, 3000, 2700, 3200, 2900, 3300, 3000, 3400],
          "ordersData": [12, 16, 14, 20, 18, 24, 20, 26, 22, 28, 24, 30]
        }
      }
    }
  ]
}
```

#### 5. 產品分析資料 (`product-analysis.json`)
```json
{
  "topCategories": [
    {"category": "Touch Panel PCs", "sales": 3200},
    {"category": "PoE Switches", "sales": 2800}, 
    {"category": "Remote I/O", "sales": 2400},
    {"category": "Embedded Systems", "sales": 1900},
    {"category": "IoT Sensors", "sales": 1600}
  ],
  "topProducts": [
    {"rank": 1, "name": "TPC-2140WP-T3AE", "category": "Touch Panel PCs", "sales": "$1,200"},
    {"rank": 2, "name": "EKI-7659CI", "category": "PoE Switches", "sales": "$980"},
    {"rank": 3, "name": "ADAM-6050-D", "category": "Remote I/O", "sales": "$850"}
  ]
}
```

#### 6. 市場分析資料 (`market-analysis.json`)
```json
[
  {"region": "North America", "orders": 125, "sales": "$15,200"},
  {"region": "Europe", "orders": 98, "sales": "$12,800"},
  {"region": "Asia Pacific", "orders": 87, "sales": "$10,500"},
  {"region": "Latin America", "orders": 45, "sales": "$5,800"},
  {"region": "Middle East", "orders": 32, "sales": "$4,200"}
]
```

### 收益與訂單頁面 (`earnings-orders.html`)

#### 7. 收益總覽資料 (`earnings-summary.json`)
```json
{
  "userEarnings": [
    {
      "userId": "USER_001",
      "totalEarnings": "$8,500.00",
      "pendingPayout": "$1,520.00", 
      "alreadyPaid": "$6,980.00",
      "tooltipText": "Payouts over $100 USD are processed on the 5th of each month. Balances under $100 will roll over to the next month.",
      "currentLevel": {
        "name": "Explorer",
        "effectiveDate": "2025-06-15"
      },
      "levelProgress": {
        "current": 35,
        "target": 50,
        "nextLevel": "Leader"
      }
    },
    {
      "userId": "USER_002",
      "totalEarnings": "$18,750.00",
      "pendingPayout": "$2,850.00", 
      "alreadyPaid": "$15,900.00",
      "tooltipText": "Payouts over $100 USD are processed on the 5th of each month. Balances under $100 will roll over to the next month.",
      "currentLevel": {
        "name": "Leader",
        "effectiveDate": "2025-08-20"
      },
      "levelProgress": {
        "current": 65,
        "target": 100,
        "nextLevel": "Master"
      }
    }
  ]
}
```

#### 8. 撥款歷史資料 (`payout-history.json`)
```json
{
  "userPayouts": [
    {
      "userId": "USER_001",
      "payouts": [
        {
          "id": "RP-000010",
          "date": "2025-08-05",
          "grossAmount": "$1,550.00",
          "bankFee": "$20.00", 
          "processingFee": "$10.00",
          "netAmount": "$1,520.00",
          "level": "Explorer"
        },
        {
          "id": "RP-000009", 
          "date": "2025-07-05",
          "grossAmount": "$1,350.00",
          "bankFee": "$15.00",
          "processingFee": "$5.00", 
          "netAmount": "$1,330.00",
          "level": "Explorer"
        }
      ]
    },
    {
      "userId": "USER_002",
      "payouts": [
        {
          "id": "RP-000020",
          "date": "2025-08-05",
          "grossAmount": "$3,100.00",
          "bankFee": "$25.00", 
          "processingFee": "$15.00",
          "netAmount": "$3,060.00",
          "level": "Leader"
        }
      ]
    }
  ]
}
```

#### 9. 訂單追蹤資料 (`order-tracking.json`)
```json
{
  "userOrders": [
    {
      "userId": "USER_001",
      "orders": [
        {
          "date": "2025-08-25",
          "orderId": "IMNL00068932", 
          "amount": "$1,200.00",
          "status": "Processing",
          "statusClass": "status-processing",
          "estimatedEarning": "$54.00"
        },
        {
          "date": "2025-08-22",
          "orderId": "IMNL00068901",
          "amount": "$150.00", 
          "status": "Completed",
          "statusClass": "status-completed",
          "actualEarning": "$6.75"
        }
      ]
    },
    {
      "userId": "USER_002",
      "orders": [
        {
          "date": "2025-08-26",
          "orderId": "IMNL00068945", 
          "amount": "$2,500.00",
          "status": "Completed",
          "statusClass": "status-completed",
          "actualEarning": "$137.50"
        },
        {
          "date": "2025-08-24",
          "orderId": "IMNL00068938",
          "amount": "$850.00", 
          "status": "Processing",
          "statusClass": "status-processing",
          "estimatedEarning": "$46.75"
        }
      ]
    }
  ]
}
```

### 資源中心頁面 (`resource-center.html`)

#### 10. 資源中心資料 (`resource-center.json`)
```json
{
  "deals": [
    {
      "title": "Touch Panel PCs Solutions",
      "image": "https://irp.cdn-website.com/56869327/dms3rep/multi/BEL-PCs.png",
      "link": "https://www.iotmart.com/touch-panel-pcs",
      "category": "deals"
    },
    {
      "title": "PoE Industrial Switches", 
      "image": "https://irp.cdn-website.com/56869327/dms3rep/multi/BEL-PoE.png",
      "link": "https://www.iotmart.com/poe-switches",
      "category": "deals"
    }
  ],
  "products": [
    {
      "title": "WISE IoT Sensor Node Series",
      "image": "https://irp.cdn-website.com/56869327/dms3rep/multi/BEL-WISE.png", 
      "link": "https://www.iotmart.com/wise-series",
      "category": "products"
    }
  ],
  "marketing": [
    {
      "title": "Product Banners",
      "description": "Download high-resolution product banners",
      "category": "marketing"
    }
  ]
}
```

### 支援與FAQ頁面 (`support-faq.html`)

#### 11. FAQ資料 (`faq.json`)
```json
[
  {
    "question": "How are earnings calculated?",
    "answer": "Earnings are calculated based on the final transaction amount (excluding tax and shipping) of your referred orders, multiplied by the percentage associated with your current partner level. For detailed percentages, please refer to the Legal Terms page."
  },
  {
    "question": "How long does it take to get paid?", 
    "answer": "Payouts for balances over $100 USD are processed automatically on the 5th of each month. Balances under $100 will roll over to the next payout cycle. Please allow 5-7 business days for the funds to appear in your account after processing."
  }
]
```

### 條款頁面 (`terms.html`)

#### 12. 條款內容資料 (`terms.json`)
```json
{
  "lastUpdated": "August 29, 2025",
  "sections": [
    {
      "title": "Program Overview",
      "content": "The BEL (Business Exclusive Leader) Platform is an invitation-only partner program operated by IoTMart..."
    },
    {
      "title": "Partner Levels and Earnings",
      "content": "Partners are classified into different levels...",
      "levels": [
        {"name": "Builder Level", "percentage": "2.5%"},
        {"name": "Enabler Level", "percentage": "3.5%"},
        {"name": "Explorer Level", "percentage": "4.5%"},
        {"name": "Leader Level", "percentage": "5.5%"}
      ]
    }
  ]
}
```

### 配置資料 (`config.json`)
```json
{
  "logo": "https://irp.cdn-website.com/56869327/dms3rep/multi/iotmart-logo.svg",
  "platformName": "BEL Portal",
  "supportEmail": "bel-support@iotmart.com",
  "paymentSchedule": {
    "paymentDate": 5,
    "minimumPayout": 100,
    "processingDays": "5-7"
  },
  "cookieDuration": 30,
  "partnerLevels": [
    {"name": "Builder", "icon": "fas fa-hammer", "percentage": "2.5%", "requirement": 0},
    {"name": "Enabler", "icon": "fas fa-cog", "percentage": "3.5%", "requirement": 20},
    {"name": "Explorer", "icon": "fas fa-rocket", "percentage": "4.5%", "requirement": 35},
    {"name": "Leader", "icon": "fas fa-crown", "percentage": "5.5%", "requirement": 50}
  ],
  "languages": [
    {"code": "en", "name": "English"},
    {"code": "zh-TW", "name": "繁體中文"}
  ]
}
```

#### 14. 表單選項資料 (`form-options.json`)
```json
{
  "countries": [
    {"code": "US", "name": "United States"},
    {"code": "TW", "name": "Taiwan"},
    {"code": "JP", "name": "Japan"},
    {"code": "DE", "name": "Germany"}
  ],
  "supportCategories": [
    {"id": "account", "name": "Account Issues"},
    {"id": "payment", "name": "Payment & Payout"},
    {"id": "technical", "name": "Technical Support"},
    {"id": "general", "name": "General Inquiry"}
  ],
  "orderStatuses": [
    {"key": "processing", "label": "Processing", "class": "status-processing"},
    {"key": "completed", "label": "Completed", "class": "status-completed"},
    {"key": "canceled", "label": "Canceled", "class": "status-canceled"},
    {"key": "refunded", "label": "Refunded", "class": "status-refunded"}
  ]
}
```

### 技術細節補充
- **互動功能**：
  - 使用 JavaScript 實現動態篩選、排序與圖表渲染。
  - 提供複製按鈕，方便會員快速複製推薦連結與 ID。
- **圖表與篩選**：
  - 使用 Chart.js 繪製折線圖與長條圖。
  - 使用 flatpickr 實現日期篩選功能。
- **響應式設計**：
  - 使用 CSS Media Queries 調整不同裝置的顯示效果。
  - 側邊欄在行動裝置上支援展開與收起。

### 常見問題與支援
- **FAQ**：提供會員常見問題的解答，例如收益計算、撥款流程與推薦追蹤機制。
- **聯絡客服**：內建聯絡表單，方便會員提交問題或反饋。

## 🎯 **資料抽離的優點**

1. **維護性** - 資料與程式碼分離，易於更新內容
2. **國際化** - 未來可支援多語系版本
3. **動態性** - 可透過API或CMS系統管理資料
4. **測試性** - 可輕鬆建立測試資料集
5. **擴展性** - 新增功能時不需修改既有程式碼

## 📋 **資料結構總結**

總共需要 **14個 JSON 檔案**：

### 共用資料 (4個)
- `users.json` - 多用戶資料、等級、推薦資訊、銀行資訊、帳戶設定
- `notifications.json` - 系統通知與公告（全局 + 用戶專屬）
- `config.json` - 平台配置、等級定義、語言選項
- `form-options.json` - 表單選項、國家清單、狀態定義

### 頁面專用資料 (10個)
- `dashboard-stats.json` - 儀表板統計卡片（多用戶）
- `annual-performance.json` - 年度績效圖表（多用戶）
- `product-analysis.json` - 產品銷售分析
- `market-analysis.json` - 市場分析
- `earnings-summary.json` - 收益總覽（多用戶）
- `payout-history.json` - 撥款歷史（多用戶）
- `order-tracking.json` - 訂單追蹤（多用戶）
- `resource-center.json` - 資源中心內容
- `faq.json` - FAQ常見問題
- `terms.json` - 條款與條件

## ⚠️ **注意事項**

1. **多用戶資料處理**：
   - 所有 JSON 檔案都包含多用戶資料結構
   - 前端需要根據當前用戶 ID (`userId`) 進行資料篩選
   - 建議前端實作通用的資料篩選函數：`getUserData(jsonData, userId)`

2. **敏感資料處理**：
   - 密碼應該加密存儲，前端不應該存取
   - 完整帳號由前端進行遮罩顯示
   - 推薦連結應該是動態生成而非靜態儲存

3. **資料一致性**：
   - 確保各檔案中的用戶資料保持一致
   - 等級資訊應該在 config.json 中統一定義
   - 日期格式統一使用 ISO 8601 標準
   - 所有檔案的 `userId` 必須保持一致

4. **安全考量**：
  - 銀行資訊等敏感資料需要額外的加密保護
  - API 呼叫時需要適當的驗證機制
  - 前端顯示資料時進行適當的資料清理
