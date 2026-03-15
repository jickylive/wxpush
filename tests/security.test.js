/**
 * 安全工具函数测试 - CI 版本
 * 这些测试用于 GitHub Actions CI/CD 流程
 */

import { describe, it, expect } from 'vitest'
import {
  escapeHtml,
  escapeUrl,
  validateToken,
  isValidOpenId,
  isValidAppId,
  sanitizeInput,
  generateSecureToken,
} from '../src/lib/security.js'

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
    )
    expect(escapeHtml('<div>Content</div>')).toBe('&lt;div&gt;Content&lt;/div&gt;')
  })

  it('should handle empty strings', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('escapeUrl', () => {
  it('should escape URL special characters', () => {
    expect(escapeUrl('hello world')).toBe('hello%20world')
    expect(escapeUrl('test@example.com')).toBe('test%40example.com')
  })
})

describe('validateToken', () => {
  it('should validate valid tokens', () => {
    const result = validateToken('abc123xyz789abcdefghijklmnop')
    expect(result.valid).toBe(true)
    expect(result.error).toBe(null)
  })

  it('should reject invalid tokens', () => {
    expect(validateToken('short').valid).toBe(false)
    expect(validateToken('').valid).toBe(false)
    expect(validateToken(null).valid).toBe(false)
  })
})

describe('isValidOpenId', () => {
  it('should validate valid OpenID format', () => {
    expect(isValidOpenId('oaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBe(true)
  })

  it('should reject invalid OpenID format', () => {
    expect(isValidOpenId('invalid')).toBe(false)
    expect(isValidOpenId(null)).toBe(false)
    expect(isValidOpenId('')).toBe(false)
  })
})

describe('isValidAppId', () => {
  it('should validate valid AppID format', () => {
    expect(isValidAppId('wx1234567890abcdef')).toBe(true)
  })

  it('should reject invalid AppID format', () => {
    expect(isValidAppId('invalid')).toBe(false)
    expect(isValidAppId('wx123')).toBe(false)
    expect(isValidAppId(null)).toBe(false)
    expect(isValidAppId('')).toBe(false)
  })
})

describe('sanitizeInput', () => {
  it('should trim and limit input length', () => {
    const result = sanitizeInput('  hello  ', { maxLength: 5, trim: true })
    expect(result).toBe('hello')
  })

  it('should escape HTML when requested', () => {
    const result = sanitizeInput('<script>', { escape: true })
    expect(result).toBe('&lt;script&gt;')
  })

  it('should handle null and undefined', () => {
    expect(sanitizeInput(null)).toBe('')
    expect(sanitizeInput(undefined)).toBe('')
  })
})

describe('generateSecureToken', () => {
  it('should generate token of specified length', () => {
    const token = generateSecureToken(16)
    expect(token).toHaveLength(16)
    expect(token).toMatch(/^[A-Za-z0-9]+$/)
  })

  it('should generate different tokens', () => {
    const token1 = generateSecureToken(32)
    const token2 = generateSecureToken(32)
    expect(token1).not.toBe(token2)
  })

  it('should use default length', () => {
    const token = generateSecureToken()
    expect(token).toHaveLength(32)
  })
})
