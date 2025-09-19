# BEL Management Portal
hello
## 專案概述

BEL Management Portal 是一個品牌夥伴管理系統，提供 IoTmart 等品牌商管理其品牌推廣者（Brand Evangelist Leaders, BEL）的全面解決方案。此專案已從原始的單一 HTML 檔案重構為模組化的現代 Web 應用程式架構。

## 功能特色

### 核心功能模組

#### 1. Dashboard (`#dashboard`)
- **KPI 摘要卡片**：動態顯示 BEL 總數、總點擊、總訂單、營收等關鍵績效指標。
- **BEL 等級績效分析**：
  - **等級分佈圓餅圖** (`#level-pie-chart`)：視覺化展示各 BEL 等級的佔比。
  - **績效檢視切換**：提供圖表 (`#performance-chart-view`) 與表格 (`#performance-table-view`) 兩種模式，分析各等級的詳細表現。
- **產品銷售分析**：
  - **前 5 大產品類別分析** (`#product-category-chart`)：使用橫向長條圖呈現。
  - **Top 20 產品銷售表格**：展示最暢銷的產品列表。

#### 2. Account Management (`#Account-Management`)
- **多維度篩選器** (`#bel-filters`)：提供關鍵字、等級、地區、註冊日期等多種篩選條件。
- **批次操作**：包含「全選」 (`#select-all-page`) 與「匯出 CSV」 (`#export-csv`) 功能。
- **可排序資料表** (`#bel-table`)：展示 BEL 詳細資料，支援多欄位排序。
- **分頁功能** (`.pagination-bar`)：可調整每頁顯示筆數並進行頁面切換。

#### 3. Payouts (`#payouts-order`)
- **支付歷史記錄**：顯示過去的支付日期、總金額及受益 BEL 數量。
- **支付狀態追蹤**：提供支付處理狀態的即時更新。

#### 4. Orders (`#orders`)
- **訂單追蹤**：提供即時的訂單列表，包含訂單號、金額、對應 BEL 及訂單狀態。
- **訂單篩選與搜尋**：支援按日期、狀態或 BEL 進行訂單查詢。

#### 5. Content (`#content`)
- **資源上傳與管理**：管理員可以上傳、分類和管理供 BEL 使用的各種資源。
- **集中的資源庫**：為 BEL 提供一個單一的存取點，讓他們可以輕鬆尋找和下載官方資料。

#### 6. Contact Support (`#contact-support`)
- **客服單系統**：允許 BEL 提交問題，並追蹤處理進度。
- **歷史查詢**：檢視已關閉或解決的支援請求。

#### 7. Announcements (`#announcements`)
- **公告發布**：向所有 BEL 推播系統更新、產品發布等重要訊息。
- **歷史公告存檔**：提供過去的公告記錄供隨時查閱。

### 技術架構

#### 前端技術棧
- **HTML5 + CSS3**：響應式設計，支援桌面和行動裝置
- **Vanilla JavaScript ES6+**：模組化架構，無框架依賴
- **Chart.js 3.5.1**：圓餅圖、橫向堆疊圖等資料視覺化
- **Font Awesome 6.0.0**：圖示庫

#### CSS 設計系統
- **CSS Custom Properties（變數）**：集中管理顏色、字型、間距
- **元件化 CSS 類別**：可重複使用的 UI 元件
- **響應式設計**：適配多種螢幕尺寸
- **設計代幣系統**：標準化的顏色、字型、間距規範

#### 應用程式架構
- **模組化 JavaScript**：Navigation、Dashboard、AccountManagement、BELModal、ContentManager 等獨立模組
- **資料載入器**：非同步 JSON 資料載入和快取管理
- **狀態管理**：集中式應用程式狀態管理
- **事件驅動**：組件間通過事件進行通訊

## 檔案結構

```
BEL-management Portal-0830/
├── index.html                         # 主要應用程式入口
├── README.md                          # 專案說明文件
│
├── legacy/
│   └── BEL-management Portal-0830.html # 原始單一檔案版本（已重構）
│
├── src/                               # 原始碼目錄
│   ├── css/
│   │   └── main.css                   # 主要樣式表（包含設計系統和所有元件樣式）
│   ├── js/
│   │   ├── app.js                     # 主要應用程式邏輯
│   │   └── data-loader.js             # 資料載入和管理模組
│   └── pages/                         # 未來頁面擴展目錄
│
└── data/                              # JSON 資料檔案
    ├── dataConfig.json                # 資料載入設定檔
    ├── userProfile.json               # 使用者個人資料
    ├── header.json                    # 頁首資料（通知、導航）
    ├── dashboard.json                 # 儀表板資料
    ├── payoutsAndOrders.json         # 支付與訂單資料
    ├── content.json                   # 內容管理資料
    └── supportAndComm.json           # 支援與溝通資料
```

