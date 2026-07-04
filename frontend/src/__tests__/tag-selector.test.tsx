import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('lucide-react', () => ({
  CheckCircle2: () => React.createElement('span', { 'data-testid': 'check-icon' }),
  Send: () => React.createElement('span', { 'data-testid': 'send-icon' }),
}))

import { TagSelector } from '@/features/learning/components/tag-selector'

describe('TagSelector', () => {
  const onSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tag buttons', () => {
    render(React.createElement(TagSelector, { onSubmit }))
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(1)
  })

  it('renders the 선호도 저장 submit button', () => {
    render(React.createElement(TagSelector, { onSubmit }))
    const submitBtn = screen.getByRole('button', { name: /선호도 저장/i })
    expect(submitBtn).toBeDefined()
  })

  it('renders the 건너뛰기 skip button', () => {
    render(React.createElement(TagSelector, { onSubmit }))
    const skipBtn = screen.getByRole('button', { name: /건너뛰기/i })
    expect(skipBtn).toBeDefined()
  })

  it('toggles tag selection on click', () => {
    render(React.createElement(TagSelector, { onSubmit }))
    const tagBtn = screen.getByRole('button', { name: /More structured/i })

    fireEvent.click(tagBtn)
    expect(screen.getAllByTestId('check-icon').length).toBeGreaterThanOrEqual(1)

    fireEvent.click(tagBtn)
    expect(screen.queryAllByTestId('check-icon').length).toBe(0)
  })

  it('calls onSubmit with selected tags when 선호도 저장 is clicked', () => {
    render(React.createElement(TagSelector, { onSubmit }))

    // Select one tag
    const tagBtn = screen.getByRole('button', { name: /More concise/i })
    fireEvent.click(tagBtn)

    // Submit
    const submitBtn = screen.getByRole('button', { name: /선호도 저장/i })
    fireEvent.click(submitBtn)

    expect(onSubmit).toHaveBeenCalledOnce()
    const submitted = onSubmit.mock.calls[0][0] as string[]
    expect(Array.isArray(submitted)).toBe(true)
    expect(submitted.length).toBe(1)
  })

  it('calls onSubmit with empty array when no tags selected', () => {
    render(React.createElement(TagSelector, { onSubmit }))
    const submitBtn = screen.getByRole('button', { name: /선호도 저장/i })
    fireEvent.click(submitBtn)
    expect(onSubmit).toHaveBeenCalledWith([])
  })

  it('disables submit button when isSubmitting=true', () => {
    render(React.createElement(TagSelector, { onSubmit, isSubmitting: true }))
    const submitBtn = screen.getByRole('button', { name: /선호도 저장/i }) as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)
  })

  it('skip button calls onSubmit with empty array', () => {
    render(React.createElement(TagSelector, { onSubmit }))
    const skipBtn = screen.getByRole('button', { name: /건너뛰기/i })
    fireEvent.click(skipBtn)
    expect(onSubmit).toHaveBeenCalledWith([])
  })
})
