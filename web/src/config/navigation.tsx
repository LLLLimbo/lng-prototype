import {
  AlertOutlined,
  AuditOutlined,
  BarChartOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  LineChartOutlined,
  MobileOutlined,
  ScheduleOutlined,
  TruckOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { RoleKey } from '../store/useAppStore'

export interface AppMenuItem {
  key: string
  label: string
  path: string
  icon: ReactNode
  roles: RoleKey[]
}

export const appMenus: AppMenuItem[] = [
  {
    key: 'dashboard',
    label: '工作台',
    path: '/app/dashboard',
    icon: <DashboardOutlined />,
    roles: ['terminal', 'market', 'dispatch', 'finance', 'carrier', 'driver'],
  },
  {
    key: 'gas-price',
    label: '气价查看',
    path: '/app/gas-price',
    icon: <BarChartOutlined />,
    roles: ['terminal', 'market'],
  },
  {
    key: 'plan-create',
    label: '新建计划',
    path: '/app/plans/new',
    icon: <ScheduleOutlined />,
    roles: ['terminal'],
  },
  {
    key: 'plan-list',
    label: '我的计划',
    path: '/app/plans/list',
    icon: <FileTextOutlined />,
    roles: ['terminal'],
  },
  {
    key: 'plan-approval',
    label: '计划审批',
    path: '/app/plans/approval',
    icon: <CheckCircleOutlined />,
    roles: ['market'],
  },
  {
    key: 'onboarding',
    label: '入驻审核',
    path: '/app/onboarding',
    icon: <AuditOutlined />,
    roles: ['market'],
  },
  {
    key: 'fulfillment',
    label: '履约看板',
    path: '/app/orders/fulfillment',
    icon: <TruckOutlined />,
    roles: ['dispatch', 'carrier', 'driver'],
  },
  {
    key: 'finance',
    label: '资金管理',
    path: '/app/finance',
    icon: <CreditCardOutlined />,
    roles: ['terminal', 'finance'],
  },
  {
    key: 'reconciliation',
    label: '对账签章',
    path: '/app/reconciliation',
    icon: <FileSearchOutlined />,
    roles: ['terminal', 'market', 'finance'],
  },
  {
    key: 'invoice',
    label: '发票中心',
    path: '/app/invoices',
    icon: <WalletOutlined />,
    roles: ['terminal', 'market', 'finance'],
  },
  {
    key: 'mobile',
    label: '移动任务模拟',
    path: '/app/mobile',
    icon: <MobileOutlined />,
    roles: ['dispatch', 'carrier', 'driver'],
  },
  {
    key: 'reports',
    label: '报表分析',
    path: '/app/reports',
    icon: <LineChartOutlined />,
    roles: ['market', 'dispatch', 'finance'],
  },
  {
    key: 'settlement',
    label: '结算看板',
    path: '/app/settlement',
    icon: <CalculatorOutlined />,
    roles: ['finance'],
  },
  {
    key: 'archive',
    label: '归档管理',
    path: '/app/archive',
    icon: <FolderOpenOutlined />,
    roles: ['market', 'dispatch', 'finance'],
  },
  {
    key: 'exceptions',
    label: '异常处理',
    path: '/app/exceptions',
    icon: <AlertOutlined />,
    roles: ['terminal', 'market', 'dispatch', 'finance'],
  },
]

export const roleLabelMap: Record<RoleKey, string> = {
  terminal: '终端用户',
  market: '市场部',
  dispatch: '调度中心',
  finance: '财务部',
  carrier: '承运商管理员',
  driver: '司机/押运员',
}

export const rolePathFallback: Record<RoleKey, string> = {
  terminal: '/app/dashboard',
  market: '/app/plans/approval',
  dispatch: '/app/orders/fulfillment',
  finance: '/app/reports',
  carrier: '/app/orders/fulfillment',
  driver: '/app/mobile',
}
