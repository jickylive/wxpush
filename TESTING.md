# 测试说明文档

## 概述

本项目的测试文件与主代码库分离，不会提交到远程仓库。测试文件仅用于本地开发和质量保证。

## 测试文件结构

```
src/lib/test/
├── response.test.js    # 响应处理测试
└── security.test.js    # 安全功能测试
```

## 测试框架

项目使用 **Vitest** 作为测试框架，配置文件为 `vitest.config.js`。

## 运行测试

### 安装依赖
```bash
npm install
```

### 运行所有测试
```bash
npm test
```

### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

### 监听模式运行测试
```bash
npm run test:watch
```

## 测试文件说明

### 1. security.test.js
测试安全相关功能，包括：
- HTML 转义 (`escapeHtml`)
- URL 转义 (`escapeUrl`)
- Token 验证 (`validateToken`)
- OpenID 验证 (`isValidOpenId`)
- AppID 验证 (`isValidAppId`)
- 输入清理 (`sanitizeInput`)
- 安全 Token 生成 (`generateSecureToken`)
- 源验证 (`validateOrigin`)

### 2. response.test.js
测试响应处理功能，包括：
- JSON 响应格式
- 错误处理
- 成功响应
- CORS 头处理

## 为什么测试文件不提交到远程仓库？

1. **减少仓库大小**：测试文件通常比较大，会增加仓库体积
2. **简化 CI/CD**：GitHub Actions 的 CI 工作流已经配置了测试步骤
3. **本地开发灵活性**：开发者可以根据需要编写和修改测试
4. **避免误报**：测试文件中的模拟数据可能触发安全扫描误报
5. **关注点分离**：主仓库专注于生产代码，测试在本地环境中管理

## CI/CD 集成

GitHub Actions 工作流会自动运行测试：

- **CI 工作流**：每次 push 和 pull request 时运行测试
- **测试覆盖率**：自动生成并上传到 Codecov
- **代码质量**：同时运行 ESLint 检查

## 测试最佳实践

1. **编写测试时**：
   - 使用安全的测试数据
   - 避免使用真实的敏感信息
   - 测试边界情况和异常情况

2. **提交代码前**：
   - 运行测试确保不破坏现有功能
   - 检查测试覆盖率
   - 确保所有测试通过

3. **维护测试**：
   - 定期更新测试用例
   - 删除过时的测试
   - 保持测试代码整洁

## 本地测试环境设置

### 1. 克隆项目
```bash
git clone <your-repo-url>
cd wxpush
```

### 2. 安装依赖
```bash
npm install
```

### 3. 运行测试
```bash
npm test
```

### 4. 开发模式
```bash
npm run dev
```

## 常见问题

### Q: 测试文件在哪里？
A: 测试文件位于 `src/lib/test/` 目录，但不会被提交到 Git。

### Q: 如何分享测试代码？
A: 如果需要分享测试代码，可以通过其他方式（如邮件、文档）提供，或创建单独的测试仓库。

### Q: CI/CD 如何运行测试？
A: GitHub Actions 工作流会自动在 CI 环境中运行测试，无需本地测试文件。

### Q: 如何确保测试不被意外提交？
A: `.gitignore` 文件已配置忽略测试目录和所有 `.test.js` 文件。

## 安全注意事项

1. **测试数据安全**：
   - 不要在测试中使用真实的敏感信息
   - 使用明显的测试数据（如 `test123`、`example.com`）
   - 避免使用可能触发安全扫描的模式

2. **环境变量**：
   - 测试应使用模拟的环境变量
   - 不要在测试中引用真实的密钥

3. **API 调用**：
   - 使用 mock 或 stub 来模拟 API 调用
   - 避免在测试中调用真实的 API

## 更新日志

- **2026-03-15**: 将测试文件与主代码库分离，不再提交到远程仓库
- **2026-03-15**: 创建此测试说明文档

## 联系方式

如有测试相关问题，请通过 GitHub Issues 联系。
