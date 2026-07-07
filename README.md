# Lake Macquarie EV & E-Bus Survey — Web Prototype

基于问卷规格 **LM_EV_eBus_Questionnaire_v4.3** 的在线填写网页，可用于 **pilot 测试** 或作为 **SurveyEngine 编程参考**。

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173` 即可填写。

生产部署：

```bash
npm run build
npm run preview
```

`dist/` 目录可上传至任意静态托管（Netlify、GitHub Pages、大学服务器等）。

## 已实现功能

- **Part 0–10** 全部题目模块（欢迎、筛选、出行、充电、态度、DCE-A/B、人口统计等）
- **v4.3 核心路由逻辑**：
  - 非 LGA 居民 / 未满 18 岁终止
  - 零车家庭跳过 Q2.2–Q2.5，显示 Q4.5
  - `USUAL_CENTRE_MODE` 驱动 DCE-B 状态 quo 标签与车费显示
  - `HOME_CHARGE_FEASIBLE` 路由 DCE-A 充电方式
  - On Demand 选项按郊区 lookup 显示
  - 非驾驶员不可选 “Drive myself”
- **随机化**：`ORDER_ATT`（态度在 DCE 前/后 50/50）、`ORDER_DCE`（A-first / B-first）、态度题随机顺序
- **DCE 示例任务**：8 个 DCE-A + 6 个 DCE-B（pilot 用示例设计；正式 fieldwork 需从 **Ngene** 导入 SurveyEngine）
- **数据导出**：完成后可下载 **JSON** 或 **CSV**（含 computed 变量与注意力检查标记）

## 与 SurveyEngine 的关系

正式 fieldwork（N≈600）建议在 **SurveyEngine** 上部署：

1. 在 SurveyEngine Dashboard 创建新项目
2. 按本规格编程逻辑，或 **Export/Import Codeplan**（Excel 格式）
3. 从 **Ngene** 直接导入 DCE 实验设计（DCE-A 8 tasks、DCE-B 6 tasks）
4. 本网页 prototype 可用于 pilot（N≈50–80）收集反馈，或对照检查逻辑

SurveyEngine 文档：<https://surveyengine.com/software-tutorials/how-to-build-an-online-questionnaire/>

## 项目结构

```
src/
  App.tsx              # 主问卷流程与全部 Part
  types.ts             # 答案数据结构
  data/constants.ts    # 郊区、态度题文案
  utils/compute.ts     # 派生变量与 DCE 任务生成
  utils/export.ts      # JSON/CSV 导出
  components/          # 可复用表单组件
```

## 注意事项

- DCE 属性水平为 **pilot 示例**，非 Ngene 正式设计矩阵
- HREC 批准号需在 Part 0 正式投放前填入
- 正式投放前需锁定 **reference month**（Opal 票价、电价、油价、车价）

## 技术栈

React 18 · TypeScript · Vite · 纯静态部署，无需后端
