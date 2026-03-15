# Cloudflare Workers 环境变量配置指南

## 概述

本指南详细说明如何将 `.env` 文件中的机密变量配置到 Cloudflare Workers。对于敏感信息，推荐使用 Cloudflare Secrets 而不是 wrangler.toml。

## 环境变量分类

### 敏感变量（推荐使用 Secrets）

以下变量包含敏感信息，应该通过 Cloudflare Secrets 配置：

- `API_TOKEN` - API 访问令牌
- `WX_SECRET` - 微信 App Secret

### 非敏感变量（可以使用 wrangler.toml）

以下变量相对不那么敏感，可以在 wrangler.toml 中配置：

- `WX_APPID` - 微信 App ID（公开可见）
- `WX_USERID` - 微信用户 OpenID
- `WX_TEMPLATE_ID` - 微信模板消息 ID
- `WX_BASE_URL` - 基础 URL

## 配置方法

### 方法 1：使用 wrangler secret 命令（推荐）

#### 设置敏感变量

```bash
# 设置 API_TOKEN
echo "your_api_token_here" | wrangler secret put API_TOKEN

# 设置 WX_SECRET
echo "your_wechat_secret_here" | wrangler secret put WX_SECRET
```

#### 设置非敏感变量

```bash
# 设置 WX_APPID
echo "your_wechat_appid" | wrangler secret put WX_APPID

# 设置 WX_USERID
echo "your_wechat_userid" | wrangler secret put WX_USERID

# 设置 WX_TEMPLATE_ID
echo "your_template_id" | wrangler secret put WX_TEMPLATE_ID

# 设置 WX_BASE_URL
echo "your_base_url" | wrangler secret put WX_BASE_URL
```

### 方法 2：使用 Cloudflare Dashboard

#### 步骤

1. **登录 Cloudflare Dashboard**
   - 访问 https://dash.cloudflare.com/
   - 进入 Workers & Pages

2. **选择你的 Worker**
   - 找到 `wxpush` Worker
   - 点击进入设置

3. **配置环境变量**
   - 进入 **Settings** > **Variables**
   - 在 **Environment variables** 部分添加变量

4. **添加变量**
   ```
   变量名：API_TOKEN
   值：your_api_token_here
   加密：✅ 勾选

   变量名：WX_SECRET
   值：your_wechat_secret_here
   加密：✅ 勾选

   变量名：WX_APPID
   值：your_wechat_appid
   加密：✅ 勾选（推荐）

   变量名：WX_USERID
   值：your_wechat_userid
   加密：✅ 勾选（推荐）

   变量名：WX_TEMPLATE_ID
   值：your_template_id
   加密：✅ 勾选（推荐）

   变量名：WX_BASE_URL
   值：your_base_url
   加密：可选
   ```

### 方法 3：使用自动化脚本

#### 使用 setup-secrets.sh 脚本

```bash
# 给脚本添加执行权限
chmod +x setup-secrets.sh

# 运行脚本
./setup-secrets.sh
```

#### 使用 npm 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "setup-secrets": "bash setup-secrets.sh"
  }
}
```

然后运行：

```bash
npm run setup-secrets
```

## 验证配置

### 检查变量是否设置成功

```bash
# 列出所有 secrets
wrangler secret list

# 查看特定 secret（不显示值）
wrangler secret list | grep API_TOKEN
```

### 测试部署

```bash
# 部署到 Cloudflare
npm run deploy

