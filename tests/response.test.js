/**
 * 响应处理测试 - CI 版本
 * 这些测试用于 GitHub Actions CI/CD 流程
 */

import { describe, it, expect } from 'vitest'
import {
  successResponse,
  errorResponse,
  missingParamsResponse,
  unauthorizedResponse,
  healthCheckResponse,
} from '../src/lib/response.js'

describe('successResponse', () => {
  it('should create a success response with message', async () => {
    const response = successResponse('Operation successful')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.message).toBe('Operation successful')
  })

  it('should create a success response with data', async () => {
    const data = { id: 1, name: 'test' }
    const response = successResponse('Operation successful', data)
    expect(response.status).toBe(200)
    const result = await response.json()
    expect(result.data).toMatchObject(data)
  })
})

describe('errorResponse', () => {
  it('should create an error response with message', async () => {
    const response = errorResponse('ValidationError', 'Invalid input')
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('ValidationError')
    expect(data.message).toBe('Invalid input')
  })

  it('should create an error response with custom status', async () => {
    const response = errorResponse('ValidationError', 'Invalid input', {}, 400)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
  })

  it('should create an error response with details', async () => {
    const details = { field: 'email', error: 'Invalid format' }
    const response = errorResponse('ValidationError', 'Validation failed', details, 422)
    expect(response.status).toBe(422)
    const data = await response.json()
    expect(data.details).toEqual(details)
  })
})

describe('missingParamsResponse', () => {
  it('should create a missing parameters response', async () => {
    const missingParams = { token: 'Token is required', title: 'Title is required' }
    const response = missingParamsResponse(missingParams)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing required parameters')
    expect(data.details).toEqual(missingParams)
  })
})

describe('unauthorizedResponse', () => {
  it('should create an unauthorized response', async () => {
    const response = unauthorizedResponse('Invalid token')
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
    expect(data.message).toBe('Invalid token')
  })

  it('should create an unauthorized response with default message', async () => {
    const response = unauthorizedResponse()
    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.message).toBe('Invalid token')
  })
})

describe('healthCheckResponse', () => {
  it('should create a health check response', async () => {
    const response = healthCheckResponse('WXPush', '2.0.0')
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('healthy')
    expect(data.service).toBe('WXPush')
    expect(data.version).toBe('2.0.0')
    expect(data.timestamp).toBeDefined()
  })

  it('should create a health check response with default values', async () => {
    const response = healthCheckResponse()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.service).toBe('WXPush')
    expect(data.version).toBe('1.0.0')
  })
})
