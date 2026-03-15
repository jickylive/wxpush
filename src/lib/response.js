/**
 * 响应处理工具函数
 * 统一 API 响应格式和错误处理
 */

/**
 * 创建成功响应
 * @param {string} message - 成功消息
 * @param {Object} data - 响应数据
 * @param {number} status - HTTP 状态码
 * @returns {Response} Fetch API 响应对象
 */
export function successResponse(message, data = {}, status = 200) {
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
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * 创建错误响应
 * @param {string} error - 错误类型
 * @param {string} message - 错误消息
 * @param {Object} details - 错误详情
 * @param {number} status - HTTP 状态码
 * @returns {Response} Fetch API 响应对象
 */
export function errorResponse(error, message, details = {}, status = 500) {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      message,
      details,
      timestamp: new Date().toISOString(),
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * 创建参数缺失错误响应
 * @param {Object} missingParams - 缺失的参数对象
 * @returns {Response} Fetch API 响应对象
 */
export function missingParamsResponse(missingParams) {
  return errorResponse(
    'Missing required parameters',
    'Please provide all required parameters',
    missingParams,
    400
  )
}

/**
 * 创建认证失败响应
 * @param {string} message - 错误消息
 * @returns {Response} Fetch API 响应对象
 */
export function unauthorizedResponse(message = 'Invalid token') {
  return errorResponse('Unauthorized', message, {}, 403)
}

/**
 * 创建内部错误响应
 * @param {Error} error - 错误对象
 * @returns {Response} Fetch API 响应对象
 */
export function internalErrorResponse(error) {
  return errorResponse(
    'Internal server error',
    error.message,
    {
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    500
  )
}

/**
 * 创建健康检查响应
 * @param {string} service - 服务名称
 * @param {string} version - 服务版本
 * @returns {Response} Fetch API 响应对象
 */
export function healthCheckResponse(service = 'WXPush', version = '1.0.0') {
  return new Response(
    JSON.stringify({
      status: 'healthy',
      service,
      version,
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 'N/A',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
