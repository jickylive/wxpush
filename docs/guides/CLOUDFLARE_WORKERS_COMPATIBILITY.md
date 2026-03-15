# Cloudflare Workers 兼容性指南

## 概述

本项目已完全优化以兼容 Cloudflare Workers 环境。本文档详细说明兼容性要求、最佳实践和故障排查方法。

## Cloudflare Workers 运行时

### 运行时特性

**支持的 API：**
- ✅ Web Crypto API
- ✅ Fetch API
- ✅ Streams API
- ✅ TextEncoder/TextDecoder
- ✅ URL/URLSearchParams
- ✅ WebSocket API
- ✅ Cache API
- ✅ KV Storage API

**不支持的 API：**
- ❌ Node.js `require()` (除非启用 nodejs_compat)
- ❌ Node.js `fs` 模块
- ❌ Node.js `path` 模块
- ❌ Node.js `crypto` 模块 (使用 Web Crypto 替代)
- ❌ Node.js `Buffer` (使用 Uint8Array 替代)

## 兼容性配置

### wrangler.toml 配置

```toml
name = "wxpush"
main = "src/index-refactored.js"
compatibility_date = "2023-11-21"
compatibility_flags = ["nodejs_compat"]

# 环境变量
[vars]
ENVIRONMENT = "production"
VERSION = "2.0.0"

# KV 命名空间
[[kv_namespaces]]
binding = "WX_CACHE"
id = "28ef1c3d200449ca96dce1f255ae158c"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "84f5fcb3664346a189e5950a554f04be"
```

### nodejs_compat 标志

**作用：**
- 启用 Node.js 兼容性模式
- 支持部分 Node.js API
- 提供更好的开发体验

**支持的 Node.js API：**
- ✅ `process.env`
- ✅ `setTimeout/setInterval`
- ✅ `console` 方法
- ⚠️ 部分 `crypto` API (仍推荐使用 Web Crypto)

## 代码兼容性最佳实践

### 1. 随机数生成

**❌ 不推荐（Node.js 特定）：**
```javascript
const crypto = require('crypto')
const buffer = crypto.randomBytes(32)
```

**✅ 推荐（Web Crypto API）：**
```javascript
const array = new Uint32Array(32)
crypto.getRandomValues(array)
```

### 2. 字符串编码

**❌ 不推荐（Node.js 特定）：**
```javascript
const buffer = Buffer.from(string, 'utf8')
const encoded = buffer.toString('base64')
```

**✅ 推荐（Web API）：**
```javascript
const encoder = new TextEncoder()
const decoder = new TextDecoder()
const encoded = btoa(string)
const decoded = atob(encoded)
```

### 3. 文件路径处理

**❌ 不支持（Node.js 特定）：**
```javascript
const path = require('path')
const fullPath = path.join(__dirname, 'file.txt')
```

**✅ 推荐（使用相对路径）：**
```javascript
const fullPath = './file.txt'
// 或使用 import.meta.url
```

### 4. 环境变量访问

**✅ 支持（Node.js 兼容模式）：**
```javascript
const envVar = process.env.MY_VARIABLE
```

**✅ 也支持（Workers 原生）：**
```javascript
const envVar = env.MY_VARIABLE
```

## 项目兼容性实现

### generateSecureToken 函数

**实现示例：**
```javascript
export function generateSecureToken(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  // 使用 Web Crypto API（Cloudflare Workers 支持）
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)

  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length]
  }

  return result
}
```

**特点：**
- ✅ 完全兼容 Cloudflare Workers
- ✅ 使用密码学安全的随机数生成
- ✅ 无需环境检测
- ✅ 性能优异

### 响应处理

**实现示例：**
```javascript
export function successResponse(message, data = {}) {
  return new Response(
    JSON.stringify({
      success: true,
      message,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
```

**特点：**
- ✅ 使用 Fetch API Response 对象
- ✅ 原生支持 JSON 序列化
- ✅ 完全兼容 Workers 环境

## 部署和测试

### 本地开发

**安装 Wrangler：**
```bash
npm install -g wrangler
```

**本地测试：**
```bash
# 启动开发服务器
wrangler dev

# 或使用 npm script
npm run dev
```

