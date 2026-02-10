import { createStore, type StateCreator } from 'zustand/vanilla'
import { useStore } from 'zustand'

export type RoleKey =
  | 'terminal'
  | 'market'
  | 'dispatch'
  | 'finance'
  | 'carrier'
  | 'driver'

export type PlanStatus =
  | 'draft'
  | 'submitted'
  | 'returned'
  | 'approved'
  | 'cancelled'
  | 'changed'

export type OrderStatus =
  | 'pending-supplement'
  | 'ordered'
  | 'stocking'
  | 'loaded'
  | 'transporting'
  | 'arrived'
  | 'pending-acceptance'
  | 'accepted'
  | 'settling'
  | 'settled'
  | 'archived'

export type TransportMode = 'upstream' | 'self' | 'carrier'
export type PaymentMethod = 'prepaid' | 'postpaid'
export type WeighDiffRule = 'load' | 'unload' | 'delta'

export interface AuthUser {
  id: string
  phone: string
  password: string
  contactName: string
  organizationName: string
  role: RoleKey
  customerId?: string
}

export interface Site {
  id: string
  name: string
  type: 'load' | 'unload' | 'use'
  status: 'enabled' | 'disabled' | 'maintenance'
  maintenancePolicy?: 'block' | 'manual'
  maintenanceWindow?: string
}

export interface Vehicle {
  id: string
  plateNo: string
  capacity: number
  valid: boolean
  certExpiry: string
}

export interface Person {
  id: string
  name: string
  role: 'driver' | 'escort'
  valid: boolean
  certExpiry: string
}

export interface GasPrice {
  id: string
  sourceCompany: string
  sourceSite: string
  scope: 'public' | 'exclusive'
  customerId?: string
  price: number
  validFrom: string
  validTo: string
  taxIncluded: boolean
  note: string
}

export interface Plan {
  id: string
  number: string
  customerId: string
  customerName: string
  siteId: string
  siteName: string
  priceId: string
  plannedVolume: number
  unitPrice: number
  estimatedAmount: number
  freightFee: number
  totalAmount: number
  transportMode: TransportMode
  paymentMethod: PaymentMethod
  weighDiffRule: WeighDiffRule
  agreementChecked: boolean
  carrierId?: string
  vehicleId?: string
  driverId?: string
  escortId?: string
  status: PlanStatus
  submittedAt: string
  reviewer?: string
  rejectReason?: string
}

export interface Order {
  id: string
  number: string
  planId: string
  customerName: string
  siteName: string
  transportMode: TransportMode
  weighDiffRule: WeighDiffRule
  status: OrderStatus
  threshold: number
  upstreamOrderNo?: string
  loadSiteName?: string
  estimatedLoadAt?: string
  supplementDocName?: string
  supplementStatus?: 'pending' | 'approved' | 'rejected'
  supplementReviewer?: string
  supplementNote?: string
  loadWeight?: number
  unloadWeight?: number
  settlementWeight?: number
  diffAbnormal: boolean
  exceptionNote?: string
}

export interface Account {
  total: number
  available: number
  occupied: number
  frozen: number
}

export interface LedgerRecord {
  id: string
  type: 'deposit' | 'occupy' | 'release' | 'freeze' | 'deduct' | 'refund'
  amount: number
  relatedNo: string
  createdAt: string
  note: string
}

export interface DepositRecord {
  id: string
  customerName: string
  amount: number
  paidAt: string
  receiptName: string
  status: 'pending' | 'confirmed' | 'rejected'
  reviewer?: string
  rejectReason?: string
}

export interface NotificationItem {
  id: string
  category: 'approval' | 'fulfillment' | 'finance' | 'system'
  title: string
  content: string
  createdAt: string
  read: boolean
}

export interface ReconciliationStatement {
  id: string
  number: string
  customerName: string
  period: string
  status: 'draft' | 'platform-stamped' | 'double-confirmed' | 'offline-confirmed'
  totalAmount: number
  orderNumbers: string[]
  stampLogs: Array<{
    actorType: 'platform' | 'customer'
    actor: string
    stampedAt: string
  }>
}

export interface InvoiceItem {
  id: string
  number: string
  customerName: string
  amount: number
  issueDate: string
  statementNo: string
  status: 'pending' | 'issued'
  applicationId?: string
  taxRate?: number
  attachmentName?: string
  issuedBy?: string
}

export interface UpstreamReconciliationArchive {
  id: string
  upstreamCompany: string
  period: string
  fileName: string
  archivedBy: string
  archivedAt: string
  note?: string
  status: 'archived'
}

export interface InvoiceApplication {
  id: string
  number: string
  statementId: string
  statementNo: string
  customerName: string
  orderNumbers: string[]
  originalAmount: number
  discountEnabled: boolean
  discountAmount: number
  requestedAmount: number
  invoiceTitle: string
  taxNo: string
  applicant: string
  appliedAt: string
  status: 'pending-review' | 'approved' | 'rejected' | 'invoiced'
  reviewer?: string
  reviewedAt?: string
  rejectReason?: string
  note?: string
  invoiceId?: string
}

export interface OnboardingApplication {
  id: string
  organizationName: string
  organizationType: 'upstream' | 'terminal' | 'carrier'
  contactName: string
  contactPhone: string
  submittedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'activated'
  level?: 'A' | 'B' | 'C'
  reviewer?: string
  rejectReason?: string
  contractName?: string
  contractEffectiveDate?: string
}

export type ExceptionType =
  | 'plan-terminate'
  | 'order-terminate'
  | 'plan-change'
  | 'order-change'
  | 'delta-adjustment'

export interface ExceptionCase {
  id: string
  number: string
  type: ExceptionType
  targetNo: string
  reason: string
  responsibilityParty: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  reviewer?: string
  reviewedAt?: string
  note?: string
}

export interface DashboardMetric {
  id: string
  title: string
  value: string
  trend?: string
}

export interface DailyPlanReportPlan {
  planId: string
  number: string
  customerName: string
  siteName: string
  plannedVolume: number
  transportMode: TransportMode
  status: PlanStatus
  submittedAt: string
}

export interface DailyPlanReport {
  id: string
  reportDate: string
  generatedAt: string
  generatedBy: string
  plans: DailyPlanReportPlan[]
}

export interface PlanInput {
  siteId: string
  priceId: string
  plannedVolume: number
  freightFee: number
  transportMode: TransportMode
  paymentMethod: PaymentMethod
  weighDiffRule: WeighDiffRule
  agreementChecked: boolean
  carrierId?: string
  vehicleId?: string
  driverId?: string
  escortId?: string
}

export interface CreatePlanResult {
  success: boolean
  errors: string[]
  planId?: string
}

export interface ReviewPlanInput {
  planId: string
  action: 'approve' | 'reject'
  reviewer: string
  reason?: string
}

export interface LoadConfirmInput {
  orderId: string
  weight: number
}

export interface UnloadConfirmInput {
  orderId: string
  weight: number
}

export interface DepositInput {
  customerName: string
  amount: number
  paidAt: string
  receiptName: string
}

export interface ArchiveActionResult {
  success: boolean
  error?: string
}

export interface CreateExceptionInput {
  type: ExceptionType
  targetNo: string
  reason: string
  responsibilityParty: string
  amount: number
}

export interface ProcessExceptionInput {
  exceptionId: string
  action: 'approve' | 'reject'
  reviewer: string
  note?: string
}

export interface AddSiteInput {
  name: string
  type: Site['type']
  status?: Site['status']
  maintenancePolicy?: Site['maintenancePolicy']
  maintenanceWindow?: string
}

export interface UpdateSiteInput {
  siteId: string
  patch: Partial<
    Pick<Site, 'name' | 'type' | 'status' | 'maintenancePolicy' | 'maintenanceWindow'>
  >
}

