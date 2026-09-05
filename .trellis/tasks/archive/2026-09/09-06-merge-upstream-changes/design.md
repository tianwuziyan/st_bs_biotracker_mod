# 合并原项目代码变更：技术设计

## Integration boundary

本任务以共同基线 `088313796b2c11528447712b751409d4f782c0bc` 做三方合并：本地 `main` 是保留本地功能的主线，`upstream/main` 是要纳入的原项目变更源。合并前不改写历史，不使用覆盖整个工作树的方式替代冲突解决。

重叠最大的文件是 `index.js`、`scripts/api.js`、`scripts/state.js`、`scripts/tools.js`、`scripts/tracker.js`、`scripts/tracker_prompt_context.js`、`scripts/registry.js`、`settings.html`、`style.css`、`README.md`、`Changelog.md` 及 `tests/api.test.mjs`。原项目新增的 `scripts/fetus_tags.js`、`scripts/lineage.js`、`scripts/lineage_view.js` 和相关测试应作为新增模块保留并接入现有入口。

## Merge strategy by layer

### State and domain layer

- 以 `scripts/state.js` 作为状态字段和迁移边界，合并原项目的 child id、iPhone 设置、回归期/特殊胎儿字段及存量数据回填。
- 保留本地 checkpoint、聊天绑定、尾部恢复和现有状态快照语义；任何新字段都必须经过默认值、归一化、快照和恢复路径。
- 检查 `gestationSpeciesSpeed`、`gestationModifierMultiplier`、`gestationEffectiveSpeed` 的冻结语义，不能因解决冲突把有效的 `0` 当作无效值。

### Tool, registry, and tracker layer

- `scripts/registry.js` 继续负责注册输入白名单和注册后归一化；合并特殊胎儿来历时保留本地注册/记忆上下文接入。
- `scripts/tools.js` 继续作为工具执行、生命周期约束和状态变更入口；新增来源标签、异期/孕中孕/回归期规则必须与已有自然受精、快照和错误返回一致。
- `scripts/tracker.js` 和 `scripts/tracker_prompt_context.js` 组合原项目的新标签/残留/工具契约提示与本地历史正则、外部记忆、checkpoint 基线逻辑。请求前后的 payload 字段不能只在 UI 层补造。
- `scripts/api.js` 合并原项目代理 User-Agent，同时保留本地 API 格式、URL 规范化、认证、超时和回退策略。

### UI layer

- `index.js` 继续是当前单文件 UI 控制器的入口：纳入族谱、特殊胎儿注册、胎儿标签、年龄、压力量表、精液占比环和 iPhone 设置，同时保留本地正则/记忆/权重 UI 事件与设置持久化。
- `settings.html` 只增加/合并必要控件，确保 data attribute、输入 id 与 `index.js` 事件绑定一一对应；特殊胎儿字段与 iPhone 字段要有清晰的显示条件。
- `style.css` 以现有主题变量和 `currentColor` 体系合并新组件，保留本地规则页布局；重点检查移动端、Sakura/retro 对比度和 iPhone 主题专属变量的作用域。
- `scripts/lineage.js` 和 `scripts/lineage_view.js` 作为数据投影层，UI 只消费投影结果，不在渲染函数中重新推导父子关系。

### Documentation and tests

- `README.md`、`Changelog.md` 合并功能事实，按当前仓库文档结构更新相关 `docs/`，不以版本标题覆盖本地未发布说明。
- 原项目新增测试与本地测试同时保留。对因合并改变字段/函数接口的 fixture 做最小适配，不能删除断言覆盖。

## Data-flow contracts

```text
注册输入 / 工具调用
  → registry/tools 入口归一化与生命周期校验
  → chatState / profile / fetus / child 存档
  → checkpoint、提示词 payload、lineage view model
  → tracker、完整变量页、角色追踪页、族谱窗口
```

- 特殊胎儿标签与支撑字段由 registry/tools 统一归一化，状态、提示词和 UI 使用同一字段含义。
- child `id` 是跨搬移、族谱和注册来源的稳定引用；索引只用于当前数组遍历，不作为持久关系主键。
- 未揭晓异期胎儿的“模型/追踪可见性”与完整变量页可见性必须保持原项目约定，不能让 UI 过滤破坏存档。
- checkpoint 仍以聊天楼层边界和当前聊天为约束；新字段进入快照后必须能恢复，坏快照不能覆盖有效 sidecar 状态。

## Compatibility and migration

- 对旧聊天状态使用现有默认值和懒迁移，不要求用户手工重置存档。
- 对缺少 child id 的旧孩子记录在读取/归一化时补齐一次并持久化；后续引用使用稳定 id。
- 对没有新 iPhone/特殊胎儿字段的旧设置使用默认值，不影响已有十二套主题和旧注册流程。
- 版本字段维持本地 `0.9.7`；版本相同不代表状态结构相同，因此以字段回填和测试验证兼容性。

## Conflict and rollback approach

- 合并前记录当前 HEAD、共同基线和上游 HEAD，并先运行基线测试。
- 使用 `git merge --no-commit upstream/main` 进入可检查的合并状态；冲突解决期间保留 `git merge --abort` 作为回滚点。
- 每组冲突按层验证，先保证语法和导入，再运行相关测试，最后运行完整测试集。
- 不使用 `git reset --hard`、`git clean` 或远端 push。若合并无法在当前范围内稳定完成，保留未完成合并状态并报告具体冲突，不删除用户代码。