**部署到 Cloudflare：**
```bash
# 直接部署
wrangler deploy

# 或使用 npm script
npm run deploy
```

### CI/CD 部署

**GitHub Actions 配置：**
```yaml
- name: Deploy to Cloudflare Workers
  run: npx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## 性能优化

### 1. 减少冷启动时间

**策略：**
- ✅ 避免复杂的初始化逻辑
- ✅ 使用懒加载
- ✅ 优化依赖项大小

### 2. 内存管理

**最佳实践：**
- ✅ 及时释放大对象
- ✅ 避免内存泄漏
- ✅ 使用高效的数据结构

### 3. 网络请求优化

**建议：**
- ✅ 使用 keep-alive 连接
- ✅ 实现请求缓存
- ✅ 设置合理的超时时间

## 故障排查

### 常见问题

#### 1. "Could not resolve 'crypto'" 错误

**原因：**
- 使用了 Node.js 特定的 `require('crypto')`

**解决方案：**
- 使用 Web Crypto API 替代
- 启用 `nodejs_compat` 标志

#### 2. "require is not defined" 错误

**原因：**
- 使用了 `require()` 语法

**解决方案：**
- 使用 ES6 `import` 语法
- 启用 `nodejs_compat` 标志

#### 3. 内存限制错误

**原因：**
- 内存使用超过 Workers 限制（128MB）

**解决方案：**
- 优化内存使用
- 减少数据缓存
- 使用 KV 存储替代内存存储

#### 4. CPU 时间超限

**原因：**
- 执行时间超过 CPU 限制（免费版 10ms）

**解决方案：**
- 优化算法复杂度
- 使用异步操作
- 考虑升级到付费计划

### 调试工具

**Wrangler CLI：**
```bash
# 查看实时日志
wrangler tail

# 查看部署列表
wrangler deployments list

# 查看部署详情
wrangler deployments tail
```

**Cloudflare Dashboard：**
- 实时日志
- 性能指标
- 错误追踪
- 分析工具

## 限制和配额

### 免费计划限制

- **CPU 时间：** 10ms/请求
- **内存：** 128MB
- **请求次数：** 100,000/天
- **KV 存储：** 1GB
- **KV 读取：** 100,000/天
- **KV 写入：** 1,000/天

### 付费计划优势

- **CPU 时间：** 50ms/请求（或更多）
- **内存：** 更高的内存限制
- **请求次数：** 无限制
- **更多 KV 存储和读写次数**

## 最佳实践总结

### 1. 代码编写

- ✅ 使用 ES6+ 语法
- ✅ 避免依赖 Node.js 特定 API
- ✅ 使用 Web 标准 API
- ✅ 编写环境无关的代码

### 2. 性能优化

- ✅ 最小化冷启动时间
- ✅ 优化内存使用
- ✅ 实现缓存策略
- ✅ 使用异步操作

### 3. 错误处理

- ✅ 实现全面的错误处理
- ✅ 提供有意义的错误信息
- ✅ 实现重试机制
- ✅ 监控和日志记录

### 4. 安全考虑

- ✅ 验证所有输入
- ✅ 使用安全的随机数生成
- ✅ 实现速率限制
- ✅ 保护敏感数据

## 相关资源

### 官方文档

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

### 工具和库

- [Wrangler CLI](https://github.com/cloudflare/workers-sdk)
- [Cloudflare Workers SDK](https://github.com/cloudflare/workers-sdk)
- [Miniflare](https://miniflare.dev/) - 本地 Workers 模拟器

## 迁移检查清单

### 从 Node.js 到 Cloudflare Workers

- [ ] 移除所有 `require()` 调用
- [ ] 替换 Node.js 特定 API
- [ ] 更新 wrangler.toml 配置
- [ ] 添加 nodejs_compat 标志（如需要）
- [ ] 测试所有功能
- [ ] 验证性能和内存使用
- [ ] 更新文档和部署流程

---

**最后更新：** 2026-03-15
**维护者：** CodeArts 代码智能体
**相关文档：**
- [部署指南](DEPLOYMENT_GUIDE.md)
- [Node.js 版本迁移](NODEJS_VERSION_MIGRATION.md)
- [CI/CD 故障排查](GITHUB_ACTIONS_DEPLOYMENT_TROUBLESHOOTING.md)
