import { describe, expect, it } from 'vitest'
import { createAppStore, defaultMockData } from './useAppStore'

describe('app store domain flow', () => {
  it('blocks plan submission when available balance is insufficient', () => {
    const store = createAppStore(defaultMockData())
    const result = store.getState().createPlan({
      siteId: 'site-01',
      priceId: 'price-exclusive-a',
      plannedVolume: 120,
      freightFee: 3000,
      transportMode: 'carrier',
      paymentMethod: 'prepaid',
      weighDiffRule: 'load',
      agreementChecked: true,
      carrierId: 'carrier-01',
      vehicleId: 'vehicle-01',
      driverId: 'person-01',
      escortId: 'person-02',
    })

    expect(result.success).toBe(false)
    expect(result.errors[0]).toContain('余额不足')
    expect(store.getState().plans).toHaveLength(2)
  })

  it('approves a plan and converts occupied funds into frozen funds', () => {
    const store = createAppStore(defaultMockData())
    const createResult = store.getState().createPlan({
      siteId: 'site-01',
      priceId: 'price-public-1',
      plannedVolume: 30,
      freightFee: 1000,
      transportMode: 'upstream',
      paymentMethod: 'prepaid',
      weighDiffRule: 'load',
      agreementChecked: true,
    })

    expect(createResult.success).toBe(true)
    const createdPlanId = createResult.planId as string

    store.getState().reviewPlan({
      planId: createdPlanId,
      action: 'approve',
      reviewer: '市场部-李工',
    })

    const state = store.getState()
    const approvedPlan = state.plans.find((item) => item.id === createdPlanId)

    expect(approvedPlan?.status).toBe('approved')
    expect(state.orders.some((order) => order.planId === createdPlanId)).toBe(true)
    expect(state.account.frozen).toBeGreaterThan(0)
  })

  it('supports dual stamp flow for reconciliation statement', () => {
    const store = createAppStore(defaultMockData())
    const statementId = store.getState().reconciliations[0].id

    store.getState().applyStamp(statementId, 'platform', '市场部-王经理')
    store.getState().applyStamp(statementId, 'customer', '终端用户-张三')

    const statement = store
      .getState()
      .reconciliations.find((item) => item.id === statementId)

    expect(statement?.status).toBe('double-confirmed')
    expect(statement?.stampLogs).toHaveLength(2)
  })

  it('archives only completed orders', () => {
    const store = createAppStore(defaultMockData())
    const resultBeforeAcceptance = store
      .getState()
      .archiveOrder('order-2001', '调度-刘工')

    expect(resultBeforeAcceptance.success).toBe(false)
    expect(resultBeforeAcceptance.error).toContain('仅已验收/已结算订单可归档')

    store.getState().acceptOrder('order-2001', true, 17.8)
    const resultAfterAcceptance = store
      .getState()
      .archiveOrder('order-2001', '调度-刘工')

    expect(resultAfterAcceptance.success).toBe(true)
    expect(
      store.getState().orders.find((item) => item.id === 'order-2001')?.status,
    ).toBe('archived')
  })

  it('creates and approves an exception case', () => {
    const store = createAppStore(defaultMockData())
    const exceptionId = store.getState().createException({
      type: 'plan-change',
      targetNo: 'PL-20260209-001',
      reason: '客户申请数量变更',
      responsibilityParty: '终端用户',
      amount: 5600,
    })

    store.getState().processException({
      exceptionId,
      action: 'approve',
      reviewer: '市场部-审批员',
      note: '同意调整，补收差额',
    })

    const exception = store
      .getState()
      .exceptions.find((item) => item.id === exceptionId)

    expect(exception?.status).toBe('approved')
    expect(exception?.reviewer).toBe('市场部-审批员')
  })

  it('approves onboarding and activates organization after contract upload', () => {
    const store = createAppStore(defaultMockData())

    store.getState().reviewOnboarding({
      applicationId: 'onb-001',
      action: 'approve',
      reviewer: '市场部-赵主管',
      level: 'A',
    })
    store.getState().uploadOnboardingContract({
      applicationId: 'onb-001',
      contractName: 'service-contract.pdf',
      effectiveDate: '2026-02-10',
    })

    const app = store
      .getState()
      .onboardingApplications.find((item) => item.id === 'onb-001')

    expect(app?.status).toBe('activated')
    expect(app?.level).toBe('A')
    expect(app?.contractName).toBe('service-contract.pdf')
  })
})
