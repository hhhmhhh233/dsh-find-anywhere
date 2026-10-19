# dsh-find-anywhere

为 DeepSeek Harness Web UI 提供 `Ctrl+F` 式查找：在**当前对话**和**右侧面板**中搜索已渲染文本，高亮全部匹配，并在结果间循环定位。

包名 `@dsh-external/dsh-find-anywhere`，版本 `0.1.0`，纯浏览器实现。

> **发布状态：as-is / best-effort。** 本仓库按现状发布，不承诺持续维护、不承诺跟进上游变更，也不承诺及时响应 issue。详见 [MAINTENANCE.md](MAINTENANCE.md)。

## 为什么值得用：右侧面板内容也能搜

右侧面板常驻文档预览、文件列表、计划/子代理内容等信息。多数查找只覆盖对话正文；本插件把**右侧面板当前激活页里已渲染的文字**纳入同一套查找条：

- 面板打开时，右下角出现圆形 🔍 浮钮，点击即可查找面板内容。
- `Ctrl+Shift+F` 直接进入右侧面板范围。
- 查找条停靠在面板内容区顶部，避开标签栏和文件路径行，并随面板展开/全屏/切换标签重新定位。
- 对话和右侧面板共享高亮、计数、上一个/下一个循环；范围随时切换。

查找条只读取 DOM 文本，不修改面板结构，也不发送内容到网络。

## 使用

| 操作 | 说明 |
|---|---|
| `Ctrl+F` / `Cmd+F` | 打开查找条；焦点在右侧面板时搜索面板，否则搜索对话 |
| `Ctrl+Shift+F` | 打开右侧面板范围 |
| 对话标题栏的 🔍 / 右侧面板右下角的 🔍 | 鼠标打开对应范围 |
| 输入文字 | 实时高亮全部匹配，计数显示 `当前/总数` |
| `Enter` / `F3` / `Ctrl+G` | 下一个匹配（循环） |
| `Shift+Enter` / `Shift+F3` / `Ctrl+Shift+G` | 上一个匹配（循环） |
| 计数旁 `↑` / `↓` | 上一个 / 下一个 |
| 查找条左侧的范围切换 | 在对话与右侧面板之间切换 |
| `Esc` | 关闭并清除高亮 |

### 范围规则

- **对话**：搜索当前对话列里已渲染的文字（用户消息、助手回复、工具卡片、命令输出等）；输入框和编辑器被排除，草稿不会产生假匹配。
- **右侧面板**：搜索当前激活页里已渲染的文字（文档预览、文件列表、计划/子代理内容等）；面板标签栏、按钮和工具栏文字被排除。
- 左侧会话列表不参与搜索。
- 面板关闭时，面板入口自动隐藏；面板重新打开或切换标签后，查找条会重新定位。

## 设计取舍

- **不包裹 `<mark>`**：对话 DOM 归 React 所有，流式输出时持续重渲染。插件使用 CSS Custom Highlight API 在 Range 上绘制高亮，不插入节点，不破坏 reconciliation。
- **MutationObserver 跟随流式输出**：对话继续输出或历史分页载入时防抖重算匹配；按“文本节点 + 偏移”保持当前匹配，不会跳到另一个位置。
- **纯 DOM 检索**：不依赖会话数据结构，因此工具卡片、命令输出、折叠内容中已渲染的部分都能被找到；尚未进入 DOM 的虚拟化历史不在范围内。
- **极简外观**：单行 38px 浮条，沿用 `--dsw-alias-*` 主题令牌，自动适配明暗主题；无结果时计数与边框变红并轻微抖动（尊重 `prefers-reduced-motion`）。
- **右侧面板入口**：面板打开时右下角出现圆形 🔍 浮钮；面板关闭时自动隐藏，不占用面板标签栏的槽位。

## 能力边界

- 只匹配渲染后的纯文本：不做正则、不折叠变音符号、不跨文本节点匹配（被样式拆开的短语可能匹配不到）。
- 依赖 CSS Custom Highlight API（当前 Chromium / Electron 均支持）；不支持时仍能计数和滚动定位，但没有高亮底色。
- 虚拟化或懒加载的历史若尚未进入 DOM，需要先滚动加载后再搜索。
- 右侧面板的**浏览器页签**如果是跨域 iframe，父页面无法读取其内部文字；**终端页签**（canvas/xterm）也没有可检索的 DOM 文本。这两类内容搜不到是预期行为。
- 左侧会话列表不参与搜索。
- 若 `Ctrl+Shift+F` 被其他功能占用，用右侧面板右下角的 🔍，或把焦点放进右侧面板后按 `Ctrl+F`。

## 安装与构建

运行时需要支持客户端插件的 DeepSeek Harness Web UI。`lib/` 是注入器实际加载的产物；`src/` 是源码。

```bash
# 仓库是源码形态；先生成运行产物
bash scripts/build.sh
```

若你的环境装有 `dsh-super-injector`，可以把仓库目录注入：

```text
dev_inject_plugin /absolute/path/to/dsh-find-anywhere
```

卸载：

```text
dev_uninject_plugin dsh-find-anywhere
```

也可以直接使用发布包 `dsh-external-dsh-find-anywhere-0.1.0.tgz`。该 tgz 包含 `lib/`、`locale/`、`icon.svg`、`README.md`、`LICENSE` 和 `MAINTENANCE.md`；具体安装方式取决于你的 DSH 版本。

注意：源码仓库的 `.gitignore` 忽略了 `lib/`，所以 GitHub 上的仓库默认是源码形态；需要预构建产物时请使用 tgz，或本地运行构建脚本。

## 隐私与安全

- 不读取会话数据库，不调用后端接口，不发送任何内容到网络。
- 插件在 DSH Web UI 页面内运行，会读取当前页面已渲染的 DOM 文本。安装前请自行审阅源码。
- 查找高亮使用浏览器原生 Highlight API，不向页面插入额外节点。

## 验证状态

本次发布整理只修改了 `package.json` 元数据与文档，没有重新运行 GUI 验证。功能描述基于现有实现，按 as-is 提供；如果上游 UI 结构变化导致失效，本仓库不承诺修复。

## 文件

- `src/client/index.js` — 全部浏览器逻辑与 UI（ModuleLoader bundle 源文件）
- `src/index.js` — Host 注册壳（无 host 行为）
- `scripts/build.mjs` — 无编译依赖的构建（语法校验 + 复制）
- `lib/` — 注入器实际加载的产物（由 `src/` 生成）
- `locale/zh.json`、`locale/en.json` — 插件管理页的标题/描述元数据
- `icon.svg` — 原创图标（对话气泡 + 放大镜）
- `LICENSE` — MIT
- `MAINTENANCE.md` — 维护状态与自维护指引

## License

[MIT](LICENSE) © 2026 dsh-find-anywhere contributors
