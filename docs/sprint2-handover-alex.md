# Sprint 2 Frontend Handover

> **Project:** Course Collaboration Platform (ISIT950 Autumn 2026)
> **Sprint:** 2 — Static UI with Mock Data
> **Stack:** React + Vite + Tailwind CSS + React Router v6 + React Hook Form

---

## Table of Contents

- [中文版 (Chinese)](#中文版)
- [English Version](#english-version)

---

<a name="中文版"></a>
# 中文版

## 1. 项目结构

```
frontend/src/
├── components/
│   └── shared/             ← 所有可复用 UI 组件
│       ├── index.js        ← 统一导出入口（所有组件从这里 import）
│       ├── Navbar.jsx
│       ├── StudentSidebar.jsx
│       ├── InstructorSidebar.jsx
│       ├── Button.jsx
│       ├── LoadingSpinner.jsx
│       ├── Skeleton.jsx
│       ├── Modal.jsx
│       ├── FileUpload.jsx
│       └── StatusBadge.jsx
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx   ← 登录 / 注册（双面板卡片，动画切换）
│   ├── CourseList.jsx      ← 学生课程列表
│   ├── CourseDetail.jsx    ← 课程详情（4 个 Tab）
│   ├── AssignmentSubmission.jsx
│   └── Forum.jsx
├── mock/                   ← Sprint 2 静态数据，Sprint 3 替换为真实 API
│   ├── users.js
│   ├── courses.js
│   ├── materials.js
│   ├── assignments.js
│   ├── announcements.js
│   └── forum.js
├── lib/
│   ├── auth.jsx            ← AuthContext + useAuth hook（唯一认证状态来源）
│   └── axios.js            ← Axios 实例 + 拦截器
├── router/
│   └── index.jsx           ← 所有路由 + 路由守卫
├── index.css               ← 全局样式（所有 .ccp-* 类）
└── main.jsx                ← 应用入口
```

---

## 2. 新建 / 修改的文件

| 文件 | 状态 | 说明 |
|---|---|---|
| `src/router/index.jsx` | 新建 | 所有路由定义，包含 `ProtectedRoute`、`StudentRoute`、`InstructorRoute` 路由守卫，以及 `StudentLayout`、`InstructorLayout` 布局包装器 |
| `src/lib/auth.jsx` | 新建 | `AuthContext`、`AuthProvider`、`useAuth` hook。管理登录状态，支持 mock token 本地解析（无需后端） |
| `src/lib/axios.js` | 新建 | Axios 实例，`baseURL: '/api'`。请求拦截器自动附加 Bearer token；响应拦截器在 401 时自动清除 token 并跳转 `/login` |
| `src/context/AuthContext.jsx` | 修改 | 仅作重导出，实际逻辑已移至 `lib/auth.jsx` |
| `src/pages/auth/LoginPage.jsx` | 新建 | 登录 / 注册页，完整实现原型 `#page-auth` 的双面板卡片、wipe 动画、React Hook Form 验证、mock 登录逻辑、开发快捷登录按钮（仅 `import.meta.env.DEV` 为 true 时显示）|
| `src/pages/CourseList.jsx` | 修改 | 改为使用 mock 数据 |
| `src/pages/CourseDetail.jsx` | 修改 | 改为使用 mock 数据 |
| `src/pages/AssignmentSubmission.jsx` | 修改 | 改为使用 mock 数据 |
| `src/pages/Forum.jsx` | 修改 | 改为使用 mock 数据（含本地写操作模拟） |
| `src/components/shared/Navbar.jsx` | 新建 | 顶部导航栏，高度 56px，渐变背景，显示登录用户名和头像 |
| `src/components/shared/StudentSidebar.jsx` | 新建 | 学生侧边栏，active 图标色 `#7a5a6a` |
| `src/components/shared/InstructorSidebar.jsx` | 新建 | 讲师侧边栏，active 图标色 `#534ab7` |
| `src/components/shared/Button.jsx` | 新建 | 通用按钮，支持 `primary` / `secondary` / `danger` 变体，`loading` 和 `disabled` 状态 |
| `src/components/shared/LoadingSpinner.jsx` | 新建 | 可配置尺寸的加载旋转图标，支持 `fullPage` 全屏居中 |
| `src/components/shared/Skeleton.jsx` | 新建 | 骨架屏组件，提供 `Skeleton.Block`、`Skeleton.Row`、`Skeleton.CourseCard` |
| `src/components/shared/Modal.jsx` | 新建 | 通用弹窗，使用 React Portal 渲染，支持标题 / 内容 / 底部按钮插槽 |
| `src/components/shared/FileUpload.jsx` | 新建 | 拖拽上传组件，仅接受 PDF / DOCX，最大 50 MB |
| `src/components/shared/StatusBadge.jsx` | 新建 | 作业状态徽章，五种状态各对应独立颜色 |
| `src/components/shared/index.js` | 新建 | 所有共享组件的统一导出 |
| `src/mock/*.js` | 新建 | 六个 mock 数据文件 |
| `src/index.css` | 修改 | 新增全局样式：`.ccp-nav-item`、`.ccp-sidebar-*`、`.ccp-modal-*`、`.ccp-upload-*`、`.ccp-file-*`、`.ccp-skeleton`、`.auth-*` |
| `src/main.jsx` | 修改 | 使用 `AuthProvider` + `BrowserRouter` 包裹 `AppRouter` |
| `index.html` | 修改 | 修正 Gowun Batang 字体 CDN 链接（包含 400 和 700 字重） |

---

## 3. 路由列表

```
/                         → 重定向到 /login
/login                    → 登录 / 注册页（公开）

── 学生路由（需登录，role === 'student'）──────────────────────────
/courses                  → 课程列表（已实现）
/courses/:id              → 课程详情（已实现，含 4 个 Tab）
/courses/:id/assignments/:asgId/submit  → 作业提交（已实现）
/courses/:id/assignments/:asgId/review  → 作业评审（待实现）
/assignments              → 全局作业列表（待实现）
/discussions              → 全局讨论（待实现）
/announcements            → 全局公告（待实现）
/profile                  → 学生个人资料（待实现）

── 讲师路由（需登录，role === 'instructor'）────────────────────────
/dashboard                → 讲师仪表盘（待实现）
/instructor/courses       → 课程管理（待实现）
/instructor/grading       → 评分（待实现）
/instructor/discussions   → 讨论收件箱（待实现）
/instructor/announcements → 公告管理（待实现）
/instructor/analytics     → 学生分析（待实现）
/instructor/profile       → 讲师个人资料（待实现）
```

**路由守卫逻辑：**
- 未登录访问任何受保护路由 → 跳转 `/login`
- 学生访问 `/instructor/*` → 跳转 `/courses`
- 讲师访问学生路由 → 跳转 `/dashboard`

---

## 4. 共享组件使用方法

所有组件统一从 `src/components/shared` 导入：

```jsx
import { Button, Modal, FileUpload, StatusBadge, Skeleton, LoadingSpinner } from '../components/shared';
```

### Button

```jsx
// 三种变体
<Button variant="primary" onClick={handleSave}>保存</Button>
<Button variant="secondary" onClick={handleCancel}>取消</Button>
<Button variant="danger" onClick={handleDelete}>删除</Button>

// 加载状态
<Button loading={isSubmitting}>提交中...</Button>

// 禁用状态
<Button disabled={!isValid}>提交</Button>
```

### Modal

```jsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>打开</Button>

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="创建课程"
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
      <Button onClick={handleSubmit}>确认</Button>
    </>
  }
>
  {/* 弹窗内容 */}
  <p>这里放表单或内容</p>
</Modal>
```

> **注意：** Modal 通过 `createPortal` 渲染在 `document.body`，不会受父级 `overflow:hidden` 影响。

### FileUpload

```jsx
const [file, setFile] = useState(null);

<FileUpload
  value={file}
  onChange={setFile}          // 传入 null 表示移除文件
  error="请上传文件"           // 可选，显示外部验证错误
  maxSizeMB={50}              // 可选，默认 50
/>

// 与 React Hook Form Controller 配合使用：
<Controller
  name="file"
  control={control}
  rules={{ required: '请选择文件' }}
  render={({ field: { value, onChange }, fieldState: { error } }) => (
    <FileUpload value={value ?? null} onChange={onChange} error={error?.message} />
  )}
/>
```

### StatusBadge

```jsx
// 五种状态
<StatusBadge status="due-soon" />   // 红色，"Due soon"
<StatusBadge status="upcoming" />   // 灰色，"Upcoming"
<StatusBadge status="overdue" />    // 红色，"Overdue"
<StatusBadge status="submitted" />  // 绿色，"Submitted"
<StatusBadge status="graded" />     // 紫色，"Graded"
```

### Skeleton

```jsx
// 默认：4 行骨架
if (loading) return <Skeleton />;

// 自定义行数
if (loading) return <Skeleton rows={6} />;

// 单块
<Skeleton.Block width="200px" height="20px" radius="10px" />

// 课程卡片骨架
<Skeleton.CourseCard />
```

### LoadingSpinner

```jsx
// 全页居中
<LoadingSpinner fullPage />

// 内嵌，自定义尺寸（px）
<LoadingSpinner size={24} />
```

---

## 5. 数据加载模式

**所有页面必须遵循以下模式（直接复制，替换数据获取部分）：**

```jsx
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  // Sprint 2：setTimeout 模拟网络延迟 + mock 数据
  const timer = setTimeout(() => {
    try {
      setData(getMockXxx(id));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [id]);

// Sprint 3 替换为（shape 不变）：
// axios.get(`/api/...`).then(res => setData(res.data)).catch(setError).finally(() => setLoading(false));

if (loading) return <Skeleton rows={5} />;
if (error)   return <p style={{ color: '#d85a30' }}>加载失败，请刷新重试。</p>;
```

---

## 6. Mock 数据字段结构

### 用户（`src/mock/users.js`）

```js
// 对应 POST /api/auth/login 和 /register 的响应
{
  id:            number,
  name:          string,            // 全名
  email:         string,
  password:      string,            // 仅 mock，真实 API 不返回
  role:          'student' | 'instructor',
  studentNumber: string | null,     // 学生专有
  department:    string | null,     // 讲师专有
}
```

### 课程（`src/mock/courses.js`）

```js
// 对应 GET /api/courses 和 GET /api/courses/:id
{
  id:            number,
  code:          string,            // 如 "ISIT950"
  name:          string,
  description:   string,
  instructor:    { id: number, name: string },
  coverImageUrl: string | null,
  semester: {
    startDate:   string,            // ISO 8601 日期
    endDate:     string,            // endDate > today → "进行中"，否则 "已完成"
  },
  enrolledCount: number,
}
```

### 课程材料（`src/mock/materials.js`）

```js
// 对应 GET /api/courses/:id/materials
{
  id:          number,
  courseId:    number,
  filename:    string,
  fileType:    'pdf' | 'doc' | 'ppt' | 'zip',
  url:         string,
  section:     string,             // 分组标题，如 "Week 1: Introduction"
  size:        number,             // 字节数
  uploadedAt:  string,             // ISO 8601
}
```

### 作业（`src/mock/assignments.js`）

```js
// 对应 GET /api/courses/:id/assignments
{
  id:          number,
  courseId:    number,
  title:       string,
  description: string,
  openDate:    string,             // ISO 8601
  dueDate:     string,             // ISO 8601
  maxScore:    number,
  submissionStatus: null | {       // null → 未提交
    id:          number,
    fileUrl:     string,
    submittedAt: string,
    score:       number | null,    // null → 已提交但未评分
    feedback:    string | null,
  },
}
```

**作业状态判断逻辑（必须严格遵守）：**

```js
const now = Date.now();
const open = new Date(assignment.openDate).getTime();
const due  = new Date(assignment.dueDate).getTime();
const sub  = assignment.submissionStatus;

if (open > now)                          → 'upcoming'   （置灰，不可点击）
if (open <= now && due > now && !sub)    → 'due-soon'   （可点击 → /submit）
if (due <= now  && !sub)                 → 'overdue'    （置灰）
if (sub && sub.score === null)           → 'submitted'  （可点击 → /review）
if (sub && sub.score !== null)           → 'graded'     （可点击 → /review）
```

### 公告（`src/mock/announcements.js`）

```js
// 对应 GET /api/courses/:id/announcements
{
  id:        number,
  courseId:  number,
  title:     string,
  body:      string,
  status:    'published' | 'draft',
  author:    { id: number, name: string },
  createdAt: string,               // ISO 8601，按降序排列
}
```

### 论坛帖子（`src/mock/forum.js`）

```js
// 对应 GET /api/courses/:id/posts
{
  id:         number,
  courseId:   number,
  title:      string,
  body:       string,
  author:     { id: number, name: string },
  authorRole: 'student' | 'instructor',
  createdAt:  string,
  replies: [
    {
      id:         number,
      postId:     number,
      body:       string,
      author:     { id: number, name: string },
      authorRole: 'student' | 'instructor',
      createdAt:  string,
    }
  ],
}
```

---

## 7. 认证机制

```jsx
// 获取当前用户（任意组件）
import { useAuth } from '../lib/auth';
const { user, login, logout, loading } = useAuth();

// user 对象结构
{
  id:   number,
  name: string,
  role: 'student' | 'instructor',
  email: string,
}
```

**Sprint 2 mock 登录账号：**

| 邮箱 | 密码 | 角色 |
|---|---|---|
| `bwang@uowmail.edu.au` | `password1` | Student |
| `clee@uowmail.edu.au` | `password1` | Student |
| `mitchell@uowmail.edu.au` | `password1` | Instructor |

开发环境（`import.meta.env.DEV`）登录页面底部有快捷登录按钮，无需手动填写。

---

## 8. 新建页面注意事项

1. **导入路径** — 共享组件永远从 `'../components/shared'`（或对应的相对路径）导入，不要直接 import 单个文件。

2. **样式** — 不要自创颜色或间距。所有设计令牌在 `.cursorrules` 和 `src/index.css` 中已定义。自定义 CSS 类名必须以 `ccp-` 开头。如需 hover 效果必须写 CSS 类（不能用 inline style）。

3. **Icons** — 只使用 Material Symbols Rounded：
   ```jsx
   <span className="material-symbols-rounded">icon_name</span>
   ```
   不使用任何其他图标库。

4. **数据加载** — 务必实现加载（`<Skeleton>`）和错误状态。页面不得因数据缺失而崩溃。

5. **Mock 数据** — 新增 mock 数据时字段必须和上方「数据字段结构」完全一致，Sprint 3 替换时才不会出错。

6. **路由守卫** — 学生页面放在 `<StudentRoute>` 内，讲师页面放在 `<InstructorRoute>` 内。不要直接在 `<ProtectedRoute>` 下添加角色限制页面。

7. **两端布局已内置** — `StudentLayout` / `InstructorLayout` 已包含 Navbar 和对应 Sidebar，新页面只需实现 main content 区域的内容，不需要再套 Navbar。

8. **写操作** — Sprint 2 所有写操作（POST/PUT/DELETE）用本地 state 模拟更新，不发真实请求。

---

---

<a name="english-version"></a>
# English Version

## 1. Project Structure

```
frontend/src/
├── components/
│   └── shared/             ← All reusable UI components
│       ├── index.js        ← Barrel export (import everything from here)
│       ├── Navbar.jsx
│       ├── StudentSidebar.jsx
│       ├── InstructorSidebar.jsx
│       ├── Button.jsx
│       ├── LoadingSpinner.jsx
│       ├── Skeleton.jsx
│       ├── Modal.jsx
│       ├── FileUpload.jsx
│       └── StatusBadge.jsx
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx   ← Login / Register (dual-panel card, wipe animation)
│   ├── CourseList.jsx      ← Student course list
│   ├── CourseDetail.jsx    ← Course detail (4 tabs)
│   ├── AssignmentSubmission.jsx
│   └── Forum.jsx
├── mock/                   ← Sprint 2 static data; replaced by real API in Sprint 3
│   ├── users.js
│   ├── courses.js
│   ├── materials.js
│   ├── assignments.js
│   ├── announcements.js
│   └── forum.js
├── lib/
│   ├── auth.jsx            ← AuthContext + useAuth hook (single source of truth)
│   └── axios.js            ← Axios instance + interceptors
├── router/
│   └── index.jsx           ← All routes + route guards
├── index.css               ← Global styles (all .ccp-* classes)
└── main.jsx                ← App entry point
```

---

## 2. New and Modified Files

| File | Status | Description |
|---|---|---|
| `src/router/index.jsx` | Created | All route definitions with `ProtectedRoute`, `StudentRoute`, `InstructorRoute` guards, and `StudentLayout` / `InstructorLayout` shell wrappers |
| `src/lib/auth.jsx` | Created | `AuthContext`, `AuthProvider`, `useAuth` hook. Manages auth state with local mock-token resolution (no backend required) |
| `src/lib/axios.js` | Created | Axios instance with `baseURL: '/api'`. Request interceptor attaches Bearer token; response interceptor clears token and redirects to `/login` on 401 |
| `src/context/AuthContext.jsx` | Modified | Re-exports only; real logic lives in `lib/auth.jsx` |
| `src/pages/auth/LoginPage.jsx` | Created | Login / Register page matching prototype `#page-auth`: dual-panel card, wipe animation, React Hook Form validation, mock login logic, dev quick-login buttons (only shown when `import.meta.env.DEV`) |
| `src/pages/CourseList.jsx` | Modified | Switched to mock data |
| `src/pages/CourseDetail.jsx` | Modified | Switched to mock data |
| `src/pages/AssignmentSubmission.jsx` | Modified | Switched to mock data |
| `src/pages/Forum.jsx` | Modified | Switched to mock data (local write simulation) |
| `src/components/shared/Navbar.jsx` | Created | Top navbar, 56px height, gradient background, user avatar and name from `useAuth` |
| `src/components/shared/StudentSidebar.jsx` | Created | Student sidebar, active icon colour `#7a5a6a` |
| `src/components/shared/InstructorSidebar.jsx` | Created | Instructor sidebar, active icon colour `#534ab7` |
| `src/components/shared/Button.jsx` | Created | Reusable button: `primary` / `secondary` / `danger` variants, `loading` spinner, `disabled` state |
| `src/components/shared/LoadingSpinner.jsx` | Created | Configurable spinner with `fullPage` prop for centred overlay |
| `src/components/shared/Skeleton.jsx` | Created | Shimmer skeleton with `Skeleton.Block`, `Skeleton.Row`, `Skeleton.CourseCard` sub-components |
| `src/components/shared/Modal.jsx` | Created | Generic modal rendered via React Portal; title / body / footer slots |
| `src/components/shared/FileUpload.jsx` | Created | Drag-and-drop upload: PDF / DOCX only, 50 MB max |
| `src/components/shared/StatusBadge.jsx` | Created | Assignment status pill; five statuses with distinct colours |
| `src/components/shared/index.js` | Created | Barrel export for all shared components |
| `src/mock/*.js` | Created | Six mock data files |
| `src/index.css` | Modified | Added global classes: `.ccp-nav-item`, `.ccp-sidebar-*`, `.ccp-modal-*`, `.ccp-upload-*`, `.ccp-file-*`, `.ccp-skeleton`, `.auth-*` |
| `src/main.jsx` | Modified | Wraps `AppRouter` with `AuthProvider` + `BrowserRouter` |
| `index.html` | Modified | Fixed Gowun Batang Google Fonts URL to include weight 400 and 700 |

---

## 3. Route List

```
/                         → Redirects to /login
/login                    → Login / Register (public)

── Student routes (requires login, role === 'student') ────────────────
/courses                  → Course list (implemented)
/courses/:id              → Course detail with 4 tabs (implemented)
/courses/:id/assignments/:asgId/submit  → Assignment submission (implemented)
/courses/:id/assignments/:asgId/review  → Assignment review (pending)
/assignments              → Global assignments list (pending)
/discussions              → Global discussions (pending)
/announcements            → Global announcements (pending)
/profile                  → Student profile (pending)

── Instructor routes (requires login, role === 'instructor') ──────────
/dashboard                → Instructor dashboard (pending)
/instructor/courses       → Course management (pending)
/instructor/grading       → Grading (pending)
/instructor/discussions   → Discussions inbox (pending)
/instructor/announcements → Announcements management (pending)
/instructor/analytics     → Student analytics (pending)
/instructor/profile       → Instructor profile (pending)
```

**Route guard behaviour:**
- Unauthenticated user visits any protected route → redirected to `/login`
- Student visits `/instructor/*` → redirected to `/courses`
- Instructor visits student routes → redirected to `/dashboard`

---

## 4. Shared Component Usage

Import everything from the shared barrel:

```jsx
import { Button, Modal, FileUpload, StatusBadge, Skeleton, LoadingSpinner } from '../components/shared';
```

### Button

```jsx
<Button variant="primary" onClick={handleSave}>Save</Button>
<Button variant="secondary" onClick={handleCancel}>Cancel</Button>
<Button variant="danger" onClick={handleDelete}>Delete</Button>

// Loading state (spinner shown, button disabled automatically)
<Button loading={isSubmitting}>Submitting…</Button>

// Disabled state
<Button disabled={!isValid}>Submit</Button>
```

### Modal

```jsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Open</Button>

<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Create Course"
  footer={
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleSubmit}>Confirm</Button>
    </>
  }
>
  {/* Modal body — forms, text, anything */}
  <p>Modal content goes here.</p>
</Modal>
```

> **Note:** `Modal` renders via `createPortal` directly onto `document.body`, so it is never clipped by a parent `overflow:hidden` container.

### FileUpload

```jsx
// Standalone
const [file, setFile] = useState(null);

<FileUpload
  value={file}
  onChange={setFile}          // called with null when file is removed
  error="Please upload a file"  // optional — show an external validation error
  maxSizeMB={50}              // optional, default 50
/>

// With React Hook Form Controller
<Controller
  name="file"
  control={control}
  rules={{ required: 'Please select a file' }}
  render={({ field: { value, onChange }, fieldState: { error } }) => (
    <FileUpload value={value ?? null} onChange={onChange} error={error?.message} />
  )}
/>
```

### StatusBadge

```jsx
<StatusBadge status="due-soon" />   // red    "Due soon"
<StatusBadge status="upcoming" />   // grey   "Upcoming"
<StatusBadge status="overdue" />    // red    "Overdue"
<StatusBadge status="submitted" />  // green  "Submitted"
<StatusBadge status="graded" />     // purple "Graded"
```

### Skeleton

```jsx
// Default: 4 shimmer rows
if (loading) return <Skeleton />;

// Custom row count
if (loading) return <Skeleton rows={6} />;

// Individual block
<Skeleton.Block width="200px" height="20px" radius="10px" />

// Pre-built course card placeholder
<Skeleton.CourseCard />
```

### LoadingSpinner

```jsx
// Full-page centred
<LoadingSpinner fullPage />

// Inline, custom size in px
<LoadingSpinner size={24} />
```

---

## 5. Data Loading Pattern

**All pages must follow this exact pattern:**

```jsx
const [data, setData]       = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError]     = useState(null);

useEffect(() => {
  // Sprint 2 — setTimeout simulates network latency
  const timer = setTimeout(() => {
    try {
      setData(getMockXxx(id));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [id]);

// Sprint 3 replacement (shape is identical, just swap the source):
// axios.get(`/api/...`).then(res => setData(res.data)).catch(setError).finally(() => setLoading(false));

if (loading) return <Skeleton rows={5} />;
if (error)   return <p style={{ color: '#d85a30' }}>Failed to load. Please refresh.</p>;
```

---

## 6. Mock Data Field Reference

### User (`src/mock/users.js`)

```js
// Matches POST /api/auth/login and /register responses
{
  id:            number,
  name:          string,
  email:         string,
  password:      string,            // mock only — real API never returns this
  role:          'student' | 'instructor',
  studentNumber: string | null,     // students only
  department:    string | null,     // instructors only
}
```

### Course (`src/mock/courses.js`)

```js
// Matches GET /api/courses and GET /api/courses/:id
{
  id:            number,
  code:          string,            // e.g. "ISIT950"
  name:          string,
  description:   string,
  instructor:    { id: number, name: string },
  coverImageUrl: string | null,
  semester: {
    startDate:   string,            // ISO 8601 date
    endDate:     string,            // endDate > today → "In progress", else "Completed"
  },
  enrolledCount: number,
}
```

### Course Material (`src/mock/materials.js`)

```js
// Matches GET /api/courses/:id/materials
{
  id:          number,
  courseId:    number,
  filename:    string,
  fileType:    'pdf' | 'doc' | 'ppt' | 'zip',
  url:         string,
  section:     string,             // group heading, e.g. "Week 1: Introduction"
  size:        number,             // bytes
  uploadedAt:  string,             // ISO 8601
}
```

### Assignment (`src/mock/assignments.js`)

```js
// Matches GET /api/courses/:id/assignments
{
  id:          number,
  courseId:    number,
  title:       string,
  description: string,
  openDate:    string,             // ISO 8601
  dueDate:     string,             // ISO 8601
  maxScore:    number,
  submissionStatus: null | {       // null → not submitted
    id:          number,
    fileUrl:     string,
    submittedAt: string,
    score:       number | null,    // null → submitted, not yet graded
    feedback:    string | null,
  },
}
```

**Assignment status derivation (implement exactly):**

```js
const now  = Date.now();
const open = new Date(assignment.openDate).getTime();
const due  = new Date(assignment.dueDate).getTime();
const sub  = assignment.submissionStatus;

if (open > now)                         → 'upcoming'   (disabled, grey)
if (open <= now && due > now && !sub)   → 'due-soon'   (clickable → /submit)
if (due <= now  && !sub)                → 'overdue'    (disabled)
if (sub && sub.score === null)          → 'submitted'  (clickable → /review)
if (sub && sub.score !== null)          → 'graded'     (clickable → /review)
```

### Announcement (`src/mock/announcements.js`)

```js
// Matches GET /api/courses/:id/announcements
{
  id:        number,
  courseId:  number,
  title:     string,
  body:      string,
  status:    'published' | 'draft',
  author:    { id: number, name: string },
  createdAt: string,               // ISO 8601, sorted descending
}
```

### Forum Post (`src/mock/forum.js`)

```js
// Matches GET /api/courses/:id/posts
{
  id:         number,
  courseId:   number,
  title:      string,
  body:       string,
  author:     { id: number, name: string },
  authorRole: 'student' | 'instructor',
  createdAt:  string,
  replies: [
    {
      id:         number,
      postId:     number,
      body:       string,
      author:     { id: number, name: string },
      authorRole: 'student' | 'instructor',
      createdAt:  string,
    }
  ],
}
```

---

## 7. Authentication

```jsx
// Access the current user from any component
import { useAuth } from '../lib/auth';
const { user, login, logout, loading } = useAuth();

// user shape
{
  id:    number,
  name:  string,
  role:  'student' | 'instructor',
  email: string,
}
```

**Sprint 2 mock accounts:**

| Email | Password | Role |
|---|---|---|
| `bwang@uowmail.edu.au` | `password1` | Student |
| `clee@uowmail.edu.au` | `password1` | Student |
| `mitchell@uowmail.edu.au` | `password1` | Instructor |

In development mode (`import.meta.env.DEV`), quick-login buttons are shown at the bottom of the login page — no need to type credentials.

---

## 8. Checklist Before Starting a New Page

1. **Imports** — Always import shared components from `'../components/shared'` (the barrel). Never import individual files directly.

2. **Styling** — Do not invent colours or spacing values. All design tokens are defined in `.cursorrules` and `src/index.css`. Custom CSS class names must be prefixed with `ccp-`. Hover effects must be CSS classes (inline styles cannot handle pseudo-selectors).

3. **Icons** — Use Material Symbols Rounded only:
   ```jsx
   <span className="material-symbols-rounded">icon_name</span>
   ```
   Do not introduce Heroicons, Lucide, FontAwesome, or any other icon library.

4. **Loading and error states** — Every page must show `<Skeleton>` while loading and a human-readable error message on failure. Pages must never crash due to missing data.

5. **Mock data fields** — When adding new mock entries, the shape must exactly match the field reference in Section 6. Correct shape now = painless Sprint 3 API swap.

6. **Route guards** — Student pages go inside `<StudentRoute>`; instructor pages go inside `<InstructorRoute>`. Do not add role-gated pages directly under `<ProtectedRoute>`.

7. **Layouts are already wired** — `StudentLayout` and `InstructorLayout` already include the Navbar and the correct Sidebar. New pages only implement the `<main>` content area — do not re-render a Navbar.

8. **Write operations** — All POST / PUT / DELETE calls in Sprint 2 are simulated by local state updates. Do not make real network requests.