export interface AddVehicleInput {
  plateNo: string
  capacity: number
  certExpiry: string
  valid: boolean
}

export interface UpdateVehicleInput {
  vehicleId: string
  patch: Partial<Pick<Vehicle, 'plateNo' | 'capacity' | 'certExpiry' | 'valid'>>
}

export interface AddPersonInput {
  name: string
  role: Person['role']
  certExpiry: string
  valid: boolean
}

export interface UpdatePersonInput {
  personId: string
  patch: Partial<Pick<Person, 'name' | 'role' | 'certExpiry' | 'valid'>>
}

export interface SubmitOrderSupplementInput {
  orderId: string
  upstreamOrderNo: string
  loadSiteName: string
  estimatedLoadAt: string
  supplementDocName?: string
}

export interface ReviewOrderSupplementInput {
  orderId: string
  action: 'approve' | 'reject'
  reviewer: string
  reason?: string
}

export interface GenerateDailyPlanReportInput {
  reportDate: string
  generatedBy: string
}

export interface ReviewOnboardingInput {
  applicationId: string
  action: 'approve' | 'reject'
  reviewer: string
  reason?: string
  level?: 'A' | 'B' | 'C'
}

export interface UploadOnboardingContractInput {
  applicationId: string
  contractName: string
  effectiveDate: string
}

export interface UploadUpstreamArchiveInput {
  upstreamCompany: string
  period: string
  fileName: string
  archivedBy: string
  note?: string
}

export interface CreateInvoiceApplicationInput {
  statementId: string
  discountEnabled: boolean
  discountAmount: number
  invoiceTitle: string
  taxNo: string
  applicant: string
  note?: string
}

export interface CreateInvoiceApplicationResult {
  success: boolean
  errors: string[]
  applicationId?: string
}

export interface ReviewInvoiceApplicationInput {
  applicationId: string
  action: 'approve' | 'reject'
  reviewer: string
  reason?: string
}

export interface IssueInvoiceInput {
  invoiceId: string
  issuer: string
  invoiceNo?: string
  issueDate?: string
  taxRate?: number
  attachmentName?: string
}

export interface LoginInput {
  phone: string
  password: string
  verifyCode: string
}

export interface LoginResult {
  success: boolean
  error?: string
}

export interface RegisterInput {
  organizationName: string
  contactName: string
  phone: string
  password: string
  role: RoleKey
  verifyCode: string
}

export interface RegisterResult {
  success: boolean
  error?: string
}

export interface ResetPasswordInput {
  phone: string
  verifyCode: string
  newPassword: string
}

export interface ResetPasswordResult {
  success: boolean
  error?: string
}

export interface AppSeed {
  isAuthenticated: boolean
  currentUser?: AuthUser
  authUsers: AuthUser[]
  currentRole: RoleKey
  activeCustomerId: string
  activeCustomerName: string
  account: Account
  sites: Site[]
  vehicles: Vehicle[]
  personnel: Person[]
  gasPrices: GasPrice[]
  plans: Plan[]
  orders: Order[]
  ledgers: LedgerRecord[]
  deposits: DepositRecord[]
  notifications: NotificationItem[]
  reconciliations: ReconciliationStatement[]
  invoices: InvoiceItem[]
  upstreamArchives: UpstreamReconciliationArchive[]
  invoiceApplications: InvoiceApplication[]
  onboardingApplications: OnboardingApplication[]
  exceptions: ExceptionCase[]
  dailyPlanReports: DailyPlanReport[]
  dashboardMetrics: Record<RoleKey, DashboardMetric[]>
}

export interface AppState extends AppSeed {
  login: (input: LoginInput) => LoginResult
  registerAccount: (input: RegisterInput) => RegisterResult
  resetPassword: (input: ResetPasswordInput) => ResetPasswordResult
  logout: () => void
  switchRole: (role: RoleKey) => void
  addSite: (input: AddSiteInput) => string
  updateSite: (input: UpdateSiteInput) => void
  disableSite: (siteId: string) => void
  addVehicle: (input: AddVehicleInput) => string
  updateVehicle: (input: UpdateVehicleInput) => void
  disableVehicle: (vehicleId: string) => void
  addPerson: (input: AddPersonInput) => string
  updatePerson: (input: UpdatePersonInput) => void
  disablePerson: (personId: string) => void
  submitOrderSupplement: (input: SubmitOrderSupplementInput) => void
  reviewOrderSupplement: (input: ReviewOrderSupplementInput) => void
  generateDailyPlanReport: (input: GenerateDailyPlanReportInput) => string
  createPlan: (input: PlanInput) => CreatePlanResult
  reviewPlan: (input: ReviewPlanInput) => void
  cancelPlan: (planId: string, reason: string) => void
  confirmLoad: (input: LoadConfirmInput) => void
  confirmUnload: (input: UnloadConfirmInput) => void
  resolveDiffException: (orderId: string, settlementWeight: number, note: string) => void
  acceptOrder: (orderId: string, accepted: boolean, settlementWeight: number) => void
  registerDeposit: (input: DepositInput) => void
  reviewDeposit: (
    depositId: string,
    action: 'confirm' | 'reject',
    reviewer: string,
    reason?: string,
  ) => void
  applyStamp: (
    statementId: string,
    actorType: 'platform' | 'customer',
    actor: string,
  ) => void
  uploadUpstreamArchive: (input: UploadUpstreamArchiveInput) => string
  createInvoiceApplication: (
    input: CreateInvoiceApplicationInput,
  ) => CreateInvoiceApplicationResult
  reviewInvoiceApplication: (input: ReviewInvoiceApplicationInput) => void
  issueInvoice: (input: IssueInvoiceInput) => void
  reviewOnboarding: (input: ReviewOnboardingInput) => void
  uploadOnboardingContract: (input: UploadOnboardingContractInput) => void
  archiveOrder: (orderId: string, operator: string) => ArchiveActionResult
  unarchiveOrder: (orderId: string, operator: string) => ArchiveActionResult
  createException: (input: CreateExceptionInput) => string
  processException: (input: ProcessExceptionInput) => void
  markNotificationRead: (notificationId: string) => void
}

let sequence = 10

