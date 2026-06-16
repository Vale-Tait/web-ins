# WebInsprition Design Guide

这份文档用于开发新页面或新组件时保持现有产品风格一致。优先复用 `app/globals.css` 里的 CSS 变量和已有组件 class，不要为单个页面重新发明一套视觉语言。

## 1. 设计基调

整体风格是低饱和、克制、偏工具型的 inspiration manager。界面应当像一个内容管理工作台，而不是营销页。

关键词：

- 极简留白
- 低对比边线
- mono 操作感
- 小圆角
- 轻玻璃质感
- 页面结构清晰
- 动效短、柔和、不过度装饰

不要使用大面积渐变、装饰光斑、过大的圆角、厚重阴影、彩色卡片背景或复杂插画。

## 2. 全局比例与布局

应用整体使用 75% 视觉比例：

```css
--app-scale: 0.75;
```

根容器是 `.app-scale-root`，页面内容都在这个缩放容器内。不要绕过 `ProductShell` 直接做全屏页面，否则比例、滚动和弹窗会不一致。

基础结构：

- 左侧主题栏：`84px`
- 顶部导航栏：`90px`
- 主内容区：`padding-left: 84px; padding-top: 90px`
- 顶栏固定，左栏固定
- 页面背景使用 `var(--bg)`
- 主要边线使用 `var(--line)`

常见页面 padding：

```tsx
className="px-7 py-5 md:px-10"
className="p-4 md:px-10 lg:px-14"
className="px-7 py-28 md:px-10"
```

列表页保持宽松留白。不要把内容塞满屏幕。

## 3. 主题 Token

所有页面必须使用 CSS 变量，不要直接写死白底黑字，除非是危险色或不可主题化的品牌色。

核心 token：

```css
--bg
--panel
--muted-panel
--text
--muted
--faint
--line
--button
--button-text
--accent
--shadow
--ease-out
```

默认主题：

```css
--bg: #ffffff;
--panel: #ffffff;
--muted-panel: #f7f7f8;
--text: #111827;
--muted: #7b8494;
--line: #e9ebef;
--button: #171717;
--button-text: #ffffff;
```

暗色主题：

```css
--bg: #101112;
--panel: #151617;
--muted-panel: #1d1f21;
--text: #f1f3f5;
--muted: #8d96a3;
--line: #2b2e33;
--button: #f4f5f6;
--button-text: #111111;
```

暖色主题 `dawn` / `dusk` 使用更暖的背景和 muted 色。新增组件必须天然适配这四个主题。

## 4. 字体与文字

全局字体：

