# Cloudflare 构建错误修复指南

## 错误信息

```
Failed: The build token selected for this build has been deleted or rolled and cannot be used for this build.
Please update your build token in the Worker Builds settings and retry the build.
```

## 问题分析

这个错误通常发生在以下情况：

1. **Cloudflare Pages 配置问题**：如果你同时配置了 Cloudflare Pages，构建令牌可能已过期
2. **GitHub 集成配置**：GitHub Actions 与 Cloudflare 的集成令牌需要更新
3. **Wrangler 配置**：本地 wrangler 配置可能与 Cloudflare Dashboard 不同步

## 解决方案

### 方案 1：使用 Workers 部署（推荐）

你的项目已经成功部署到 Cloudflare Workers，建议继续使用 Workers 而不是 Pages。

**当前部署状态：**
- ✅ Workers 部署成功：https://wxpush.jicky2853.workers.dev
- ✅ 使用 `npm run deploy` 或 `wrangler deploy` 命令
- ✅ 无需额外的构建配置

### 方案 2：修复 Cloudflare Pages 构建令牌

如果你确实需要使用 Cloudflare Pages，请按以下步骤修复：

#### 步骤 1：访问 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages**
3. 找到你的 Pages 项目

#### 步骤 2：更新构建令牌

1. 点击项目进入设置
2. 进入 **Settings** > **Builds & deployments**
3. 找到 **Build configurations** 部分
4. 更新或重新生成构建令牌

#### 步骤 3：重新连接 GitHub

1. 进入 **Settings** > **Functions**
2. 断开 GitHub 连接
3. 重新连接你的 GitHub 仓库
4. 确保所有环境变量都正确配置

### 方案 3：检查 GitHub Actions 配置

如果你的项目使用 GitHub Actions 自动部署，检查 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

**需要在 GitHub Secrets 中配置：**
- `CLOUDFLARE_API_TOKEN` - 你的 Cloudflare API 令牌
- `CLOUDFLARE_ACCOUNT_ID` - 你的 Cloudflare 账户 ID

## 推荐做法

### 对于这个项目：

1. **继续使用 Workers 部署**
   - 使用 `npm run deploy` 命令
   - 或者使用 GitHub Actions 自动部署
   - 避免使用 Cloudflare Pages，因为这是 Worker 项目

2. **如果必须使用 Pages**
   - 确保 Pages 配置正确
   - 更新构建令牌
   - 配置正确的构建设置

3. **GitHub Actions 集成**
   - 确保所有 Secrets 都正确配置
   - 定期更新 API 令牌
   - 监控部署日志

## 验证部署

### 检查 Workers 部署状态：

```bash
# 查看当前部署状态
wrangler deployments list

# 查看部署详情
wrangler deployments tail --format=pretty
```

### 测试服务：

```bash
# 测试健康检查端点
curl https://wxpush.jicky2853.workers.dev/health

# 测试消息推送（需要配置正确的 token）
curl "https://wxpush.jicky2853.workers.dev/wxsend?title=测试&content=服务正常&token=your_token"
```

## 预防措施

1. **定期更新令牌**：建议每 3-6 个月更新一次 API 令牌
2. **备份配置**：保存 wrangler.toml 和环境变量配置
3. **监控部署**：设置部署失败通知
4. **文档记录**：记录所有的配置和部署流程

## 获取帮助

如果问题仍然存在：

1. 检查 [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
2. 查看 [Cloudflare 状态页面](https://www.cloudflarestatus.com/)
3. 在 GitHub 上创建 [Issue](https://github.com/cloudflare/workers-sdk/issues)

---

**最后更新：** 2026-03-15
