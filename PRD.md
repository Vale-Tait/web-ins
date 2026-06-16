# Website Inspiration Manager PRD

Version: MVP V1.0

---

# 1. 产品概述

## 产品定位

Website Inspiration Manager 是一个用于收藏、分类、分析和整理网站灵感的个人工具。

用户通过输入 URL 收藏外部网站，并通过文件夹、搜索、分析和无限画布进行管理。

产品不提供：

- 灵感发现
- 案例推荐
- AI 推荐
- 社区内容

所有内容均由用户主动收藏。

---

# 2. 产品目标

帮助用户解决：

- 浏览器书签难管理
- 收藏网站无法分类整理
- 网站分析信息需要手动收集
- 网站灵感无法进行可视化组织
- 收藏后难以再次查找

---

# 3. 目标用户

## 核心用户

- UI Designer
- UX Designer
- Product Manager
- Frontend Developer
- Indie Hacker

---

# 4. 产品结构

产品包含三个核心模块：

```text
Collections
Analyze
Canvas
```

---

# 5. 用户流程

## 收藏网站

```text
登录
↓
Collections
↓
Create
↓
Save URL
↓
输入 URL
↓
选择文件夹
↓
保存
↓
自动分析（默认开启）
```

---

## 分析网站

```text
Analyze
↓
输入 URL
↓
Analyze Website
↓
查看分析结果
↓
保存到收藏（可选）
```

---

## 创建画布

```text
Canvas
↓
Create Canvas
↓
命名
↓
导入收藏内容
↓
整理灵感
```

---

# 6. Collections

## 6.1 首页

登录后默认进入 Collections。

页面包含：

- Search
- Folder List
- All Items
- Analyze
- Create
- Theme Switch

---

## 6.2 文件夹

系统默认：

```text
All Items
Unsorted
```

支持：

- Create Folder
- Rename Folder
- Delete Folder

---

## 6.3 Save URL

点击：

```text
Create
→ Save URL
```

弹窗字段：

### URL

```text
https://example.com
```

---

### Save to Folder(s)

支持：

- 搜索文件夹
- 多选文件夹

例如：

```text
☑ Portfolio
☑ Dashboard
☑ Agency
```

---

### Include Tech Stack Analysis

默认开启：

```text
☑ Include tech stack analysis
```

---

### Save

执行：

```text
保存网站
生成截图
执行分析
```

---

## 6.4 搜索

支持搜索：

### Website Domain

```text
stripe.com
linear.app
```

### Folder Name

```text
Portfolio
Dashboard
```

### Note

```text
优秀动画效果
```

### Custom Tag

```text
Typography
Minimal
```

---

# 7. 收藏详情页

## Screenshot

显示网站截图。

支持：

```text
Replace Screenshot
```

---

## Website Info

显示：

```text
Domain
External Link
```

例如：

```text
isadeburgh.com
```

---

## Folder

显示：

```text
Saved in 2 folders
```

支持修改所属文件夹。

---

## Note

支持：

```text
Add Note
```

---

## Custom Tags

支持：

```text
+ Add
```

示例：

```text
Portfolio
Typography
Agency
```

---

## Analysis Result

### Fonts

例如：

```text
PP Neue Montreal
Founders Grotesk
Editorial New
```

---

### Animation

例如：

```text
GSAP
Lenis
Framer Motion
```

---

### Tech Stack

例如：

```text
Next.js
React
Vercel
```

---

## Item Actions

```text
Edit
Replace Screenshot
Delete Link
```

---

# 8. Analyze

## 功能说明

独立分析网站，无需先收藏。

---

## 输入

```text
Website URL
```

---

## 输出

### Screenshot

网站截图

### Fonts

字体识别

### Animation

动画库识别

### Tech Stack

技术栈识别

---

## 保存

分析完成后：

```text
Save to Folder
```

加入收藏库。

---

# 9. Canvas

## Canvas List

支持：

```text
Create Canvas
```

创建画布。

---

创建时输入：

