/**
 * 速率限制工具函数
 * 使用 Cloudflare KV 实现简单的速率限制
 */

/**
 * 检查并更新速率限制
 * @param {string} key - 限制键（通常是 IP 地址或用户 ID）
 * @param {Object} env - Cloudflare Workers 环境变量
 * @param {number} limit - 限制次数（默认 100）
 * @param {number} window - 时间窗口（秒，默认 60）
 * @returns {Promise<{allowed: boolean, remaining: number, reset: number}>}
 */
export async function checkRateLimit(key, env, limit = 100, window = 60) {
  if (!env || !env.RATE_LIMIT) {
    // 如果没有配置 KV，则不限制
    return { allowed: true, remaining: limit, reset: 0 }
  }

  try {
    const now = Date.now()
    const windowMs = window * 1000
    const reset = now + windowMs

    // 获取当前计数
    const current = await env.RATE_LIMIT.get(key, { type: 'json' })

    if (!current || current.reset < now) {
      // 窗口已过期，重置计数
      await env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, reset }), { expirationTtl: window })
      return { allowed: true, remaining: limit - 1, reset }
    }

    // 检查是否超过限制
    if (current.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        reset: current.reset,
      }
    }

    // 增加计数
    const newCount = current.count + 1
    const remaining = limit - newCount
    const ttl = Math.ceil((current.reset - now) / 1000)

    await env.RATE_LIMIT.put(key, JSON.stringify({ count: newCount, reset: current.reset }), {
      expirationTtl: ttl,
    })

    return { allowed: true, remaining, reset: current.reset }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // 出错时允许请求
    return { allowed: true, remaining: limit, reset: 0 }
  }
}

/**
 * 创建速率限制中间件
 * @param {Object} env - Cloudflare Workers 环境变量
 * @param {Object} options - 选项 { limit, window, keyPrefix }
 * @returns {Function} 中间件函数
 */
export function createRateLimitMiddleware(env, options = {}) {
  const { limit = 100, window = 60, keyPrefix = 'ratelimit' } = options

  return async (request) => {
    // 从请求中提取 IP 或用户标识
    const key = `${keyPrefix}:${getClientIdentifier(request)}`

    const result = await checkRateLimit(key, env, limit, window)

    if (!result.allowed) {
      return {
        allowed: false,
        response: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.reset).toISOString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        },
      }
    }

    return {
      allowed: true,
      remaining: result.remaining,
      reset: result.reset,
    }
  }
}

/**
 * 获取客户端标识符
 * @param {Request} request - Fetch API 请求对象
 * @returns {string} 客户端标识符
 */
function getClientIdentifier(request) {
  // 优先使用 IP 地址
  const ip =
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    request.headers.get('X-Real-IP')

  if (ip) {
    return ip
  }

  // 如果没有 IP，使用 User-Agent 的哈希
  const userAgent = request.headers.get('User-Agent') || 'unknown'
  return simpleHash(userAgent)
}

/**
 * 简单哈希函数
 * @param {string} str - 要哈希的字符串
 * @returns {string} 哈希值
 */
function simpleHash(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}
