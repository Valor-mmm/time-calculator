import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const KEY = 'TimeCalculator_Language'

// The store keeps module-level state, so every test gets a fresh module.
const loadHook = async () => {
  const freshModule = await import('./useLanguageSwitch')
  return freshModule.useLanguageSwitch
}

const mockBrowserLanguages = (value: unknown) =>
  vi
    .spyOn(navigator, 'languages', 'get')
    .mockReturnValue(value as readonly string[])

const renderLanguageHook = async () => {
  const useLanguageSwitch = await loadHook()
  return renderHook(() => useLanguageSwitch())
}

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useLanguageSwitch', () => {
  it('prefers a previously stored language over the browser setting', async () => {
    window.localStorage.setItem(KEY, 'de-DE')
    mockBrowserLanguages(['en-EN'])

    const { result } = await renderLanguageHook()

    expect(result.current[0]).toBe('de-DE')
  })

  it('picks the first supported browser language', async () => {
    mockBrowserLanguages(['fr-FR', 'de-DE', 'en-EN'])

    const { result } = await renderLanguageHook()

    expect(result.current[0]).toBe('de-DE')
  })

  it('falls back to en-EN when no browser language is supported', async () => {
    mockBrowserLanguages(['fr-FR', 'es-ES'])

    const { result } = await renderLanguageHook()

    expect(result.current[0]).toBe('en-EN')
  })

  it('ignores an unsupported stored language', async () => {
    window.localStorage.setItem(KEY, 'klingon')
    mockBrowserLanguages(['de-DE'])

    const { result } = await renderLanguageHook()

    expect(result.current[0]).toBe('de-DE')
  })

  it('accepts a plain string from navigator.languages', async () => {
    mockBrowserLanguages('de-DE')

    const { result } = await renderLanguageHook()

    expect(result.current[0]).toBe('de-DE')
  })

  it('falls back to en-EN when reading the browser language throws', async () => {
    mockBrowserLanguages(undefined)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    const { result } = await renderLanguageHook()

    expect(result.current[0]).toBe('en-EN')
  })

  it('persists a switched language and notifies subscribers', async () => {
    mockBrowserLanguages(['en-EN'])

    const { result } = await renderLanguageHook()
    act(() => {
      result.current[1]('de-DE')
    })

    expect(window.localStorage.getItem(KEY)).toBe('de-DE')
    expect(result.current[0]).toBe('de-DE')
  })

  it('shares the language between separate consumers', async () => {
    mockBrowserLanguages(['en-EN'])

    const useLanguageSwitch = await loadHook()
    const first = renderHook(() => useLanguageSwitch())
    const second = renderHook(() => useLanguageSwitch())

    act(() => {
      first.result.current[1]('de-DE')
    })

    expect(second.result.current[0]).toBe('de-DE')
  })

  it('regression: switching away from a browser-detected language works on the first click', async () => {
    // The browser says German, so the hook starts on de-DE while the store's
    // own default used to be en-EN. Clicking "English" was a no-op because the
    // store compared against its stale default instead of the shown value.
    mockBrowserLanguages(['de-DE'])

    const { result } = await renderLanguageHook()
    expect(result.current[0]).toBe('de-DE')

    act(() => {
      result.current[1]('en-EN')
    })

    expect(result.current[0]).toBe('en-EN')
    expect(window.localStorage.getItem(KEY)).toBe('en-EN')
  })

  it('does not notify when the language is unchanged', async () => {
    mockBrowserLanguages(['de-DE'])

    const { result } = await renderLanguageHook()
    const setItem = vi.spyOn(Storage.prototype, 'setItem')

    act(() => {
      result.current[1]('de-DE')
    })

    expect(setItem).not.toHaveBeenCalled()
  })
})
