# CrowKit Website

CrowKit 的 GitHub Pages 静态介绍页。

下载按钮读取与页面同源的 `releases.json`，不依赖浏览器访问 GitHub API。
`.github/workflows/update-release.yml` 会定时在服务端查询 GitHub Releases，
选择版本号最高且包含 `CrowKit-Setup-*.exe` 的非草稿版本，并在版本变化时
自动提交新的清单。

页面内置 0.2.0 下载地址作为清单暂时不可用时的回退。手动刷新清单可运行：

```bash
python scripts/update_release.py
```

页面中的“功能建议”和“问题反馈”共用站内弹窗。用户填写标题与内容后，页面使用
GlitchTip 的公开写入 DSN 直接提交事件，不跳转 GitHub，也不需要在页面中保存
GlitchTip 认证 token。