const now = () => new Date().toISOString()
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${sequence++}`
const nextNo = (prefix: string) => {
  const dateTag = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const seq = String(sequence++).padStart(3, '0')

  return `${prefix}-${dateTag}-${seq}`
}

const createNotification = (
  category: NotificationItem['category'],
  title: string,
  content: string,
): NotificationItem => ({
  id: nextId('msg'),
  category,
  title,
  content,
  createdAt: now(),
  read: false,
})

const createLedger = (
  type: LedgerRecord['type'],
  amount: number,
  relatedNo: string,
  note: string,
): LedgerRecord => ({
  id: nextId('ldg'),
  type,
  amount,
  relatedNo,
  note,
  createdAt: now(),
})

const ensureFixed = (value: number) => Number(value.toFixed(2))
const MOCK_VERIFY_CODE = '123456'

export const defaultMockData = (): AppSeed => ({
  isAuthenticated: false,
  currentUser: undefined,
  authUsers: [
    {
      id: 'auth-terminal-01',
      phone: '13800138000',
      password: '123456',
      contactName: '张三',
      organizationName: '华东能源科技有限公司',
      role: 'terminal',
      customerId: 'customer-a',
    },
    {
      id: 'auth-market-01',
      phone: '13800138001',
      password: '123456',
      contactName: '周婷',
      organizationName: '气源发展-市场部',
      role: 'market',
    },
    {
      id: 'auth-dispatch-01',
      phone: '13800138002',
      password: '123456',
      contactName: '刘工',
      organizationName: '气源发展-调度中心',
      role: 'dispatch',
    },
    {
      id: 'auth-finance-01',
      phone: '13800138003',
      password: '123456',
      contactName: '陈会计',
      organizationName: '气源发展-财务部',
      role: 'finance',
    },
    {
      id: 'auth-carrier-01',
      phone: '13800138004',
      password: '123456',
      contactName: '刘主管',
      organizationName: '华东承运物流有限公司',
      role: 'carrier',
    },
    {
      id: 'auth-driver-01',
      phone: '13800138005',
      password: '123456',
      contactName: '赵强',
      organizationName: '华东承运物流有限公司',
      role: 'driver',
    },
  ],
  currentRole: 'terminal',
  activeCustomerId: 'customer-a',
  activeCustomerName: '华东能源科技有限公司',
  account: {
    total: 520000,
    available: 160000,
    occupied: 40000,
    frozen: 320000,
  },
  sites: [
    {
      id: 'site-01',
      name: '苏州工业园卸气站',
      type: 'unload',
      status: 'enabled',
    },
    {
      id: 'site-02',
      name: '常州西港卸气站',
      type: 'unload',
      status: 'maintenance',
      maintenancePolicy: 'block',
      maintenanceWindow: '2026-02-08 ~ 2026-02-12',
    },
    {
      id: 'site-03',
      name: '无锡北站用气点',
      type: 'use',
      status: 'enabled',
    },
  ],
  vehicles: [
    {
      id: 'vehicle-01',
      plateNo: '苏A·LNG88',
      capacity: 35,
      valid: true,
      certExpiry: '2026-12-31',
    },
    {
      id: 'vehicle-02',
      plateNo: '苏B·LNG12',
      capacity: 25,
      valid: false,
      certExpiry: '2026-01-15',
    },
  ],
  personnel: [
    {
      id: 'person-01',
      name: '赵强',
      role: 'driver',
      valid: true,
      certExpiry: '2026-08-31',
    },
    {
      id: 'person-02',
      name: '王敏',
      role: 'escort',
      valid: true,
      certExpiry: '2026-09-30',
    },
    {
      id: 'person-03',
      name: '李凯',
      role: 'driver',
      valid: false,
      certExpiry: '2025-12-31',
    },
  ],
  gasPrices: [
    {
      id: 'price-public-1',
      sourceCompany: '中海气源公司',
      sourceSite: '宁波接收站',
      scope: 'public',
      price: 3950,
      validFrom: '2026-02-01',
      validTo: '2026-02-15',
      taxIncluded: true,
      note: '公共挂牌价',
    },
    {
      id: 'price-exclusive-a',
      sourceCompany: '中海气源公司',
      sourceSite: '宁波接收站',
      scope: 'exclusive',
      customerId: 'customer-a',
      price: 4200,
      validFrom: '2026-02-01',
      validTo: '2026-02-15',
      taxIncluded: true,
      note: '一户一价，覆盖公共价',
    },
    {
      id: 'price-public-2',
      sourceCompany: '华北气源公司',
      sourceSite: '天津港站',
      scope: 'public',
      price: 3880,
      validFrom: '2026-02-01',
      validTo: '2026-02-20',
      taxIncluded: false,
      note: '公共价，税外',
    },
  ],
  plans: [
    {
      id: 'plan-1001',
      number: 'PL-20260209-001',
      customerId: 'customer-a',
      customerName: '华东能源科技有限公司',
      siteId: 'site-01',
      siteName: '苏州工业园卸气站',
      priceId: 'price-exclusive-a',
      plannedVolume: 22,
      unitPrice: 4200,
      estimatedAmount: 92400,
      freightFee: 3200,
      totalAmount: 95600,
      transportMode: 'carrier',
      paymentMethod: 'prepaid',
      weighDiffRule: 'delta',
      agreementChecked: true,
      carrierId: 'carrier-01',
      vehicleId: 'vehicle-01',
      driverId: 'person-01',
      escortId: 'person-02',
      status: 'submitted',
      submittedAt: '2026-02-09T08:30:00.000Z',
    },
    {
      id: 'plan-1002',
      number: 'PL-20260209-002',
      customerId: 'customer-a',
      customerName: '华东能源科技有限公司',
      siteId: 'site-03',
      siteName: '无锡北站用气点',
      priceId: 'price-public-1',
      plannedVolume: 18,
      unitPrice: 3950,
      estimatedAmount: 71100,
      freightFee: 2000,
      totalAmount: 73100,
      transportMode: 'upstream',
      paymentMethod: 'postpaid',
      weighDiffRule: 'unload',
      agreementChecked: true,
      status: 'approved',
      submittedAt: '2026-02-08T08:30:00.000Z',
      reviewer: '市场部-周婷',
    },
  ],
  orders: [
    {
      id: 'order-2001',
      number: 'OD-20260209-001',
      planId: 'plan-1002',
      customerName: '华东能源科技有限公司',
      siteName: '无锡北站用气点',
      transportMode: 'upstream',
      weighDiffRule: 'unload',
      status: 'transporting',
      threshold: 0.5,
      loadWeight: 18,
      unloadWeight: 17.8,
      settlementWeight: 17.8,
      diffAbnormal: false,
    },
  ],
  ledgers: [
    {
      id: 'ldg-init-1',
      type: 'freeze',
      amount: 320000,
      relatedNo: 'OD-20260208-001',
      note: '历史订单冻结',
      createdAt: '2026-02-08T11:00:00.000Z',
    },
    {
      id: 'ldg-init-2',
      type: 'occupy',
      amount: 40000,
      relatedNo: 'PL-20260209-001',
      note: '计划提交占用',
      createdAt: '2026-02-09T08:30:00.000Z',
    },
  ],
  deposits: [
    {
      id: 'dep-1',
      customerName: '华东能源科技有限公司',
      amount: 50000,
      paidAt: '2026-02-09',
      receiptName: '回单-0209.pdf',
      status: 'pending',
    },
  ],
  notifications: [
    {
      id: 'msg-init-1',
      category: 'approval',
      title: '计划待审批',
      content: 'PL-20260209-001 已提交，请市场部处理。',
      createdAt: '2026-02-09T08:31:00.000Z',
      read: false,
    },
  ],
  reconciliations: [
    {
      id: 'rc-202602-001',
      number: 'RC-202602-001',
      customerName: '华东能源科技有限公司',
      period: '2026-02-01 ~ 2026-02-15',
      status: 'draft',
      totalAmount: 168700,
      orderNumbers: ['OD-20260209-001'],
      stampLogs: [],
    },
    {
      id: 'rc-202601-003',
      number: 'RC-202601-003',
      customerName: '华东能源科技有限公司',
      period: '2026-01-01 ~ 2026-01-31',
      status: 'double-confirmed',
      totalAmount: 120000,
      orderNumbers: ['OD-20260131-008'],
      stampLogs: [
        {
          actorType: 'platform',
          actor: '市场部-王经理',
          stampedAt: '2026-02-01T09:30:00.000Z',
        },
        {
          actorType: 'customer',
          actor: '终端用户-张三',
          stampedAt: '2026-02-01T10:10:00.000Z',
        },
      ],
    },
  ],
  invoices: [
    {
      id: 'inv-1',
      number: 'INV-20260208-001',
      customerName: '华东能源科技有限公司',
      amount: 120000,
      issueDate: '2026-02-08',
      statementNo: 'RC-202601-003',
      status: 'issued',
    },
    {
      id: 'inv-2',
      number: 'INV-20260209-002',
      customerName: '华东能源科技有限公司',
      amount: 48700,
      issueDate: '2026-02-09',
      statementNo: 'RC-202602-001',
      status: 'pending',
    },
  ],
  upstreamArchives: [
    {
      id: 'upa-001',
      upstreamCompany: '中海气源公司',
      period: '2026-01',
      fileName: 'upstream-reconciliation-202601.pdf',
      archivedBy: '市场部-周婷',
      archivedAt: '2026-02-02T10:40:00.000Z',
      note: '线下对账签字版',
      status: 'archived',
    },
  ],
  invoiceApplications: [
    {
      id: 'iap-001',
      number: 'IA-20260209-001',
      statementId: 'rc-202601-003',
      statementNo: 'RC-202601-003',
      customerName: '华东能源科技有限公司',
      orderNumbers: ['OD-20260131-008'],
      originalAmount: 120000,
      discountEnabled: false,
      discountAmount: 0,
      requestedAmount: 120000,
      invoiceTitle: '华东能源科技有限公司',
      taxNo: '91320000MA1234567X',
      applicant: '市场部-王经理',
      appliedAt: '2026-02-09T09:30:00.000Z',
      status: 'pending-review',
    },
  ],
  onboardingApplications: [
    {
      id: 'onb-001',
      organizationName: '江苏中海清洁能源有限公司',
      organizationType: 'terminal',
      contactName: '张经理',
      contactPhone: '13800138000',
      submittedAt: '2026-02-09T02:30:00.000Z',
      status: 'pending',
    },
    {
      id: 'onb-002',
      organizationName: '华东承运物流有限公司',
      organizationType: 'carrier',
      contactName: '刘主管',
      contactPhone: '13900139000',
      submittedAt: '2026-02-08T05:20:00.000Z',
      status: 'rejected',
      rejectReason: '运输资质附件不完整',
      reviewer: '市场部-周婷',
    },
  ],
  exceptions: [
    {
      id: 'ex-001',
      number: 'EX-20260209-001',
      type: 'delta-adjustment',
      targetNo: 'OD-20260209-001',
      reason: '装卸磅差超阈值，需多退少补',
      responsibilityParty: '承运商',
      amount: 3200,
      status: 'pending',
      createdAt: '2026-02-09T09:20:00.000Z',
    },
  ],
  dailyPlanReports: [
    {
      id: 'dpr-20260209',
      reportDate: '2026-02-09',
      generatedAt: '2026-02-09T21:30:00.000Z',
      generatedBy: '市场部-系统任务',
      plans: [
        {
          planId: 'plan-1001',
          number: 'PL-20260209-001',
          customerName: '华东能源科技有限公司',
          siteName: '苏州工业园卸气站',
          plannedVolume: 22,
          transportMode: 'carrier',
          status: 'submitted',
          submittedAt: '2026-02-09T08:30:00.000Z',
        },
      ],
    },
  ],
  dashboardMetrics: {
    terminal: [
      { id: 'tm-1', title: '账户可用余额', value: '¥160,000.00', trend: '+12%' },
      { id: 'tm-2', title: '待审批计划', value: '1 单' },
      { id: 'tm-3', title: '运输中订单', value: '1 单' },
    ],
    market: [
      { id: 'mk-1', title: '待审批计划', value: '1 单', trend: '+2' },
      { id: 'mk-2', title: '今日发布气价', value: '3 条' },
      { id: 'mk-3', title: '余额预警客户', value: '1 家' },
    ],
    dispatch: [
      { id: 'dp-1', title: '待装车', value: '0 单' },
      { id: 'dp-2', title: '运输中', value: '1 单' },
      { id: 'dp-3', title: '待验收', value: '0 单' },
    ],
    finance: [
      { id: 'fn-1', title: '待确认预存', value: '1 笔' },
      { id: 'fn-2', title: '冻结金额', value: '¥320,000.00' },
      { id: 'fn-3', title: '待开票', value: '1 单' },
    ],
    carrier: [
      { id: 'cr-1', title: '今日任务', value: '2 单' },
      { id: 'cr-2', title: '待装车', value: '1 单' },
      { id: 'cr-3', title: '待卸车', value: '1 单' },
    ],
    driver: [
      { id: 'dr-1', title: '待装车', value: '1 单' },
      { id: 'dr-2', title: '待卸车', value: '1 单' },
      { id: 'dr-3', title: '异常上报', value: '0 单' },
    ],
  },
})

const createState = (seed: AppSeed): StateCreator<AppState> =>
  (set, get) => ({
    ...seed,
    login: (input: LoginInput): LoginResult => {
      const state = get()
      const phone = input.phone.trim()

      if (!phone) {
        return { success: false, error: '请输入手机号' }
      }

      if (!input.password.trim()) {
        return { success: false, error: '请输入密码' }
      }

      if (input.verifyCode.trim() !== MOCK_VERIFY_CODE) {
        return { success: false, error: '验证码错误，请输入 123456（Mock）' }
      }

      const target = state.authUsers.find((item) => item.phone === phone)

      if (!target) {
        return { success: false, error: '账号不存在' }
      }

      if (target.password !== input.password) {
        return { success: false, error: '密码错误' }
      }

      set({
        isAuthenticated: true,
        currentUser: target,
        currentRole: target.role,
        activeCustomerId: target.customerId ?? state.activeCustomerId,
        activeCustomerName: target.organizationName,
      })

      return { success: true }
    },
    registerAccount: (input: RegisterInput): RegisterResult => {
      const state = get()
      const phone = input.phone.trim()

      if (!input.organizationName.trim()) {
        return { success: false, error: '请输入组织名称' }
      }

      if (!input.contactName.trim()) {
        return { success: false, error: '请输入联系人' }
      }

      if (!phone) {
        return { success: false, error: '请输入手机号' }
      }

      if (!input.password.trim()) {
        return { success: false, error: '请输入登录密码' }
      }

      if (input.verifyCode.trim() !== MOCK_VERIFY_CODE) {
        return { success: false, error: '验证码错误，请输入 123456（Mock）' }
      }

      if (state.authUsers.some((item) => item.phone === phone)) {
        return { success: false, error: '该手机号已注册' }
      }

      const authUser: AuthUser = {
        id: nextId('auth'),
        phone,
        password: input.password,
        contactName: input.contactName.trim(),
        organizationName: input.organizationName.trim(),
        role: input.role,
        customerId: input.role === 'terminal' ? nextId('customer') : undefined,
      }

      set({
        authUsers: [authUser, ...state.authUsers],
      })

      return { success: true }
    },
    resetPassword: (input: ResetPasswordInput): ResetPasswordResult => {
      const state = get()
      const phone = input.phone.trim()

      if (!phone) {
        return { success: false, error: '请输入手机号' }
      }

      if (input.verifyCode.trim() !== MOCK_VERIFY_CODE) {
        return { success: false, error: '验证码错误，请输入 123456（Mock）' }
      }

      if (!input.newPassword.trim()) {
        return { success: false, error: '请输入新密码' }
      }

      const target = state.authUsers.find((item) => item.phone === phone)

      if (!target) {
        return { success: false, error: '账号不存在' }
      }

      set({
        authUsers: state.authUsers.map((item) =>
          item.phone === phone
            ? {
                ...item,
                password: input.newPassword,
              }
            : item,
        ),
      })

      return { success: true }
    },
    logout: () => {
      set({
        isAuthenticated: false,
        currentUser: undefined,
      })
    },
    switchRole: (role: RoleKey) => {
      set({ currentRole: role })
    },
    addSite: (input: AddSiteInput): string => {
      const state = get()
      const siteId = nextId('site')
      const site: Site = {
        id: siteId,
        name: input.name.trim(),
        type: input.type,
        status: input.status ?? 'enabled',
        maintenancePolicy: input.maintenancePolicy,
        maintenanceWindow: input.maintenanceWindow?.trim() || undefined,
      }

      set({
        sites: [site, ...state.sites],
      })

      return siteId
    },
    updateSite: (input: UpdateSiteInput) => {
      const state = get()
      const target = state.sites.find((item) => item.id === input.siteId)

      if (!target) {
        return
      }

      const nextSites = state.sites.map((item) =>
        item.id === input.siteId
          ? {
              ...item,
              ...input.patch,
              name: input.patch.name?.trim() || item.name,
              maintenanceWindow:
                input.patch.maintenanceWindow === undefined
                  ? item.maintenanceWindow
                  : input.patch.maintenanceWindow.trim() || undefined,
            }
          : item,
      )

      set({ sites: nextSites })
    },
    disableSite: (siteId: string) => {
      const state = get()
      const target = state.sites.find((item) => item.id === siteId)

      if (!target) {
        return
      }

      const nextSites = state.sites.map((item) =>
        item.id === siteId
          ? {
              ...item,
              status: 'disabled' as const,
            }
          : item,
      )

      set({ sites: nextSites })
    },
    addVehicle: (input: AddVehicleInput): string => {
      const state = get()
      const vehicleId = nextId('vehicle')
      const vehicle: Vehicle = {
        id: vehicleId,
        plateNo: input.plateNo.trim(),
        capacity: input.capacity,
        certExpiry: input.certExpiry,
        valid: input.valid,
      }

      set({
        vehicles: [vehicle, ...state.vehicles],
      })

      return vehicleId
    },
    updateVehicle: (input: UpdateVehicleInput) => {
      const state = get()
      const target = state.vehicles.find((item) => item.id === input.vehicleId)

      if (!target) {
        return
      }

      const nextVehicles = state.vehicles.map((item) =>
        item.id === input.vehicleId
          ? {
              ...item,
              ...input.patch,
              plateNo: input.patch.plateNo?.trim() || item.plateNo,
            }
          : item,
      )

      set({ vehicles: nextVehicles })
    },
    disableVehicle: (vehicleId: string) => {
      const state = get()
      const target = state.vehicles.find((item) => item.id === vehicleId)

      if (!target) {
        return
      }

      const nextVehicles = state.vehicles.map((item) =>
        item.id === vehicleId
          ? {
              ...item,
              valid: false,
            }
          : item,
      )

      set({ vehicles: nextVehicles })
    },
    addPerson: (input: AddPersonInput): string => {
      const state = get()
      const personId = nextId('person')
      const person: Person = {
        id: personId,
        name: input.name.trim(),
        role: input.role,
        certExpiry: input.certExpiry,
        valid: input.valid,
      }

      set({
        personnel: [person, ...state.personnel],
      })

      return personId
    },
    updatePerson: (input: UpdatePersonInput) => {
      const state = get()
      const target = state.personnel.find((item) => item.id === input.personId)

      if (!target) {
        return
      }

      const nextPersonnel = state.personnel.map((item) =>
        item.id === input.personId
          ? {
              ...item,
              ...input.patch,
              name: input.patch.name?.trim() || item.name,
            }
          : item,
      )

      set({ personnel: nextPersonnel })
    },
    disablePerson: (personId: string) => {
      const state = get()
      const target = state.personnel.find((item) => item.id === personId)

      if (!target) {
        return
      }

      const nextPersonnel = state.personnel.map((item) =>
        item.id === personId
          ? {
              ...item,
              valid: false,
            }
          : item,
      )

      set({ personnel: nextPersonnel })
    },
    submitOrderSupplement: (input: SubmitOrderSupplementInput) => {
      const state = get()
      const target = state.orders.find((item) => item.id === input.orderId)

      if (!target) {
        return
      }

      const nextOrders = state.orders.map((item) =>
        item.id === input.orderId
          ? {
              ...item,
              upstreamOrderNo: input.upstreamOrderNo.trim(),
              loadSiteName: input.loadSiteName.trim(),
              estimatedLoadAt: input.estimatedLoadAt.trim(),
              supplementDocName: input.supplementDocName?.trim() || undefined,
              supplementStatus: 'pending' as const,
              supplementReviewer: undefined,
              supplementNote: undefined,
              status: 'pending-supplement' as const,
            }
          : item,
      )

      set({
        orders: nextOrders,
        notifications: [
          createNotification(
            'approval',
            '订单补录待审核',
            `${target.number} 已提交补录信息，待调度审核。`,
          ),
          ...state.notifications,
        ],
      })
    },
    reviewOrderSupplement: (input: ReviewOrderSupplementInput) => {
      const state = get()
      const target = state.orders.find((item) => item.id === input.orderId)

      if (!target || target.supplementStatus !== 'pending') {
        return
      }

      const approved = input.action === 'approve'
      const nextOrders = state.orders.map((item) =>
        item.id === input.orderId
          ? {
              ...item,
              supplementStatus: approved ? ('approved' as const) : ('rejected' as const),
              supplementReviewer: input.reviewer,
              supplementNote: input.reason,
              status: approved ? ('stocking' as const) : ('pending-supplement' as const),
            }
          : item,
      )

      set({
        orders: nextOrders,
        notifications: [
          createNotification(
            'approval',
            approved ? '订单补录已通过' : '订单补录已驳回',
            `${target.number} 补录审核结果：${approved ? '通过，进入备货' : '驳回，待修改后重提'}`,
          ),
          ...state.notifications,
        ],
      })
    },
    generateDailyPlanReport: (input: GenerateDailyPlanReportInput): string => {
      const state = get()
      const plans = state.plans
        .filter((item) => item.submittedAt.slice(0, 10) === input.reportDate)
        .map((item) => ({
          planId: item.id,
          number: item.number,
          customerName: item.customerName,
          siteName: item.siteName,
          plannedVolume: item.plannedVolume,
          transportMode: item.transportMode,
          status: item.status,
          submittedAt: item.submittedAt,
        }))

      const reportId = nextId('dpr')
      const report: DailyPlanReport = {
        id: reportId,
        reportDate: input.reportDate,
        generatedAt: now(),
        generatedBy: input.generatedBy,
        plans,
      }

      set({
        dailyPlanReports: [report, ...state.dailyPlanReports],
      })

      return reportId
    },
    createPlan: (input: PlanInput): CreatePlanResult => {
      const state = get()
      const errors: string[] = []
      const site = state.sites.find((item) => item.id === input.siteId)
      const gasPrice = state.gasPrices.find((item) => item.id === input.priceId)

      if (!site) {
        errors.push('请选择有效站点')
      }

      if (site?.status === 'maintenance' && site.maintenancePolicy === 'block') {
        errors.push(
          `站点 [${site.name}] 当前处于维护中（${site.maintenanceWindow ?? '维护中'}）`,
        )
      }

      if (site?.status === 'disabled') {
        errors.push(`站点 [${site.name}] 已停用`)
      }

      if (!gasPrice) {
        errors.push('请选择有效气价')
      }

      if (input.plannedVolume <= 0) {
        errors.push('计划量必须大于 0')
      }

      if (!input.agreementChecked) {
        errors.push('请先勾选费用确认条款')
      }

      if (input.transportMode !== 'upstream') {
        const vehicle = state.vehicles.find((item) => item.id === input.vehicleId)
        const driver = state.personnel.find((item) => item.id === input.driverId)
        const escort = state.personnel.find((item) => item.id === input.escortId)

        if (!input.vehicleId || !vehicle) {
          errors.push('自提/承运模式必须选择车辆')
        } else if (!vehicle.valid) {
          errors.push(`车辆 [${vehicle.plateNo}] 运输资质已过期（${vehicle.certExpiry}）`)
        }

        if (!input.driverId || !driver) {
          errors.push('请选择司机')
        } else if (!driver.valid) {
          errors.push(`司机 [${driver.name}] 资质已过期（${driver.certExpiry}）`)
        }

        if (!input.escortId || !escort) {
          errors.push('请选择押运员')
        } else if (!escort.valid) {
          errors.push(`押运员 [${escort.name}] 资质已过期（${escort.certExpiry}）`)
        }
      }

      const unitPrice = gasPrice?.price ?? 0
      const estimatedAmount = ensureFixed(unitPrice * input.plannedVolume)
      const totalAmount = ensureFixed(estimatedAmount + input.freightFee)

      if (state.account.available < totalAmount) {
        errors.push(
          `可用余额不足：需要 ¥${totalAmount.toLocaleString()}, 当前可用 ¥${state.account.available.toLocaleString()}`,
        )
      }

      if (errors.length > 0 || !site || !gasPrice) {
        return {
          success: false,
          errors,
        }
      }

      const planId = nextId('plan')
      const planNo = nextNo('PL')
      const newPlan: Plan = {
        id: planId,
        number: planNo,
        customerId: state.activeCustomerId,
        customerName: state.activeCustomerName,
        siteId: site.id,
        siteName: site.name,
        priceId: gasPrice.id,
        plannedVolume: input.plannedVolume,
        unitPrice,
        estimatedAmount,
        freightFee: input.freightFee,
        totalAmount,
        transportMode: input.transportMode,
        paymentMethod: input.paymentMethod,
        weighDiffRule: input.weighDiffRule,
        agreementChecked: input.agreementChecked,
        carrierId: input.carrierId,
        vehicleId: input.vehicleId,
        driverId: input.driverId,
        escortId: input.escortId,
        status: 'submitted',
        submittedAt: now(),
      }

      const nextAccount: Account = {
        ...state.account,
        available: ensureFixed(state.account.available - totalAmount),
        occupied: ensureFixed(state.account.occupied + totalAmount),
      }

      set({
        plans: [newPlan, ...state.plans],
        account: nextAccount,
        ledgers: [
          createLedger('occupy', totalAmount, newPlan.number, '计划提交占用资金'),
          ...state.ledgers,
        ],
        notifications: [
          createNotification(
            'approval',
            '新计划待审批',
            `${newPlan.number} 已提交，待市场部审批。`,
          ),
          ...state.notifications,
        ],
      })

      return {
        success: true,
        errors: [],
        planId,
      }
    },
    reviewPlan: (input: ReviewPlanInput) => {
      const state = get()
      const plan = state.plans.find((item) => item.id === input.planId)

      if (!plan || !['submitted', 'returned'].includes(plan.status)) {
        return
      }

      if (input.action === 'reject') {
        const nextPlans = state.plans.map((item) =>
          item.id === input.planId
            ? {
                ...item,
                status: 'returned' as const,
                reviewer: input.reviewer,
                rejectReason: input.reason ?? '信息需补充',
              }
            : item,
        )

        set({
          plans: nextPlans,
          account: {
            ...state.account,
            available: ensureFixed(state.account.available + plan.totalAmount),
            occupied: ensureFixed(state.account.occupied - plan.totalAmount),
          },
          ledgers: [
            createLedger('release', plan.totalAmount, plan.number, '计划退回释放占用资金'),
            ...state.ledgers,
          ],
          notifications: [
            createNotification(
              'approval',
              '计划已退回',
              `${plan.number} 已退回，原因：${input.reason ?? '信息需补充'}`,
            ),
            ...state.notifications,
          ],
        })

        return
      }

      const approvedPlan: Plan = {
        ...plan,
        status: 'approved',
        reviewer: input.reviewer,
        rejectReason: undefined,
      }

      const nextPlans = state.plans.map((item) =>
        item.id === approvedPlan.id ? approvedPlan : item,
      )

      const orderNo = nextNo('OD')
      const newOrder: Order = {
        id: nextId('order'),
        number: orderNo,
        planId: approvedPlan.id,
        customerName: approvedPlan.customerName,
        siteName: approvedPlan.siteName,
        transportMode: approvedPlan.transportMode,
        weighDiffRule: approvedPlan.weighDiffRule,
        status: 'ordered',
        threshold: 0.5,
        settlementWeight: approvedPlan.plannedVolume,
        diffAbnormal: false,
      }

      set({
        plans: nextPlans,
        orders: [newOrder, ...state.orders],
        account: {
          ...state.account,
          occupied: ensureFixed(state.account.occupied - approvedPlan.totalAmount),
          frozen: ensureFixed(state.account.frozen + approvedPlan.totalAmount),
        },
        ledgers: [
          createLedger('freeze', approvedPlan.totalAmount, newOrder.number, '审批通过转冻结'),
          ...state.ledgers,
        ],
        notifications: [
          createNotification(
            'approval',
            '计划已审批通过',
            `${approvedPlan.number} 已通过审批并生成订单 ${newOrder.number}`,
          ),
          ...state.notifications,
        ],
      })
    },
    cancelPlan: (planId: string, reason: string) => {
      const state = get()
      const plan = state.plans.find((item) => item.id === planId)

      if (!plan || ['approved', 'cancelled'].includes(plan.status)) {
        return
      }

      const canRelease = ['submitted', 'returned'].includes(plan.status)
      const nextPlans = state.plans.map((item) =>
        item.id === planId
          ? {
              ...item,
              status: 'cancelled' as const,
              rejectReason: reason,
            }
          : item,
      )

      const accountDelta = canRelease
        ? {
            available: ensureFixed(state.account.available + plan.totalAmount),
            occupied: ensureFixed(state.account.occupied - plan.totalAmount),
          }
        : {
            available: state.account.available,
            occupied: state.account.occupied,
          }

      set({
        plans: nextPlans,
        account: {
          ...state.account,
          ...accountDelta,
        },
        ledgers: canRelease
          ? [
              createLedger('release', plan.totalAmount, plan.number, '计划取消释放占用'),
              ...state.ledgers,
            ]
          : state.ledgers,
      })
    },
    confirmLoad: (input: LoadConfirmInput) => {
      const state = get()
      const nextOrders = state.orders.map((item) =>
        item.id === input.orderId
          ? {
              ...item,
              loadWeight: input.weight,
              status: 'loaded' as const,
            }
          : item,
      )

      set({ orders: nextOrders })
    },
    confirmUnload: (input: UnloadConfirmInput) => {
      const state = get()
      let isAbnormal = false
      let orderNo = ''

      const nextOrders = state.orders.map((item) => {
        if (item.id !== input.orderId) {
          return item
        }

        const loadWeight = item.loadWeight ?? input.weight
        const diff = Math.abs(loadWeight - input.weight)
        isAbnormal = diff > item.threshold
        orderNo = item.number

        return {
          ...item,
          unloadWeight: input.weight,
          diffAbnormal: isAbnormal,
          status: isAbnormal ? ('settling' as const) : ('pending-acceptance' as const),
          settlementWeight:
            item.weighDiffRule === 'load'
              ? loadWeight
              : item.weighDiffRule === 'unload'
                ? input.weight
                : ensureFixed((loadWeight + input.weight) / 2),
        }
      })

      set({
        orders: nextOrders,
        notifications: isAbnormal
          ? [
              createNotification(
                'fulfillment',
                '磅差异常提醒',
                `${orderNo} 检测到磅差异常，请调度处理结算量。`,
              ),
              ...state.notifications,
            ]
          : state.notifications,
      })
    },
    resolveDiffException: (orderId: string, settlementWeight: number, note: string) => {
      const state = get()
      const nextOrders = state.orders.map((item) =>
        item.id === orderId
          ? {
              ...item,
              settlementWeight,
              exceptionNote: note,
              diffAbnormal: false,
              status: 'pending-acceptance' as const,
            }
          : item,
      )

      set({ orders: nextOrders })
    },
    acceptOrder: (orderId: string, accepted: boolean, settlementWeight: number) => {
      const state = get()
      const targetOrder = state.orders.find((item) => item.id === orderId)

      if (!targetOrder) {
        return
      }

      const nextStatus: OrderStatus = accepted ? 'accepted' : 'settling'
      const nextOrders = state.orders.map((item) =>
        item.id === orderId
          ? {
              ...item,
              status: nextStatus,
              settlementWeight,
            }
          : item,
      )

      set({
        orders: nextOrders,
        notifications: [
          createNotification(
            'fulfillment',
            accepted ? '订单已验收' : '验收未通过',
            `${targetOrder.number} ${accepted ? '已完成验收' : '验收不通过，待处理'}`,
          ),
          ...state.notifications,
        ],
      })
    },
    registerDeposit: (input: DepositInput) => {
      const state = get()
      const deposit: DepositRecord = {
        id: nextId('dep'),
        customerName: input.customerName,
        amount: input.amount,
        paidAt: input.paidAt,
        receiptName: input.receiptName,
        status: 'pending',
      }

      set({
        deposits: [deposit, ...state.deposits],
        notifications: [
          createNotification('finance', '收到预存登记', `${deposit.customerName} 提交了预存登记`),
          ...state.notifications,
        ],
      })
    },
    reviewDeposit: (
      depositId: string,
      action: 'confirm' | 'reject',
      reviewer: string,
      reason?: string,
    ) => {
      const state = get()
      const target = state.deposits.find((item) => item.id === depositId)

      if (!target || target.status !== 'pending') {
        return
      }

      const nextDeposits = state.deposits.map((item) => {
        if (item.id !== depositId) {
          return item
        }

        return {
          ...item,
          status: action === 'confirm' ? ('confirmed' as const) : ('rejected' as const),
          reviewer,
          rejectReason: action === 'reject' ? reason : undefined,
        }
      })

      if (action === 'confirm') {
        set({
          deposits: nextDeposits,
          account: {
            total: ensureFixed(state.account.total + target.amount),
            available: ensureFixed(state.account.available + target.amount),
            occupied: state.account.occupied,
            frozen: state.account.frozen,
          },
          ledgers: [
            createLedger('deposit', target.amount, target.id, '财务确认预存到账'),
            ...state.ledgers,
          ],
        })

        return
      }

      set({ deposits: nextDeposits })
    },
    applyStamp: (
      statementId: string,
      actorType: 'platform' | 'customer',
      actor: string,
    ) => {
      const state = get()
      const target = state.reconciliations.find((item) => item.id === statementId)

      if (!target) {
        return
      }

      if (actorType === 'platform' && target.status !== 'draft') {
        return
      }

      if (actorType === 'customer' && target.status !== 'platform-stamped') {
        return
      }

      const nextStatements = state.reconciliations.map((item) => {
        if (item.id !== statementId) {
          return item
        }

        const nextStatus =
          actorType === 'platform' ? ('platform-stamped' as const) : ('double-confirmed' as const)

        return {
          ...item,
          status: nextStatus,
          stampLogs: [
            ...item.stampLogs,
            {
              actorType,
              actor,
              stampedAt: now(),
            },
          ],
        }
      })

      set({
        reconciliations: nextStatements,
        notifications: [
          createNotification(
            'system',
            actorType === 'platform' ? '确认单已加盖公章' : '确认单双方签章完成',
            `${target.number} 当前状态：${
              actorType === 'platform' ? '待客户签章' : '双方已确认'
            }`,
          ),
          ...state.notifications,
        ],
      })
    },
    uploadUpstreamArchive: (input: UploadUpstreamArchiveInput): string => {
      const state = get()
      const archiveId = nextId('upa')
      const record: UpstreamReconciliationArchive = {
        id: archiveId,
        upstreamCompany: input.upstreamCompany,
        period: input.period,
        fileName: input.fileName,
        archivedBy: input.archivedBy,
        archivedAt: now(),
        note: input.note,
        status: 'archived',
      }

      set({
        upstreamArchives: [record, ...state.upstreamArchives],
        notifications: [
          createNotification(
            'system',
            '上游对账已存档',
            `${record.upstreamCompany} ${record.period} 对账文件已归档。`,
          ),
          ...state.notifications,
        ],
      })

      return archiveId
    },
    createInvoiceApplication: (
      input: CreateInvoiceApplicationInput,
    ): CreateInvoiceApplicationResult => {
      const state = get()
      const errors: string[] = []
      const statement = state.reconciliations.find((item) => item.id === input.statementId)

      if (!statement) {
        errors.push('请选择有效的对账单')
      }

      if (
        statement &&
        !['double-confirmed', 'offline-confirmed'].includes(statement.status)
      ) {
        errors.push('仅双方已确认或线下已确认的对账单可申请开票')
      }

      if (!input.invoiceTitle.trim()) {
        errors.push('开票抬头不能为空')
      }

      if (!input.taxNo.trim()) {
        errors.push('税号不能为空')
      }

      if (input.discountEnabled && input.discountAmount <= 0) {
        errors.push('启用优惠时，优惠金额必须大于 0')
      }

      if (
        statement &&
        input.discountEnabled &&
        input.discountAmount > statement.totalAmount
      ) {
        errors.push('优惠金额不能超过对账金额')
      }

      if (!input.applicant.trim()) {
        errors.push('申请人不能为空')
      }

      if (errors.length > 0 || !statement) {
        return {
          success: false,
          errors,
        }
      }

      const appliedAmount = ensureFixed(
        statement.totalAmount - (input.discountEnabled ? input.discountAmount : 0),
      )
      const applicationId = nextId('iap')
      const application: InvoiceApplication = {
        id: applicationId,
        number: nextNo('IA'),
        statementId: statement.id,
        statementNo: statement.number,
        customerName: statement.customerName,
        orderNumbers: statement.orderNumbers,
        originalAmount: statement.totalAmount,
        discountEnabled: input.discountEnabled,
        discountAmount: input.discountEnabled ? input.discountAmount : 0,
        requestedAmount: appliedAmount,
        invoiceTitle: input.invoiceTitle,
        taxNo: input.taxNo,
        applicant: input.applicant,
        appliedAt: now(),
        status: 'pending-review',
        note: input.note,
      }

      set({
        invoiceApplications: [application, ...state.invoiceApplications],
        notifications: [
          createNotification(
            'finance',
            '新增开票申请待审核',
            `${application.number} 已提交，待财务审核。`,
          ),
          ...state.notifications,
        ],
      })

      return {
        success: true,
        errors: [],
        applicationId,
      }
    },
    reviewInvoiceApplication: (input: ReviewInvoiceApplicationInput) => {
      const state = get()
      const target = state.invoiceApplications.find((item) => item.id === input.applicationId)

      if (!target || target.status !== 'pending-review') {
        return
      }

      if (input.action === 'reject') {
        const nextApplications = state.invoiceApplications.map((item) =>
          item.id === input.applicationId
            ? {
                ...item,
                status: 'rejected' as const,
                reviewer: input.reviewer,
                reviewedAt: now(),
                rejectReason: input.reason ?? '申请信息不完整',
              }
            : item,
        )

        set({
          invoiceApplications: nextApplications,
          notifications: [
            createNotification(
              'finance',
              '开票申请已驳回',
              `${target.number} 已驳回，原因：${input.reason ?? '申请信息不完整'}`,
            ),
            ...state.notifications,
          ],
        })

        return
      }

      const pendingInvoiceId = nextId('inv')
      const pendingInvoice: InvoiceItem = {
        id: pendingInvoiceId,
        number: nextNo('INV'),
        customerName: target.customerName,
        amount: target.requestedAmount,
        issueDate: new Date().toISOString().slice(0, 10),
        statementNo: target.statementNo,
        status: 'pending',
        applicationId: target.id,
      }

      const nextApplications = state.invoiceApplications.map((item) =>
        item.id === input.applicationId
          ? {
              ...item,
              status: 'approved' as const,
              reviewer: input.reviewer,
              reviewedAt: now(),
              rejectReason: undefined,
              invoiceId: pendingInvoice.id,
            }
          : item,
      )

      set({
        invoiceApplications: nextApplications,
        invoices: [pendingInvoice, ...state.invoices],
        notifications: [
          createNotification(
            'finance',
            '开票申请已通过',
            `${target.number} 已通过审核，生成待开票任务 ${pendingInvoice.number}。`,
          ),
          ...state.notifications,
        ],
      })
    },
    issueInvoice: (input: IssueInvoiceInput) => {
      const state = get()
      const target = state.invoices.find((item) => item.id === input.invoiceId)

      if (!target || target.status === 'issued') {
        return
      }

      const nextInvoices = state.invoices.map((item) =>
        item.id === input.invoiceId
          ? {
              ...item,
              number: input.invoiceNo?.trim() ? input.invoiceNo.trim() : item.number,
              status: 'issued' as const,
              issueDate: input.issueDate ?? new Date().toISOString().slice(0, 10),
              taxRate: input.taxRate,
              attachmentName: input.attachmentName,
              issuedBy: input.issuer,
            }
          : item,
      )

      const nextApplications = target.applicationId
        ? state.invoiceApplications.map((item) =>
            item.id === target.applicationId
              ? {
                  ...item,
                  status: 'invoiced' as const,
                }
              : item,
          )
        : state.invoiceApplications

      set({
        invoices: nextInvoices,
        invoiceApplications: nextApplications,
        notifications: [
          createNotification(
            'finance',
            '发票已开具',
            `${target.number} 已由 ${input.issuer} 完成开票并归档。`,
          ),
          ...state.notifications,
        ],
      })
    },
    reviewOnboarding: (input: ReviewOnboardingInput) => {
      const state = get()
      const target = state.onboardingApplications.find(
        (item) => item.id === input.applicationId,
      )

      if (!target || target.status === 'activated') {
        return
      }

      const nextStatus: OnboardingApplication['status'] =
        input.action === 'approve' ? 'approved' : 'rejected'
      const nextApplications = state.onboardingApplications.map((item) =>
        item.id === input.applicationId
          ? {
              ...item,
              status: nextStatus,
              reviewer: input.reviewer,
              rejectReason: input.action === 'reject' ? input.reason ?? '资料不完整' : undefined,
              level: input.action === 'approve' ? input.level : item.level,
            }
          : item,
      )

      set({
        onboardingApplications: nextApplications,
        notifications: [
          createNotification(
            'approval',
            input.action === 'approve' ? '入驻审核通过' : '入驻审核驳回',
            `${target.organizationName} ${
              input.action === 'approve' ? '已审核通过，待上传合同' : '审核未通过'
            }`,
          ),
          ...state.notifications,
        ],
      })
    },
    uploadOnboardingContract: (input: UploadOnboardingContractInput) => {
      const state = get()
      const target = state.onboardingApplications.find(
        (item) => item.id === input.applicationId,
      )

      if (!target || target.status !== 'approved') {
        return
      }

      const nextApplications = state.onboardingApplications.map((item) =>
        item.id === input.applicationId
          ? {
              ...item,
              contractName: input.contractName,
              contractEffectiveDate: input.effectiveDate,
              status: 'activated' as const,
            }
          : item,
      )

      set({
        onboardingApplications: nextApplications,
        notifications: [
          createNotification(
            'system',
            '服务合同已上传',
            `${target.organizationName} 已激活，可进入业务流程。`,
          ),
          ...state.notifications,
        ],
      })
    },
    archiveOrder: (orderId: string, operator: string): ArchiveActionResult => {
      const state = get()
      const target = state.orders.find((item) => item.id === orderId)

      if (!target) {
        return {
          success: false,
          error: '订单不存在',
        }
      }

      if (!['accepted', 'settled'].includes(target.status)) {
        return {
          success: false,
          error: '仅已验收/已结算订单可归档',
        }
      }

      const nextOrders = state.orders.map((item) =>
        item.id === orderId
          ? {
              ...item,
              status: 'archived' as const,
            }
          : item,
      )

      set({
        orders: nextOrders,
        notifications: [
          createNotification(
            'system',
            '订单已归档',
            `${target.number} 已由 ${operator} 归档，核心字段转为只读。`,
          ),
          ...state.notifications,
        ],
      })

      return { success: true }
    },
    unarchiveOrder: (orderId: string, operator: string): ArchiveActionResult => {
      const state = get()
      const target = state.orders.find((item) => item.id === orderId)

      if (!target) {
        return {
          success: false,
          error: '订单不存在',
        }
      }

      if (target.status !== 'archived') {
        return {
          success: false,
          error: '仅已归档订单支持取消归档',
        }
      }

      const nextOrders = state.orders.map((item) =>
        item.id === orderId
          ? {
              ...item,
              status: 'settled' as const,
            }
          : item,
      )

      set({
        orders: nextOrders,
        notifications: [
          createNotification(
            'system',
            '订单取消归档',
            `${target.number} 已由 ${operator} 取消归档。`,
          ),
          ...state.notifications,
        ],
      })

      return { success: true }
    },
    createException: (input: CreateExceptionInput): string => {
      const state = get()
      const exceptionId = nextId('exception')
      const exceptionNo = nextNo('EX')
      const exception: ExceptionCase = {
        id: exceptionId,
        number: exceptionNo,
        type: input.type,
        targetNo: input.targetNo,
        reason: input.reason,
        responsibilityParty: input.responsibilityParty,
        amount: input.amount,
        status: 'pending',
        createdAt: now(),
      }

      set({
        exceptions: [exception, ...state.exceptions],
        notifications: [
          createNotification(
            'system',
            '新增异常单待处理',
            `${exception.number} 已创建，目标单据 ${exception.targetNo}`,
          ),
          ...state.notifications,
        ],
      })

      return exceptionId
    },
    processException: (input: ProcessExceptionInput) => {
      const state = get()
      const target = state.exceptions.find((item) => item.id === input.exceptionId)

      if (!target || target.status !== 'pending') {
        return
      }

      const nextStatus: ExceptionCase['status'] =
        input.action === 'approve' ? 'approved' : 'rejected'
      const nextExceptions = state.exceptions.map((item) =>
        item.id === input.exceptionId
          ? {
              ...item,
              status: nextStatus,
              reviewer: input.reviewer,
              reviewedAt: now(),
              note: input.note,
            }
          : item,
      )

      let nextPlans = state.plans
      let nextOrders = state.orders

      if (input.action === 'approve') {
        if (target.type === 'plan-terminate') {
          nextPlans = state.plans.map((item) =>
            item.number === target.targetNo
              ? { ...item, status: 'cancelled' as const, rejectReason: input.note ?? target.reason }
              : item,
          )
        }

        if (target.type === 'plan-change') {
          nextPlans = state.plans.map((item) =>
            item.number === target.targetNo
              ? { ...item, status: 'changed' as const, rejectReason: input.note }
              : item,
          )
        }

        if (target.type === 'order-terminate') {
          nextOrders = state.orders.map((item) =>
            item.number === target.targetNo
              ? { ...item, status: 'settling' as const, exceptionNote: input.note ?? target.reason }
              : item,
          )
        }

        if (['order-change', 'delta-adjustment'].includes(target.type)) {
          nextOrders = state.orders.map((item) =>
            item.number === target.targetNo
              ? { ...item, exceptionNote: input.note ?? target.reason, status: 'settling' as const }
              : item,
          )
        }
      }

      set({
        exceptions: nextExceptions,
        plans: nextPlans,
        orders: nextOrders,
        notifications: [
          createNotification(
            'system',
            input.action === 'approve' ? '异常单已审批通过' : '异常单已驳回',
            `${target.number} 已由 ${input.reviewer} 处理。`,
          ),
          ...state.notifications,
        ],
      })
    },
    markNotificationRead: (notificationId: string) => {
      const state = get()
      const nextNotifications = state.notifications.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              read: true,
            }
          : item,
      )

      set({ notifications: nextNotifications })
    },
  })

export const createAppStore = (seed = defaultMockData()) => createStore<AppState>(createState(seed))

export const appStore = createAppStore()

export const useAppStore = <T,>(selector: (state: AppState) => T): T =>
  useStore(appStore, selector)
