/**
 * 安全工具函数
 * 提供常见的安全防护功能
 */

/**
 * HTML 转义，防止 XSS 攻击
 * @param {string} unsafe - 未转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * URL 转义
 * @param {string} unsafe - 未转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeUrl(unsafe) {
  if (typeof unsafe !== 'string') return unsafe
  return encodeURIComponent(unsafe)
}

/**
 * 验证令牌格式
 * @param {string} token - 要验证的令牌
 * @param {Object} options - 选项 { minLength, maxLength, pattern }
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateToken(token, options = {}) {
  const { minLength = 16, maxLength = 256, pattern = /^[a-zA-Z0-9\-_]+$/ } = options

  if (!token) {
    return { valid: false, error: 'Token is required' }
  }

  if (typeof token !== 'string') {
    return { valid: false, error: 'Token must be a string' }
  }

  if (token.length < minLength) {
    return { valid: false, error: `Token must be at least ${minLength} characters` }
  }

  if (token.length > maxLength) {
    return { valid: false, error: `Token must not exceed ${maxLength} characters` }
  }

  if (!pattern.test(token)) {
    return { valid: false, error: 'Token contains invalid characters' }
  }

  return { valid: true, error: null }
}

/**
 * 验证微信 OpenID 格式
 * @param {string} openid - 要验证的 OpenID
 * @returns {boolean} 是否有效
 */
export function isValidOpenId(openid) {
  if (!openid || typeof openid !== 'string') {
    return false
  }

  // 微信 OpenID 通常为 28 位字母数字组合
  return /^[a-zA-Z0-9]{28}$/.test(openid)
}

/**
 * 验证微信 AppID 格式
 * @param {string} appid - 要验证的 AppID
 * @returns {boolean} 是否有效
 */
export function isValidAppId(appid) {
  if (!appid || typeof appid !== 'string') {
    return false
  }

  // 微信 AppID 格式：wx 开头，后跟 16 位字母数字
  return /^wx[a-zA-Z0-9]{16}$/.test(appid)
}

/**
 * 清理和验证用户输入
 * @param {*} input - 用户输入
 * @param {Object} options - 选项 { maxLength, trim, escape }
 * @returns {string} 清理后的字符串
 */
export function sanitizeInput(input, options = {}) {
  const { maxLength = 1000, trim = true, escape = false } = options

  if (input === null || input === undefined) {
    return ''
  }

  let result = String(input)

  if (trim) {
    result = result.trim()
  }

  if (result.length > maxLength) {
    result = result.substring(0, maxLength)
  }

  if (escape) {
    result = escapeHtml(result)
  }

  return result
}

/**
 * 生成安全的随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
export function generateSecureToken(length = 32) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  // 使用 crypto API 生成随机数
  const array = new Uint32Array(length)
  crypto.getRandomValues(array)

  for (let i = 0; i < length; i++) {
    result += charset[array[i] % charset.length]
  }

  return result
}

/**
 * 验证请求来源（简单的 CORS 检查）
 * @param {Request} request - Fetch API 请求对象
 * @param {Array<string>} allowedOrigins - 允许的来源列表
 * @returns {boolean} 是否允许
 */
export function validateOrigin(request, allowedOrigins = []) {
  const origin = request.headers.get('Origin')

  if (!origin) {
    return true // 没有Origin头，可能是直接请求
  }

  if (allowedOrigins.length === 0) {
    return true // 没有限制来源
  }

  return allowedOrigins.some((allowed) => {
    if (allowed === '*') return true
    if (allowed === origin) return true

    // 支持通配符域名
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2)
      return origin.endsWith(domain)
    }

    return false
  })
}
