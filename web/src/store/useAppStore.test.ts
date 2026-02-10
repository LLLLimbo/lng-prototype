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

  it('blocks invoice application when statement is not confirmed', () => {
    const store = createAppStore(defaultMockData())
    const draftStatementId = 'rc-202602-001'

    const result = store.getState().createInvoiceApplication({
      statementId: draftStatementId,
      discountEnabled: false,
      discountAmount: 0,
      invoiceTitle: '华东能源科技有限公司',
      taxNo: '91320000MA1234567X',
      applicant: '市场部-王经理',
    })

    expect(result.success).toBe(false)
    expect(result.errors[0]).toContain('仅双方已确认或线下已确认的对账单可申请开票')
  })

  it('approves invoice application and generates pending invoice', () => {
    const store = createAppStore(defaultMockData())
    const result = store.getState().createInvoiceApplication({
      statementId: 'rc-202601-003',
      discountEnabled: true,
      discountAmount: 5000,
      invoiceTitle: '华东能源科技有限公司',
      taxNo: '91320000MA1234567X',
      applicant: '市场部-王经理',
      note: '周期优惠',
    })

    expect(result.success).toBe(true)

    const applicationId = result.applicationId as string
    store.getState().reviewInvoiceApplication({
      applicationId,
      action: 'approve',
      reviewer: '财务-陈会计',
    })

    const stateAfterApprove = store.getState()
    const application = stateAfterApprove.invoiceApplications.find(
      (item) => item.id === applicationId,
    )
    const generatedInvoice = stateAfterApprove.invoices.find(
      (item) => item.applicationId === applicationId,
    )

    expect(application?.status).toBe('approved')
    expect(application?.requestedAmount).toBe(115000)
    expect(generatedInvoice?.status).toBe('pending')

    if (generatedInvoice) {
      store.getState().issueInvoice({
        invoiceId: generatedInvoice.id,
        issuer: '财务-陈会计',
        invoiceNo: 'INV-20260210-168',
        issueDate: '2026-02-10',
        taxRate: 13,
        attachmentName: 'invoice-20260210-168.pdf',
      })
    }

    const stateAfterIssue = store.getState()
    const invoiced = stateAfterIssue.invoices.find(
      (item) => item.applicationId === applicationId,
    )

    expect(
      stateAfterIssue.invoiceApplications.find((item) => item.id === applicationId)?.status,
    ).toBe('invoiced')
    expect(invoiced?.status).toBe('issued')
    expect(invoiced?.number).toBe('INV-20260210-168')
    expect(invoiced?.issueDate).toBe('2026-02-10')
    expect(invoiced?.taxRate).toBe(13)
    expect(invoiced?.attachmentName).toBe('invoice-20260210-168.pdf')
    expect(invoiced?.issuedBy).toBe('财务-陈会计')
  })

  it('uploads upstream reconciliation archive record', () => {
    const store = createAppStore(defaultMockData())
    const archiveId = store.getState().uploadUpstreamArchive({
      upstreamCompany: '华北气源公司',
      period: '2026-02',
      fileName: 'upstream-202602.pdf',
      archivedBy: '市场部-周婷',
      note: '线下盖章后上传',
    })

    const record = store
      .getState()
      .upstreamArchives.find((item) => item.id === archiveId)

    expect(record?.status).toBe('archived')
    expect(record?.fileName).toBe('upstream-202602.pdf')
  })

  it('supports site add, edit and disable lifecycle', () => {
    const store = createAppStore(defaultMockData())

    const siteId = store.getState().addSite({
      name: '南京江北卸气站',
      type: 'unload',
      status: 'enabled',
      maintenancePolicy: 'manual',
      maintenanceWindow: '2026-02-10 ~ 2026-02-12',
    })

    store.getState().updateSite({
      siteId,
      patch: {
        name: '南京江北综合站',
        maintenancePolicy: 'block',
      },
    })
    store.getState().disableSite(siteId)

    const site = store.getState().sites.find((item) => item.id === siteId)
    expect(site?.name).toBe('南京江北综合站')
    expect(site?.status).toBe('disabled')
    expect(site?.maintenancePolicy).toBe('block')
  })

  it('supports vehicle and personnel maintenance operations', () => {
    const store = createAppStore(defaultMockData())

    const vehicleId = store.getState().addVehicle({
      plateNo: '苏C·LNG66',
      capacity: 30,
      certExpiry: '2026-10-31',
      valid: true,
    })

    store.getState().updateVehicle({
      vehicleId,
      patch: {
        capacity: 32,
        certExpiry: '2026-11-30',
      },
    })
    store.getState().disableVehicle(vehicleId)

    const personId = store.getState().addPerson({
      name: '周航',
      role: 'driver',
      certExpiry: '2026-09-30',
      valid: true,
    })

    store.getState().updatePerson({
      personId,
      patch: {
        role: 'escort',
      },
    })
    store.getState().disablePerson(personId)

    const vehicle = store.getState().vehicles.find((item) => item.id === vehicleId)
    const person = store.getState().personnel.find((item) => item.id === personId)

    expect(vehicle?.capacity).toBe(32)
    expect(vehicle?.valid).toBe(false)
    expect(person?.role).toBe('escort')
    expect(person?.valid).toBe(false)
  })
})
