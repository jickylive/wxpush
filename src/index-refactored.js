/**
 * WXPush - 微信消息推送服务（重构版本）
 * 使用共享模块库，代码更简洁、可维护
 */

import { getParams, extractAuthToken, getClientIP } from './lib/request.js'

import { getStableToken, sendMessagesWithConcurrency } from './lib/wechat.js'

import {
  successResponse,
  errorResponse,
  missingParamsResponse,
  unauthorizedResponse,
  internalErrorResponse,
  healthCheckResponse,
} from './lib/response.js'

import { checkRateLimit } from './lib/rateLimit.js'
import { escapeHtml } from './lib/security.js'

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url)

    // 健康检查端点
    if (url.pathname === '/health') {
      return healthCheckResponse('WXPush', '1.0.0')
    }

    // 测试页面路由
    const singleSeg = url.pathname.match(/^\/([^/]+)\/?$/)
    if (singleSeg && singleSeg[1] && singleSeg[1] !== 'wxsend' && singleSeg[1] !== 'index.html') {
      const rawTokenFromPath = singleSeg[1]

      // 认证令牌
      if (rawTokenFromPath !== env.API_TOKEN) {
        return unauthorizedResponse()
      }

      // 转义令牌以安全嵌入 HTML
      const sanitizedToken = escapeHtml(rawTokenFromPath)

      return new Response(getTestPageHtml(sanitizedToken), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // 消息发送路由
    if (url.pathname === '/wxsend') {
      return await handleSendMessage(request, env)
    }

    // 首页路由
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return new Response(getHomePageHtml(), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // 404
    return new Response('Not Found', { status: 404 })
  },
}

/**
 * 处理消息发送请求
 */
async function handleSendMessage(request, env) {
  try {
    // 解析参数
    const params = await getParams(request)

    // 提取认证令牌
    const requestToken = extractAuthToken(request, params)

    // 验证必需参数
    const content = params.content
    const title = params.title

    if (!content || !title || !requestToken) {
      return missingParamsResponse({
        content: !content ? 'content is required' : null,
        title: !title ? 'title is required' : null,
        token: !requestToken ? 'token is required' : null,
      })
    }

    // 验证令牌
    if (requestToken !== env.API_TOKEN) {
      return unauthorizedResponse()
    }

    // 速率限制检查（可选）
    if (env.RATE_LIMIT) {
      const clientIP = getClientIP(request)
      const rateLimitResult = await checkRateLimit(`wxpush:${clientIP}`, env, 100, 60)

      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests. Please try again later.',
            reset: new Date(rateLimitResult.reset).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }
    }

    // 获取配置
    const appid = params.appid || env.WX_APPID
    const secret = params.secret || env.WX_SECRET
    const useridStr = params.userid || env.WX_USERID
    const template_id = params.template_id || env.WX_TEMPLATE_ID
    const base_url = params.base_url || env.WX_BASE_URL

    // 验证必需的环境变量
    if (!appid || !secret || !useridStr || !template_id) {
      return errorResponse(
        'Missing required environment variables',
        'Please configure all required environment variables',
        {
          appid: !appid ? 'WX_APPID is required' : null,
          secret: !secret ? 'WX_SECRET is required' : null,
          useridStr: !useridStr ? 'WX_USERID is required' : null,
          template_id: !template_id ? 'WX_TEMPLATE_ID is required' : null,
        },
        500
      )
    }

    // 解析用户列表
    const user_list = useridStr
      .split('|')
      .map((uid) => uid.trim())
      .filter(Boolean)

    // 获取访问令牌（支持缓存）
    const accessToken = await getStableToken(appid, secret, env)

    if (!accessToken) {
      return errorResponse(
        'Authentication failed',
        'Failed to get access token from WeChat API',
        {},
        500
      )
    }

    // 批量发送消息（带并发控制）
    const results = await sendMessagesWithConcurrency(
      accessToken,
      user_list,
      template_id,
      base_url,
      title,
      content,
      5 // 并发数
    )

    // 统计结果
    const successfulMessages = results.filter((r) => r.errmsg === 'ok')

    if (successfulMessages.length > 0) {
      return successResponse(`Successfully sent messages to ${successfulMessages.length} user(s)`, {
        sentCount: successfulMessages.length,
        totalCount: user_list.length,
        failedCount: user_list.length - successfulMessages.length,
      })
    } else {
      const firstError = results.length > 0 ? results[0].errmsg : 'Unknown error'
      return errorResponse(
        'Failed to send messages',
        `WeChat API returned error: ${firstError}`,
        {
          attemptedUsers: user_list.length,
          errorDetails: results,
        },
        500
      )
    }
  } catch (error) {
    console.error('Error:', error)
    return internalErrorResponse(error)
  }
}

