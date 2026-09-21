# Contributing / 参与贡献

Thanks for helping! 感谢参与！

## Translate / 翻译

1. Copy `src/locales/en.json` to `src/locales/<code>.json` (e.g. `fr.json`).
   复制 `en.json`，按语言代码重命名。
2. Translate the **values only**. Keep keys and `{{placeholders}}` unchanged.
   只翻译冒号右边的文字，键名和 `{{占位符}}` 保持不变。
3. Register the language in `src/i18n.ts` (import + `languages` + `resources`).
   在 `src/i18n.ts` 里登记新语言。
4. Open a pull request. 提交 Pull Request。

Keys ending in `_one` / `_other` are plural forms. Languages without plurals (Chinese, Japanese, Korean) only need `_other`.
以 `_one`/`_other` 结尾的是复数形式，中日韩只需 `_other`。

## Code / 代码

```bash
npm install
npm run dev        # local preview at http://localhost:5173
npm run typecheck
npm run build
```

- One feature or fix per pull request. 每个 PR 只做一件事。
- Never hard-code UI text; add a key to every locale file. 界面文字不要写死，加到所有语言文件。
- Do not copy text from any book. Write original explanations. 不要复制任何书籍原文。
