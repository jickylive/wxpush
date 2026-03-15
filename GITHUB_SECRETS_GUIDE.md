# GitHub Secrets 配置指南

## 📋 概述

本文档详细说明如何为 WXPush 项目配置 GitHub Secrets，以启用 Cloudflare Workers 自动部署功能。

## 🔑 需要配置的 Secrets

### 1. CLOUDFLARE_API_TOKEN
**用途**：Cloudflare API 访问令牌，用于部署和管理 Workers

### 2. CLOUDFLARE_ACCOUNT_ID
**用途**：Cloudflare 账户 ID，用于识别您的账户

## 📝 详细配置步骤

### 步骤 1：获取 Cloudflare API Token

#### 1.1 登录 Cloudflare
1. 访问 https://dash.cloudflare.com/
2. 使用您的 Cloudflare 账户登录

#### 1.2 进入 API Tokens 页面
1. 点击右上角的用户头像
2. 选择 "My Profile"
3. 在左侧菜单中选择 "API Tokens"

#### 1.3 创建 API Token
1. 点击 "Create Token" 按钮
2. 选择 "Create Custom Token"

#### 1.4 配置 Token 权限
**Permissions** 设置：
- **Account**：`Account Settings` - `Read`
- **Workers Scripts**：`Edit` - `Edit`

**Account Resources**：
- 选择 "Include" -> "All accounts" 或选择特定账户

**TTL**：
- 可以设置过期时间（推荐 1 年或更长）

#### 1.5 创建并复制 Token
1. 点击 "Continue to summary"
2. 确认配置无误后点击 "Create Token"
3. **重要**：立即复制生成的 Token（只显示一次！）
4. 将 Token 保存到安全的位置

### 步骤 2：获取 Cloudflare Account ID

#### 2.1 在 Cloudflare 控制台查找
1. 在 Cloudflare 控制台的任意页面
2. 查看 URL 或页面信息
3. 账户 ID 通常显示在 URL 中或页面右上角

**示例位置**：
- URL 格式：`https://dash.cloudflare.com/<account_id>/...`
- 或者在 "Workers & Pages" 页面中查找

#### 2.2 使用 API 获取（备选方法）
如果找不到，可以使用以下命令获取：

```bash
# 使用 Wrangler CLI
wrangler whoami
```

这将显示您的账户 ID。

### 步骤 3：在 GitHub 中配置 Secrets

#### 3.1 进入仓库设置
1. 访问您的 GitHub 仓库：https://github.com/jickylive/wxpush
2. 点击仓库上方的 "Settings" 标签

#### 3.2 进入 Secrets 配置页面
1. 在左侧菜单中选择 "Secrets and variables"
2. 点击 "Actions" 子菜单

#### 3.3 添加 CLOUDFLARE_API_TOKEN
1. 点击 "New repository secret" 按钮
2. **Name**：输入 `CLOUDFLARE_ACCOUNT_ID`
3. **Value**：粘贴您的 Cloudflare Account ID
4. 点击 "Add secret" 按钮

#### 3.5 验证配置
确认两个 Secrets 都已正确添加：
- ✅ CLOUDFLARE_API_TOKEN
- ✅ CLOUDFLARE_ACCOUNT_ID

## 🔄 配置完成后的操作

### 1. 手动触发部署
配置完成后，您可以手动触发部署：

#### 方式一：通过 GitHub Actions 页面
1. 访问仓库的 "Actions" 标签
2. 选择 "Deploy to Cloudflare Workers" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支（通常是 `main`）
5. 点击 "Run workflow" 按钮

#### 方式二：通过 Git 推送
```bash
# 提交一个小的更改来触发部署
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

### 2. 监控部署状态
1. 访问 "Actions" 标签
2. 查看 "Deploy to Cloudflare Workers" 工作流的执行状态
3. 点击具体运行查看详细日志

### 3. 验证部署成功
部署成功后，您可以：
- 访问 Cloudflare Workers 控制台查看部署的 Worker
- 测试 API 端点是否正常工作
- 检查环境变量是否正确配置

## ⚠️ 注意事项

### 安全建议
1. **不要在代码中暴露 Secrets**：永远不要将 Secrets 提交到代码仓库
2. **定期轮换 Tokens**：建议定期更新 API Token
3. **使用最小权限原则**：只授予必要的权限
4. **限制 Token 访问范围**：如果可能，限制 Token 只能访问特定账户

### 常见问题

#### Q1: Token 创建后找不到在哪里？
A: Token 只在创建时显示一次，请务必立即复制并保存。如果丢失，需要重新创建。

#### Q2: 如何验证 Token 是否有效？
A: 可以使用以下命令测试：
```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

#### Q3: Account ID 在哪里？
A: Account ID 通常为 32 位字符，可以在 Cloudflare 控制台的 URL 或 Worker 页面中找到。

#### Q4: 配置后部署仍然失败？
A: 请检查：
1. Secrets 名称是否正确（完全匹配，区分大小写）
2. Token 权限是否足够
3. wrangler.toml 配置是否正确
4. 查看 GitHub Actions 日志获取详细错误信息

## 🚀 配置完成后的好处

配置 GitHub Secrets 后，您将获得：

### 自动化部署
- 每次推送到 `main` 分支自动部署
- 无需手动执行部署命令
- 部署状态实时可见

### 持续集成
- 自动运行测试
- 自动检查代码质量
- 部署前验证代码

### 版本管理
- Git 提交与部署关联
- 容易回滚到之前版本
- 清晰的部署历史

## 📝 配置检查清单

在配置完成后，请确认以下事项：

- [ ] 已获取 Cloudflare API Token
- [ ] 已获取 Cloudflare Account ID
- [ ] 已在 GitHub 中添加 CLOUDFLARE_API_TOKEN Secret
- [ ] 已在 GitHub 中添加 CLOUDFLARE_ACCOUNT_ID Secret
- [ ] Secrets 名称拼写正确（区分大小写）
- [ ] 已测试 Token 是否有效
- [ ] wrangler.toml 配置正确
- [ ] 已手动触发部署测试

## 🎯 快速配置命令

如果您有 `gh` CLI 工具，可以使用以下命令快速配置：

```bash
# 设置 CLOUDFLARE_API_TOKEN
gh secret set CLOUDFLARE_API_TOKEN -b jickylive/wxpush

# 设置 CLOUDFLARE_ACCOUNT_ID
gh secret set CLOUDFLARE_ACCOUNT_ID -b jickylive/wxpush

# 验证 Secrets
gh secret list -b jickylive/wxpush
```

## 📞 获取帮助

如果遇到问题：

1. **查看文档**：
   - Cloudflare API 文档：https://developers.cloudflare.com/api/
   - GitHub Secrets 文档：https://docs.github.com/en/actions/security-guides/encrypted-secrets

2. **检查日志**：
   - GitHub Actions 日志提供详细的错误信息
   - Cloudflare Workers 日志可以在控制台中查看

3. **社区支持**：
   - Cloudflare 社区论坛
   - GitHub Actions 社区论坛

---

**配置完成后**：您的项目将支持完全自动化的 CI/CD 流程。
**预期效果**：推送代码后自动测试、检查和部署。
**文档版本**：v1.0.0
**最后更新**：2026-03-15