## 部署和使用

### 開發環境
1. 直接在本地伺服器中開啟 `index.html`
2. 確保所有 JSON 資料檔案可正常存取
3. 建議使用 Live Server 或類似工具進行開發

### 生產環境
1. 將所有檔案部署到 Web 伺服器
2. 確保 CORS 設定允許載入 JSON 檔案
3. 考慮使用 CDN 服務提供靜態資源

## 擴展性考量

### 1. 新增頁面
在 `src/pages/` 目錄下創建新的 HTML 檔案，並在主應用程式中註冊路由。

### 2. 新增模組
在 `src/js/` 目錄下創建新的 JavaScript 模組，並在 `app.js` 中初始化。

### 3. 資料結構擴展
修改對應的 JSON 檔案，DataLoader 會自動處理新的資料結構。

### 4. 樣式系統擴展
在 `main.css` 中使用現有的設計代幣系統添加新的元件樣式。

## 特色功能 (Key Features)

1. **單頁應用程式 (SPA)**：無需頁面重新載入的流暢導航
2. **響應式設計**：支援桌面、平板與手機裝置
3. **即時數據視覺化**：Chart.js 整合的互動式圖表
4. **進階篩選與排序**：多維度數據篩選功能
5. **模態視窗互動**：詳細的 BEL 資訊管理介面
6. **批量操作**：多選與批量匯出功能
7. **稽核軌跡**：完整的操作記錄系統

## 用戶體驗設計 (UX Design)

- **一致性設計語言**：統一的色彩、字型與間距系統
- **直觀的導航結構**：清晰的側邊欄選單組織
- **即時反饋**：操作狀態與載入指示器
- **無障礙設計**：鍵盤導航與螢幕閱讀器支援
- **數據密集型介面**：有效的資訊密度管理

## 資料架構與狀態管理

### 模組化設計
應用程式分為以下主要模組：

- **Navigation**: 導航和路由管理
- **Dashboard**: 儀表板功能和圖表渲染
- **AccountManagement**: BEL 管理表格和篩選功能
- **BELModal**: BEL 詳細資訊模態框
- **ContentManager**: 動態內容注入和管理
- **DataLoader**: 非同步資料載入和快取

### 資料流架構
```
JSON Files → DataLoader → APP_DATA → UI Modules → DOM Rendering
```
```
外部 API/JSON → APP_DATA → 渲染函數 → DOM 更新
                    ↑              ↓
               狀態更新 ← 用戶操作 ← 事件處理
```

### 狀態管理
- **appState**: 全局應用程式狀態（分頁、篩選、排序等）
- **APP_DATA**: 靜態應用程式資料
- **UI State**: 各模組內部狀態管理

### 應用程式狀態管理

系統採用中央化的資料狀態管理架構，所有資料都統一存放在 `APP_DATA` 物件中：

