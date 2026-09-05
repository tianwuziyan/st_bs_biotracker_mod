# 合并原项目代码变更：执行计划

## Phase 1：合并前基线

1. [x] 确认工作区只包含本任务规划文件，记录 `HEAD`、共同基线和 `upstream/main`。
2. [x] 运行现有测试和语法/差异检查，记录基线结果。
3. [x] 用 `rg` 检查本地专属入口、设置键、快照函数和测试文件，作为合并后的保留清单。

## Phase 2：三方合并

4. [x] 执行 `git merge --no-commit upstream/main`，不提交未解决的冲突。
5. [x] 先处理新增文件和低风险文档/测试文件，确认原项目新增模块被正确纳入。
6. [x] 合并 `scripts/state.js`、`scripts/registry.js`、`scripts/tools.js`：保留本地状态快照/自然受精逻辑，接入原项目特殊胎儿、族谱、异期复孕、孕中孕、胎内回归、child id 和迁移行为。
7. [x] 合并 `scripts/api.js`、`scripts/tracker.js`、`scripts/tracker_prompt_context.js`：组合 User-Agent、原项目提示/工具契约与本地 API、历史正则、记忆来源和 checkpoint 基线。
8. [x] 合并 `index.js`、`settings.html`、`style.css`：保留本地正则/记忆/权重 UI，纳入族谱、胎儿标签、压力量表、精液占比环、特殊注册与 iPhone 主题。
9. [x] 合并 `README.md`、`Changelog.md` 和必要的 `docs/`；保留版本 `0.9.7`，不引入只由版本号造成的改动。

## Phase 3：一致性检查

10. [x] 搜索 `<<<<<<<`、`=======`、`>>>>>>>`，搜索本地专属函数/设置键，确认没有被上游覆盖。
11. [x] 检查新状态字段从入口、归一化、快照、提示词到 UI/族谱的完整数据流。
12. [x] 检查新增工具 schema 与执行器约束一致，尤其是索引起点、阶段限制、回归期和特殊胎儿来源。
13. [x] 检查主题变量、设置控件、事件处理器和移动端布局契约；对风险较高的样式冲突做静态/测试验证。

## Phase 4：验证与交付

14. [x] 运行 `node --test tests/*.test.mjs`。
15. [x] 运行必要的 `node --check`、UI 契约/测试服务器检查和 `git diff --check`。
16. [x] 对失败项分类并修复合并回归；不得通过删除测试或版本号修改规避问题。
17. [x] 更新项目文档（如实际行为已有 README/docs 记录则说明无需重复创建），检查不含敏感信息。
18. [x] 查看最终 diff 和状态，创建本地合并提交，不 push；记录验证命令和结果。

## 执行记录

- 共同基线：`088313796b2c11528447712b751409d4f782c0bc`；原项目合并源：`upstream/main`（`c83afcc`）。
- 基线测试为 253 项、251 项通过；其中 2 项是本地已有的手动排卵期候选重建缺陷，已在合并后修复并补回归覆盖。
- 合并后 `node --test tests/*.test.mjs`：398 项全部通过（含新增的三种 API 格式转换回归）。
- 合并后通过核心模块 `node --check`、冲突标记搜索和 `git diff --check`；仓库无 `package.json`，没有额外 lint/type-check 命令可运行。
- `README.md` 与 `docs/` 已检查，无需重复创建；`Changelog.md` 已保留本地未发布记录并纳入原项目实际功能说明，版本号仍为 `0.9.7`。
- 上游 user 宏测试的 `bsAddSperm` fixture 补齐本地既有的 `ejaculatedInside` / `protected` 明确参数，未放宽安全校验。

## Risky files and rollback points

- 高风险：`scripts/state.js`、`scripts/tools.js`、`scripts/registry.js`、`index.js`、`style.css`。
- 中风险：`scripts/api.js`、`scripts/tracker*.js`、`settings.html`、测试 fixture。
- 低风险但需核对：`README.md`、`Changelog.md`、`docs/` 和新增测试/模块。
- 主要回滚点：合并前 HEAD；合并冲突阶段使用 `git merge --abort`；每组冲突解决后以相关测试结果作为局部检查点。

## Validation commands

```bash
node --test tests/*.test.mjs
git diff --check
rg -n '<<<<<<<|=======|>>>>>>>' .
rg -n 'historyRegex|memorySource|CHAT_CHECKPOINT|reconcileMessageCheckpoints|naturalConception|competitionWeight' index.js scripts tests
```
