# BEL Management Portal - app.js 技術文件

## 概述
BEL Management Portal 的主要應用程式腳本，管理儀表板功能、帳戶管理、支付、內容和支援功能。

## 架構與程式碼結構

### 1. 檔案頭部與基本設定 (第 1-13 行)
- **檔案註釋**: 定義應用程式的核心功能範圍
- **嚴格模式**: 啟用 ES5 嚴格模式，提供更好的錯誤檢測
- **DOM 就緒事件**: 確保在 DOM 完全載入後才執行應用程式邏輯

### 2. 應用程式初始化 (第 14-78 行)
- **資料結構初始化** : 建立 `APP_DATA` 和 `DataLoader` 實例
- **非同步資料載入** : 使用 `DataLoader` 從 JSON 檔案載入所有應用程式資料
- **全域狀態設定** : 透過 `window.appData` 和 `window.APP_DATA` 使資料全域可用
- **元件初始化** : 資料載入後初始化所有主要元件
- **錯誤處理機制** : 載入失敗時的降級處理，使用備用資料

### 3. UI 元素快取 (第 86-127 行)
`const ui =` 為效能快取常用的 DOM 元素:
- **導航元素** (第 86-91 行): 側邊欄、漢堡選單、內容連結
- **標題元素** (第 94-97 行): 通知、使用者個人資料
- **帳戶管理元素** (第 100-112 行): 篩選器、表格、分頁
- **模態框元素** (第 115-126 行): BEL 詳情模態框

### 4. 應用程式狀態 (第 133-190 行)
`const appState =` 管理分頁、篩選器和 UI 狀態:
- **主表格分頁** (第 130-137 行): `page: 1, rowsPerPage: 10, selected: new Set()`
- **搜尋篩選器** (第 140-194 行): keyword, referralId, level, region, country 等
- **排序設定** (第 152 行): `sortDir: 'desc'`
- **模態框狀態** (第 158-161 行): currentReferralId, notes, bankingHistory 等
- **多區段分頁** (第 164-179 行): 每個區段的不同分頁設定
- **訂單篩選器** (第 182-188 行): 支付與訂單頁面的篩選條件

### 5. 工具函數 (第 195-579 行)
提供應用程式通用的輔助功能，包含金額格式化、貨幣轉換、地區映射、日期處理、防抖動機制，以及頭像生成等核心工具
- **`formatMoney`** (第 196-201 行): 金額格式化函數，將數字轉換為帶美元符號和千位分隔符的字符串
- **`formatCurrency`** (第 203-223 行): 多貨幣格式化，支援 USD、EUR、GBP、JPY、KRW、AUD、TWD 等貨幣
- **`getRegionFromCountry`** (第 226-360 行): 國家與地區映射函數，將國家名稱轉換為對應的地區標識
- **`formatPercent`** (第 362 行): 百分比格式化函數，將小數轉換為百分比顯示
- **`parseDate`** (第 364 行): 日期解析工具，將日期字符串轉換為 Date 對象
- **`debounce`** (第 366-376 行): 防抖動函數，用於優化搜尋和輸入事件處理
- **`generateAvatar`** (第 379-442 行): 頭像生成核心邏輯，根據用戶名稱和ID生成一致性的顏色和縮寫
- **`generateAvatarHTML`** (第 345-492 行): 生成帶邊框的頭像 HTML 元素
- **`generateAvatarHTMLNoBorder`** (第 495-541 行): 生成無邊框的頭像 HTML 元素
- **`generateAvatarHTMLPlaceholder`** (第 544-579 行): 生成佔位符頭像 HTML 元素

## 6. Navigation 導航與頁面管理系統 (第 584-710 行)
負責整個應用程式的導航控制、頁面路由、頭部初始化和用戶交互管理

- **`init()`** (第 585-590 行): 導航系統初始化，依序執行頁面標題設定、事件監聽和路由初始化
- **`initializeHeader()`** (第 591-618 行): 頁面標題初始化，設定品牌 logo 和標題，將靜態頭像改為動態產生的頭像，建立通知清單
- **`setupEventListeners()`** (第 620-660 行): 使用者操作事件設定，處理選單開關、導航連結點擊、通知面板開關、使用者資料面板開關和點擊外部關閉面板
- **`showContent(targetId)`** (第 662-681 行): 頁面內容切換控制，隱藏所有內容區塊並顯示目標頁面，設定 ContentManager 目前內容類型，管理頁面標題過濾器顯示
- **`manageHeaderFiltersVisibility(targetId)`** (第 683-693 行): 頁面標題過濾器顯示控制，在特定頁面(聯絡支援、發布資源)隱藏過濾器，其他頁面保持顯示
- **`initializeRouting()`** (第 695-708 行): 應用程式路由初始化，根據網址、DOM 狀態或預設值決定初始顯示頁面，同步導航連結狀態並顯示頁面內容

### 7. Dashboard 儀表板管理系統 (第 715-2248 行)
提供完整的儀表板功能，包含年份/地區過濾、數據統計計算、UI 渲染和互動處理

