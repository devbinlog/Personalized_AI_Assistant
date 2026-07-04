import { describe, it, expect, vi, afterEach } from 'vitest'
import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request', () => {
    const key = `test-first-${Date.now()}-${Math.random()}`
    const result = rateLimit(key, 5, 60_000)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('allows requests within the limit', () => {
    const key = `test-within-${Date.now()}-${Math.random()}`
    const limit = 3

    rateLimit(key, limit, 60_000)
    rateLimit(key, limit, 60_000)
    const third = rateLimit(key, limit, 60_000)

    expect(third.allowed).toBe(true)
    expect(third.remaining).toBe(0)
  })

  it('rejects requests over the limit', () => {
    const key = `test-over-${Date.now()}-${Math.random()}`
    const limit = 2

    rateLimit(key, limit, 60_000)
    rateLimit(key, limit, 60_000)
    const third = rateLimit(key, limit, 60_000) // over limit

    expect(third.allowed).toBe(false)
    expect(third.remaining).toBe(0)
  })

  it('resets the window after windowMs elapses', () => {
    vi.useFakeTimers()
    const key = `test-reset-${Date.now()}-${Math.random()}`
    const limit = 1
    const windowMs = 1000

    rateLimit(key, limit, windowMs) // use up the limit
    const overLimit = rateLimit(key, limit, windowMs)
    expect(overLimit.allowed).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(windowMs + 1)

    const afterReset = rateLimit(key, limit, windowMs)
    expect(afterReset.allowed).toBe(true)
    expect(afterReset.remaining).toBe(0)
  })

  it('tracks separate keys independently', () => {
    const base = `test-sep-${Date.now()}-${Math.random()}`
    const keyA = `${base}-A`
    const keyB = `${base}-B`
    const limit = 1

    rateLimit(keyA, limit, 60_000) // exhaust keyA

    const resultA = rateLimit(keyA, limit, 60_000)
    const resultB = rateLimit(keyB, limit, 60_000)

    expect(resultA.allowed).toBe(false)
    expect(resultB.allowed).toBe(true) // keyB is independent
  })
})
