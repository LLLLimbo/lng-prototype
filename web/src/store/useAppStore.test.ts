import { describe, expect, it } from 'vitest'
import { createAppStore, defaultMockData } from './useAppStore'

describe('app store domain flow', () => {
  it('shows newly published gas price to terminal users', () => {
    const store = createAppStore(defaultMockData())
    store.getState().switchRole('market')

    const draftResult = store.getState().saveGasPriceDraft({
      sourceCompany: '华南气源公司',
      sourceSite: '深圳接收站',
      scope: 'exclusive',
      customerId: 'customer-a',
      price: 4020,
      validFrom: '2026-02-11',
      validTo: '2026-02-20',
      taxIncluded: true,
      note: '专项优惠价',
    })

    expect(draftResult.success).toBe(true)
    const draftId = draftResult.priceId as string

    store.getState().publishGasPrice(draftId, '市场部-周婷')
    store.getState().switchRole('terminal')

    const visiblePriceIds = store.getState().getVisibleGasPrices().map((item) => item.id)
    expect(visiblePriceIds).toContain(draftId)
  })

  it('does not show draft gas price to terminal users', () => {
    const store = createAppStore(defaultMockData())
    store.getState().switchRole('market')

    const draftResult = store.getState().saveGasPriceDraft({
      sourceCompany: '华南气源公司',
      sourceSite: '深圳接收站',
      scope: 'exclusive',
      customerId: 'customer-a',
      price: 3980,
      validFrom: '2026-02-11',
      validTo: '2026-02-20',
      taxIncluded: false,
      note: '待发布草稿',
    })

    expect(draftResult.success).toBe(true)
    const draftId = draftResult.priceId as string

    store.getState().switchRole('terminal')
    const visiblePriceIds = store.getState().getVisibleGasPrices().map((item) => item.id)
    expect(visiblePriceIds).not.toContain(draftId)
  })

  it('blocks plan declaration when gas price is taken down', () => {
    const store = createAppStore(defaultMockData())
    store.getState().switchRole('market')

    const draftResult = store.getState().saveGasPriceDraft({
      sourceCompany: '华南气源公司',
      sourceSite: '深圳接收站',
      scope: 'exclusive',
      customerId: 'customer-a',
      price: 3900,
      validFrom: '2026-02-11',
      validTo: '2026-02-20',
      taxIncluded: true,
      note: '用于下架校验',
    })

    expect(draftResult.success).toBe(true)
    const draftId = draftResult.priceId as string

    store.getState().publishGasPrice(draftId, '市场部-周婷')
    store.getState().switchRole('terminal')

    const planBeforeTakeDown = store.getState().createPlan({
      siteId: 'site-01',
      priceId: draftId,
      plannedVolume: 10,
      freightFee: 500,
      transportMode: 'upstream',
      paymentMethod: 'prepaid',
      weighDiffRule: 'load',
      agreementChecked: true,
    })
    expect(planBeforeTakeDown.success).toBe(true)

    store.getState().switchRole('market')
    store.getState().takeDownGasPrice(draftId, '市场部-周婷')
    store.getState().switchRole('terminal')

    const planAfterTakeDown = store.getState().createPlan({
      siteId: 'site-01',
      priceId: draftId,
      plannedVolume: 10,
      freightFee: 500,
      transportMode: 'upstream',
      paymentMethod: 'prepaid',
      weighDiffRule: 'load',
      agreementChecked: true,
    })

    expect(planAfterTakeDown.success).toBe(false)
    expect(planAfterTakeDown.errors[0]).toContain('仅可申报已发布且可见气价')
  })

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
    expect(store.getState().plans.find((item) => item.number === 'PL-20260209-001')?.status).toBe('changed')
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
      address: '江苏省南京市浦口区临港大道 18 号',
      contactName: '周亮',
      contactPhone: '13900001234',
      maintenancePolicy: 'manual',
      maintenanceWindow: '2026-02-10 ~ 2026-02-12',
    })

    store.getState().updateSite({
      siteId,
      patch: {
        name: '南京江北综合站',
        address: '江苏省南京市浦口区临港大道 20 号',
        contactName: '周亮',
        contactPhone: '13900004567',
        maintenancePolicy: 'block',
      },
    })
    store.getState().disableSite(siteId)

    const site = store.getState().sites.find((item) => item.id === siteId)
    expect(site?.name).toBe('南京江北综合站')
    expect((site as { address?: string } | undefined)?.address).toBe('江苏省南京市浦口区临港大道 20 号')
    expect((site as { contactName?: string } | undefined)?.contactName).toBe('周亮')
    expect((site as { contactPhone?: string } | undefined)?.contactPhone).toBe('13900004567')
    expect(site?.status).toBe('disabled')
    expect(site?.maintenancePolicy).toBe('block')
  })

  it('supports vehicle and personnel maintenance operations', () => {
    const store = createAppStore(defaultMockData())

    const vehicleId = store.getState().addVehicle({
      plateNo: '苏C·LNG66',
      capacity: 30,
      model: 'LNG槽车-40方',
      tankVolume: 40,
      certExpiry: '2026-10-31',
      certFile: 'vehicle-cert-66.pdf',
      valid: true,
    })

    store.getState().updateVehicle({
      vehicleId,
      patch: {
        capacity: 32,
        certExpiry: '2026-11-30',
        certFile: 'vehicle-cert-66-v2.pdf',
      },
    })
    store.getState().disableVehicle(vehicleId)

    const personId = store.getState().addPerson({
      name: '周航',
      role: 'driver',
      phone: '13800008888',
      idNo: '320106198905012233',
      certFile: 'driver-cert-zhouhang.pdf',
      organizationName: '华东承运物流有限公司',
      certExpiry: '2026-09-30',
      valid: true,
    })

    store.getState().updatePerson({
      personId,
      patch: {
        role: 'escort',
        certFile: 'escort-cert-zhouhang.pdf',
      },
    })
    store.getState().disablePerson(personId)

    const vehicle = store.getState().vehicles.find((item) => item.id === vehicleId)
    const person = store.getState().personnel.find((item) => item.id === personId)

    expect(vehicle?.capacity).toBe(32)
    expect((vehicle as { certFile?: string } | undefined)?.certFile).toBe('vehicle-cert-66-v2.pdf')
    expect(vehicle?.valid).toBe(false)
    expect(person?.role).toBe('escort')
    expect((person as { idNo?: string } | undefined)?.idNo).toBe('320106198905012233')
    expect((person as { certFile?: string } | undefined)?.certFile).toBe('escort-cert-zhouhang.pdf')
    expect(person?.valid).toBe(false)
  })

  it('stores plan schedule fields from plan creation', () => {
    const store = createAppStore(defaultMockData())
    const result = store.getState().createPlan({
      siteId: 'site-01',
      priceId: 'price-public-1',
      plannedVolume: 12,
      freightFee: 800,
      transportMode: 'upstream',
      paymentMethod: 'prepaid',
      weighDiffRule: 'load',
      agreementChecked: true,
      planDate: '2026-02-12',
      timeWindow: '08:00-12:00',
    })

    expect(result.success).toBe(true)

    const created = store
      .getState()
      .plans.find((item) => item.id === result.planId)

    expect((created as { planDate?: string } | undefined)?.planDate).toBe('2026-02-12')
    expect((created as { timeWindow?: string } | undefined)?.timeWindow).toBe('08:00-12:00')
  })

  it('submits and approves order supplement workflow', () => {
    const store = createAppStore(defaultMockData())

    store.getState().submitOrderSupplement({
      orderId: 'order-2001',
      upstreamOrderNo: 'UP-20260210-001',
      loadSiteName: '宁波接收站',
      estimatedLoadAt: '2026-02-10 13:30',
      supplementDocName: 'upstream-outbound-0210.pdf',
    })

    store.getState().reviewOrderSupplement({
      orderId: 'order-2001',
      action: 'approve',
      reviewer: '调度中心-王主管',
    })

    const order = store.getState().orders.find((item) => item.id === 'order-2001')
    expect(order?.supplementStatus).toBe('approved')
    expect(order?.status).toBe('stocking')
    expect(order?.upstreamOrderNo).toBe('UP-20260210-001')
  })

  it('generates daily plan report snapshot by date', () => {
    const store = createAppStore(defaultMockData())

    const reportId = store.getState().generateDailyPlanReport({
      reportDate: '2026-02-09',
      generatedBy: '市场部-周婷',
    })

    const report = store.getState().dailyPlanReports.find((item) => item.id === reportId)
    expect(report?.reportDate).toBe('2026-02-09')
    expect(report?.plans.length).toBeGreaterThan(0)
    expect(report?.generatedBy).toBe('市场部-周婷')
  })

  it('supports auth login and logout with mock verify code', () => {
    const store = createAppStore(defaultMockData())
    const loginResult = store.getState().login({
      phone: '13800138001',
      password: '123456',
      verifyCode: '123456',
    })

    expect(loginResult.success).toBe(true)
    expect(store.getState().isAuthenticated).toBe(true)
    expect(store.getState().currentRole).toBe('market')

    store.getState().logout()
    expect(store.getState().isAuthenticated).toBe(false)
    expect(store.getState().currentUser).toBeUndefined()
  })

  it('supports register and reset password flow', () => {
    const store = createAppStore(defaultMockData())
    const registerResult = store.getState().registerAccount({
      organizationName: '苏州新奥燃气有限公司',
      contactName: '李敏',
      phone: '13800138111',
      password: 'init123',
      role: 'terminal',
      verifyCode: '123456',
    })

    expect(registerResult.success).toBe(true)

    const resetResult = store.getState().resetPassword({
      phone: '13800138111',
      verifyCode: '123456',
      newPassword: 'next123',
    })
    expect(resetResult.success).toBe(true)

    const loginResult = store.getState().login({
      phone: '13800138111',
      password: 'next123',
      verifyCode: '123456',
    })
    expect(loginResult.success).toBe(true)
  })

  it('supports upstream organization registration flow', () => {
    const store = createAppStore(defaultMockData())
    const registerResult = store.getState().registerAccount({
      organizationName: '浙江海港气源有限公司',
      contactName: '蒋涛',
      phone: '13800138113',
      password: 'init123',
      role: 'upstream',
      verifyCode: '123456',
    })

    expect(registerResult.success).toBe(true)
    expect(store.getState().authUsers[0].role).toBe('upstream')
    expect(store.getState().onboardingApplications[0].organizationType).toBe('upstream')
    expect(store.getState().onboardingApplications[0].status).toBe('pending')
  })

  it('creates onboarding application when external account registers', () => {
    const store = createAppStore(defaultMockData())
    const beforeCount = store.getState().onboardingApplications.length

    const registerResult = store.getState().registerAccount({
      organizationName: '宁波港新能物流有限公司',
      contactName: '赵伟',
      phone: '13800138112',
      password: 'welcome123',
      role: 'carrier',
      verifyCode: '123456',
    })

    expect(registerResult.success).toBe(true)
    expect(store.getState().onboardingApplications.length).toBe(beforeCount + 1)
    expect(store.getState().onboardingApplications[0].organizationName).toBe('宁波港新能物流有限公司')
    expect(store.getState().onboardingApplications[0].status).toBe('pending')
  })

  it('allows rejected onboarding application to resubmit', () => {
    const store = createAppStore(defaultMockData())
    store.getState().resubmitOnboarding('onb-002')

    const app = store.getState().onboardingApplications.find((item) => item.id === 'onb-002')
    expect(app?.status).toBe('pending')
    expect(app?.rejectReason).toBeUndefined()
  })

  it('submits onboarding materials and reopens application for review', () => {
    const store = createAppStore(defaultMockData())
    const result = store.getState().submitOnboardingMaterials({
      applicationId: 'onb-002',
      contactPhone: '13900139001',
      invoiceTitle: '华东承运物流有限公司',
      taxNo: '91320000MA7654321X',
      businessLicenseFile: 'business-license.pdf',
      qualificationFile: 'carrier-qualification.pdf',
    })

    expect(result.success).toBe(true)

    const app = store.getState().onboardingApplications.find((item) => item.id === 'onb-002')
    expect(app?.status).toBe('pending')
    expect(app?.businessLicenseFile).toBe('business-license.pdf')
    expect(app?.qualificationFile).toBe('carrier-qualification.pdf')
    expect(app?.taxNo).toBe('91320000MA7654321X')
    expect(app?.rejectReason).toBeUndefined()
  })
})
