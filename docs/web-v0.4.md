# 网页版 v0.4：场景示例与语音输入 / Web v0.4

- 四种场景分别显示月报、维护通知、AI入门PPT和政策检索摘要示例。切换同时更新输入框提示与示例文字，不覆盖已输入的需求。填入示例前保护已有需求、附件和草稿。
- 新增中文语音转文字：最终识别片段追加到需求，临时结果只显示状态；用户可以停止，页面切到后台也会取消。不会修改原有手写内容，超长片段会单独显示，不静默截断丢失。
- 通过浏览器SpeechRecognition服务实现，不引入付费API、第三方脚本或网站录音存储。默认要求本机识别；只有用户明确勾选允许在线识别才放开在线服务。缺少本机中文模型不自动下载、不静默切换在线。
- 浏览器不支持、没有麦克风、权限拒绝、服务失败或语言不可用时提供明确说明，可用手机输入法的麦克风按钮或键盘替代。浏览器内置服务不保证免费额度或可用性，本站没有新增计费服务。

## 验证与限制

15项Node测试通过，含重复最终结果去重、临时结果不入正文、取消后忽略回调、在线许可、本机模式、权限错误恢复及超长保留；静态构建与语法检查通过。

真实浏览器核对了四个场景的提示/示例、切换时保留输入、填入示例前确认、PPT示例填入正确、语音许可窗口默认不允许在线识别，以及390px无横向溢出。控制台无警告/错误。**没有启用真实麦克风或向识别服务发送测试录音，不能据此宣称实际识别准确率、不同手机兼容性或端到端语音识别已通过。** 用户仍需在支持的浏览器授予麦克风权限，本机语言包是否可用由浏览器决定。

浏览器语音识别并非所有主流浏览器均支持，部分实现会使用在线服务；本机识别属性仍存在兼容性差异。参考：[SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)、[processLocally](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition/processLocally)。这些是接口依据，不是本项目识别效果的证据。

Scenario-specific examples now update without replacing user text. Chinese browser dictation appends final transcripts, ignores interim/duplicate results, supports stop/cancel and reports failures. Remote recognition requires explicit opt-in; no recordings are stored by this site. Browser/service/language-pack support varies. Automated controller tests and browser UI checks passed; live microphone transcription and accuracy have not been validated.
