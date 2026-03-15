#!/bin/bash

# Cloudflare Workers 环境变量设置脚本
# 用于将 .env 文件中的敏感变量设置到 Cloudflare Workers

echo "开始设置 Cloudflare Workers 环境变量..."
echo ""

# 从 .env 文件读取变量
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "错误：.env 文件不存在"
    exit 1
fi

# 设置敏感变量（使用 wrangler secret put）
echo "设置敏感变量..."

if [ -n "$API_TOKEN" ]; then
    echo "$API_TOKEN" | wrangler secret put API_TOKEN
else
    echo "警告：API_TOKEN 未设置"
fi

if [ -n "$WX_SECRET" ]; then
    echo "$WX_SECRET" | wrangler secret put WX_SECRET
else
    echo "警告：WX_SECRET 未设置"
fi

echo ""
echo "敏感变量设置完成"
echo ""
echo "非敏感变量可以在 wrangler.toml 中配置，或通过以下命令设置："
echo "wrangler secret put WX_APPID"
echo "wrangler secret put WX_USERID"
echo "wrangler secret put WX_TEMPLATE_ID"
echo "wrangler secret put WX_BASE_URL"
echo ""
echo "或者直接编辑 wrangler.toml 文件添加 [vars] 配置"