/**
 * 生成测试页面 HTML
 */
function getTestPageHtml(token) {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>WXPush 测试页面</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        background: linear-gradient(170deg, #f3e8ff 0%, #ffffff 100%);
        color: #1f2937;
        box-sizing: border-box;
      }
      .container {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 40px;
        max-width: 720px;
        width: 100%;
        text-align: left;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .container:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        font-weight: 700;
        text-align: center;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .hint {
        color: #4b5563;
        margin: 0 0 24px;
        font-size: 16px;
        line-height: 1.6;
        text-align: center;
      }
      label {
        display: block;
        margin: 16px 0 8px;
        font-weight: 700;
        color: #374151;
      }
      input[type=text], textarea {
        width: 100%;
        padding: 12px;
        border: 1px solid #d4d4d8;
        border-radius: 12px;
        background: #f4f4f5;
        transition: all 0.2s ease;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 14px;
      }
      input[type=text]:focus, textarea:focus {
        outline: none;
        border-color: #8b5cf6;
        background: #ffffff;
        box-shadow: 0 0 0 2px #c4b5fd;
      }
      button {
        margin-top: 24px;
        padding: 12px 20px;
        border-radius: 12px;
        border: 0;
        background: #8b5cf6;
        color: #fff;
        cursor: pointer;
        font-weight: 700;
        transition: all 0.2s ease;
      }
      button:hover {
        background: #7c3aed;
        transform: translateY(-2px);
      }
      button#clearBtn {
         background: #f4f4f5;
         color: #374151;
         border: 1px solid #e4e4e7;
      }
       button#clearBtn:hover {
         background: #ffffff;
         border-color: #d4d4d8;
         color: #1f2937;
      }
      pre {
        background: #1f2937;
        color: #e5e7eb;
        padding: 16px;
        border-radius: 12px;
        white-space: pre-wrap;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>WXPush 测试页面</h1>
      <p class="hint">当前 token (来自路径)：<strong>${token}</strong></p>

      <form id="testForm" method="POST" action="/wxsend">

        <label for="title">标题 (title)</label>
        <input id="title" name="title" type="text" value="测试标题" />

        <label for="content">内容 (content)</label>
        <textarea id="content" name="content" rows="4">这是测试内容</textarea>

        <label for="userid">用户 ID (userid，可选，多用户用 | 分隔)</label>
        <input id="userid" name="userid" type="text" placeholder="例如: OPENID1|OPENID2" />

        <label for="appid">WX_APPID (可选，留空使用环境变量)</label>
        <input id="appid" name="appid" type="text" />

        <label for="secret">WX_SECRET (可选，留空使用环境变量)</label>
        <input id="secret" name="secret" type="text" />

        <label for="template_id">模板 ID (template_id，可选)</label>
        <input id="template_id" name="template_id" type="text" />

        <label for="base_url">跳转链接 base_url (可选)</label>
        <input id="base_url" name="base_url" type="text" />

        <input type="hidden" name="token" id="hiddenToken" value="${token}" />

        <div style="display:flex;gap:12px;align-items:center">
          <button id="sendBtn" type="submit">发送测试请求</button>
          <button type="button" id="clearBtn">清空</button>
        </div>
      </form>
      <div id="responseCard" style="display:none; margin-top: 20px;">
        <label for="responseArea">响应</label>
        <pre id="responseArea"></pre>
      </div>
    </div>

    <script>
      const form = document.getElementById('testForm');
      const sendBtn = document.getElementById('sendBtn');
      const clearBtn = document.getElementById('clearBtn');
      const responseArea = document.getElementById('responseArea');
      const responseCard = document.getElementById('responseCard');

      if (form && sendBtn && clearBtn && responseArea && responseCard) {
        clearBtn.addEventListener('click', () => {
          document.getElementById('title').value = '';
          document.getElementById('content').value = '';
          document.getElementById('userid').value = '';
          document.getElementById('appid').value = '';
          document.getElementById('secret').value = '';
          document.getElementById('template_id').value = '';
          document.getElementById('base_url').value = '';
          responseArea.textContent = '';
          responseCard.style.display = 'none';
        });

        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          sendBtn.disabled = true;
          const originalText = sendBtn.textContent;
          sendBtn.textContent = '发送中...';
          responseCard.style.display = 'none';

          const formData = new FormData(form);
          const payload = {};
          for (const [k, v] of formData.entries()) {
             if (k !== 'token' && v) {
                payload[k] = v;
             }
          }

          try {
            const headers = { 'Content-Type': 'application/json' };
            const token = document.getElementById('hiddenToken').value;
            if (token) headers['Authorization'] = token;

            const response = await fetch('/wxsend', { method: 'POST', headers, body: JSON.stringify(payload) });
            const responseText = await response.text();
            responseArea.textContent = 'Status: ' + response.status + '\\n\\n' + responseText;
            responseCard.style.display = 'block';
          } catch (err) {
            responseArea.textContent = 'Fetch error: ' + err.message;
            responseCard.style.display = 'block';
          } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = originalText;
          }
        });
      }
    </script>
  </body>
