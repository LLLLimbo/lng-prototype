import { Button, Empty } from 'antd'
import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { appMenus, rolePathFallback } from './config/navigation'
import AdminLayout from './layouts/AdminLayout'
import DashboardPage from './pages/DashboardPage'
import ExceptionCenterPage from './pages/ExceptionCenterPage'
import FinancePage from './pages/FinancePage'
import FulfillmentPage from './pages/FulfillmentPage'
import GasPricePage from './pages/GasPricePage'
import InvoicePage from './pages/InvoicePage'
import MobileTaskPage from './pages/MobileTaskPage'
import NotFoundPage from './pages/NotFoundPage'
import OnboardingPage from './pages/OnboardingPage'
import PlanApprovalPage from './pages/PlanApprovalPage'
import PlanCreatePage from './pages/PlanCreatePage'
import PlanListPage from './pages/PlanListPage'
import ReconciliationPage from './pages/ReconciliationPage'
import ReportsPage from './pages/ReportsPage'
import SettlementPage from './pages/SettlementPage'
import ArchivePage from './pages/ArchivePage'
import { useAppStore } from './store/useAppStore'

interface GuardProps {
  children: ReactElement
}

function PermissionGuard({ children }: GuardProps) {
  const role = useAppStore((state) => state.currentRole)
  const location = useLocation()
  const navigate = useNavigate()
  const matched = appMenus.find((item) => location.pathname.startsWith(item.path))

  if (!matched || matched.roles.includes(role)) {
    return children
  }

  return (
    <Empty
      description="您没有权限访问此页面"
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      <Button type="primary" onClick={() => navigate(rolePathFallback[role])}>
        返回工作台
      </Button>
    </Empty>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app" element={<AdminLayout />}>
          <Route
            path="dashboard"
            element={
              <PermissionGuard>
                <DashboardPage />
              </PermissionGuard>
            }
          />
          <Route
            path="gas-price"
            element={
              <PermissionGuard>
                <GasPricePage />
              </PermissionGuard>
            }
          />
          <Route
            path="plans/new"
            element={
              <PermissionGuard>
                <PlanCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="plans/list"
            element={
              <PermissionGuard>
                <PlanListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="plans/approval"
            element={
              <PermissionGuard>
                <PlanApprovalPage />
              </PermissionGuard>
            }
          />
          <Route
            path="onboarding"
            element={
              <PermissionGuard>
                <OnboardingPage />
              </PermissionGuard>
            }
          />
          <Route
            path="orders/fulfillment"
            element={
              <PermissionGuard>
                <FulfillmentPage />
              </PermissionGuard>
            }
          />
          <Route
            path="finance"
            element={
              <PermissionGuard>
                <FinancePage />
              </PermissionGuard>
            }
          />
          <Route
            path="reconciliation"
            element={
              <PermissionGuard>
                <ReconciliationPage />
              </PermissionGuard>
            }
          />
          <Route
            path="invoices"
            element={
              <PermissionGuard>
                <InvoicePage />
              </PermissionGuard>
            }
          />
          <Route
            path="mobile"
            element={
              <PermissionGuard>
                <MobileTaskPage />
              </PermissionGuard>
            }
          />
          <Route
            path="settlement"
            element={
              <PermissionGuard>
                <SettlementPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports"
            element={
              <PermissionGuard>
                <ReportsPage />
              </PermissionGuard>
            }
          />
          <Route
            path="archive"
            element={
              <PermissionGuard>
                <ArchivePage />
              </PermissionGuard>
            }
          />
          <Route
            path="exceptions"
            element={
              <PermissionGuard>
                <ExceptionCenterPage />
              </PermissionGuard>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
