# BEL Portal 全方位平台系統

## 📋 專案概述
**BEL (Business Ecosystem Leader) Partner Program** 是 Advantech IoTMart 的合作夥伴生態系統平台，致力於建立強大的工業物聯網商業聯盟。

### 系統架構
- **多語系支援**: 英文、中文(繁體)、韓文
- **響應式設計**: 支援桌面、平板、手機設備
- **模組化架構**: 前端 SPA 應用，無需後端依賴
- **身份驗證系統**: 多層級用戶權限管理

## 🏗️ 專案結構

### 🌐 主要入口頁面
```
index.html              # BEL 合作夥伴計劃主頁 (多語系)
├── 英雄區塊             # 計劃介紹與 CTA
├── 合作夥伴福利         # 4大核心優勢
├── 3步驟流程           # 簡化的加入流程
├── 合作夥伴等級         # Builder > Enabler > Exploder > Leader
├── 成功案例            # 真實合作夥伴見證
├── FAQ 常見問題        # 7個核心問題解答
└── 行動呼籲區          # 最終轉換區塊

about-us.html           # 關於我們頁面
Starter-Guide.html      # 新手入門指南
test-faq.html          # FAQ 測試頁面
```

### 🔐 [BEL-Admin/](BEL-Admin/) - 管理員後台系統
**存取權限**: 管理員專用
- **功能模組**: 會員管理、數據分析、內容管理、報告導出
- **視覺化**: Chart.js 圖表系統
- **技術架構**: 純前端 SPA，JSON 資料驅動

### 👤 [BEL-Login/](BEL-Login/) - 統一登入系統
**多角色支援**: 管理員、BEL用戶、新用戶
- **身份驗證**: 表單驗證 + 角色權限控制
- **登入重導向**: 根據用戶角色自動跳轉

### 🏠 [BEL-UserPortal-A/](BEL-UserPortal-A/) - BEL用戶入口網站
**用戶專屬功能**:
- 個人化儀表板
- 收益追蹤系統
- 推廣資源中心
- 訂單管理介面

## 🚀 快速開始

### 🔑 測試帳號
```javascript
// 管理員帳號
email: admin@advantech.com
password: Admin123!
→ 登入後跳轉至: BEL-Admin/

// 現有BEL用戶
email: demo@iotmart.com  
password: Demo123!
→ 登入後跳轉至: BEL-UserPortal-A/

// 新註冊BEL用戶
email: newuser@iotmart.com
password: NewUser123!
→ 登入後跳轉至: BEL-UserPortal-A/
```

### ⚡ 本地部署
```bash
# 1. 克隆專案
git clone [repository-url]
cd BEL-PortalALL2

# 2. 啟動本地伺服器 (擇一使用)
python -m http.server 8000
# 或
npx serve .
# 或
php -S localhost:8000

# 3. 開啟瀏覽器
http://localhost:8000
```

## 🌐 用戶流程導航

### 🎯 訪客到合作夥伴的轉換漏斗
```
主頁瀏覽 → 了解計劃 → 註冊登入 → 選擇角色 → 使用平台功能
    ↓         ↓         ↓         ↓         ↓
index.html → 合作夥伴等級 → BEL-Login → 身份驗證 → 對應入口網站
```

### 📱 系統導航架構
- **訪客入口**: `index.html` - 計劃介紹與註冊引導
- **身份驗證**: `BEL-Login/` - 統一登入系統  
- **管理後台**: `BEL-Admin/` - 管理員專用介面
- **用戶中心**: `BEL-UserPortal-A/` - BEL合作夥伴功能

## ✨ 核心功能特色

### 🌍 國際化 (i18n) 系統
- **支援語言**: EN | 中文(繁) | 한국어
- **動態切換**: localStorage 記憶用戶偏好
- **內容覆蓋**: 100% 介面元素多語化
- **SEO 優化**: 各語言版本獨立 meta 標籤

### 🎨 設計系統 (Design System)
```css
/* 色彩系統 */
Primary: #F39800 (IoTMart 橙)
Brand: #004280 (Advantech 藍)
Link: #006EFF (互動藍)
Success: #28A745
Warning: #FFC107
Danger: #DC3545

/* 字體系統 */
標題: 'Poppins' (H1, H2)
內文: 'Inter' (其他元素)
程式碼: 'Fira Code'

/* 間距系統 */
Container: 9vw (大螢幕) | 4vw (中螢幕) | 6vw (手機)
```