- **`init()`**(第 716-727 行): 儀表板初始化入口點，按序啟動年份選擇器、統計渲染、性能表格、產品排行、圖表初始化和視圖切換器
- **`setupYearSelector()`** (第 733-754 行): 年份資料收集器，從 BEL 個人檔案的月度資料中找出所有可用年份，按時間新到舊排序後設定頁面頂部的過濾選單
- **`setupHeaderFilter(years)`** (第 759-825 行): 頁面頂部過濾器建立器，等待網頁載入完成後建立年份和地區下拉選單，設定預設選項並監聽使用者選擇變更
- **`getRegionsWithData()`** (第 830-843 行): 有效地區偵測器，掃描所有 BEL 個人檔案資料找出實際有資料的地區名稱，回傳去除重複的地區清單
- **`setupRegionSelector(regionSelect)`** (第 849-888 行): 地區選擇器建立器，使用標準地區清單建立選項，偵測資料是否存在並停用無資料的地區，加上視覺提示
- **`applyFilters(selectedYear, selectedRegion)`** (第 893-945 行): 全域過濾器套用器，儲存使用者選擇的條件到全域變數，重新顯示所有儀表板內容，強制更新圖表並同步其他頁面資料
- **`getFilteredData(year, region)`** (第 950-966 行): 資料過濾處理器，根據地區條件從原始 BEL 個人檔案中篩選出符合條件的記錄，提供除錯訊息輸出
- **`getSelectedYear()`** (第 971-980 行): 目前年份取得器，從頁面頂部年份選擇器讀取目前選擇的值，提供目前年份或全域變數作為備用選項
- **`calculateSummaryStats(year, region)`** (第 988-1101 行): 統計資料計算核心，處理年份和地區篩選，累計點擊/訂單/營收資料，計算平均轉換率和訂單價值，支援「全年份」模式和目前年份動態計算
- **`formatDisplayValue(num, prefix, suffix)`** (第 1107-1117 行): 智能數字格式化器，>100K顯示為"100k"，10K-99K顯示為"10.5k"，<10K完整顯示千分位分隔符，支援自定義前後綴
- **`calculateDashboardTrends(selectedYear, selectedRegion)`** (第 1123-1243 行): 月環比趨勢分析核心，自動計算前一月vs前前月數據變化，處理跨年邊界情況，格式化趨勢值並返回正負狀態和描述文字
- **`calculateDashboardStatsForSpecificMonth(year, month, selectedRegion)`** (第 1250-1320 行): 特定月份統計計算器，從月度數據中提取指定月份的點擊/訂單/收入數據，計算活躍BEL數量和平均轉換率/AOV
- **`renderSummaryStats(year, region)`** (第 1322-1395 行): 統計卡片渲染器，結合實時數據計算和動態趨勢分析，使用配置驅動的圖標和標題，生成帶趨勢指示器的統計卡片HTML
- **`calculatePerformanceByLevel(year, region)`** (第 1403-1471 行): 等級績效分析器，按Builder/Enabler/Exploder/Leader和A/K系列分離統計，累計年度數據並計算轉換率/AOV，返回格式化的績效詳情陣列
- **`renderPerformanceTable(year, region)`** (第 1473-1491 行): 績效表格渲染器，使用動態計算的等級績效數據生成HTML表格，應用TableUtils排序功能
- **`updateDashboardRegionFilters()`** (第 1497-1504 行): 儀表板地區過濾器更新器，更新Top 10績效排行榜區段的地區選擇器，禁用無數據地區選項
- **`updateRegionSelectWithDisabledOptions(regionSelect)`** (第 1510-1544 行): 地區選擇器選項更新器，使用標準地區列表創建選項，檢測數據可用性並標記無數據地區為禁用狀態，添加"(No data)"後綴
- **`getTopProductsFor(year, region)`** (第 1550-1606 行): 產品排行計算器，從類別數據中聚合產品銷量和收入，合併重複產品並從靜態數據補充價格，按銷量排序返回前20名產品
- **`renderTopProducts(year, region)`** (第 1608-1625 行): 產品排行表格渲染器，使用過濾後的產品數據生成HTML表格，應用TableUtils排序功能
- **`renderTop10Leaderboard(year, region)`** (第 1632-1700 行): Top 10排行榜渲染器，計算加權績效分數(收入40%+訂單30%+點擊20%+轉換率10%)，排序取前10名並生成表格，處理空結果情況
- **`initializeCharts(year, region)`** (第 1702-1712 行): 圖表系統初始化器，強制刷新等級分布餅圖、產品類別圖和績效圖表，確保所有圖表使用當前過濾條件
- **`initializePieChart(year, region)`** (第 1714-1746 行): 等級分布餅圖初始化器，計算實時等級分布數據，銷毀舊圖表並創建新的Chart.js甜甜圈圖，使用A/K系列不同顏色方案
- **`calculateLevelDistribution(year, region)`** (第 1753-1804 行): 等級分布計算器，從過濾後的BEL profiles中統計各等級人數，按Referral ID前綴分離A/K系列，返回標籤/數據/顏色配置
- **`getCategoryDataFor(year, region)`** (第 1810-1881 行): 類別數據解析器，使用智能回退策略從年份/地區結構化數據中獲取產品類別信息，支援數據合併和價格補全，提供多層級數據匹配
- **`initializeProductCategoryChart(year, region)`** (第 1883-1953 行): 產品類別圖表初始化器，計算各類別總銷量和收入，排序取前5名創建橫向條圖，提供詳細tooltip顯示數量和總額
- **`initializePerformanceChart(year, region)`** (第 1955-2104 行): 績效混合圖表初始化器，創建包含收入/點擊條圖、訂單條圖和轉換率線圖的多軸圖表，使用CSS變量定義顏色主題
- **`setupViewSwitcher()`** (第 2106-2148 行): 視圖切換器設置，處理表格/圖表視圖切換邏輯，動態顯示/隱藏內容區塊，延遲初始化圖表確保DOM準備就緒