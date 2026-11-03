# 网页源代码

从项目根目录执行 npm start 启动本机预览；npm test 运行测试；npm run build 生成 dist/ 静态站点。
首次运行前执行 npm ci 安装锁定的解析与构建依赖。完整介绍、公开部署步骤及隐私边界见根目录 README.md。

支持将 Word（DOCX）、Excel（XLSX/XLS）、PPT（PPTX）、文字 PDF 和 UTF-8 TXT、MD、CSV 拖入「参考资料」区域，或点击选择。最多 5 份，每份 20 MB；提取内容进入最终提示词。扫描 PDF 请先 OCR；旧 DOC/PPT 请先转为 DOCX/PPTX。提取文字与表格，不还原原排版、图表、图片，单份文字上限100万字符，超限报错且不截断。全部解析在浏览器本地执行，PDF 字体与字符映射只从本站加载。

本目录的 server.mjs 仅用于本地预览。GitHub Pages 直接托管 dist/，不需要运行 Node 服务。
当前为本地规则和模板演示，尚未接入 AI、候选评审、账号、历史或资料分享链接。
