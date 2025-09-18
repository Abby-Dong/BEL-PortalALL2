# 付款 (`#payouts-order`)

付款部分提供支付給 BEL 的詳細歷史記錄和狀態。

## 功能

- **付款歷史**：顯示過去付款日期、支付總金額以及每個週期接收方 BEL 數量的記錄。
- **付款狀態追蹤**：顯示正在進行的付款流程的即時狀態。

## 使用者體驗 (User Experience)

- **清晰的財務概覽**：
    - **事件**：使用者進入此頁面。
    - **介面變化**：頁面會立即顯示一個清晰的、按時間倒序排列的付款歷史列表。最近的付款週期會顯示在最上方。
    - **用意**：讓管理者可以輕鬆追蹤歷史付款記錄，並快速找到最近的付款資訊，無需進行任何額外操作，方便進行財務對帳和審核。
- **詳細資訊的即時存取**：
    - **事件**：點擊任一付款歷史記錄項目旁的「詳情」按鈕或展開圖示。
    - **介面變化**：該項目會展開，顯示該付款週期中所有接收款項的 BEL 列表、每人的金額及狀態等詳細資訊。
    - **用意**：採用「漸進式揭露」的設計模式。預設只顯示摘要資訊，避免資訊過載，同時允許使用者在需要時才深入查看細節，保持介面的整潔與高效。
- **狀態的視覺化呈現**：
    - **事件**：查看付款狀態。
    - **介面變化**：付款狀態（如「處理中」、「已完成」、「失敗」）會以不同顏色或圖示的標籤顯示。
    - **用意**：利用視覺元素來傳達資訊，讓使用者可以快速掃描並識別每個項目的狀態，而無需仔細閱讀文字，從而提高了資訊處理的效率。

### 互動式彈窗與邏輯 (IT 參考)

#### 1. 付款詳情彈窗 (Payout Details Popup)
- **觸發事件**: 管理者點擊任一付款歷史記錄項目旁的「詳情」按鈕。
- **介面行為**: 系統會彈出一個模態視窗 (Modal)，覆蓋在主畫面之上。
- **彈窗內容與判斷邏輯**:
    - **標題**: 根據所選項目動態生成，例如：「2025-08-05 付款詳情」。
    - **摘要區**: 顯示該週期的核心數據：
        - **總支付金額**: `payouts.history[n].total`
        - **總受款 BEL 人數**: `payouts.history[n].belCount`
        - **狀態**: `payouts.history[n].status` (例如：Completed, Processing, Failed)
    - **詳細列表區**: 一個可滾動的表格，顯示該週期內每一筆支付的詳細資料。
        - **欄位**: Referral ID, BEL 姓名, 個人金額, 狀態 (Success/Failed)。
        - **資料來源**: `payouts.history[n].details` 陣列。
    - **條件式按鈕**:
- **用意**: 提供一個集中的視圖來審核單一付款週期的所有細節，而無需離開主列表。條件式按鈕則確保了只有在資料完整無誤時才能執行匯出操作，避免了錯誤資料的流通。

## 資料來源

付款資訊來自 `data/payoutsAndOrders.json` 中的 `payouts` 物件。

# Payouts (`#payouts-order`)

The Payouts section provides a detailed history and status of payments made to BELs.

## Features

- **Payout History**: Displays a record of past payout dates, total amounts disbursed, and the number of recipient BELs for each cycle.
- **Payout Status Tracking**: Shows the real-time status of ongoing payout processes.

## User Experience

- **Clear Financial Overview**:
    - **Event**: User navigates to this page.
    - **Interface Change**: The page immediately displays a clear, reverse-chronological list of payout histories. The most recent payout cycle appears at the top.
    - **Purpose**: Allows managers to easily track historical payment records and quickly find the latest payout information without any extra steps, facilitating financial reconciliation and auditing.
- **Instant Access to Details**:
    - **Event**: Clicking a "Details" button or an expand icon next to any payout history entry.
    - **Interface Change**: The entry expands to reveal a detailed list of all BELs who received payments in that cycle, including individual amounts and statuses.
    - **Purpose**: Employs a "progressive disclosure" design pattern. It shows summary information by default to avoid information overload, while allowing users to drill down into specifics only when needed, keeping the interface clean and efficient.
- **Visual Status Representation**:
    - **Event**: Viewing the status of a payout.
    - **Interface Change**: Payout statuses (e.g., "Processing," "Completed," "Failed") are displayed with distinct colors or icons.
    - **Purpose**: Leverages visual elements to convey information, allowing users to quickly scan and identify the status of each item without reading text closely, thereby improving information processing speed.

### Interactive Popups & Logic (for IT Reference)

#### 1. Payout Details Popup
- **Trigger Event**: An administrator clicks the "Details" button next to any payout history item.
- **Interface Behavior**: The system will display a modal window that overlays the main screen.
- **Popup Content & Logic**:
    - **Title**: Dynamically generated based on the selected item, e.g., "2025-08-05 Payout Details".
    - **Summary Section**: Displays key data for the cycle:
        - **Total Payout Amount**: `payouts.history[n].total`
        - **Total BEL Recipients**: `payouts.history[n].belCount`
        - **Status**: `payouts.history[n].status` (e.g., Completed, Processing, Failed)
    - **Details List Section**: A scrollable table showing the details of each payment within the cycle.
        - **Columns**: Referral ID, BEL Name, Individual Amount, Status (Success/Failed).
        - **Data Source**: `payouts.history[n].details` array.
    - **Conditional Button**:
        - **If cycle status is `Completed`**: An "Export CSV Report" button is displayed at the bottom of the popup, allowing the admin to download the detailed payout records for that cycle.
        - **If cycle status is `Processing` or `Failed`**: The "Export CSV Report" button will be disabled or hidden, as the data is not yet complete or contains errors.
- **Purpose**: To provide a centralized view for auditing all details of a single payout cycle without leaving the main list. The conditional button ensures that the export action can only be performed when the data is complete and accurate, preventing the circulation of incorrect data.

## Data Source

Payout information is sourced from the `payouts` object within `data/payoutsAndOrders.json`.

## 資料來源

付款資訊來自 `data/payoutsAndOrders.json` 中的 `payouts` 物件。

