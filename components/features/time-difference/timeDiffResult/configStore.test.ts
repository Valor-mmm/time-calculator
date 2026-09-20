import { describe, expect, it, vi } from 'vitest'
import { loadLocallyStoredConfig, storeConfigLocally } from './configStore'

const KEY = 'TIME_DIFF_CONFIG'

describe('loadLocallyStoredConfig', () => {
  it('defaults to hidden pauses when nothing is stored', () => {
    expect(loadLocallyStoredConfig()).toEqual({ showPauses: false })
  })

  it('reads a stored config back', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ showPauses: true }))

    expect(loadLocallyStoredConfig()).toEqual({ showPauses: true })
  })

  it('falls back to the default on corrupt JSON instead of throwing', () => {
    window.localStorage.setItem(KEY, '{not json')

    expect(() => loadLocallyStoredConfig()).not.toThrow()
    expect(loadLocallyStoredConfig()).toEqual({ showPauses: false })
  })

  it.each(['null', '"a string"', '42', '{"showPauses":"yes"}', '{}'])(
    'falls back to the default for the wrong shape %s',
    (stored) => {
      window.localStorage.setItem(KEY, stored)

      expect(loadLocallyStoredConfig()).toEqual({ showPauses: false })
    },
  )

  it('falls back to the default when storage access throws', () => {
    const getItem = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('storage disabled')
      })

    expect(loadLocallyStoredConfig()).toEqual({ showPauses: false })

    getItem.mockRestore()
  })
})

describe('storeConfigLocally', () => {
  it('round-trips through localStorage', () => {
    storeConfigLocally({ showPauses: true })

    expect(loadLocallyStoredConfig()).toEqual({ showPauses: true })
  })

  it('swallows a storage write failure', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('quota exceeded')
      })

    expect(() => storeConfigLocally({ showPauses: true })).not.toThrow()

    setItem.mockRestore()
  })
})