### 📊 BEL 合作夥伴等級系統
| 等級 | 圖示 | 描述 | 目標族群 | 特色功能 |
|------|------|------|----------|----------|
| **Builder** | 🌱 | 入門等級 | 新手推廣者 | 基礎推廣工具 |
| **Enabler** | ⚙️ | 成長等級 | 有經驗合作夥伴 | 進階分析功能 |
| **Exploder** | 🚀 | 擴展等級 | 規模化經營者 | 自動化工具 |  
| **Leader** | 👑 | 領導等級 | 業界專家 | 專屬客戶經理 |

## 🛠️ 技術架構

### 前端技術棧
- **HTML5**: 語義化標籤、無障礙設計
- **CSS3**: Custom Properties、Grid/Flexbox、動畫效果
- **Vanilla JavaScript**: ES6+、模組化設計、非同步載入
- **Font Awesome 6**: 圖示系統
- **Google Fonts**: Poppins + Inter 字體組合

### 資料管理架構
```
data/
├── announcements.json      # 公告資料
├── belProfiles.json        # BEL用戶檔案
├── contactSupport.json     # 客服資料
├── content.json           # 多語系內容
├── dashboard.json         # 儀表板配置
├── dataConfig.json        # 系統設定
├── orders.json            # 訂單資料
├── payouts.json           # 支付記錄
├── productCatalog.json    # 產品目錄
└── userProfile.json       # 用戶資料
```

### JavaScript 模組系統
```javascript
// 主要模組
js/
├── app.js                 # 主應用邏輯
├── data-loader.js         # 資料載入器
├── charts.js             # 圖表功能
└── common.js             # 共用函數
```

## 🎯 主要功能模組

### 🏠 主頁 (index.html)
**核心價值主張展示**
- **英雄區塊**: 吸睛的 CTA 與價值主張
- **福利展示**: 4大核心優勢視覺化呈現
- **流程引導**: 3步驟簡化加入流程
- **社會證明**: 真實合作夥伴成功案例
- **FAQ解答**: 常見疑慮即時解決

### 🔐 登入系統 (BEL-Login/)
**多角色身份驗證**
- 表單驗證與安全性檢查
- 角色權限自動判斷
- 登入狀態記憶功能
- 自動重導向機制

### 📊 管理後台 (BEL-Admin/)
**數據驅動的管理介面**
- **儀表板**: 即時數據視覺化
- **用戶管理**: BEL合作夥伴資料管理
- **內容管理**: 多語系內容編輯
- **報告系統**: 績效分析與導出
- **公告系統**: 系統通知管理

### 🏆 用戶中心 (BEL-UserPortal-A/)
**個人化合作夥伴體驗**
- **個人儀表板**: 績效追蹤與目標設定
- **收益管理**: 佣金計算與支付記錄
- **推廣資源**: 行銷素材與工具下載
- **訂單追蹤**: 推廣成效即時監控
- **客戶支援**: FAQ與客服系統

## 📱 響應式設計

### 斷點系統
```css
/* 手機優先設計 */
Mobile:    320px - 768px
Tablet:    768px - 1024px  
Desktop:   1024px - 1440px
Large:     1440px+

/* 關鍵適配點 */
Navigation: 漢堡選單 < 768px
Layout: 堆疊式 < 1024px
Typography: 動態縮放 < 768px
```

### 使用者體驗優化
- **載入性能**: 圖片延遲載入、資源預載
- **互動回饋**: 微動畫、狀態提示
- **可訪問性**: ARIA 標籤、鍵盤導航
- **SEO 優化**: 結構化資料、meta 標籤

## 🔧 開發指南

### 專案設定
```bash
# 開發環境需求
Node.js 14+
Modern Browser (Chrome 90+, Firefox 90+, Safari 14+)
VS Code (推薦編輯器)

# 推薦 VS Code 擴充套件
- Live Server
- Prettier
- ESLint
- HTML CSS Support
```

