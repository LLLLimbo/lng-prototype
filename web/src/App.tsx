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
import OnboardingSubmitPage from './pages/OnboardingSubmitPage'
import OnboardingStatusPage from './pages/OnboardingStatusPage'
import PlanApprovalPage from './pages/PlanApprovalPage'
import PlanCreatePage from './pages/PlanCreatePage'
import PlanListPage from './pages/PlanListPage'
import ReconciliationPage from './pages/ReconciliationPage'
import ReportsPage from './pages/ReportsPage'
import SettlementPage from './pages/SettlementPage'
import ArchivePage from './pages/ArchivePage'
import AcceptancePage from './pages/AcceptancePage'
import AttachmentCenterPage from './pages/AttachmentCenterPage'
import BasicInfoPage from './pages/BasicInfoPage'
import DailyPlanReportPage from './pages/DailyPlanReportPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import LoginPage from './pages/LoginPage'
import MessageCenterPage from './pages/MessageCenterPage'
import OrderListPage from './pages/OrderListPage'
import OrderManagementPage from './pages/OrderManagementPage'
import RegisterPage from './pages/RegisterPage'
import { useAppStore } from './store/useAppStore'

interface GuardProps {
  children: ReactElement
}

function AuthRequiredGuard({ children }: GuardProps) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (isAuthenticated) {
    return children
  }

  return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
}

function GuestOnlyGuard({ children }: GuardProps) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return children
  }

  return <Navigate to="/app/dashboard" replace />
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
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/app/dashboard' : '/auth/login'} replace />}
        />
        <Route
          path="/auth/login"
          element={
            <GuestOnlyGuard>
              <LoginPage />
            </GuestOnlyGuard>
          }
        />
        <Route
          path="/auth/register"
          element={
            <GuestOnlyGuard>
              <RegisterPage />
            </GuestOnlyGuard>
          }
        />
        <Route
          path="/auth/forgot"
          element={
            <GuestOnlyGuard>
              <ForgotPasswordPage />
            </GuestOnlyGuard>
          }
        />
        <Route
          path="/app"
          element={
            <AuthRequiredGuard>
              <AdminLayout />
            </AuthRequiredGuard>
          }
        >
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
            path="plans/daily-report"
            element={
              <PermissionGuard>
                <DailyPlanReportPage />
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
            path="onboarding/status"
            element={
              <PermissionGuard>
                <OnboardingStatusPage />
              </PermissionGuard>
            }
          />
          <Route
            path="onboarding/submit"
            element={
              <PermissionGuard>
                <OnboardingSubmitPage />
              </PermissionGuard>
            }
          />
          <Route
            path="basic-info"
            element={
              <PermissionGuard>
                <BasicInfoPage />
              </PermissionGuard>
            }
          />
          <Route
            path="orders/manage"
            element={
              <PermissionGuard>
                <OrderManagementPage />
              </PermissionGuard>
            }
          />
          <Route
            path="orders/list"
            element={
              <PermissionGuard>
                <OrderListPage />
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
            path="orders/acceptance"
            element={
              <PermissionGuard>
                <AcceptancePage />
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
            path="attachments"
            element={
              <PermissionGuard>
                <AttachmentCenterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="messages"
            element={
              <PermissionGuard>
                <MessageCenterPage />
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
