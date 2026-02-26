# 自动化商业方案改进设计 (Automation Business Loop)

## 1. 核心问题分析
用户反馈：“现在的方案没有可操作性，只是给了一段代码（如爬虫），但不知道爬什么、爬了卖给谁、怎么变现。”
**当前痛点**：
- **纯技术视角**：只关注“如何写脚本”，忽略了“为什么写脚本”。
- **缺乏商业闭环**：没有定义 Input (数据源/资源) -> Process (加工) -> Output (交付物) -> Customer (买家)。
- **操作性差**：用户拿到代码后，依然不知道第一步该做什么业务动作。

## 2. 改进目标
将“自动化脚本生成器”升级为**“自动化微型商业 MVP 生成器”**。
不仅仅是 `code`，而是 `Business in a Box`。

## 3. 数据结构升级 (Schema Redesign)

我们需要在 `AutomationResult` 中增加以下维度：

### A. 商业模式 (The "Why")
- **Target Customer**: 谁会买这个结果？（例如：房地产经纪人、跨境电商卖家、本地小微企业主）
- **Deliverable**: 最终交付给客户的是什么？（例如：Excel 潜客名单、每日价格监控报告、自动生成的 SEO 文章）
- **Monetization**: 怎么收钱？（例如：单次出售数据 $50、订阅制 $29/月、作为引流钩子）

### B. 操作手册 (The "How")
- **Input Source**: 具体去哪里找数据？（例如：Google Maps 特定关键词、Amazon Best Sellers 榜单、特定行业论坛）
- **Process Logic**: 脚本具体做了什么增值？（例如：清洗数据、聚合多个来源、筛选高价值目标）
- **Execution Frequency**: 多久运行一次？（例如：每日运行、每周运行、一次性）

## 4. Prompt 策略调整
在 `geminiService.ts` 中，我们将强制 AI 扮演 **"Growth Hacker & Product Manager"** 而不仅仅是 "Engineer"。

**Prompt 核心指令变更**：
1.  **禁令**：禁止生成“通用爬虫”或“Hello World”级别的演示代码。
2.  **强制**：必须针对一个具体的**利基市场 (Niche)** 设计**最小闭环**。
3.  **结构化输出**：
    ```json
    {
      "title": "Amazon 竞品价格监控器",
      "summary": "自动抓取 Top 100 竞品价格，每日生成 Excel 报告，帮助卖家调整定价。",
      "target_user": "亚马逊 FBA 私有品牌卖家",
      "value_proposition": "节省人工监控时间，防止价格战亏损。",
      "monetization_strategy": "在卖家论坛发帖，提供免费试用，之后 $19/月订阅日报。",
      "code": "...", // 实际 Python/Node 代码
      "setup_guide": "...",
      "manual_operation": "每天早上运行脚本，将生成的 report.csv 发送给客户群。"
    }
    ```

## 5. UI 呈现 (SandboxView)
界面需要分为两部分：
1.  **商业蓝图 (Business Blueprint)**：
    -   **卖给谁？** (Target)
    -   **卖什么？** (Product)
    -   **怎么卖？** (Strategy)
2.  **执行引擎 (Execution Engine)**：
    -   **代码预览**
    -   **配置指南**
    -   **运行按钮** (模拟)

## 6. 实施步骤
1.  修改 `types.ts`：扩展 `AutomationResult` 接口。
2.  修改 `geminiService.ts`：重写 System Prompt 和 User Prompt。
3.  修改 `SandboxView.tsx`：重构 UI，优先展示商业逻辑，代码作为支撑工具。
