# WXPush 部署指南

## 📋 前置要求

- Node.js >= 18.0.0
- Cloudflare 账号
- 微信公众号（已认证）
- Wrangler CLI（Cloudflare Workers 命令行工具）

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.dev.vars` 文件（本地开发）或在 Cloudflare 控制台配置环境变量：

```env
API_TOKEN=your_secure_token_here
WX_APPID=your_wechat_appid
WX_SECRET=your_wechat_secret
WX_USERID=user_openid1|user_openid2
WX_TEMPLATE_ID=your_template_id
WX_BASE_URL=https://your-skin-domain.com
```

### 3. 本地开发

```bash
npm run dev
```

访问 `http://localhost:8787` 查看服务。

### 4. 部署到 Cloudflare Workers

#### 方法一：使用 Wrangler CLI

```bash
npm run deploy
```

#### 方法二：通过 GitHub Actions 自动部署

1. Fork 本项目到你的 GitHub 账号
2. 在 GitHub 仓库设置中添加以下 Secrets：
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID
3. 推送代码到 `main` 分支，自动触发部署

## 🔧 Cloudflare 配置

### 创建 KV 命名空间

为了启用 access_token 缓存和速率限制功能，需要创建两个 KV 命名空间：

1. 登录 Cloudflare 控制台
2. 进入 **Workers & Pages** > **KV**
3. 创建两个命名空间：
   - `WX_CACHE`: 用于缓存 access_token
   - `RATE_LIMIT`: 用于速率限制

4. 更新 `wrangler.toml` 中的 KV 命名空间 ID：

```toml
[[kv_namespaces]]
binding = "WX_CACHE"
id = "28ef1c3d200449ca96dce1f255ae158c"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "84f5fcb3664346a189e5950a554f04be"
```

### 配置自定义域名（可选）

在 `wrangler.toml` 中添加路由配置：

```toml
routes = [
  { pattern = "yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

## 🧪 测试

### 运行测试

```bash
npm test
```

### 运行测试并监听变化

```bash
npm run test:watch
```

### 生成测试覆盖率报告

```bash
npm run test:coverage
```

报告将生成在 `coverage/` 目录中。

## 📝 代码质量

### 运行 Linter

```bash
npm run lint
```

### 格式化代码

```bash
npm run format
```

## 🔐 安全最佳实践

### 1. 保护敏感信息

- 永远不要将 `.env` 或 `.dev.vars` 提交到版本控制
- 使用强密码作为 API_TOKEN
- 定期轮换密钥和令牌

### 2. 启用速率限制

配置 `RATE_LIMIT` KV 命名空间以防止 API 滥用：

```javascript
// 默认配置：每分钟 100 次请求
const rateLimitResult = await checkRateLimit(`wxpush:${clientIP}`, env, 100, 60);
```

### 3. 使用 HTTPS

- Cloudflare Workers 自动提供 HTTPS
- 确保所有 API 端点都使用 HTTPS

### 4. 验证输入

所有用户输入都应经过验证和清理：

```javascript
import { sanitizeInput, isValidOpenId } from './lib/security.js';

const cleanTitle = sanitizeInput(title, { maxLength: 100, escape: true });
if (!isValidOpenId(userid)) {
  return errorResponse('Invalid OpenID', 'The provided OpenID is invalid');
}
```

## 📊 监控和日志

### 健康检查端点

```bash
curl https://your-worker.workers.dev/health
```

响应示例：

```json
{
  "status": "healthy",
  "service": "WXPush",
  "version": "1.0.0",
  "timestamp": "2026-03-15T10:30:00.000Z",
  "uptime": 123456.789
}
```

### Cloudflare Analytics

在 Cloudflare 控制台中查看：
- 请求统计
- 错误率
- 响应时间
- 地理分布

## 🔄 更新和维护

### 更新依赖

```bash
npm update
```

### 更新 Wrangler

```bash
npm install -g wrangler
```

## 🐛 故障排查

### 常见问题

#### 1. 部署失败

**问题**：`Error: No such namespace`

**解决方案**：
- 确保已在 Cloudflare 创建 KV 命名空间
- 更新 `wrangler.toml` 中的命名空间 ID

#### 2. 微信 API 调用失败

**问题**：`Failed to get access token`

**解决方案**：
- 检查 `WX_APPID` 和 `WX_SECRET` 是否正确
- 确认微信公众号已认证
- 检查 IP 白名单设置

#### 3. 消息发送失败

**问题**：`Failed to send messages`

**解决方案**：
- 验证用户 OpenID 是否正确
- 检查模板 ID 是否有效
- 确认模板消息是否已通过审核

#### 4. 速率限制触发

**问题**：`Rate limit exceeded`

**解决方案**：
- 减少请求频率
- 调整速率限制配置
- 检查是否有异常流量

## 📚 相关文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [微信公众号开发文档](https://developers.weixin.qq.com/doc/offiaccount/Getting_Started/Overview.html)
- [项目 README](./README.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)

## 🆘 获取帮助

如果遇到问题：

1. 检查 [常见问题](#常见问题) 部分
2. 查看 [GitHub Issues](https://github.com/frankiejun/wxpush/issues)
3. 提交新的 Issue 并提供详细信息

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件
