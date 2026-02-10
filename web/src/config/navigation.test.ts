import { describe, expect, it } from 'vitest'
import { appMenus } from './navigation'

describe('navigation role visibility', () => {
  it('does not expose onboarding submit/status menu to driver role', () => {
    const onboardingStatus = appMenus.find((item) => item.key === 'onboarding-status')
    const onboardingSubmit = appMenus.find((item) => item.key === 'onboarding-submit')

    expect(onboardingStatus).toBeDefined()
    expect(onboardingSubmit).toBeDefined()
    expect(onboardingStatus?.roles).not.toContain('driver')
    expect(onboardingSubmit?.roles).not.toContain('driver')
  })
})
