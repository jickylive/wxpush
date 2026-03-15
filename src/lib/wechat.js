/**
 * 微信 API 工具函数
 * 处理微信公众号相关的 API 调用
 */

/**
 * 获取微信访问令牌
 * @param {string} appid - 微信公众号 AppID
 * @param {string} secret - 微信公众号 AppSecret
 * @param {Object} env - Cloudflare Workers 环境变量（可选，用于缓存）
 * @returns {Promise<string|null>} 访问令牌
 */
export async function getStableToken(appid, secret, env = null) {
  // 如果有 KV 缓存，先尝试从缓存获取
  if (env && env.WX_CACHE) {
    try {
      const cached = await env.WX_CACHE.get('access_token')
      if (cached) {
        const { token, expiry } = JSON.parse(cached)
        if (Date.now() < expiry) {
          console.log('Using cached access token')
          return token
        }
      }
    } catch (error) {
      console.error('Cache read error:', error)
    }
  }

  const tokenUrl = 'https://api.weixin.qq.com/cgi-bin/stable_token'
  const payload = {
    grant_type: 'client_credential',
    appid: appid,
    secret: secret,
    force_refresh: false,
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (data.access_token) {
    // 如果有 KV 缓存，缓存 token（有效期 2 小时，提前 5 分钟过期）
    if (env && env.WX_CACHE) {
      try {
        const expiry = Date.now() + 2 * 60 * 60 * 1000 - 5 * 60 * 1000 // 1 小时 55 分钟
        await env.WX_CACHE.put(
          'access_token',
          JSON.stringify({ token: data.access_token, expiry }),
          { expirationTtl: 7200 }
        )
        console.log('Access token cached')
      } catch (error) {
        console.error('Cache write error:', error)
      }
    }
    return data.access_token
  }

  console.error('Failed to get access token:', data)
  return null
}

/**
 * 发送微信模板消息
 * @param {string} accessToken - 微信访问令牌
 * @param {string} userid - 用户 OpenID
 * @param {string} template_id - 模板消息 ID
 * @param {string} base_url - 跳转基础 URL
 * @param {string} title - 消息标题
 * @param {string} content - 消息内容
 * @returns {Promise<Object>} 微信 API 响应
 */
export async function sendMessage(accessToken, userid, template_id, base_url, title, content) {
  const sendUrl = `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${accessToken}`

  // 使用 Intl.DateTimeFormat 正确处理北京时间 (UTC+8)
  const date = new Date()
    .toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(/\//g, '-')

  const encoded_message = encodeURIComponent(content)
  const encoded_date = encodeURIComponent(date)

  const payload = {
    touser: userid,
    template_id: template_id,
    url: `${base_url}?message=${encoded_message}&date=${encoded_date}&title=${encodeURIComponent(title)}`,
    data: {
      title: { value: title },
      content: { value: content },
    },
  }

  const response = await fetch(sendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
    body: JSON.stringify(payload),
  })

  return await response.json()
}

/**
 * 批量发送消息（带并发控制）
 * @param {string} accessToken - 微信访问令牌
 * @param {Array<string>} userids - 用户 OpenID 列表
 * @param {string} template_id - 模板消息 ID
 * @param {string} base_url - 跳转基础 URL
 * @param {string} title - 消息标题
 * @param {string} content - 消息内容
 * @param {number} concurrency - 并发数（默认 5）
 * @returns {Promise<Array<Object>>} 所有发送结果
 */
export async function sendMessagesWithConcurrency(
  accessToken,
  userids,
  template_id,
  base_url,
  title,
  content,
  concurrency = 5
) {
  const results = []

  for (let i = 0; i < userids.length; i += concurrency) {
    const chunk = userids.slice(i, i + concurrency)
    const chunkResults = await Promise.all(
      chunk.map((userid) => sendMessage(accessToken, userid, template_id, base_url, title, content))
    )
    results.push(...chunkResults)
  }

  return results
}
