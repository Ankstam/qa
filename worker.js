export default {
  async fetch(request) {
    if (request.method === "GET") {
      return new Response(getAppHTML(), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response("Method Not Allowed", { status: 405 });
  },
};

function getAppHTML() {
  // 使用 String.raw 防止 Worker 吞掉正则表达式和 LaTeX 公式中的反斜杠
  return String.raw`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>多学科知识与母题双卷 PDF 生成器 (黑白打印专版)</title>
  
  <!-- 多语种字体 (中日英衬线/无衬线/等宽) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,700;1,400&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Noto+Serif+JP:wght@400;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
  
  <!-- KaTeX 渲染物理/数学/化学复杂公式 -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js"></script>
  
  <!-- html2pdf 引擎 -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>

  <style>
    :root {
      --doc-font: 'Noto Serif SC', 'Noto Serif JP', 'Times New Roman', serif;
      --doc-size: 13px;
      --doc-line-height: 1.65;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      background: #f0f2f5;
      color: #000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .app-shell {
      max-width: 1180px;
      margin: 0 auto;
    }

    /* ====== 顶部控制面板 ====== */
    .control-panel {
      background: #fff;
      border: 2px solid #000;
      padding: 18px;
      margin-bottom: 20px;
      box-shadow: 4px 4px 0 #000;
    }
    .panel-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #000;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .controls-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }
    .control-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .control-group label {
      font-size: 12px;
      font-weight: 700;
    }
    select, input[type="text"] {
      padding: 7px 10px;
      border: 1.5px solid #000;
      font-size: 13px;
      background: #fff;
      color: #000;
      font-weight: 500;
    }
    textarea#jsonInput {
      width: 100%;
      height: 190px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      padding: 10px;
      border: 1.5px solid #000;
      margin-bottom: 10px;
      resize: vertical;
    }
    #errorBanner {
      display: none;
      border: 1.5px solid #000;
      background: #000;
      color: #fff;
      padding: 6px 12px;
      font-size: 12px;
      margin-bottom: 10px;
      font-weight: bold;
    }

    .btn-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      padding-top: 8px;
      border-top: 1px dashed #000;
    }
    button {
      padding: 9px 15px;
      font-size: 13px;
      font-weight: 700;
      border: 1.5px solid #000;
      background: #000;
      color: #fff;
      cursor: pointer;
    }
    button:hover { opacity: 0.85; }
    button.btn-outline {
      background: #fff;
      color: #000;
    }
    button.btn-accent {
      background: #000;
      color: #fff;
      box-shadow: 2px 2px 0 #555;
    }
    .mode-badge {
      margin-left: auto;
      font-size: 13px;
      font-weight: bold;
      padding: 6px 12px;
      border: 1.5px solid #000;
      background: #fff;
    }

    /* ====== 打印纸张容器 (严格黑白高对比度) ====== */
    #print-stage {
      background: #fff;
      width: 794px; /* 标准 A4 96DPI 像素宽度，避免导出偏移 */
      min-height: 1123px;
      margin: 0 auto;
      padding: 36px 42px;
      border: 1px solid #000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      font-family: var(--doc-font);
      font-size: var(--doc-size);
      line-height: var(--doc-line-height);
      color: #000;
    }

    .doc-header {
      border-bottom: 2.5px solid #000;
      padding-bottom: 8px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .doc-title-area h1 {
      margin: 0 0 4px 0;
      font-size: 1.55em;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .doc-subtitle { font-size: 0.85em; }
    .doc-version-stamp {
      border: 2px solid #000;
      padding: 4px 10px;
      font-weight: 800;
      font-size: 0.95em;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    ruby { ruby-align: center; }
    rt { font-size: 0.62em; font-weight: normal; }
    .ipa-symbol { font-family: "Lucida Sans Unicode", "Arial Unicode MS", sans-serif; }
    .cloze-blank {
      display: inline-block;
      min-width: 65px;
      border-bottom: 1.2px solid #000;
      text-align: center;
      padding: 0 6px;
      font-weight: bold;
    }

    .sec-block {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 16px;
    }
    .sec-header {
      font-size: 1.12em;
      font-weight: 800;
      border-bottom: 1.5px solid #000;
      padding-bottom: 4px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .sec-tag {
      font-size: 0.78em;
      border: 1px solid #000;
      padding: 1px 6px;
      font-weight: normal;
    }
    .kp-list {
      margin: 0 0 10px 0;
      padding-left: 18px;
    }
    .kp-item { margin-bottom: 6px; }
    .kp-name { font-weight: 700; }
    .formula-bar {
      border: 1px dashed #000;
      padding: 6px 10px;
      margin: 5px 0;
      font-size: 0.95em;
      overflow-x: auto;
    }

    /* 母题模块 */
    .mother-box {
      border: 1.5px solid #000;
      padding: 10px 12px;
      margin-top: 8px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .mother-badge {
      display: inline-block;
      background: #000;
      color: #fff;
      font-weight: 700;
      font-size: 0.85em;
      padding: 1px 7px;
      margin-right: 6px;
    }
    .mother-stem { margin-bottom: 8px; }
    .variation-box {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dotted #000;
      font-size: 0.95em;
    }

    /* 函数图像与配图 */
    .visual-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin: 8px 0;
    }
    .plot-box {
      border: 1px solid #000;
      padding: 6px;
      background: #fff;
      text-align: center;
      max-width: 100%;
    }
    .plot-caption {
      font-size: 0.8em;
      margin-top: 4px;
      font-weight: 600;
    }
    img.bw-threshold { filter: grayscale(100%) contrast(260%) brightness(105%); }
    img.bw-grayscale { filter: grayscale(100%) contrast(125%); }

    /* 答案解析 vs 留白网格 */
    .answer-panel {
      margin-top: 8px;
      border-top: 1px solid #000;
      padding-top: 6px;
    }
    .ans-label {
      font-weight: 800;
      text-decoration: underline;
    }
    .blank-space {
      width: 100%;
      margin-top: 6px;
      border: 1px solid #000;
      position: relative;
    }
    .blank-space-label {
      position: absolute;
      top: 2px;
      left: 5px;
      font-size: 10px;
      color: #000;
      background: #fff;
      padding: 0 3px;
    }
    .pattern-lined {
      background-image: repeating-linear-gradient(to bottom, transparent 0px, transparent 23px, #000 24px);
    }
    .pattern-grid {
      background-size: 18px 18px;
      background-image: 
        linear-gradient(to right, #000 0.6px, transparent 0.6px),
        linear-gradient(to bottom, #000 0.6px, transparent 0.6px);
    }
    .pattern-dotted {
      background-size: 16px 16px;
      background-image: radial-gradient(#000 0.9px, transparent 0.9px);
    }
    .pattern-blank { background: #fff; }

    /* ====== 五种排版类型 ====== */
    /* 1. 康奈尔笔记排版 */
    .layout-cornell .sec-block {
      border: 1.5px solid #000;
      margin-bottom: 18px;
    }
    .layout-cornell .sec-header {
      background: #000;
      color: #fff;
      padding: 6px 10px;
      margin-bottom: 0;
    }
    .layout-cornell .sec-header .sec-tag {
      border-color: #fff;
      color: #fff;
    }
    .layout-cornell .cornell-body {
      display: grid;
      grid-template-columns: 29% 71%;
      border-bottom: 1.5px solid #000;
    }
    .layout-cornell .cornell-cue {
      border-right: 1.5px solid #000;
      padding: 10px;
    }
    .layout-cornell .cornell-main { padding: 10px; }
    .layout-cornell .cornell-summary {
      padding: 8px 10px;
      min-height: 54px;
      font-size: 0.9em;
    }

    /* 2. 双栏紧凑试卷排版 */
    .layout-twocol .doc-body {
      column-count: 2;
      column-gap: 18px;
      column-rule: 1.5px solid #000;
    }
    .layout-twocol .sec-block {
      break-inside: avoid;
      margin-bottom: 14px;
    }

    /* 3. 母题精讲卡片排版 */
    .layout-cards .sec-block {
      border: 2px solid #000;
      padding: 12px;
      box-shadow: 3px 3px 0 #000;
      margin-bottom: 18px;
    }
    .layout-cards .sec-header {
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
    }

    /* 4. 左讲右练对照排版 */
    .layout-split .sec-block {
      display: grid;
      grid-template-columns: 60% 40%;
      border: 1.5px solid #000;
      margin-bottom: 16px;
    }
    .layout-split .split-left {
      padding: 10px 12px;
      border-right: 1.5px solid #000;
    }
    .layout-split .split-right {
      display: flex;
      flex-direction: column;
    }
    .layout-split .split-right-header {
      font-size: 0.82em;
      font-weight: bold;
      padding: 4px 8px;
      border-bottom: 1px solid #000;
      text-align: center;
    }
    .layout-split .split-pad {
      flex: 1;
      min-height: 160px;
    }

    /* 5. 经典大纲讲义排版 */
    .layout-outline .sec-block {
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #000;
    }

    @media print {
      body { background: #fff; padding: 0; }
      .no-print { display: none !important; }
      #print-stage {
        width: 100%;
        border: none;
        box-shadow: none;
        padding: 0;
      }
    }
  </style>
</head>
<body>

<div class="app-shell">
  <div class="control-panel no-print">
    <div class="panel-title">
      <span>文理科母题 & 多语种复杂符号黑白双卷生成器</span>
      <span style="font-size: 12px; font-weight: normal;">支持 KaTeX 公式 / SVG 函数绘制 / 日语振假名 / 问题与答案分离</span>
    </div>

    <div class="controls-grid">
      <div class="control-group">
        <label>1. 排版类型 (5种模式)</label>
        <select id="layoutSelect" onchange="renderAll()">
          <option value="cornell">① 康奈尔笔记排版 (左线索/右母题/底总结)</option>
          <option value="twocol">② 双栏紧凑试卷排版 (高密度分栏刷题)</option>
          <option value="cards">③ 母题精讲卡片排版 (模块化边框精讲)</option>
          <option value="split">④ 左讲右练对照排版 (左侧讲义+右侧演算网格)</option>
          <option value="outline">⑤ 经典大纲讲义排版 (通栏标准教材流式)</option>
        </select>
      </div>

      <div class="control-group">
        <label>2. 预设字体选择</label>
        <select id="fontSelect" onchange="applyTypography()">
          <option value="'Noto Serif SC', 'Noto Serif JP', 'Times New Roman', serif">中日英衬线体 (宋体 / 明朝体 - 试卷标准)</option>
          <option value="'Noto Sans SC', 'Noto Sans JP', Arial, sans-serif">现代无衬线体 (黑体 / 哥特体 - 清晰醒目)</option>
          <option value="'KaiTi', 'STKaiti', 'Kaiti SC', 'Noto Serif SC', serif">传统楷书体 (手写讲义感)</option>
          <option value="'JetBrains Mono', 'Noto Sans SC', 'Noto Sans JP', monospace">理科等宽混合体 (公式代码对齐)</option>
        </select>
      </div>

      <div class="control-group">
        <label>3. 自定义字体名 (选填，覆盖预设)</label>
        <input type="text" id="customFontInput" placeholder="如: FangSong, Yu Mincho..." oninput="applyTypography()">
      </div>

      <div class="control-group">
        <label>4. 基础字号与留白底纹</label>
        <div style="display:flex; gap:6px;">
          <select id="fontSizeSelect" onchange="applyTypography()" style="flex:1;">
            <option value="12px">12px (紧凑)</option>
            <option value="13px" selected>13px (标准)</option>
            <option value="14px">14px (舒朗)</option>
            <option value="15px">15px (大字)</option>
          </select>
          <select id="patternSelect" onchange="renderAll()" style="flex:1.2;">
            <option value="pattern-grid">方格演算底纹</option>
            <option value="pattern-lined">横线笔记底纹</option>
            <option value="pattern-dotted">点阵手账底纹</option>
            <option value="pattern-blank">纯白无底纹</option>
          </select>
        </div>
      </div>

      <div class="control-group">
        <label>5. 图像黑白打印滤镜 & 插入本地图</label>
        <div style="display:flex; gap:6px;">
          <select id="imgFilterSelect" onchange="renderAll()" style="flex:1;">
            <option value="bw-threshold">二值高对比黑白</option>
            <option value="bw-grayscale">高对比灰度</option>
            <option value="">原始图像</option>
          </select>
          <input type="file" id="imgUpload" accept="image/*" style="width:95px; font-size:11px;" title="上传图片自动转为Base64插入当前数据">
        </div>
      </div>
    </div>

    <div id="errorBanner"></div>

    <!-- 预设 JSON 直接内嵌于 textarea 中，杜绝 JS 字符串转义丢失 -->
    <textarea id="jsonInput" spellcheck="false" oninput="renderAll()">{
  "title": "文理综合核心考点与母题精讲双卷",
  "subtitle": "科目：数学 / 物理 / 地理 / 日语 / 英语 | 适用：黑白双面打印",
  "date": "2026-10-14",
  "sections": [
    {
      "category": "理科 · 数学与物理 (函数图像与电磁感应)",
      "tag": "重点必考 ★★★",
      "cues": [
        "超越方程图像交点分析",
        "法拉第电磁感应定律：$\\mathcal{E} = -N\\frac{\\Delta \\Phi}{\\Delta t}$",
        "洛伦兹力矢量式：$\\vec{F} = q(\\vec{E} + \\vec{v} \\times \\vec{B})$"
      ],
      "knowledge": [
        {
          "name": "超越方程与图像交点法",
          "detail": "判断方程 $f(x)=g(x)$ 实根个数时，将其转化为两个基本初等函数图像的[[交点个数]]。极值点满足一阶导数 [[$f'(x_0)=0$]]。",
          "formula": "$$\\int_{0}^{\\pi} \\sin(x)\\,dx = [-\\cos(x)]_{0}^{\\pi} = 2 \\quad , \\quad \\Delta = b^2 - 4ac$$"
        },
        {
          "name": "导体棒切割磁感线与安培力做功",
          "detail": "闭合回路中感应电动势 $E = [[BLv\\sin\\theta]]$，安培力做负功将机械能转化为回路的[[焦耳热 $Q$]]。"
        }
      ],
      "plot": {
        "title": "图1：函数 f(x)=0.25x²-1 (实线) 与 g(x)=cos(x) (虚线) 交点分析图",
        "domain": [-4, 4],
        "range": [-1.5, 2.5],
        "functions": [
          { "expr": "0.25*x*x - 1", "style": "solid", "label": "f(x)=0.25x²-1" },
          { "expr": "Math.cos(x)", "style": "dashed", "label": "g(x)=cos(x)" }
        ]
      },
      "motherProblem": {
        "title": "母题1 · 函数零点与导数切线综合",
        "keyPoint": "数形结合思想 + 导数几何意义",
        "stem": "已知函数 $f(x) = \\frac{1}{4}x^2 - 1$ 与 $g(x) = \\cos(x)$（如上图所示）。\n(1) 结合函数图像与单调性，说明方程 $4\\cos(x) - x^2 + 4 = 0$ 在区间 $[-\\pi, \\pi]$ 上实根的个数；\n(2) 求 $f(x)$ 在点 $(2, 0)$ 处的切线方程。",
        "variation": "【变式演练】若将 $f(x)$ 平移为 $f(x) = \\frac{1}{4}x^2 - k$，求当两函数恰有 1 个公共点时实数 $k$ 的值。",
        "answerSpaceHeight": 90,
        "answer": "(1) 方程有 2 个实根；(2) 切线方程为 $x - y - 2 = 0$；【变式】$k = -1$。",
        "analysis": "【解析步骤】① 原方程变形为 $\\frac{1}{4}x^2 - 1 = \\cos(x)$，即观察图中实线抛物线与虚线余弦曲线的交点；因两函数均为偶函数，且 $f(0)=-1 < g(0)=1$，$f(\\pi) = \\frac{\\pi^2}{4}-1 > 1 > g(\\pi)=-1$，故在 $(0, \\pi)$ 与 $(-\\pi, 0)$ 各有 1 个交点，共 2 个实根。② 求导得 $f'(x) = \\frac{1}{2}x$，故 $f'(2) = 1$，切线为 $y - 0 = 1\\cdot(x - 2)$。"
      },
      "summary": "处理含三角函数与代数多项式混合的方程根问题，优先画黑白坐标草图，标出对称轴、极值点和特殊点 $(0, y_0)$。"
    },
    {
      "category": "文科 · 自然地理 (大气环流与等压线判读)",
      "tag": "高频图表 ★★★",
      "cues": [
        "太阳直射 $\\odot$ / 地球 $\\oplus$",
        "回归线：$23^\\circ26'\\text{N/S}$",
        "北半球气旋：逆时针辐合 $\\uparrow$",
        "气压单位：百帕 ($\\text{hPa}$)"
      ],
      "knowledge": [
        {
          "name": "水平气压梯度力与地转偏向力",
          "detail": "水平气压梯度力垂直于[[等压线]]并由高压指向低压；北半球地转偏向力向[[右]]偏，高空风向最终与等压线[[平行]]。"
        }
      ],
      "svgDiagram": "\u003csvg width='230' height='135' viewBox='0 0 230 135' xmlns='http://www.w3.org/2000/svg'\u003e\u003crect x='2' y='2' width='226' height='131' fill='none' stroke='#000' stroke-width='1.2'/\u003e\u003cellipse cx='115' cy='68' rx='92' ry='48' fill='none' stroke='#000' stroke-width='1.2'/\u003e\u003cellipse cx='115' cy='68' rx='60' ry='30' fill='none' stroke='#000' stroke-width='1.2' stroke-dasharray='4,3'/\u003e\u003cellipse cx='115' cy='68' rx='26' ry='13' fill='none' stroke='#000' stroke-width='1.5'/\u003e\u003ctext x='104' y='72' font-size='12' font-weight='bold'\u003e低(L)\u003c/text\u003e\u003ctext x='143' y='64' font-size='9'\u003e1000\u003c/text\u003e\u003ctext x='176' y='55' font-size='9'\u003e1004\u003c/text\u003e\u003ctext x='186' y='28' font-size='9'\u003e1008 hPa\u003c/text\u003e\u003ccircle cx='62' cy='68' r='3' fill='#000'/\u003e\u003ctext x='44' y='65' font-size='11' font-weight='bold'\u003e甲\u003c/text\u003e\u003cpath d='M 38 68 L 78 60' stroke='#000' stroke-width='1.5' fill='none'/\u003e\u003cpolygon points='78,60 71,58 73,64' fill='#000'/\u003e\u003c/svg\u003e",
      "svgCaption": "图2：某半球海平面等压线分布示意图 (单位: hPa)",
      "motherProblem": {
        "title": "母题2 · 等压线锋面气旋综合判读",
        "keyPoint": "风向判定 + 天气系统特征",
        "stem": "读图2《某半球海平面等压线分布图》：\n(1) 根据甲地实线箭头所示风向相对于水平气压梯度力的偏转方向，判断该图位于哪个半球？\n(2) 说明中心“低(L)”控制区域的垂直气流运动方向及常见天气状况。",
        "variation": "【变式演练】若该天气系统强烈发展形成台风 ($\\approx 950\\,\\text{hPa}$)，当台风中心位于东京正南方向时，东京吹什么方向的风？",
        "answerSpaceHeight": 80,
        "answer": "(1) 北半球；(2) 垂直方向盛行上升气流（$\\uparrow$），多阴雨天气；【变式】偏东风（或东北风）。",
        "analysis": "【解析步骤】① 甲处水平气压梯度力由外向内指向低压中心（向东），而实际风向箭头向右偏转成西南风，说明受北半球向右的地转偏向力作用。② 低压中心气流辐合上升（$\\uparrow$），水汽凝结易成云致雨。"
      },
      "summary": "等压线判读口诀：“高压发散下沉晴，低压辐合上升雨；北右南左看偏转，等压密集风力急。”"
    },
    {
      "category": "语言 · 日语与英语 (复杂注音与音标句型)",
      "tag": "双语核心 ★★☆",
      "cues": [
        "日语振假名：{漢字|かんじ}",
        "声调标识：⓪ 平板型 / ① 头高型",
        "英语音标：IPA 国际音标符号"
      ],
      "knowledge": [
        {
          "name": "日语惯用句与接续助词辨析",
          "detail": "例句：{彼|かれ}の{説明|せつめい}は{曖昧|あいまい}⓪で、{一石二鳥|いっせきにちょう}どころか{本末転倒|ほんまつてんとう}だ。文末「～に{違|ちが}いない」表示强烈的[[断定与确信]]。"
        },
        {
          "name": "英语复杂词汇音标与倒装结构",
          "detail": "词汇：**photosynthesis** [ˌfəʊtəʊˈsɪnθəsɪs] (n. 光合作用)；**anthropology** [ˌænθrəˈpɒlədʒi] (n. 人类学)。否定副词 [[Seldom / Never]] 置于句首时，主句需采用[[部分倒装]]。"
        }
      ],
      "motherProblem": {
        "title": "母题3 · 日英双语语法转换与翻译精练",
        "keyPoint": "日语假名标注 + 英语倒装句改写",
        "stem": "(1)【日语】写出句中粗体汉字的平假名读音：{環境|かんきょう}の**悪化**に伴って、**迅速**な**対策**が求められている。\n(2)【英语】将下列句子改写为以 Never 开头的倒装句：We have never seen such a dramatic shift in global climate.",
        "variation": "【变式演练】用「～ざるを{得|え}ない」（不得不…）造一个包含振假名的日语句子。",
        "answerSpaceHeight": 75,
        "answer": "(1) 悪化（あっか）②、迅速（じんそく）⓪、対策（たいさく）⓪；(2) Never have we seen such a dramatic shift in global climate.",
        "analysis": "【解析步骤】① 注意促音变：「悪化」读作 あっか；「迅速」为拨音 じんそく。② 英语现在完成时倒装需把助动词 have 提到主语 we 之前。"
      },
      "summary": "日语汉字记忆需捆绑声调（⓪①②）与促音变规律；英语否定词句首倒装切记只提前助动词/情态动词/be动词。"
    }
  ]
}</textarea>

    <div class="btn-toolbar">
      <button class="btn-outline" onclick="switchMode('question')">预览【问题/学案卷】</button>
      <button class="btn-outline" onclick="switchMode('answer')">预览【答案/解析卷】</button>
      <button onclick="exportSinglePDF('question')">导出【问题卷 PDF】</button>
      <button onclick="exportSinglePDF('answer')">导出【答案卷 PDF】</button>
      <button class="btn-accent" onclick="exportDualPDFs()">⚡ 一键导出双卷 (问题+答案两份PDF)</button>
      <button class="btn-outline" onclick="window.print()">系统打印当前卷</button>
      <span class="mode-badge" id="currentModeBadge">当前视图：问题/学案卷 (Student)</span>
    </div>
  </div>

  <!-- A4 打印渲染区 -->
  <div id="print-stage" class="layout-cornell">
    <div id="print-content"></div>
  </div>
</div>

<script>
  let currentMode = 'question';

  // 本地图片上传自动转 Base64
  document.getElementById('imgUpload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
      try {
        const data = JSON.parse(document.getElementById('jsonInput').value);
        if (data.sections && data.sections.length > 0) {
          data.sections[0].imageUrl = evt.target.result;
          data.sections[0].imageCaption = "上传配图：" + file.name;
          document.getElementById('jsonInput').value = JSON.stringify(data, null, 2);
          renderAll();
        }
      } catch (err) {
        alert("请先确保 JSON 格式正确再上传图片");
      }
    };
    reader.readAsDataURL(file);
  });

  // 文本语法解析：日语振假名 {漢字|かんじ} 与 挖空语法 [[答案]]
  function formatRichText(text) {
    if (!text) return "";
    let out = String(text);
    out = out.replace(/\{([^|}]+)\|([^}]+)\}/g, "<ruby>$1<rt>$2</rt></ruby>");
    out = out.replace(/\[\[([\s\S]*?)\]\]/g, function(match, ansContent) {
      if (currentMode === 'question') {
        return '<span class="cloze-blank">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';
      } else {
        return '<span class="cloze-blank">' + ansContent + '</span>';
      }
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/\n/g, "<br>");
    return out;
  }

  // 内置纯黑白 SVG 数学函数绘图引擎
  function generateFunctionSVG(plotCfg) {
    if (!plotCfg || !plotCfg.functions) return "";
    const width = 270;
    const height = 165;
    const pad = 22;
    const xMin = plotCfg.domain ? plotCfg.domain[0] : -5;
    const xMax = plotCfg.domain ? plotCfg.domain[1] : 5;
    const yMin = plotCfg.range ? plotCfg.range[0] : -3;
    const yMax = plotCfg.range ? plotCfg.range[1] : 3;

    const toX = (x) => pad + ((x - xMin) / (xMax - xMin)) * (width - 2 * pad);
    const toY = (y) => height - pad - ((y - yMin) / (yMax - yMin)) * (height - 2 * pad);

    let svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" xmlns="http://www.w3.org/2000/svg">';
    svg += '<rect x="1" y="1" width="' + (width - 2) + '" height="' + (height - 2) + '" fill="#fff" stroke="#000" stroke-width="1"/>';

    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      const px = toX(gx);
      svg += '<line x1="' + px + '" y1="' + pad + '" x2="' + px + '" y2="' + (height - pad) + '" stroke="#000" stroke-width="0.35" stroke-dasharray="2,2"/>';
    }
    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy++) {
      const py = toY(gy);
      svg += '<line x1="' + pad + '" y1="' + py + '" x2="' + (width - pad) + '" y2="' + py + '" stroke="#000" stroke-width="0.35" stroke-dasharray="2,2"/>';
    }

    const yZero = Math.min(Math.max(toY(0), pad), height - pad);
    const xZero = Math.min(Math.max(toX(0), pad), width - pad);
    svg += '<line x1="' + pad + '" y1="' + yZero + '" x2="' + (width - pad + 6) + '" y2="' + yZero + '" stroke="#000" stroke-width="1.3"/>';
    svg += '<polygon points="' + (width - pad + 8) + ',' + yZero + ' ' + (width - pad + 2) + ',' + (yZero - 3) + ' ' + (width - pad + 2) + ',' + (yZero + 3) + '" fill="#000"/>';
    svg += '<text x="' + (width - pad + 4) + '" y="' + (yZero + 12) + '" font-size="10" font-family="serif" font-style="italic">x</text>';

    svg += '<line x1="' + xZero + '" y1="' + (height - pad) + '" x2="' + xZero + '" y2="' + (pad - 6) + '" stroke="#000" stroke-width="1.3"/>';
    svg += '<polygon points="' + xZero + ',' + (pad - 8) + ' ' + (xZero - 3) + ',' + (pad - 2) + ' ' + (xZero + 3) + ',' + (pad - 2) + '" fill="#000"/>';
    svg += '<text x="' + (xZero + 5) + '" y="' + (pad - 2) + '" font-size="10" font-family="serif" font-style="italic">y</text>';
    svg += '<text x="' + (xZero - 10) + '" y="' + (yZero + 11) + '" font-size="9">O</text>';

    const steps = 180;
    plotCfg.functions.forEach((fnObj) => {
      let pathData = "";
      let penDown = false;
      for (let i = 0; i <= steps; i++) {
        const xVal = xMin + (i / steps) * (xMax - xMin);
        let yVal;
        try {
          yVal = Function("x", "return " + fnObj.expr)(xVal);
        } catch (e) {
          yVal = NaN;
        }
        if (typeof yVal === 'number' && isFinite(yVal) && yVal >= yMin - 0.5 && yVal <= yMax + 0.5) {
          const cx = toX(xVal).toFixed(1);
          const cy = toY(yVal).toFixed(1);
          pathData += (penDown ? " L " : "M ") + cx + " " + cy;
          penDown = true;
        } else {
          penDown = false;
        }
      }
      const dash = fnObj.style === 'dashed' ? ' stroke-dasharray="5,3"' : (fnObj.style === 'dotted' ? ' stroke-dasharray="2,2"' : '');
      svg += '<path d="' + pathData + '" fill="none" stroke="#000" stroke-width="1.6"' + dash + '/>';
    });

    svg += '</svg>';
    return '<div class="plot-box">' + svg + '<div class="plot-caption">' + (plotCfg.title || '函数图像') + '</div></div>';
  }

  function buildSectionInnerHTML(sec, patternClass, imgFilterClass) {
    let html = '';

    if (sec.knowledge && sec.knowledge.length > 0) {
      html += '<ol class="kp-list">';
      sec.knowledge.forEach(k => {
        html += '<li class="kp-item"><span class="kp-name">' + formatRichText(k.name) + '：</span>' + formatRichText(k.detail);
        if (k.formula) {
          html += '<div class="formula-bar">' + k.formula + '</div>';
        }
        html += '</li>';
      });
      html += '</ol>';
    }

    if (sec.plot || sec.svgDiagram || sec.imageUrl) {
      html += '<div class="visual-row">';
      if (sec.plot) html += generateFunctionSVG(sec.plot);
      if (sec.svgDiagram) {
        html += '<div class="plot-box">' + sec.svgDiagram + '<div class="plot-caption">' + (sec.svgCaption || '示意图') + '</div></div>';
      }
      if (sec.imageUrl) {
        html += '<div class="plot-box"><img src="' + sec.imageUrl + '" class="' + imgFilterClass + '" style="max-width:220px; max-height:150px; display:block; margin:0 auto;" crossorigin="anonymous"/><div class="plot-caption">' + (sec.imageCaption || '配图') + '</div></div>';
      }
      html += '</div>';
    }

    if (sec.motherProblem) {
      const mp = sec.motherProblem;
      html += '<div class="mother-box">';
      html += '<div class="mother-stem"><span class="mother-badge">' + formatRichText(mp.title || '母题举例') + '</span>';
      if (mp.keyPoint) {
        html += '<span style="font-size:0.85em; font-weight:bold; margin-right:6px;">[考点：' + formatRichText(mp.keyPoint) + ']</span>';
      }
      html += formatRichText(mp.stem) + '</div>';

      if (mp.variation) {
        html += '<div class="variation-box">' + formatRichText(mp.variation) + '</div>';
      }

      if (currentMode === 'question') {
        const h = mp.answerSpaceHeight || 80;
        html += '<div class="blank-space ' + patternClass + '" style="height:' + h + 'px;"><span class="blank-space-label">答题与推导演算区</span></div>';
      } else {
        html += '<div class="answer-panel">';
        html += '<div><span class="ans-label">【标准答案】</span> ' + formatRichText(mp.answer) + '</div>';
        if (mp.analysis) {
          html += '<div style="margin-top:4px;">' + formatRichText(mp.analysis) + '</div>';
        }
        html += '</div>';
      }
      html += '</div>';
    }

    return html;
  }

  function renderAll() {
    const errBox = document.getElementById('errorBanner');
    let data;
    try {
      data = JSON.parse(document.getElementById('jsonInput').value);
      errBox.style.display = 'none';
    } catch (e) {
      errBox.style.display = 'block';
      errBox.textContent = '⚠️ JSON 语法错误：' + e.message;
      return;
    }

    const layout = document.getElementById('layoutSelect').value;
    const patternClass = document.getElementById('patternSelect').value;
    const imgFilterClass = document.getElementById('imgFilterSelect').value;

    const stage = document.getElementById('print-stage');
    stage.className = 'layout-' + layout;

    const versionTitle = currentMode === 'question' ? '问题与学案卷 (STUDENT)' : '答案与解析卷 (ANSWER KEY)';
    document.getElementById('currentModeBadge').textContent = '当前视图：' + (currentMode === 'question' ? '问题/学案卷' : '答案/解析卷');

    let html = '<div class="doc-header">';
    html += '<div class="doc-title-area"><h1>' + (data.title || '学科知识与母题清单') + '</h1>';
    html += '<div class="doc-subtitle">' + (data.subtitle || '') + ' | 日期：' + (data.date || '') + '</div></div>';
    html += '<div class="doc-version-stamp">' + versionTitle + '</div>';
    html += '</div><div class="doc-body">';

    (data.sections || []).forEach((sec, idx) => {
      const innerContent = buildSectionInnerHTML(sec, patternClass, imgFilterClass);

      if (layout === 'cornell') {
        const cuesHtml = (sec.cues || []).map(c => '<div style="margin-bottom:6px;">• ' + formatRichText(c) + '</div>').join('');
        const summaryContent = currentMode === 'question'
          ? '<strong>【本节复盘总结 / 易错点记录】</strong>（请在此归纳核心规律）'
          : '<strong>【核心总结】</strong>' + formatRichText(sec.summary || '');
        html += '<div class="sec-block">' +
          '<div class="sec-header"><span>' + (idx + 1) + '. ' + sec.category + '</span><span class="sec-tag">' + (sec.tag || '') + '</span></div>' +
          '<div class="cornell-body">' +
            '<div class="cornell-cue"><div style="font-weight:800; border-bottom:1px solid #000; margin-bottom:6px; padding-bottom:2px;">核心线索 / 符号公式</div>' + cuesHtml + '</div>' +
            '<div class="cornell-main">' + innerContent + '</div>' +
          '</div>' +
          '<div class="cornell-summary ' + (currentMode === 'question' ? patternClass : '') + '">' + summaryContent + '</div>' +
        '</div>';
      } else if (layout === 'split') {
        html += '<div class="sec-block">' +
          '<div class="split-left">' +
            '<div class="sec-header"><span>' + (idx + 1) + '. ' + sec.category + '</span><span class="sec-tag">' + (sec.tag || '') + '</span></div>' +
            innerContent +
          '</div>' +
          '<div class="split-right">' +
            '<div class="split-right-header">随堂笔记 / 辅助线作图 / 错题订正区</div>' +
            '<div class="split-pad ' + patternClass + '" style="padding:8px; font-size:0.9em;">' +
              (currentMode === 'answer' && sec.summary ? '<strong>【归纳要点】</strong><br>' + formatRichText(sec.summary) : '') +
            '</div>' +
          '</div>' +
        '</div>';
      } else {
        html += '<div class="sec-block">' +
          '<div class="sec-header"><span>' + (idx + 1) + '. ' + sec.category + '</span><span class="sec-tag">' + (sec.tag || '') + '</span></div>' +
          innerContent +
        '</div>';
      }
    });

    html += '</div>';
    const contentNode = document.getElementById('print-content');
    contentNode.innerHTML = html;

    if (window.renderMathInElement) {
      renderMathInElement(contentNode, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false
      });
    }
  }

  function applyTypography() {
    const presetFont = document.getElementById('fontSelect').value;
    const customFont = document.getElementById('customFontInput').value.trim();
    const fontSize = document.getElementById('fontSizeSelect').value;

    const finalFont = customFont ? (customFont + ", " + presetFont) : presetFont;
    document.documentElement.style.setProperty('--doc-font', finalFont);
    document.documentElement.style.setProperty('--doc-size', fontSize);
  }

  function switchMode(mode) {
    currentMode = mode;
    renderAll();
  }

  async function exportSinglePDF(targetMode) {
    const prevMode = currentMode;
    if (currentMode !== targetMode) {
      currentMode = targetMode;
      renderAll();
      await new Promise(r => setTimeout(r, 300));
    }

    const stage = document.getElementById('print-stage');
    const suffix = targetMode === 'question' ? '问题学案卷' : '答案解析卷';
    const opt = {
      margin:       [6, 6, 6, 6],
      filename:     '文理知识母题_' + suffix + '.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollY: 0, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    await html2pdf().set(opt).from(stage).save();

    if (prevMode !== targetMode) {
      currentMode = prevMode;
      renderAll();
    }
  }

  async function exportDualPDFs() {
    await exportSinglePDF('question');
    await new Promise(r => setTimeout(r, 700));
    await exportSinglePDF('answer');
  }

  window.addEventListener('DOMContentLoaded', () => {
    applyTypography();
    renderAll();
  });
</script>

</body>
</html>`;
}