```css
font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

操作型文字、元信息、标签、数据字段大量使用 mono：

```css
.mono {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
```

使用规则：

- 顶部主导航：sans，`28px - 31px`，`font-semibold`
- 页面大标题：mono，约 `30px - 38px`，`font-semibold`
- 弹窗标题：mono，`25px - 30px`
- 标签/字段名：mono，uppercase，`12px - 18px`
- 元信息：mono，`11px - 14px`，颜色 `var(--muted)`
- 文件夹卡片标题：mono，`text-base font-semibold`

不要使用负 letter-spacing。当前项目整体 `letter-spacing: 0`。

## 5. 颜色使用

文字层级：

```tsx
text-[var(--text)]       // 主文字
text-[var(--muted)]      // 次级文字
text-[var(--button-text)] // 主按钮文字
```

背景层级：

```tsx
bg-[var(--bg)]           // 页面背景
bg-[var(--panel)]        // 弹窗/普通面板
bg-[var(--muted-panel)]  // 输入框、hover、轻量信息块
bg-[var(--button)]       // 主按钮
```

边线：

```tsx
border border-[var(--line)]
```

危险操作：

```css
#ef4444
#ff4545
#ff3b3b
```

危险色只用于 Delete、Delete link 这类操作，不要用于普通强调。

## 6. 圆角与边框

项目整体偏硬朗，小圆角为主。

推荐：

- 普通按钮：`rounded-md` 或 `rounded-[4px]`
- 小图标按钮：`rounded-[3px]`
- 浮窗菜单项：`rounded-[3px]`
- 弹窗：`rounded-[3px]` 到 `rounded-[4px]`
- 文件夹卡片：`rounded-md`
- 不要使用 `rounded-2xl`、`rounded-3xl` 这类大圆角，除非已有设计明确需要

边框尽量轻：

```tsx
border border-[var(--line)]
```

玻璃组件边框要更弱，避免锐利白线：

```css
border-color: rgba(17, 24, 39, 0.055);
```

## 7. Button 规范

基础按钮要短、硬朗、直接。

主按钮：

```tsx
className="dialog-primary-button h-[54px] rounded-[3px] mono text-lg font-semibold"
```

次级按钮：

```tsx
className="dialog-secondary-button h-[54px] rounded-[3px] mono text-lg transition"
```

危险按钮：

```tsx
className="dialog-danger-button mono flex h-[54px] items-center gap-3 rounded-md px-6 text-lg font-semibold"
```

图标按钮：

```tsx
className="dialog-icon-button grid h-8 w-8 place-items-center rounded-[3px]"
```

按钮默认 active：

```css
button:active {
  transform: scale(0.97);
}
```

不要给按钮默认加厚阴影、白色描边、过大的 hover 上浮。

## 8. 表单与输入框

输入框使用 `dialog-field` 或等价 token：

```tsx
className="dialog-field mono h-[54px] w-full px-5 text-lg outline-none"
```

规则：

- 高度常用 `54px`
- 边框使用 `var(--line)`
- focus 只改变边框到 `var(--accent)`
- placeholder 使用 `var(--muted)`
- 输入框背景使用 `var(--panel)` 或透明
- 不要使用蓝色 focus ring，除非是系统辅助可见状态

textarea：

```tsx
className="dialog-field min-h-[120px] w-full resize-none px-5 py-3 text-lg outline-none"
```

搜索框常用 muted panel：

```tsx
className="flex h-12 items-center gap-2 rounded-md bg-[var(--muted-panel)] px-3"
```

## 9. Dialog / Modal

弹窗遮罩：

```tsx
className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
```

弹窗主体：

```tsx
className="dialog-surface w-full max-w-[720px] rounded-[3px] p-9"
```

大编辑弹窗：

```tsx
className="dialog-surface w-full max-w-[768px] rounded-[4px] p-9"
```

删除确认弹窗：

```tsx
className="dialog-surface w-full max-w-[520px] rounded-[4px] p-7"
```

弹窗规范：

- 背景必须用 `dialog-surface`
- 输入用 `dialog-field`
- 标签用 mono uppercase
- 按钮区放在底部，主按钮在右
- 关闭按钮放右上
- 暗色主题下不能出现硬编码 `bg-white`

## 10. Floating Menu / Popover

浮窗使用轻玻璃质感，保持小尺寸和小圆角。

菜单面板：

```tsx
className="floating-menu-surface absolute right-3 top-[72px] z-30 w-[360px] rounded-[4px] p-2"
```

玻璃参数：

```css
background-color: rgba(255, 255, 255, 0.62);
border: 1px solid rgba(255, 255, 255, 0.14);
backdrop-filter: blur(18px) saturate(125%);
```

菜单项：

```tsx
className="floating-menu-item flex h-14 w-full items-center gap-4 rounded-[3px] px-4 mono text-base transition"
```

hover：

```css
background-color: rgba(17, 24, 39, 0.065);
```

不要让菜单项默认就是 hover 状态。不要用强白边、厚阴影或灰黑不透明面板。

## 11. 文件夹卡片

文件夹卡片是当前产品最核心的视觉组件。

尺寸：

- 外层：`lg:w-[340px] h-[244px]`
- 透视：`perspective: 1200px`
- 预览卡：`138 x 163`
- 玻璃前板：底部 `70%` 高度

结构：

- 背板：轻渐变背景，`translateZ(-15px)`
- 预览截图：最多 3 张，错位堆叠
- 前板：玻璃模糊
- 文本层：放在前板底部，不能额外 3D 旋转，避免文字发虚

玻璃前板参数：

```css
background-color: rgba(255, 255, 255, 0.18);
border-color: rgba(17, 24, 39, 0.055);
box-shadow: 0 12px 28px rgba(17, 24, 39, 0.075);
backdrop-filter: blur(18px) saturate(125%);
```

暗色：

```css
background-color: rgba(28, 28, 30, 0.42);
border-color: rgba(255, 255, 255, 0.08);
box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
```

hover 动效：

```tsx
duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]
group-hover:scale-105
group-hover:-rotate-x-14
```

前板 hover：

```tsx
group-hover:translate-y-2
group-hover:translate-z-15
group-hover:-rotate-x-25
```

不要让文字层跟随额外 `rotateX`，否则文字会发虚。

## 12. Link Tile

链接卡片用于展示网页截图。

截图容器：

```tsx
className="relative aspect-[16/10] overflow-hidden border border-[var(--line)] bg-[var(--muted-panel)]"
```

下方 URL 行：

```tsx
className="mt-3 flex items-center justify-between gap-3"
```

URL 文本：

```tsx
className="mono min-w-0 truncate text-sm text-[var(--muted)]"
```

右侧 Link badge：

```tsx
className="mono rounded bg-[var(--muted-panel)] px-2 py-1 text-[11px] font-bold uppercase text-[var(--text)]"
```

编辑按钮：

```css
background-color: rgba(232, 232, 232, 0.9);
backdrop-filter: blur(18px) saturate(120%);
border: 0;
box-shadow: none;
```

不要给编辑按钮加白色边线或阴影。

## 13. 页面模板

Collections 列表：

```tsx
<div className="flex-1 p-4 pb-24 md:px-10 md:pb-6 md:pt-9 lg:px-14 lg:pt-11">
  <div className="flex flex-col lg:flex-row lg:flex-wrap gap-10 items-center lg:items-start">
    ...
  </div>
