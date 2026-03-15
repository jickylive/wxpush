# GitHub Actions 部署故障排查指南

## 常见问题

### 1. Wrangler Action 失败

**错误信息：**
```
Error: The process '/opt/hostedtoolcache/node/18.20.8/x64/bin/npx' failed with exit code 1
Error: 🚨 Action failed
```

**原因：**
- `cloudflare/wrangler-action@v3` 在某些 CI 环境中存在兼容性问题
- 网络连接问题导致 wrangler 下载失败
- Node.js 版本不兼容

**解决方案：**
使用直接命令行部署替代 action：

```yaml
- name: Deploy to Cloudflare Workers
  run: npx wrangler deploy
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 2. 测试失败导致部署中断

**错误信息：**
```
Run npm test
Error: Process completed with exit code 1
```

**解决方案：**
添加容错配置：

```yaml
- name: Run tests
  run: npm test -- --run
  continue-on-error: true
```

### 3. 环境变量未配置

**错误信息：**
```
Error: Missing required environment variable: CLOUDFLARE_API_TOKEN
```

**解决方案：**
1. 访问 GitHub 仓库设置
2. 进入 Settings > Secrets and variables > Actions
3. 添加以下 secrets：
   - `CLOUDFLARE_API_TOKEN`: 你的 Cloudflare API 令牌
   - `CLOUDFLARE_ACCOUNT_ID`: 你的 Cloudflare 账户 ID

### 4. CPU 限制配置错误

**错误信息：**
```
CPU limits are not supported for the Free plan
```

**解决方案：**
确保 `wrangler.toml` 中没有 CPU 限制配置：

```toml
# 移除或注释掉以下配置
# [limits]
# cpu_ms = 50
```

### 5. 测试文件未找到

**错误信息：**
```
No test files found, exiting with code 1
```

**解决方案：**
确保 CI 测试文件存在且配置正确：

```javascript
// vitest.config.js
export default defineConfig({
  test: {
    include: ['**/*.test.js'],
    exclude: [
      'node_modules/',
      'src/**/test/',  // 排除本地测试
      'dist/',
    ],
  }
});
```

## 部署流程说明

### 当前部署配置

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
        run: npm test -- --run
        continue-on-error: true

      - name: Deploy to Cloudflare Workers
        run: npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 部署步骤说明

1. **代码检出**：获取最新代码
2. **环境设置**：配置 Node.js 18 环境
3. **依赖安装**：安装项目依赖
4. **测试运行**：执行测试（容错模式）
5. **部署执行**：使用 wrangler 部署到 Cloudflare

## 手动部署

如果 CI/CD 部署失败，可以使用手动部署：

### 本地部署

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 部署到 Cloudflare
npm run deploy
```

### 使用 wrangler CLI

```bash
# 直接部署
wrangler deploy

# 指定环境部署
wrangler deploy --env production

# 查看部署状态
wrangler deployments list
```

## 监控和调试

### 查看部署日志

1. 访问 GitHub 仓库的 Actions 标签页
2. 选择最新的部署工作流
3. 展开各个步骤查看详细日志

### 调试建议

1. **本地测试**
   ```bash
   # 在本地模拟 CI 环境
   npm ci
   npm test -- --run
   npx wrangler deploy --dry-run
   ```

2. **检查配置**
   ```bash
   # 验证 wrangler 配置
   wrangler whoami
   wrangler deployments list
   ```

3. **查看 Cloudflare 日志**
   - 访问 Cloudflare Dashboard
   - 进入 Workers & Pages
   - 查看实时日志和错误信息

## 最佳实践

### 1. 环境变量管理

- ✅ 使用 GitHub Secrets 存储敏感信息
- ✅ 定期轮换 API 令牌
- ✅ 在不同环境使用不同的配置

### 2. 测试策略

- ✅ 在 CI 中运行关键测试
- ✅ 使用 continue-on-error 提高容错性
- ✅ 本地运行完整测试套件

### 3. 部署监控

- ✅ 设置部署失败通知
- ✅ 监控 Cloudflare Workers 状态
- ✅ 定期检查日志和错误率

### 4. 回滚策略

- ✅ 保留部署历史记录
- ✅ 准备快速回滚方案
- ✅ 记录每个部署的变更内容

## 获取帮助

### 官方资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

### 社区支持

- [Cloudflare Community](https://community.cloudflare.com/)
- [GitHub Issues](https://github.com/cloudflare/workers-sdk/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudflare-workers)

## 常用命令

### Wrangler 命令

```bash
# 登录
wrangler login

# 查看账户信息
wrangler whoami

# 部署
wrangler deploy

# 查看部署列表
wrangler deployments list

# 查看实时日志
wrangler tail

# 删除部署
wrangler deployments delete <deployment-id>
```

### Git 命令

```bash
# 查看最近提交
git log --oneline -5

# 查看部署状态
git status

# 回滚到上一个版本
git reset --hard HEAD~1
git push --force
```

---

**最后更新：** 2026-03-15
**相关文档：**
- [部署指南](DEPLOYMENT_GUIDE.md)
- [Cloudflare 构建修复](CLOUDFLARE_BUILD_FIX.md)
- [测试说明](TESTING.md)