```text
Canvas Name
```

例如：

```text
Agency Research
```

---

## Canvas History

支持：

- Open
- Rename
- Delete

---

## Canvas Editor

### Import Folder

导入整个文件夹。

---

### Import Item

导入单个收藏项。

---

### Website Preview

显示网站预览卡片。

---

### Device View

支持：

```text
Desktop
Tablet
Mobile
```

---

### Note

支持创建便签。

例如：

```text
优秀导航设计
适合作品集网站
```

---

### Layout

支持：

- Drag
- Resize
- Pan
- Zoom

无限画布。

---

# 10. Theme

支持：

```text
Dark
Light
Dawn
Dusk
System
```

说明：

| Theme  | Description |
| ------ | ----------- |
| Dark   | 深色主题    |
| Light  | 浅色主题    |
| Dawn   | 暖色浅主题  |
| Dusk   | 暖色深主题  |
| System | 跟随系统    |

---

# 11. 数据模型

## User

```sql
id
email
name
avatar_url
theme
created_at
updated_at
```

---

## Folder

```sql
id
user_id
name
description
is_default
created_at
updated_at
```

---

## Link

```sql
id
user_id
url
domain
title
description
screenshot_url
note
status
created_at
updated_at
```

---

## LinkFolder

```sql
id
link_id
folder_id
created_at
```

用于支持：

```text
一个网站属于多个文件夹
```

---

## Tag

```sql
id
user_id
name
created_at
```

---

## LinkTag

```sql
id
link_id
tag_id
created_at
```

---

## AnalysisResult

```sql
id
link_id
fonts
animations
tech_stack
colors
created_at
updated_at
```

---

## Canvas

```sql
id
user_id
name
thumbnail_url
created_at
updated_at
```

---

## CanvasNode

```sql
id
canvas_id
type
link_id
content
x
y
width
height
device_view
created_at
updated_at
```

---

# 12. 数据关系

```text
User
├── Folder
├── Link
└── Canvas

Link
├── Folder (N:N)
├── Tag (N:N)
└── AnalysisResult (1:1)

Canvas
└── CanvasNode (1:N)

CanvasNode
└── Link
```

---

# 13. 技术架构

## Frontend

```text
Next.js
React
TypeScript
TailwindCSS
```

---

## Backend

```text
Next.js Route Handlers
```

负责：

- Auth
- Folder CRUD
- Link CRUD
- Search
- Canvas CRUD
- Analysis Task

---

## Database

```text
PostgreSQL
```

---

## Storage

推荐：

```text
Cloudflare R2
```

存储：

- Screenshot
- Canvas Thumbnail

---

## Screenshot Service

```text
Playwright
```

流程：

```text
Save URL
↓
Create Screenshot Job
↓
Generate Screenshot
↓
Upload Storage
↓
Update Link
```

---

## Analysis Service

```text
Playwright
```

分析：

- Fonts
- Animation
- Tech Stack
- Screenshot

---

## Canvas

推荐：

```text
React Flow
```

节点类型：

```text
Website Node
Note Node
```

---

# 14. API

## Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

---

## Folder

```http
GET /api/folders
POST /api/folders
PATCH /api/folders/:id
DELETE /api/folders/:id
```

---

## Link

```http
GET /api/links
POST /api/links
GET /api/links/:id
PATCH /api/links/:id
DELETE /api/links/:id
```

---

## Analysis

```http
POST /api/analyze
GET /api/analysis/:id
```

---

## Canvas

```http
GET /api/canvas
POST /api/canvas
GET /api/canvas/:id
PATCH /api/canvas/:id
DELETE /api/canvas/:id
```

---

## Search

```http
GET /api/search?q=
```

---

# 15. MVP范围

## Included

- 用户注册
- 用户登录
- 文件夹管理
- Save URL
- 多文件夹归类
- 网站截图
- 网站分析
- 收藏详情页
- 搜索
- Canvas
- Website Preview
- Notes
- Theme

---

```

```
