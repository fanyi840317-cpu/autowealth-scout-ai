# AutoWealth Scout AI ⚡

AI 驱动的全球蓝海市场扫描器 — 实时发现自动化赚钱机会。

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)
![Gemini](https://img.shields.io/badge/Gemini_AI-Pro-4285F4?logo=google)

## ✨ 功能特性

- 🔍 **市场发现** — AI 扫描全球蓝海行业与细分领域
- 📊 **机会分析** — 预估收入、自动化评分、难度评级
- 💬 **AI 专家咨询** — 与 Gemini 实时对话，深入探讨机会细节
- ⚡ **自动化 Agent 生成** — 一键生成自动化脚本代码
- 🔐 **Agent 资产库** — 保存和管理生成的自动化方案
- 🌐 **中英双语** — 完整的中文/英文界面切换
- 🎯 **智能筛选** — 按团队规模、预算、技能、时间等维度过滤

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) >= 18
- [Google Gemini API Key](https://aistudio.google.com/apikey)

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/<your-username>/autowealth-scout-ai.git
cd autowealth-scout-ai

# 安装依赖
npm install

# 配置环境变量
# 创建 .env.local 文件，添加你的 Gemini API Key
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用。

## 🏗️ 技术栈

| 技术 | 用途 |
|------|------|
| **React 19** | UI 框架 |
| **TypeScript 5.8** | 类型安全 |
| **Vite 6** | 构建工具 |
| **Tailwind CSS** | 样式系统 |
| **Google Gemini API** | AI 模型 (Flash + Pro) |
| **Recharts** | 数据可视化 |

## 📁 项目结构

```
autowealth-scout-ai/
├── index.html              # 入口 HTML
├── index.tsx               # React 挂载点
├── App.tsx                 # 主应用组件
├── types.ts                # TypeScript 类型定义
├── vite.config.ts          # Vite 配置
├── components/
│   ├── OpportunityCard.tsx  # 机会卡片
│   ├── OpportunityModal.tsx # 机会详情弹窗 + AI 对话
│   ├── SandboxView.tsx      # 代码沙箱视图
│   ├── Terminal.tsx         # 系统日志终端
│   ├── TrendChart.tsx       # 趋势图表
│   └── AgentLibrary.tsx     # Agent 资产库
├── services/
│   └── geminiService.ts     # Gemini API 服务层
├── IMPROVEMENT_PLAN.md      # 产品改进路线图
└── .env.local               # 环境变量 (不提交到 Git)
```

## 🗺️ 改进路线图

详见 [IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md)，包含三阶段改进规划：

1. **第一阶段** — 基础修复与核心转型 (从"发现机会"到"验证想法")
2. **第二阶段** — 用户体验升级 (个性化画像、移动端适配、架构重构)
3. **第三阶段** — 差异化与壁垒构建 (真实数据源、垂直领域深耕)

## 📜 License

MIT
