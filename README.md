# BS BioTracker

![芭絲特查看 BS BioTracker PDA 的品牌插畫](assets/branding/bs-biotracker-cover.png)

BS BioTracker 是用於角色扮演的生理狀態追蹤擴充，目前開發版本為 **v1.1.6**。它會根據對話更新角色狀態，並讓角色的生理週期、妊娠、需求與時間流逝持續影響故事。

支援 SillyTavern、TauriTavern、Luker；已知測試版本為 SillyTavern `1.19.0`、TauriTavern `2.3.0`、Luker `2.8.0`。

- 角色注册：根據角色卡、種族與補充設定建立初始狀態。
- 異步 Tracker：在 AI 回覆定稿後自動分析近期對話並更新狀態。
- 完整狀態查看：可直接檢查目前所有角色變數。
- 單角色追蹤面板：用概覽、描述、妊娠、經歷、調試頁面查看單一角色。
- 時間流逝：手動推進年、月、週、天、時、分，讓所有已注册角色同步演進。
- Worldbook 條目排除：可排除不想送進 tracker 分析的世界書條目。
- 歷史消息正則：可按樓層對送入 tracker 的文本執行提取或排除規則，支援規則排序、啟用／停用與預覽；不修改原始聊天記錄。
- 外部歷史記憶：可在 SYSTEM 頁選擇插件內置記憶、Anima、柏寶書或数据库纪要；三種外部來源互斥，資料只作 tracker 的背景上下文。
- 種族百科：內建多種繁殖型態與種族資料，方便注册時查閱。
- 技能與天賦：每個聊天有獨立的技能圖鑑；技能 ID 單調遞增且刪除後不回收，圖鑑會跟隨聊天快照保存與恢復。LLM 可先登記名稱與描述，再依故事事件讓角色覺醒及鍛鍊技能；覺醒／升等會寫入最近 100 筆成長歷史並顯示提醒。角色天賦對所有 LLM 工具只讀，只能由使用者在外部介面調整。孕中期至第一產程的技能鍛鍊會依各胎親和度自動形成胎兒天賦，並保留到孩子紀錄供日後注册時載入。
- 主題介面：目前內建 `retro`、`cultivation`、`fantasy`、`cyber-egypt`、`wasteland`、`sakura`、`holo`、`gothic`、`steampunk`、`eldritch`、`ink`、`constructivism` 十二種風格。
## 安裝與開始使用

1. 在擴充安裝介面使用 Git URL 安裝：`https://github.com/Liuuuu54/st_bs_biotracker`，然後重新載入。
2. 打開 **BS BioTracker**，設定 OpenAI 相容 API 的 Base URL、API Key 與模型。模型需能穩定輸出 JSON。
3. 啟用異步追蹤，註冊角色，再於角色追蹤頁手動分析一次對話以確認設定。

插件也提供角色狀態查看、時間推進、種族資料、技能與天賦、衣櫃，以及多種介面主題。操作時可按 PDA 右上角的 `?` 查看內建說明，或閱讀[使用說明](docs/guide.md)與[機制說明](docs/mechanics/README.md)。

## 詳細使用與設定

1. 打開 SillyTavern。
2. 進入 `Extensions`。
3. 使用「Install extension from Git URL」或同類型的安裝入口。
4. 貼上這個專案的 GitHub 倉庫網址。
5. 安裝完成後重新整理 SillyTavern。

重新載入後，擴充面板中應該會出現 `BS BioTracker`。

## 快速開始

1. 打開 `BS BioTracker` 面板。
2. 在 `SYSTEM` 頁填入：
   - `OpenAI 兼容 API Base URL`
   - `API Key`
   - 模型名稱，或先按「连接并拉取模型」選擇模型；目前使用 OpenAI `/chat/completions` 兼容接口
3. 勾選「启用异步生理状态追踪」後儲存設定。
4. 到 `角色注册` 頁輸入角色名、種族與補充設定，執行注册。
5. 到 `角色追踪` 頁按「立即分析当前对话」，確認 tracker 可以正常工作。
6. 之後可在 `完整变量` 與 `角色追踪` 中檢查結果，必要時用 `时间流逝` 推進狀態。

## 頁面說明

- `條目排除`：選擇不送入 tracker 的 worldbook 條目。
- `技能`：管理目前聊天的全局技能定義，並選擇已注册角色新增、移除或調整個人技能／天賦的 Lv 與 EXP。
- `角色注册`：建立角色初始生理／妊娠／心理／描述資料；第五子頁可設定初始技能與天賦，或載入已命名孩子的天賦。
- `角色追踪`：查看已注册角色與最近一次工具呼叫結果，也可手動執行分析。
- `角色追踪 → 經歷`：查看角色技能、正負天賦、技能成長歷史、孩子及其待注册天賦。
- `衣櫃`：為未備裝角色建立空衣櫃，或手動新增、編輯、刪除衣物及調整目前主件、配件與穿著狀態。
- `完整变量`：直接查看目前保存的角色狀態 JSON，並可註銷角色。
- `时间流逝`：對全部已注册角色推進生理時間。
- `種族百科`：查看內建種族與繁殖相關資料。

## 設定說明

- 自動追蹤時機固定在 AI 回覆定稿後；舊版 `triggerTiming`／`after_user` 設定載入時會自動清除。
- `pollMs`：輪詢間隔，預設 `1800ms`
- `contextSize`：送入分析的近期訊息數，預設 `12`
- `historyRegexRules`：送入 tracker 前按樓層處理的歷史消息正則規則；可選提取或排除，預設沒有規則
- `apiTimeoutMs`：單次 API 請求超時，預設 `180000ms`；設為 `0` 表示不限制單次請求，但整輪分析仍有總時限
- `memorySource`：歷史記憶來源，可選 `internal`、`anima`、`baibai`、`database`；預設 `internal`
- `database` 來源會自動讀取當前角色主世界書中的数据库纪要，无需手动指定世界书
- `animaRecallCount`：Anima 召回摘要分片數，範圍 `1-50`
- `useStPresetForAsync`：啟用後會盡量套用目前 SillyTavern 預設中的參數

## 注意事項

- API 端必須支援 OpenAI 風格的 `/chat/completions`；`/models` 若不支援，可手動填寫模型名稱。當跨域請求受到限制時，插件會優先嘗試宿主代理，再按現有回退規則直連。
- Base URL 建議填到版本前綴，例如 `https://example.com/v1` 或 `https://example.com/api/v3`；若誤貼到 `/chat/completions` 或 `/models`，插件會自動移除 endpoint 尾巴。
- 模型若經常輸出非 JSON 內容，注册與 tracker 會失敗或結果不穩定。
## 升級提醒
v1.0.0 以新的存檔結構作為正式基準，不再讀取或轉換 0.x 的舊存檔；從舊版升級請開新聊天。版本變更見 [Changelog](Changelog.md)。
