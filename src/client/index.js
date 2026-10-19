/**
 * dsh-find-anywhere — client half.
 *
 * A Ctrl+F-style find bar for the rendered conversation and the rendered
 * right sidebar (the docked/floating right panel: document preview, files,
 * browser, terminal, subagent, …).  Plain DOM inside shell.overlay seats; the
 * panel is never mutated (CSS Custom Highlight API paints ranges over
 * React-owned text), and every match is walked from the live DOM so streaming
 * output and paged-in history stay searchable.
 *
 * Entry points: a search icon in the conversation header utilities and a
 * floating icon at the bottom-right of the right panel.  Ctrl+F / Cmd+F opens
 * the bar (scope follows focus), Ctrl+Shift+F opens the right-panel scope,
 * Enter / Shift+Enter walk matches, Esc closes.
 */
window.__ModuleLoader__.load({
  id: "@dsh-external/dsh-find-anywhere",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })

    const React = require("react")

    const NS = "dsh-find-anywhere"
    const IS_MAC = /Mac|iPhone|iPad|iPod/.test(navigator.platform || "")
    const PRIMARY = IS_MAC ? "Cmd" : "Ctrl"
    const MAX_MATCHES = 3000
    const HIGHLIGHT_ALL = "dfa-match"
    const HIGHLIGHT_ACTIVE = "dfa-active"

    const DICT = {
      zh: {
        "open": "查找",
        "open.rightpanel": "查找右侧栏",
        "scope.chat": "对话",
        "scope.rightpanel": "右侧栏",
        "scope.switch": "切换查找范围",
        "placeholder.chat": "查找对话内容…",
        "placeholder.rightpanel": "查找右侧栏内容…",
        "bar.chat": "查找对话内容",
        "bar.rightpanel": "查找右侧栏内容",
        "prev": "上一个匹配",
        "next": "下一个匹配",
        "close": "关闭查找",
        "input": "查找文本",
        "noResults": "没有找到匹配内容"
      },
      en: {
        "open": "Find",
        "open.rightpanel": "Find in right panel",
        "scope.chat": "Chat",
        "scope.rightpanel": "Right panel",
        "scope.switch": "Switch search scope",
        "placeholder.chat": "Find in conversation…",
        "placeholder.rightpanel": "Find in right panel…",
        "bar.chat": "Find in conversation",
        "bar.rightpanel": "Find in right panel",
        "prev": "Previous match",
        "next": "Next match",
        "close": "Close find",
        "input": "Find text",
        "noResults": "No matches"
      }
    }

    const STYLE_TEXT = `
.dfa-host{position:fixed;inset:0;pointer-events:none;z-index:2147483000}
.dfa-bar{position:absolute;display:none;align-items:center;gap:2px;box-sizing:border-box;height:38px;padding:0 5px 0 6px;border-radius:11px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.14));background:var(--dsw-alias-bg-overlay,#fff);box-shadow:0 8px 28px rgba(0,0,0,.18),0 1px 2px rgba(0,0,0,.08);color:var(--dsw-alias-label-primary,#111);font:13px/1.4 ui-sans-serif,system-ui,-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;pointer-events:auto;user-select:none}
.dfa-bar.dfa-open{display:flex}
.dfa-bar:focus-within{border-color:var(--dsw-alias-brand-primary,#4d6bfe);box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 18%,transparent)}
.dfa-scope{display:inline-flex;align-items:center;gap:4px;flex:none;height:26px;padding:0 7px;border:0;border-radius:7px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.08));color:var(--dsw-alias-label-secondary,#555);font:inherit;font-size:12px;line-height:1;cursor:pointer;white-space:nowrap}
.dfa-scope:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));color:var(--dsw-alias-label-primary,#111)}
.dfa-scope svg{width:14px;height:14px;flex:none}
.dfa-bar.dfa-scope-panel .dfa-scope-label{display:none}
.dfa-bar.dfa-scope-panel .dfa-scope{padding:0 6px}
.dfa-input{flex:1 1 auto;min-width:48px;height:28px;padding:0 4px;border:0;outline:0;background:transparent;color:inherit;font:inherit;user-select:text}
.dfa-input::placeholder{color:var(--dsw-alias-label-secondary,#888)}
.dfa-count{flex:none;min-width:38px;text-align:center;font-size:12px;color:var(--dsw-alias-label-secondary,#777);font-variant-numeric:tabular-nums}
.dfa-bar.dfa-empty .dfa-count{color:var(--dsw-alias-state-error-primary,#d33)}
.dfa-bar.dfa-empty{border-color:var(--dsw-alias-state-error-primary,#d33)}
.dfa-sep{flex:none;width:1px;height:18px;margin:0 2px;background:var(--dsw-alias-border-l1,rgba(0,0,0,.08))}
.dfa-btn{flex:none;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#666);cursor:pointer}
.dfa-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));color:var(--dsw-alias-label-primary,#111)}
.dfa-btn:disabled{opacity:.35;cursor:default}
.dfa-btn svg{width:15px;height:15px;display:block}
.dfa-trigger{width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#666);cursor:pointer}
.dfa-trigger:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));color:var(--dsw-alias-label-primary,#111)}
.dfa-trigger svg{width:16px;height:16px;display:block}
.dfa-panel-trigger{position:fixed;z-index:2147483000;display:none;width:28px;height:28px;align-items:center;justify-content:center;padding:0;border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:50%;background:var(--dsw-alias-bg-overlay,#fff);color:var(--dsw-alias-label-secondary,#666);box-shadow:0 2px 10px rgba(0,0,0,.16);cursor:pointer;pointer-events:auto}
.dfa-panel-trigger:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16));color:var(--dsw-alias-label-primary,#111)}
.dfa-panel-trigger svg{width:15px;height:15px;display:block}
.dfa-bar.dfa-shake{animation:dfa-shake .24s ease-in-out}
@keyframes dfa-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@media (prefers-reduced-motion:reduce){.dfa-bar.dfa-shake{animation:none}}
::highlight(dfa-match){background-color:rgba(255,199,0,.55);color:#141414}
::highlight(dfa-active){background-color:#ff9500;color:#111}
`

    const ICONS = {
      search: [
        ["circle", { cx: "11", cy: "11", r: "7" }],
        ["path", { d: "m20 20-3.6-3.6" }]
      ],
      up: [["path", { d: "m6 14 6-6 6 6" }]],
      down: [["path", { d: "m6 10 6 6 6-6" }]],
      close: [
        ["path", { d: "m6 6 12 12" }],
        ["path", { d: "M18 6 6 18" }]
      ],
      chat: [["path", { d: "M4 5.5h16v10H9l-5 4z" }]],
      rightpanel: [
        ["rect", { x: "4", y: "4", width: "16", height: "16", rx: "3" }],
        ["path", { d: "M15 4v16" }]
      ]
    }

    function svgAttrs(width) {
      return {
        viewBox: "0 0 24 24",
        width: String(width),
        height: String(width),
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        focusable: "false"
      }
    }

    function icon(name, size) {
      const width = size ?? 16
      const children = (ICONS[name] || []).map(([tag, attrs], index) =>
        React.createElement(tag, { key: index, ...attrs })
      )
      return React.createElement("svg", svgAttrs(width), children)
    }

    function domIcon(name, size) {
      const SVG_NS = "http://www.w3.org/2000/svg"
      const svg = document.createElementNS(SVG_NS, "svg")
      const px = String(size ?? 16)
      svg.setAttribute("viewBox", "0 0 24 24")
      svg.setAttribute("width", px)
      svg.setAttribute("height", px)
      svg.setAttribute("fill", "none")
      svg.setAttribute("stroke", "currentColor")
      svg.setAttribute("stroke-width", "1.8")
      svg.setAttribute("stroke-linecap", "round")
      svg.setAttribute("stroke-linejoin", "round")
      svg.setAttribute("aria-hidden", "true")
      svg.setAttribute("focusable", "false")
      for (const [tag, attrs] of ICONS[name] || []) {
        const node = document.createElementNS(SVG_NS, tag)
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value)
        svg.appendChild(node)
      }
      return svg
    }

    function supportsHighlight() {
      return typeof CSS !== "undefined" && CSS && "highlights" in CSS && typeof Highlight === "function"
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    class FindController {
      constructor() {
        this.t = (key) => key
        this.scope = "conversation"
        this.query = ""
        this.queries = { conversation: "", rightpanel: "" }
        this.matches = []
        this.activeIndex = -1
        this.opened = false
        this.host = null
        this.bar = null
        this.input = null
        this.count = null
        this.prevBtn = null
        this.nextBtn = null
        this.closeBtn = null
        this.scopeBtn = null
        this.scopeLabel = null
        this.scopeIcon = null
        this.observer = null
        this.observerRoot = null
        this.searchTimer = 0
        this.mutationTimer = 0
        this.anchors = { conversation: null }
        this.regionCache = null
        this.previouslyFocused = null
        this.pendingScope = null
        this.panelTrigger = null
        this.panelTriggerTimer = 0
        this.lastPanelPane = null

        this.onKeyDown = this.onKeyDown.bind(this)
        this.onInput = this.onInput.bind(this)
        this.onResize = this.onResize.bind(this)
        this.onMutation = this.onMutation.bind(this)
        this.onInputKeyDown = this.onInputKeyDown.bind(this)
      }

      setTranslator(fn) {
        if (typeof fn === "function") this.t = fn
        this.refreshLocale()
      }

      setAnchor(scope, el) {
        this.anchors[scope] = el
        this.regionCache = null
        if (this.opened && this.scope === scope) {
          this.position()
          this.scheduleSearch(30, false)
        }
      }

      setPanelTrigger(el) {
        this.panelTrigger = el
        window.clearInterval(this.panelTriggerTimer)
        this.panelTriggerTimer = 0
        this.lastPanelPane = null
        this.updatePanelTrigger()
        if (el) this.panelTriggerTimer = window.setInterval(() => this.updatePanelTrigger(), 500)
      }

      updatePanelTrigger() {
        const trigger = this.panelTrigger
        if (!trigger) return
        const pane = this.getRightPanelPane()
        if (pane !== this.lastPanelPane) {
          this.lastPanelPane = pane
          if (this.opened && this.scope === "rightpanel") {
            this.regionCache = null
            this.position()
            this.scheduleSearch(80, false)
          }
        }
        if (this.opened && this.scope === "rightpanel") {
          const root = this.getSearchRoot()
          if (root && root !== this.observerRoot) {
            this.ensureObserver(root)
            this.scheduleSearch(80, false)
          }
        }
        if (!pane) {
          trigger.style.display = "none"
          if (this.opened && this.scope === "rightpanel") this.close()
          return
        }
        if (this.opened && this.scope === "rightpanel") {
          trigger.style.display = "none"
          return
        }
        const rect = pane.getBoundingClientRect()
        if (rect.width < 180 || rect.height < 180) {
          trigger.style.display = "none"
          return
        }
        trigger.style.display = "inline-flex"
        trigger.style.left = rect.right - 44 + "px"
        trigger.style.top = rect.bottom - 48 + "px"
      }

      mount(host) {
        if (!host || this.host === host) return
        this.unmount()
        this.host = host
        this.buildBar()
        host.appendChild(this.bar)
        const trigger = this.buildPanelTrigger()
        host.appendChild(trigger)
        this.setPanelTrigger(trigger)
        this.refreshLocale()
        if (this.pendingScope) {
          const scope = this.pendingScope
          this.pendingScope = null
          this.openBar(scope)
        }
      }

      unmount() {
        if (this.opened) this.close()
        this.disconnectObserver()
        window.removeEventListener("resize", this.onResize)
        window.clearInterval(this.panelTriggerTimer)
        this.panelTriggerTimer = 0
        const trigger = this.panelTrigger
        this.panelTrigger = null
        this.lastPanelPane = null
        if (trigger && trigger.parentNode) trigger.parentNode.removeChild(trigger)
        if (this.bar && this.bar.parentNode) this.bar.parentNode.removeChild(this.bar)
        this.host = null
        this.bar = null
        this.input = null
        this.count = null
        this.prevBtn = null
        this.nextBtn = null
        this.closeBtn = null
        this.scopeBtn = null
        this.scopeLabel = null
        this.scopeIcon = null
        this.regionCache = null
      }

      isOpen() {
        return this.opened
      }

      buildBar() {
        const bar = document.createElement("div")
        bar.className = "dfa-bar"
        bar.setAttribute("role", "search")
        bar.dataset.dshFindUi = "bar"

        const scopeBtn = document.createElement("button")
        scopeBtn.type = "button"
        scopeBtn.className = "dfa-scope"
        scopeBtn.dataset.dshFindUi = "scope"
        const scopeIcon = document.createElement("span")
        scopeIcon.style.display = "inline-flex"
        const scopeLabel = document.createElement("span")
        scopeBtn.append(scopeIcon, scopeLabel)

        const input = document.createElement("input")
        input.type = "text"
        input.className = "dfa-input"
        input.dataset.dshFindUi = "input"
        input.spellcheck = false
        input.autocomplete = "off"
        input.setAttribute("autocapitalize", "off")
        input.setAttribute("autocorrect", "off")

        const count = document.createElement("span")
        count.className = "dfa-count"
        count.setAttribute("aria-live", "polite")

        const sep = document.createElement("span")
        sep.className = "dfa-sep"

        const prev = this.makeButton("up", "prev")
        const next = this.makeButton("down", "next")
        const close = this.makeButton("close", "close")
        close.classList.add("dfa-close")

        bar.append(scopeBtn, input, count, sep, prev, next, close)

        scopeBtn.addEventListener("click", () => this.toggleScope())
        input.addEventListener("input", this.onInput)
        input.addEventListener("keydown", this.onInputKeyDown)
        prev.addEventListener("click", () => this.step(-1))
        next.addEventListener("click", () => this.step(1))
        close.addEventListener("click", () => this.close())

        this.bar = bar
        this.input = input
        this.count = count
        this.prevBtn = prev
        this.nextBtn = next
        this.closeBtn = close
        this.scopeBtn = scopeBtn
        this.scopeLabel = scopeLabel
        this.scopeIcon = scopeIcon
        this.refreshLocale()
      }

      buildPanelTrigger() {
        const btn = document.createElement("button")
        btn.type = "button"
        btn.className = "dfa-panel-trigger"
        btn.dataset.dshFindUi = "panel-trigger"
        btn.setAttribute("aria-keyshortcuts", PRIMARY + "+Shift+F")
        btn.appendChild(domIcon("search", 15))
        btn.addEventListener("click", () => this.openBar("rightpanel"))
        return btn
      }

      makeButton(iconName, labelKey) {
        const btn = document.createElement("button")
        btn.type = "button"
        btn.className = "dfa-btn"
        btn.dataset.dshFindUi = labelKey
        btn.dataset.labelKey = labelKey
        btn.appendChild(domIcon(iconName))
        return btn
      }

      refreshLocale() {
        if (!this.bar) return
        const t = this.t
        const panelScope = this.scope === "rightpanel"
        this.bar.classList.toggle("dfa-scope-panel", panelScope)
        this.scopeLabel.textContent = t(panelScope ? "scope.rightpanel" : "scope.chat")
        this.scopeIcon.replaceChildren(domIcon(panelScope ? "rightpanel" : "chat"))
        this.scopeBtn.title = t("scope.switch") + " (" + PRIMARY + "+Shift+F)"
        this.scopeBtn.setAttribute("aria-label", t("scope.switch"))
        this.input.placeholder = t(panelScope ? "placeholder.rightpanel" : "placeholder.chat")
        this.input.setAttribute("aria-label", t("input"))
        this.bar.setAttribute("aria-label", t(panelScope ? "bar.rightpanel" : "bar.chat"))
        if (this.panelTrigger) {
          const panelLabel = t("open.rightpanel")
          this.panelTrigger.title = panelLabel + " (" + PRIMARY + "+Shift+F)"
          this.panelTrigger.setAttribute("aria-label", panelLabel)
        }
        for (const btn of [this.prevBtn, this.nextBtn, this.closeBtn]) {
          if (!btn) continue
          const key = btn.dataset.labelKey
          const label = t(key)
          btn.title = label
          btn.setAttribute("aria-label", label)
        }
      }

      onKeyDown(event) {
        if (event.defaultPrevented || event.isComposing) return
        const mod = event.ctrlKey || event.metaKey
        const key = event.key
        if (mod && !event.altKey && (key === "f" || key === "F" || event.code === "KeyF")) {
          const scope = event.shiftKey ? "rightpanel" : this.preferredScope()
          if (this.openBar(scope)) {
            event.preventDefault()
            event.stopPropagation()
          }
          return
        }
        if (!this.opened) return
        if (key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          this.close()
          return
        }
        if (key === "F3" || (mod && !event.altKey && (key === "g" || key === "G" || event.code === "KeyG"))) {
          event.preventDefault()
          event.stopPropagation()
          this.step(event.shiftKey ? -1 : 1)
        }
      }

      onInputKeyDown(event) {
        if (event.isComposing) return
        if (event.key === "Enter") {
          event.preventDefault()
          event.stopPropagation()
          this.step(event.shiftKey ? -1 : 1)
        } else if (event.key === "Escape") {
          event.preventDefault()
          event.stopPropagation()
          this.close()
        }
      }

      preferredScope() {
        const pane = this.getRightPanelPane()
        const frame = this.getFrame()
        if (pane && (pane.contains(document.activeElement) || frame?.hasAttribute("data-rightbar-fullscreen"))) {
          return "rightpanel"
        }
        return "conversation"
      }

      openBar(scope, options) {
        if (!this.bar) {
          this.pendingScope = scope
          return false
        }
        let nextScope = scope
        let column = nextScope === "rightpanel" ? this.getRightPanelPane() : this.getCenterColumn()
        if (!column || column.getBoundingClientRect().width < 120) {
          const alternate = nextScope === "rightpanel" ? "conversation" : "rightpanel"
          const candidate = alternate === "rightpanel" ? this.getRightPanelPane() : this.getCenterColumn()
          if (!candidate || candidate.getBoundingClientRect().width < 120) return false
          nextScope = alternate
          column = candidate
        }
        if (nextScope === "rightpanel" && column.getBoundingClientRect().width < 180) return false

        const alreadyOpen = this.opened
        this.scope = nextScope
        this.opened = true
        this.regionCache = null
        if (!alreadyOpen) this.previouslyFocused = document.activeElement
        this.bar.classList.add("dfa-open")
        this.pendingScope = null
        this.refreshLocale()
        this.position()
        if (nextScope === "rightpanel" && this.panelTrigger) this.panelTrigger.style.display = "none"
        this.updatePanelTrigger()
        if (!alreadyOpen) {
          this.input.value = this.queries[this.scope] || ""
          this.query = this.input.value
        } else if (this.query !== this.input.value) {
          this.query = this.input.value
        }
        window.removeEventListener("resize", this.onResize)
        window.addEventListener("resize", this.onResize)
        this.input.focus({ preventScroll: true })
        this.input.select()
        this.searchNow({ reveal: true, reset: true })
        if (!options || options.focus !== false) this.input.focus({ preventScroll: true })
        return true
      }

      close() {
        if (!this.opened) return
        this.opened = false
        this.disconnectObserver()
        this.clearHighlights()
        this.bar.classList.remove("dfa-open", "dfa-empty", "dfa-shake")
        window.removeEventListener("resize", this.onResize)
        if (this.input) this.input.blur()
        const previous = this.previouslyFocused
        this.previouslyFocused = null
        if (previous && previous.isConnected && typeof previous.focus === "function") {
          try {
            previous.focus({ preventScroll: true })
          } catch {}
        }
        this.updatePanelTrigger()
      }

      toggleScope() {
        const next = this.scope === "rightpanel" ? "conversation" : "rightpanel"
        const column = next === "rightpanel" ? this.getRightPanelPane() : this.getCenterColumn()
        if (!column || column.getBoundingClientRect().width < 180) {
          this.shake()
          return
        }
        this.scope = next
        this.query = this.input.value
        this.queries[next] = this.query
        this.regionCache = null
        this.refreshLocale()
        this.position()
        if (next === "rightpanel" && this.panelTrigger) this.panelTrigger.style.display = "none"
        this.updatePanelTrigger()
        this.searchNow({ reveal: true, reset: true })
        this.input.focus({ preventScroll: true })
      }

      onInput() {
        this.query = this.input.value
        this.queries[this.scope] = this.query
        this.scheduleSearch(90, true)
      }

      scheduleSearch(delay, reset) {
        window.clearTimeout(this.searchTimer)
        this.searchTimer = window.setTimeout(() => {
          this.searchNow({ reveal: Boolean(reset), reset: Boolean(reset) })
        }, delay)
      }

      onResize() {
        this.position()
        this.updatePanelTrigger()
      }

      onMutation() {
        window.clearTimeout(this.mutationTimer)
        this.mutationTimer = window.setTimeout(() => {
          if (!this.opened) return
          this.searchNow({ reveal: false, reset: false })
        }, 180)
      }

      searchNow({ reveal, reset }) {
        if (!this.opened) return
        const column = this.scope === "rightpanel" ? this.getRightPanelPane() : this.getCenterColumn()
        if (!column) {
          this.matches = []
          this.activeIndex = -1
          this.clearHighlights()
          this.updateUi()
          return
        }
        const root = this.getSearchRoot(column)
        this.ensureObserver(root)

        const previous = !reset && this.activeIndex >= 0 ? this.matches[this.activeIndex] : null
        const previousIndex = this.activeIndex
        const query = this.input.value.trim()
        this.query = this.input.value
        let matches = []
        if (query) matches = this.collect(root, query)
        this.matches = matches
        let nextIndex = -1
        if (matches.length > 0) {
          if (previous) {
            nextIndex = matches.findIndex((m) => m.node === previous.node && m.start === previous.start)
            if (nextIndex < 0) nextIndex = clamp(previousIndex, 0, matches.length - 1)
          } else {
            nextIndex = 0
          }
        }
        this.activeIndex = nextIndex
        this.paint()
        this.updateUi()
        if (reveal && nextIndex >= 0) this.revealActive(true)
      }

      collect(root, query) {
        const matches = []
        const needle = query.toLowerCase()
        if (!needle) return matches
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
            if (this.isExcluded(node, root)) return NodeFilter.FILTER_REJECT
            return NodeFilter.FILTER_ACCEPT
          }
        })
        let node
        while ((node = walker.nextNode())) {
          const text = node.nodeValue
          const hay = text.toLowerCase()
          let from = 0
          while (from <= hay.length - needle.length) {
            const at = hay.indexOf(needle, from)
            if (at < 0) break
            matches.push({ node, start: at, end: at + query.length })
            if (matches.length >= MAX_MATCHES) return matches
            from = at + Math.max(1, needle.length)
          }
        }
        return matches
      }

      isExcluded(node, root) {
        let el = node.parentElement
        while (el && el !== root) {
          if (el.nodeType === 1) {
            const tag = el.tagName
            if (
              tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEMPLATE" ||
              tag === "TEXTAREA" || tag === "INPUT" || tag === "SELECT" || tag === "OPTION"
            ) return true
            if (el.isContentEditable) return true
            if (el.getAttribute("role") === "textbox") return true
            if (el.hasAttribute("data-dsh-find-ui")) return true
            if (el.getAttribute("aria-hidden") === "true") return true
          }
          el = el.parentElement
        }
        return false
      }

      paint() {
        if (!supportsHighlight()) return
        CSS.highlights.delete(HIGHLIGHT_ALL)
        CSS.highlights.delete(HIGHLIGHT_ACTIVE)
        if (!this.matches.length) return
        const ranges = this.matches.map((match) => {
          const range = document.createRange()
          range.setStart(match.node, match.start)
          range.setEnd(match.node, match.end)
          return range
        })
        const active = this.activeIndex >= 0 ? ranges[this.activeIndex] : null
        const rest = active ? ranges.filter((_, index) => index !== this.activeIndex) : ranges
        if (rest.length > 0) {
          try {
            CSS.highlights.set(HIGHLIGHT_ALL, new Highlight(...rest))
          } catch {}
        }
        if (active) {
          try {
            CSS.highlights.set(HIGHLIGHT_ACTIVE, new Highlight(active))
          } catch {}
        }
      }

      clearHighlights() {
        if (!supportsHighlight()) return
        CSS.highlights.delete(HIGHLIGHT_ALL)
        CSS.highlights.delete(HIGHLIGHT_ACTIVE)
      }

      revealActive(center) {
        const match = this.matches[this.activeIndex]
        if (!match) return
        const range = document.createRange()
        range.setStart(match.node, match.start)
        range.setEnd(match.node, match.end)
        const rect = range.getBoundingClientRect()
        const root = this.getSearchRoot()
        const scroller = this.findScroller(match.node, root)
        if (!scroller) {
          try {
            match.node.parentElement?.scrollIntoView({ block: "center", behavior: "smooth" })
          } catch {}
          return
        }
        if (!center) {
          const sr = scroller.getBoundingClientRect()
          if (rect.top >= sr.top + 8 && rect.bottom <= sr.bottom - 8) return
        }
        const sr = scroller.getBoundingClientRect()
        const top = scroller.scrollTop + (rect.top - sr.top) - scroller.clientHeight / 2 + rect.height / 2
        try {
          scroller.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
        } catch {
          scroller.scrollTop = Math.max(0, top)
        }
      }

      findScroller(node, root) {
        let el = node.parentElement
        while (el && el !== root?.parentElement) {
          if (el.isConnected) {
            const style = getComputedStyle(el)
            if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 4) return el
          }
          if (el === root) break
          el = el.parentElement
        }
        return null
      }

      updateUi() {
        const total = this.matches.length
        const current = this.activeIndex >= 0 ? this.activeIndex + 1 : 0
        this.count.textContent = current + "/" + total
        this.prevBtn.disabled = total === 0
        this.nextBtn.disabled = total === 0
        const empty = Boolean(this.input.value.trim()) && total === 0
        this.bar.classList.toggle("dfa-empty", empty)
        if (empty && this.query) this.shake()
      }

      shake() {
        this.bar.classList.remove("dfa-shake")
        void this.bar.offsetWidth
        this.bar.classList.add("dfa-shake")
      }

      step(delta) {
        if (!this.matches.length) {
          this.shake()
          return
        }
        const length = this.matches.length
        const base = this.activeIndex < 0 ? (delta > 0 ? -1 : 0) : this.activeIndex
        this.activeIndex = (base + delta + length) % length
        this.paint()
        this.updateUi()
        this.revealActive(true)
        if (this.input && document.activeElement !== this.input) {
          this.input.focus({ preventScroll: true })
        }
      }

      ensureObserver(root) {
        if (!root || !this.opened) return
        if (this.observer && this.observerRoot === root && root.isConnected) return
        this.disconnectObserver()
        this.observerRoot = root
        this.observer = new MutationObserver(this.onMutation)
        this.observer.observe(root, { childList: true, subtree: true, characterData: true })
      }

      disconnectObserver() {
        if (this.observer) this.observer.disconnect()
        this.observer = null
        this.observerRoot = null
      }

      getSearchRoot(column) {
        const col = column || (this.scope === "rightpanel" ? this.getRightPanelPane() : this.getCenterColumn())
        if (!col) return null
        if (this.regionCache && this.regionCache.column === col && this.regionCache.el.isConnected) {
          return this.regionCache.el
        }
        const region = this.findScrollRegion(col) || col
        this.regionCache = { column: col, el: region }
        return region
      }

      findScrollRegion(column) {
        const columnRect = column.getBoundingClientRect()
        const minWidth = Math.min(260, Math.max(140, columnRect.width * 0.5))
        let best = null
        const candidates = column.querySelectorAll("div,section,main,ul,ol")
        for (const el of candidates) {
          if (el.clientHeight < 160) continue
          if (el.scrollHeight <= el.clientHeight + 10) continue
          const rect = el.getBoundingClientRect()
          if (rect.width < minWidth) continue
          const style = getComputedStyle(el)
          if (!/(auto|scroll)/.test(style.overflowY)) continue
          const score = el.clientHeight * rect.width
          if (!best || score > best.score) best = { el, score }
        }
        return best ? best.el : null
      }

      getCenterColumn() {
        const anchor = this.anchors.conversation
        if (anchor && anchor.isConnected) {
          const column = this.climbToConversationColumn(anchor)
          if (column && column.getBoundingClientRect().width > 200) return column
        }
        const frame = this.getFrame()
        if (!frame) return null
        let best = null
        let fallback = null
        for (const child of frame.children) {
          if (child.nodeType !== 1) continue
          if (
            child.hasAttribute("data-shell-overlay") ||
            child.hasAttribute("data-shell-bottom") ||
            child.hasAttribute("data-shell-leading") ||
            child.hasAttribute("data-rightbar-col")
          ) continue
          const rect = child.getBoundingClientRect()
          if (rect.height < window.innerHeight * 0.5 || rect.width < 200) continue
          if (!fallback || rect.width > fallback.width) fallback = { el: child, width: rect.width }
          if (rect.left < 40) continue
          if (!best || rect.width > best.width) best = { el: child, width: rect.width }
        }
        return (best || fallback)?.el || null
      }

      getRightPanelPane() {
        const owners = [...document.querySelectorAll("[data-sidebar-right-session]")]
        const owner = owners.find(
          (el) => el.hasAttribute("data-sidebar-right-open") && el.closest('[hidden], [aria-hidden="true"]') === null
        )
        if (!owner) return null
        const panes = [...owner.querySelectorAll("[data-dockkit-pane], [data-dockkit-float]")].filter(
          (el) => el.closest('[hidden], [aria-hidden="true"]') === null
        )
        const pane =
          panes.find(
            (el) => el.hasAttribute("data-dockkit-pane-active") || el.hasAttribute("data-dockkit-float-active")
          ) || panes[0]
        const target = pane || owner
        const rect = target.getBoundingClientRect()
        if (rect.width < 160 || rect.height < 120) return null
        return target
      }

      getFrame() {
        const overlay = document.querySelector("[data-shell-overlay]")
        return overlay ? overlay.parentElement : null
      }

      climbToConversationColumn(anchor) {
        let el = anchor
        let best = null
        while (el && el !== document.body) {
          const rect = el.getBoundingClientRect()
          if (rect.width > window.innerWidth * 0.95 && rect.height > window.innerHeight * 0.9) break
          if (rect.width > 300 && rect.height > Math.min(320, window.innerHeight * 0.5)) best = el
          el = el.parentElement
        }
        return best
      }

      position() {
        if (!this.bar || !this.opened) return
        const column = this.scope === "rightpanel" ? this.getRightPanelPane() : this.getCenterColumn()
        if (!column) return
        const rect = column.getBoundingClientRect()
        if (this.scope === "rightpanel") {
          const width = Math.min(520, Math.max(260, rect.width - 24))
          let left = rect.right - width - 12
          left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
          const root = this.getSearchRoot(column)
          const rootRect = root && root !== column ? root.getBoundingClientRect() : null
          const top = rootRect && rootRect.width > 200 ? Math.max(rect.top + 8, rootRect.top + 6) : rect.top + 8
          this.bar.style.left = left + "px"
          this.bar.style.top = Math.min(top, rect.bottom - 48) + "px"
          this.bar.style.width = width + "px"
        } else {
          const width = Math.min(520, Math.max(300, rect.width - 48))
          let left = rect.left + Math.max(12, (rect.width - width) / 2)
          left = Math.max(12, Math.min(left, window.innerWidth - width - 12))
          this.bar.style.left = left + "px"
          this.bar.style.top = rect.top + 8 + "px"
          this.bar.style.width = width + "px"
        }
        this.bar.style.right = "auto"
        this.bar.style.bottom = "auto"
      }
    }

    const controller = new FindController()

    function ChatTrigger(props) {
      const ref = React.useRef(null)
      React.useEffect(() => {
        controller.setAnchor("conversation", ref.current)
        return () => controller.setAnchor("conversation", null)
      }, [])
      const t = props.t
      return React.createElement(
        "button",
        {
          ref,
          type: "button",
          className: "dfa-trigger",
          "aria-label": t("open"),
          "aria-keyshortcuts": PRIMARY + "+F",
          title: t("open") + " (" + PRIMARY + "+F)",
          onClick: () => controller.openBar("conversation")
        },
        icon("search")
      )
    }

    function FindBarHost() {
      const ref = React.useRef(null)
      React.useEffect(() => {
        const host = ref.current
        if (!host) return
        controller.mount(host)
        return () => controller.unmount()
      }, [])
      return React.createElement("div", { className: "dfa-host", ref })
    }

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, DICT), "dsh-find-anywhere: dictionaries")
      const translate = ctx.locale.bind(NS)
      controller.setTranslator(translate)

      ctx.effect(() => {
        const style = document.createElement("style")
        style.dataset.pluginCss = "@dsh-external/dsh-find-anywhere"
        style.textContent = STYLE_TEXT
        document.head.appendChild(style)
        return () => style.remove()
      }, "dsh-find-anywhere: styles")

      ctx.effect(() => {
        document.addEventListener("keydown", controller.onKeyDown, true)
        return () => document.removeEventListener("keydown", controller.onKeyDown, true)
      }, "dsh-find-anywhere: shortcuts")

      ctx.effect(() => ctx.locale.subscribe(() => controller.setTranslator(ctx.locale.bind(NS))), "dsh-find-anywhere: locale")

      ctx.effect(
        () =>
          ctx.slots.inject("conversation.session.header.utilities", () =>
            ctx.slots.register({
              name: "conversation.session.header.utilities",
              id: "dsh-find-anywhere:open-chat",
              order: 25,
              label: () => translate("open"),
              locale: NS
            }, ChatTrigger)
          ),
        "dsh-find-anywhere: chat trigger"
      )

      ctx.effect(
        () =>
          ctx.slots.inject("shell.overlay", () =>
            ctx.slots.register({
              name: "shell.overlay",
              id: "dsh-find-anywhere:bar",
              order: 1000,
              label: () => translate("open"),
              locale: NS
            }, FindBarHost)
          ),
        "dsh-find-anywhere: find bar"
      )
    }

    exports.apply = apply
    exports.inject = ["slots", "locale"]
    return module.exports
  }
})