# 测试服务
curl https://wxpush.jicky2853.workers.dev/health
```

### 测试 API 调用

```bash
# 测试消息推送
curl "https://wxpush.jicky2853.workers.dev/wxsend?title=测试&content=环境变量配置成功&token=your_api_token"
```

## 安全最佳实践

### 1. 敏感信息管理

**✅ 推荐：**
- 使用 Cloudflare Secrets 存储敏感信息
- 定期轮换密钥和令牌
- 限制访问权限
- 启用审计日志

**❌ 避免：**
- 在代码中硬编码敏感信息
- 将敏感信息提交到版本控制
- 在公开文档中暴露密钥
- 使用弱密钥或令牌

### 2. 环境分离

**开发环境：**
```bash
# 使用 .env.development
wrangler secret put API_TOKEN --env development
```

**生产环境：**
```bash
# 使用 .env.production
wrangler secret put API_TOKEN --env production
```

### 3. 密钥轮换

**定期轮换策略：**

1. **生成新密钥**
   ```bash
   # 为微信 API 生成新的 App Secret
   # 在微信公众平台重新生成
   ```

2. **更新 Cloudflare Secrets**
   ```bash
   echo "new_secret_here" | wrangler secret put WX_SECRET
   ```

3. **重新部署**
   ```bash
   npm run deploy
   ```

4. **监控和验证**
   - 检查服务是否正常运行
   - 验证 API 调用是否成功
   - 监控错误日志

## 故障排查

### 常见问题

#### 1. 变量未生效

**症状：**
- 服务返回 "Missing required parameter" 错误
- 环境变量读取失败

**解决方案：**
```bash
# 重新设置变量
echo "your_value" | wrangler secret put VARIABLE_NAME

# 重新部署
npm run deploy

# 检查变量是否设置
wrangler secret list
```

#### 2. wrangler secret 命令失败

**症状：**
```
Error: Failed to put secret
```

**解决方案：**
```bash
# 检查认证
wrangler whoami

# 重新登录
wrangler login

# 检查账户权限
```

#### 3. 变量值包含特殊字符

**症状：**
- 变量值被截断
- 特殊字符导致解析错误

**解决方案：**
```bash
# 使用引号包裹
echo 'your_value_with_special_chars' | wrangler secret put VARIABLE_NAME

# 或者使用文件
echo 'your_value' > secret.txt
wrangler secret put VARIABLE_NAME < secret.txt
rm secret.txt
```

## 当前项目配置

### .env 文件内容

```env
API_TOKEN=your_api_token_here
WX_APPID=your_wechat_appid
WX_SECRET=your_wechat_secret
WX_USERID=your_wechat_userid
WX_TEMPLATE_ID=your_template_id
WX_BASE_URL=your_base_url
```

### 快速配置命令

```bash
# 敏感变量
echo "your_api_token_here" | wrangler secret put API_TOKEN
echo "your_wechat_secret" | wrangler secret put WX_SECRET

# 非敏感变量
echo "your_wechat_appid" | wrangler secret put WX_APPID
echo "your_wechat_userid" | wrangler secret put WX_USERID
echo "your_template_id" | wrangler secret put WX_TEMPLATE_ID
echo "your_base_url" | wrangler secret put WX_BASE_URL
```

## GitHub Actions 集成

### 配置 GitHub Secrets

1. **访问仓库设置**
   - 进入 GitHub 仓库
   - Settings > Secrets and variables > Actions

2. **添加 Secrets**
   ```
   Name: CLOUDFLARE_API_TOKEN
   Value: your_cloudflare_api_token

   Name: CLOUDFLARE_ACCOUNT_ID
   Value: your_cloudflare_account_id
   ```

3. **更新工作流**
   - 工作流会自动从 GitHub Secrets 读取
   - 无需在代码中硬编码

## 相关资源

### 官方文档

- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/platform/environment-variables/)
- [Wrangler CLI Secrets](https://developers.cloudflare.com/workers/wrangler/commands/#secret)
- [Environment Variables Best Practices](https://developers.cloudflare.com/workers/platform/environment-variables/)

### 工具

- [Wrangler CLI](https://github.com/cloudflare/workers-sdk)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)

---

**最后更新：** 2026-03-15
**维护者：** CodeArts 代码智能体
**相关文档：**
- [部署指南](DEPLOYMENT_GUIDE.md)
- [Cloudflare Workers 兼容性](CLOUDFLARE_WORKERS_COMPATIBILITY.md)
- [GitHub Actions 故障排查](GITHUB_ACTIONS_DEPLOYMENT_TROUBLESHOOTING.md)
