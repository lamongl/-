# 本地CSV计算组件（实验） / Local CSV calculator experiment

适用于明确列角色、明确口径的按月销售汇总。Python标准库即可运行，无模型、网络或写入操作。不是通用数据分析工具，也不自动激活或替换已发布Skill。

```sh
python experiments/csv-route/csv_sales_digest.py --input sales.csv --months 2026-08 2026-09 --id-column id --compare 2026-08 2026-09 --compact
```

默认列名：id、month、gross、refund、unit；支持元/万元。月份用YYYY-MM，UTF-8 CSV最多20MB。净额=毛额-退款；正基期才报告普通环比。缺值、未知单位、重复ID或不合法精度会失败，不静默按零处理。该工具只汇总选定金额字段，不能替代备注、因果或逐行异常分析。

测试：`python scripts/test_csv_sales_digest.py`。

对照实验与限制见 [完整记录](../../docs/benchmarks/2026-10-29-csv-complete/README.md)。脚本数值已验收；整体Skill的发现、加载与任务路由尚未完成端到端验证。原实验命令指向工作区草稿中的同字节脚本；现在移至experiments目录以明确其试验状态，文件哈希一致。

An experimental, read-only standard-library Python component for explicitly defined monthly sales aggregates. It does not activate the released Skill. See the linked trial for complete outputs, failures and measurement limits. The experiment's script bytes are unchanged; its canonical path is now under `experiments/`.