</div>
```

详情页顶部 breadcrumb：

```tsx
<section className="border-b border-[var(--line)] px-7 py-5 md:px-10">
  <p className="mono text-sm">...</p>
</section>
```

详情页主体：

```tsx
<section className="grid min-h-[calc(100dvh-151px)] grid-cols-1 lg:h-[calc(100dvh-151px)] lg:overflow-hidden lg:grid-cols-[58%_42%]">
```

分析页居中内容：

```tsx
<section className="px-7 py-28 md:px-10">
  <div className="mx-auto max-w-[930px]">
```

## 14. 动效

默认缓动：

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

柔和 hover：

```css
cubic-bezier(0.22, 1, 0.36, 1)
```

建议时长：

- 普通 hover：`160ms - 220ms`
- 图标/文字颜色：`160ms`
- 文件夹 3D hover：`320ms`
- 底部创建按钮 hover：`520ms`
- 弹窗出现如果未来新增：`180ms - 240ms`

底部创建按钮 hover：

```tsx
hover:-translate-y-1.5
hover:scale-[1.04]
duration-[520ms]
ease-[cubic-bezier(0.22,1,0.36,1)]
```

不要使用弹性过冲、bounce、长时间 delay 或大幅度位移。

## 15. Scrollbar

自定义滚动条使用 `.soft-scrollbar`。

用于：

- 文件夹选择列表
- 浮窗内滚动区域
- 需要显式内部滚动的小面板

不要让 `body` 成为滚动容器。当前滚动职责在 `.app-scale-root` 内部。

## 16. 图标

项目主要使用 `@phosphor-icons/react`。

常用尺寸：

- 小图标：`18px - 20px`
- 普通操作：`22px - 24px`
- 弹窗关闭：`27px - 28px`
- 大上传图标：`30px`

图标 stroke/weight 保持 regular 或 bold，不要混用太多风格。

## 17. 开发时避免

不要这样做：

- 硬编码 `bg-white`、`text-black`，导致暗色主题失效
- 大圆角、大阴影、大渐变
- 使用紫色、蓝色、彩色装饰作为默认强调
- 在玻璃面板上加明显白色描边
- 让文字层参与 3D transform
- 给按钮 hover 加不必要的上浮、scale 或 shadow
- 新建一套与 `dialog-*`、`floating-menu-*` 无关的弹窗样式
- 使用 `transition-all` 覆盖复杂组件的关键动效
- 把弹窗 portal 到 body 后逃出 `.app-scale-root`

## 18. 新组件检查清单

开发新页面或组件前检查：

- 是否包在 `ProductShell` 内
- 是否使用 `var(--bg)`、`var(--text)`、`var(--muted)`、`var(--line)`
- 暗色、dawn、dusk 主题是否都可读
- 圆角是否控制在 `3px - 8px`
- 边框是否轻，hover 是否自然
- mono 是否用于操作/标签/数据，sans 是否用于导航/普通说明
- 弹窗是否使用 `dialog-surface`
- 浮窗是否使用 `floating-menu-surface`
- 动效是否短而柔和
- 是否避免整页滚动条和比例逃逸