</html>`
}

/**
 * 生成首页 HTML
 */
function getHomePageHtml() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>WXPush — 微信消息推送服务</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background: linear-gradient(170deg, #f3e8ff 0%, #ffffff 100%);
        color: #1f2937;
      }
      .card {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.18);
        padding: 40px;
        max-width: 720px;
        width: 90%;
        text-align: center;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .card:hover {
        transform: translateY(-8px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
      }
      h1 {
        margin: 0 0 12px;
        font-size: 32px;
        font-weight: 700;
        background: linear-gradient(90deg, #8b5cf6, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      p {
        color: #4b5563;
        margin: 0 0 24px;
        font-size: 16px;
        line-height: 1.6;
      }
      .author {
        margin: 20px 0;
        color: #374151;
        font-size: 14px;
      }
      .icons {
        display: flex;
        gap: 20px;
        justify-content: center;
        margin-top: 24px;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 20px;
        border-radius: 12px;
        text-decoration: none;
        color: #374151;
        background: #f4f4f5;
        border: 1px solid #e4e4e7;
        font-weight: 700;
        transition: all 0.2s ease;
      }
      .btn:hover {
        background: #ffffff;
        border-color: #d4d4d8;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      .icon {
        width: 22px;
        height: 22px;
        display: inline-block;
      }
      footer {
        margin-top: 24px;
        color: #6b7280;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>WXPush</h1>
      <p>一个极简、可靠的微信消息推送服务，通过简单的 Webhook 请求，即可向微信用户发送模板消息。</p>
      <div class="author">作者：<strong>饭奇骏</strong></div>
      <div class="icons">
        <a class="btn" href="https://github.com/frankiejun" target="_blank" rel="noopener noreferrer">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.93 3.2 9.11 7.64 10.59.56.1.76-.24.76-.53 0-.26-.01-.95-.02-1.87-3.11.68-3.77-1.5-3.77-1.5-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.12.08 1.71 1.15 1.71 1.15 1.0 1.72 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.21 1.16-2.99-.12-.28-.5-1.41.11-2.94 0 0 .95-.31 3.12 1.15.9-.25 1.86-.38 2.82-.39.96.01 1.92.14 2.82.39 2.17-1.46 3.12-1.15 3.12-1.15.61 1.53.23 2.66.11 2.94.72.78 1.16 1.77 1.16 2.99 0 4.3-2.62 5.25-5.11 5.53.4.35.75 1.04.75 2.09 0 1.51-.01 2.72-.01 3.09 0 .29.2.63.77.52C19.05 20.86 22.25 16.68 22.25 11.75 22.25 5.48 17.27.5 12 .5z"/></svg>
          GitHub
        </a>
        <a class="btn" href="https://www.youtube.com/@frankiejun8965" target="_blank" rel="noopener noreferrer">
          <svg class="icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M23.5 6.2s-.23-1.63-.94-2.34C21.55 3 19.9 3 19.12 2.9 16.54 2.6 12 2.6 12 2.6s-4.53 0-7.12.3C4.1 3 2.45 3.1 1.44 3.86.73 4.47.5 6.1.5 6.1S.25 8 .25 9.9v2.2c0 1.93.25 3.8.25 3.8s.23 1.63.94 2.34c.99.76 2.64.76 3.42.86 2.6.3 7.12.3 7.12.3s4.53 0 7.12-.3c.79-.1 2.44-.1 3.43-.86.7-.7.94-2.34.94-2.34s.25-1.9.25-3.8V9.9c0-1.9-.25-3.7-.25-3.7zM9.75 15.3V8.7l6.18 3.3-6.18 3.3z"/></svg>
          YouTube
        </a>
      </div>
      <footer>点击上方图标前往关注，以获取更多项目更新和演示。</footer>
    </div>
  </body>
</html>`
}
