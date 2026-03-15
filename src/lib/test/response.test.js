/**
 * 响应处理工具函数测试
 */

import { describe, it, expect } from 'vitest'
import {
  successResponse,
  errorResponse,
  missingParamsResponse,
  unauthorizedResponse,
  internalErrorResponse,
  healthCheckResponse,
} from '../response.js'

describe('successResponse', () => {
  it('should create a success response', async () => {
    const response = successResponse('Operation successful', { id: 123 })
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')

    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Operation successful')
    expect(data.data.id).toBe(123)
    expect(data.data.timestamp).toBeDefined()
  })

  it('should support custom status code', async () => {
    const response = successResponse('Created', {}, 201)
    expect(response.status).toBe(201)
    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.success).toBe(true)
  })
})

describe('errorResponse', () => {
  it('should create an error response', async () => {
    const response = errorResponse('ValidationError', 'Invalid input', { field: 'name' })
    expect(response.status).toBe(500)
    expect(response.headers.get('Content-Type')).toBe('application/json')

    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.success).toBe(false)
    expect(data.error).toBe('ValidationError')
    expect(data.message).toBe('Invalid input')
    expect(data.details.field).toBe('name')
    expect(data.timestamp).toBeDefined()
  })

  it('should support custom status code', async () => {
    const response = errorResponse('NotFound', 'Resource not found', {}, 404)
    expect(response.status).toBe(404)
  })
})

describe('missingParamsResponse', () => {
  it('should create a missing parameters response', async () => {
    const response = missingParamsResponse({
      email: 'email is required',
      password: 'password is required',
    })
    expect(response.status).toBe(400)

    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Missing required parameters')
    expect(data.details.email).toBe('email is required')
  })
})

describe('unauthorizedResponse', () => {
  it('should create an unauthorized response', async () => {
    const response = unauthorizedResponse()
    expect(response.status).toBe(403)

    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
    expect(data.message).toBe('Invalid token')
  })

  it('should support custom message', async () => {
    const response = unauthorizedResponse('Token expired')
    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.message).toBe('Token expired')
  })
})

describe('internalErrorResponse', () => {
  it('should create an internal error response', async () => {
    const error = new Error('Something went wrong')
    const response = internalErrorResponse(error)
    expect(response.status).toBe(500)

    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Internal server error')
    expect(data.message).toBe('Something went wrong')
  })

  it('should include stack trace in development', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const error = new Error('Test error')
    const response = internalErrorResponse(error)
    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.details.stack).toBeDefined()

    process.env.NODE_ENV = originalEnv
  })
})

describe('healthCheckResponse', () => {
  it('should create a health check response', async () => {
    const response = healthCheckResponse()
    expect(response.status).toBe(200)

    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.status).toBe('healthy')
    expect(data.service).toBe('WXPush')
    expect(data.version).toBe('1.0.0')
    expect(data.timestamp).toBeDefined()
  })

  it('should support custom service name and version', async () => {
    const response = healthCheckResponse('MyService', '2.0.0')
    const bodyText = await response.text()
    const data = JSON.parse(bodyText)
    expect(data.service).toBe('MyService')
    expect(data.version).toBe('2.0.0')
  })
})