### 程式碼規範
```javascript
// JavaScript 風格指南
- ES6+ 語法
- 模組化設計
- 函數式程式設計偏好
- 詳細註釋與文檔

// CSS 命名規範  
- BEM 方法論
- CSS Custom Properties
- 行動優先響應式設計
- 語義化類名
```

### 新功能開發流程
1. **需求分析**: 確認功能規格與設計
2. **資料結構**: 設計 JSON 資料格式
3. **前端實作**: HTML/CSS/JS 開發
4. **多語系**: 新增翻譯內容
5. **測試驗證**: 跨瀏覽器與響應式測試
6. **文檔更新**: README 與註釋更新

## 🐛 疑難排解

### 常見問題
**Q: 登入後頁面空白或無法跳轉？**
A: 檢查 localStorage 中的用戶資料，清除瀏覽器快取後重試

**Q: 多語系切換不生效？**
A: 確認 localStorage 中的 language 設定，檢查 JSON 檔案路徑

**Q: 圖表無法顯示？**
A: 確認 Chart.js 載入狀態，檢查資料格式是否正確

**Q: 手機版選單無法展開？**
A: 檢查 JavaScript 事件綁定，確認 CSS 動畫設定

### 效能優化建議
- 使用圖片壓縮與 WebP 格式
- 啟用瀏覽器快取機制
- 最小化 CSS/JS 檔案大小
- 使用 CDN 加速資源載入

## 📋 部署說明

### 生產環境部署
```bash
# 1. 建置檢查
npm run build  # (如果有建置流程)

# 2. 檔案上傳至伺服器
rsync -avz . user@server:/var/www/bel-portal/

# 3. 設定 Web 伺服器 (Nginx 範例)
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/bel-portal;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# 4. 啟用 SSL 憑證
certbot --nginx -d your-domain.com
```

### 環境配置檢查清單
- [ ] 所有檔案路徑使用相對路徑
- [ ] 圖片資源已優化壓縮
- [ ] JavaScript 檔案已最小化
- [ ] Meta 標籤設定完整
- [ ] HTTPS 憑證已安裝
- [ ] Gzip 壓縮已啟用

## 🤝 貢獻指南

### 開發流程
1. **Fork 專案**: 從 main 分支創建個人分支
2. **功能開發**: 在 feature/* 分支進行開發
3. **程式碼檢查**: 確保符合專案規範
4. **測試驗證**: 完整功能與兼容性測試
5. **提交 PR**: 詳細說明變更內容

### Git 工作流程
```bash
# 1. 創建功能分支
git checkout -b feature/new-feature

# 2. 開發與提交
git add .
git commit -m "feat: add new feature description"

# 3. 推送分支
git push origin feature/new-feature

# 4. 創建 Pull Request
```

### 程式碼審查標準
- 功能完整性與正確性
- 程式碼可讀性與維護性
- 響應式設計兼容性
- 多語系支援完整性
- 效能與安全性考量

## 📊 專案統計

### 技術債務追蹤
- [ ] Legacy 程式碼重構
- [ ] CSS 變數系統標準化
- [ ] JavaScript 模組化完善
- [ ] 無障礙設計改善
- [ ] SEO 優化加強

### 功能路線圖
**Q1 2025**
- [ ] 用戶推薦系統
- [ ] 進階分析功能
- [ ] 行動應用整合

**Q2 2025**  
- [ ] AI 聊天客服
- [ ] 自動化行銷工具
- [ ] 第三方 API 整合

## 📞 支援與聯絡

### 專案團隊
- **專案負責人**: [Your Name]
- **技術負責人**: [Tech Lead Name]
- **UI/UX 設計師**: [Designer Name]

### 聯絡方式
- **技術支援**: tech-support@advantech.com
- **業務咨詢**: bel-program@iotmart.com  
- **Bug 回報**: GitHub Issues
- **功能建議**: feature-requests@iotmart.com

## 📄 授權資訊

**版權所有** © 2025 Advantech IoTMart. All rights reserved.

**授權協議**: 內部專案，僅供 Advantech 集團內部使用

---

**最後更新**: 2025年1月22日 | **版本**: 2.1.0 | **維護狀態**: 🟢 積極維護