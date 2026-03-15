/**
 * 请求处理工具函数
 * 统一处理 GET/POST 请求参数解析
 */

/**
 * 从请求中提取参数（支持 GET/POST、JSON/Form Data）
 * @param {Request} request - Fetch API 请求对象
 * @returns {Promise<Object>} 解析后的参数对象
 */
export async function getParams(request) {
  const { searchParams } = new URL(request.url)
  const urlParams = Object.fromEntries(searchParams.entries())

  let bodyParams = {}
  // Only try to parse a body if it's a POST/PUT/PATCH request
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    const contentType = (request.headers.get('content-type') || '').toLowerCase()
    try {
      if (contentType.includes('application/json')) {
        const jsonBody = await request.json()
        // jsonBody can be a string, an object, or other types
        if (typeof jsonBody === 'string') {
          // treat raw string as content
          bodyParams = { content: jsonBody }
        } else if (jsonBody && typeof jsonBody === 'object') {
          // support nested containers like { params: {...} } or { data: {...} }
          if (jsonBody.params && typeof jsonBody.params === 'object') {
            bodyParams = jsonBody.params
          } else if (jsonBody.data && typeof jsonBody.data === 'object') {
            bodyParams = jsonBody.data
          } else {
            bodyParams = jsonBody
          }
        }
      } else if (
        contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('multipart/form-data')
      ) {
        const formData = await request.formData()
        bodyParams = Object.fromEntries(formData.entries())
      } else {
        // Fallback: try to read raw text and parse as JSON, otherwise treat as raw content
        const text = await request.text()
        if (text) {
          try {
            const parsed = JSON.parse(text)
            if (parsed && typeof parsed === 'object') {
              if (parsed.params && typeof parsed.params === 'object') {
                bodyParams = parsed.params
              } else if (parsed.data && typeof parsed.data === 'object') {
                bodyParams = parsed.data
              } else {
                bodyParams = parsed
              }
            } else {
              bodyParams = { content: text }
            }
          } catch (e) {
            bodyParams = { content: text }
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse request body:', error)
      // Ignore body parsing errors and proceed with URL params
    }
  }

  // Merge params, giving body parameters precedence over URL parameters
  return { ...urlParams, ...bodyParams }
}

/**
 * 从请求中提取认证令牌
 * @param {Request} request - Fetch API 请求对象
 * @param {Object} params - 已解析的参数对象
 * @returns {string|null} 认证令牌
 */
export function extractAuthToken(request, params) {
  let requestToken = params.token

  if (!requestToken) {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization')
    if (authHeader) {
      // support formats: 'Bearer <token>' or raw token
      const parts = authHeader.split(' ')
      requestToken = parts.length === 2 && /^Bearer$/i.test(parts[0]) ? parts[1] : authHeader
    }
  }

  return requestToken
}

/**
 * 获取客户端 IP 地址
 * @param {Request} request - Fetch API 请求对象
 * @returns {string} 客户端 IP
 */
export function getClientIP(request) {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    request.headers.get('X-Real-IP') ||
    'unknown'
  )
}