```javascript
const APP_DATA = {
  userProfile: {
    // 當前登入用戶的基本資料
    name: "Maxwell",
    email: "Maxwell.Walker@example.com", 
    level: "Explorer",
    avatar: "https://..."
  },
  
  header: {
    // 頁首配置與通知資料
    portalTitle: "BEL Management Portal",
    logo: "https://...",
    notifications: [
      {
        type: "important|new-product",
        tagText: "顯示標籤文字",
        title: "通知標題",
        date: "2025-08-26"
      }
    ]
  },
  
  dashboard: {
    // 儀表板核心數據
    summaryStats: {
      belCount: { title: "BEL Count", value: "152", icon: "fas fa-users", trend: "+5.1%", status: "positive" },
      totalClicks: { title: "Total Clicks", value: "13,492", icon: "fas fa-mouse-pointer", trend: "+12.3%", status: "positive" },
      // ...其他統計指標
    },
    performanceByLevel: {
      distribution: {
        labels: ["Builder", "Enabler", "Explorer", "Leader"],
        data: [75, 45, 25, 7],
        colors: ["#006EFF", "#00893a", "#f39800", "#db3a3a"]
      },
      details: [
        { level: "Builder", clicks: "8,000", revenue: "$65,000", orders: 510, convRate: "6.8%", aov: "$127.45" }
        // ...各等級詳細數據
      ]
    },
    leaderboard: [
      { id: "ATWADVANT", name: "Maxwell Walker", level: "Explorer", clicks: 1280, orders: 35, revenue: 8500 }
      // ...前10名BEL排行榜
    ],
    productAnalysis: {
      categoryData: {
        "Remote IO & Communication": [{ product: "ADAM-6017", units: 20 }],
        // ...產品類別銷售數據
      },
      topProducts: [
        { rank: 1, product: "ADAM-6017", price: "$150", units: 20, total: "$3000" }
        // ...熱銷產品排行
      ]
    }
  },
  
  payoutsAndOrders: {
    // 支付與訂單管理數據
    payouts: {
      payoutDayMessage: "Payout Day: 12th of each month",
      history: [
        { date: "2025-08-05", total: 15420.50, belCount: 45, details: [...] }
        // ...支付歷史記錄
      ]
    },
    orders: {
      history: [
        { orderDate: "2025-08-20", orderNumber: "IMTW000234", referralId: "ATWADVANT", amount: 1250.00, status: "Completed" }
        // ...訂單追蹤記錄
      ]
    }
  },
  
  content: {
    // 內容管理系統資料
    assets: [
      { uploadDate: "2025-08-15", title: "ADAM-6017 Product Guide", subtitle: "Complete setup guide", picture: "https://...", pageLink: "https://..." }
      // ...內容素材列表
    ]
  },
  
  supportAndComm: {
    // 客戶支援與溝通資料
    tickets: [
      { ticketNumber: "TICK-2025-001", belName: "Maxwell Walker", referralId: "ATWADVANT", subject: "Payment inquiry", status: "Open" }
      // ...支援客服單列表
    ],
    announcements: [
      { created: "2025-08-25", category: "System Update", title: "Platform Maintenance", body: "Scheduled maintenance...", link: "https://..." }
      // ...系統公告列表
    ]
  }
};
```

### 資料檔案結構說明

所有應用程式資料均已模組化為獨立的 JSON 檔案，存放於 `data/` 目錄下。`dataConfig.json` 負責定義應載入的資料檔案。

- **`dataConfig.json`**: 資料載入設定檔，定義其他所有資料檔案的路徑與對應的資料鍵名。

- **`userProfile.json`**: 儲存當前登入用戶的個人資料，如姓名、Email、等級與頭像。

- **`header.json`**: 定義頁首資訊，包含網站標題、Logo 路徑及通知訊息列表。

- **`dashboard.json`**: 提供儀表板所需的所有數據。
  - `summaryStats`: KPI 摘要統計，如 BEL 總數、點擊數、訂單數、營收等。
  - `performanceByLevel`: 按 BEL 等級劃分的績效數據，用於圖表與表格。
  - `leaderboard`: Top 10 BEL 績效排行榜資料。
  - `productAnalysis`: 產品銷售分析數據。

- **`payoutsAndOrders.json`**: 包含支付與訂單相關的資料。
  - `payouts`: 支付歷史記錄。
  - `orders`: 訂單追蹤列表。

- **`content.json`**: 管理內容資產。
  - `assets`: 行銷素材、產品指南等資源列表。

- **`supportAndComm.json`**: 處理支援與溝通功能。
  - `tickets`: 客戶支援客服單列表。
  - `announcements`: 系統公告訊息。

### 資料載入整合方式

```javascript
// 建議的資料載入函數
async function loadAppData() {
  const config = await fetch('./data/dataConfig.json').then(r => r.json());
  const APP_DATA = {};
  
  for (const dataFile of config.dataFiles) {
    try {
      const data = await fetch(`./data/${dataFile.file}`).then(r => r.json());
      APP_DATA[dataFile.name] = data;
    } catch (error) {
      console.error(`Failed to load ${dataFile.file}:`, error);
    }
  }
  
  return APP_DATA;
}
```
## 部署需求 (Deployment Requirements)

- **Web 伺服器**：支援靜態檔案託管
- **現代瀏覽器**：Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- **網路需求**：穩定的網際網路連線 (載入外部 CDN 資源)

此系統設計為輕量級的前端應用程式，可輕易部署至任何靜態檔案託管服務。