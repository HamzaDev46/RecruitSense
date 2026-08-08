import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppErrorBoundary from './components/AppErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

const pageImports = {
  landing: () => import('./pages/LandingPage'),
  login: () => import('./pages/auth/LoginPage'),
  register: () => import('./pages/auth/RegisterPage'),
  forgotPassword: () => import('./pages/auth/ForgotPasswordPage'),
  resetPassword: () => import('./pages/auth/ResetPasswordPage'),
  dashboard: () => import('./pages/jobseeker/Dashboard'),
  search: () => import('./pages/jobseeker/SearchPage'),
  feed: () => import('./pages/jobseeker/FeedPage'),
  jobs: () => import('./pages/jobseeker/BrowseJobs'),
  applications: () => import('./pages/jobseeker/MyApplications'),
  resume: () => import('./pages/jobseeker/ResumeUpload'),
  resumeCoach: () => import('./pages/jobseeker/ResumeCoach'),
  profile: () => import('./pages/jobseeker/ProfilePage'),
  network: () => import('./pages/jobseeker/MyNetwork'),
  notifications: () => import('./pages/jobseeker/NotificationsPage'),
  messages: () => import('./pages/jobseeker/MessagesPage'),
  savedJobs: () => import('./pages/jobseeker/SavedJobs'),
  recommendedJobs: () => import('./pages/jobseeker/RecommendedJobs'),
  jobAlerts: () => import('./pages/jobseeker/JobAlerts'),
  settings: () => import('./pages/jobseeker/SettingsPage'),
  companyDashboard: () => import('./pages/company/CompanyDashboard'),
  companyAnalytics: () => import('./pages/company/CompanyAnalytics'),
  companyJobs: () => import('./pages/company/CompanyJobs'),
  companyApplicants: () => import('./pages/company/CompanyApplicants'),
  companyInterviews: () => import('./pages/company/CompanyInterviews'),
  companyQuiz: () => import('./pages/company/CompanyQuiz'),
  companySettings: () => import('./pages/company/CompanySettings'),
}

const LandingPage = lazy(pageImports.landing)
const LoginPage = lazy(pageImports.login)
const RegisterPage = lazy(pageImports.register)
const ForgotPasswordPage = lazy(pageImports.forgotPassword)
const ResetPasswordPage = lazy(pageImports.resetPassword)
const Dashboard = lazy(pageImports.dashboard)
const SearchPage = lazy(pageImports.search)
const FeedPage = lazy(pageImports.feed)
const BrowseJobs = lazy(pageImports.jobs)
const MyApplications = lazy(pageImports.applications)
const ResumeUpload = lazy(pageImports.resume)
const ResumeCoach = lazy(pageImports.resumeCoach)
const ProfilePage = lazy(pageImports.profile)
const MyNetwork = lazy(pageImports.network)
const NotificationsPage = lazy(pageImports.notifications)
const MessagesPage = lazy(pageImports.messages)
const SavedJobs = lazy(pageImports.savedJobs)
const RecommendedJobs = lazy(pageImports.recommendedJobs)
const JobAlerts = lazy(pageImports.jobAlerts)
const SettingsPage = lazy(pageImports.settings)
const CompanyDashboard = lazy(pageImports.companyDashboard)
const CompanyAnalytics = lazy(pageImports.companyAnalytics)
const CompanyJobs = lazy(pageImports.companyJobs)
const CompanyApplicants = lazy(pageImports.companyApplicants)
const CompanyInterviews = lazy(pageImports.companyInterviews)
const CompanyQuiz = lazy(pageImports.companyQuiz)
const CompanySettings = lazy(pageImports.companySettings)

const jobseekerPreloadKeys = [
  'dashboard',
  'search',
  'feed',
  'jobs',
  'applications',
  'resume',
  'resumeCoach',
  'profile',
  'network',
  'notifications',
  'messages',
  'savedJobs',
  'recommendedJobs',
  'jobAlerts',
  'settings',
]

const companyPreloadKeys = ['companyDashboard', 'companyAnalytics', 'companyJobs', 'companyApplicants', 'companyInterviews', 'notifications', 'messages', 'companyQuiz', 'companySettings']

const preloadAppPages = () => {
  const role = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')?.role || ''
    } catch {
      return ''
    }
  })()

  const preloadKeys = role === 'company' ? companyPreloadKeys : jobseekerPreloadKeys

  preloadKeys.forEach((key) => {
    pageImports[key]?.().catch(() => {})
  })
}

const PageLoader = () => (
  <div className="min-h-screen bg-[#f3f2ef]">
    <div className="h-16 bg-white border-b border-gray-200" />
    <div className="pt-6 flex justify-center">
      <div
        className="h-9 w-9 rounded-full border-[3px] border-gray-300 border-t-gray-700 animate-spin"
        aria-label="Loading page"
      />
    </div>
  </div>
)

const RouteClickSpinner = () => {
  const location = useLocation()
  const [loadingRoute, setLoadingRoute] = useState(null)

  useEffect(() => {
    const showSpinner = (event) => {
      setLoadingRoute({
        path: event.detail?.path || '',
        startedAt: Date.now(),
      })
    }

    window.addEventListener('recruitsense-route-loading', showSpinner)

    return () => {
      window.removeEventListener('recruitsense-route-loading', showSpinner)
    }
  }, [])

  useEffect(() => {
    if (!loadingRoute) return undefined
    if (loadingRoute.path && location.pathname !== loadingRoute.path) return undefined

    const elapsed = Date.now() - loadingRoute.startedAt
    const timer = window.setTimeout(() => setLoadingRoute(null), Math.max(260 - elapsed, 0))

    return () => window.clearTimeout(timer)
  }, [loadingRoute, location.pathname])

  useEffect(() => {
    if (!loadingRoute) return undefined

    const timer = window.setTimeout(() => setLoadingRoute(null), 1600)

    return () => window.clearTimeout(timer)
  }, [loadingRoute])

  if (!loadingRoute) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 top-16 md:top-0 md:left-64 z-30 bg-[#f3f2ef]/80 pointer-events-none">
      <div className="pt-8 flex justify-center">
        <div
          className="h-9 w-9 rounded-full border-[3px] border-gray-300 border-t-gray-700 animate-spin"
          aria-label="Loading page"
        />
      </div>
    </div>
  )
}

function App() {
  useEffect(() => {
    const runPreload = () => preloadAppPages()

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(runPreload, { timeout: 3000 })
      return () => window.cancelIdleCallback?.(idleId)
    }

    const timer = window.setTimeout(runPreload, 1500)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <AppErrorBoundary>
        <RouteClickSpinner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={
              <ProtectedRoute role="jobseeker">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute role="jobseeker">
                <SearchPage />
              </ProtectedRoute>
            } />
            <Route path="/feed" element={
              <ProtectedRoute role="jobseeker">
                <FeedPage />
              </ProtectedRoute>
            } />
            <Route path="/jobs" element={
              <ProtectedRoute role="jobseeker">
                <BrowseJobs />
              </ProtectedRoute>
            } />
            <Route path="/jobs/:jobId" element={
              <ProtectedRoute role="jobseeker">
                <BrowseJobs />
              </ProtectedRoute>
            } />
            <Route path="/recommended-jobs" element={
              <ProtectedRoute role="jobseeker">
                <RecommendedJobs />
              </ProtectedRoute>
            } />
            <Route path="/job-alerts" element={
              <ProtectedRoute role="jobseeker">
                <JobAlerts />
              </ProtectedRoute>
            } />
            <Route path="/network" element={
              <ProtectedRoute role="jobseeker">
                <MyNetwork />
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            } />
            <Route path="/my-applications" element={
              <ProtectedRoute role="jobseeker">
                <MyApplications />
              </ProtectedRoute>
            } />
            <Route path="/saved-jobs" element={
              <ProtectedRoute role="jobseeker">
                <SavedJobs />
              </ProtectedRoute>
            } />
            <Route path="/resume" element={
              <ProtectedRoute role="jobseeker">
                <ResumeUpload />
              </ProtectedRoute>
            } />
            <Route path="/resume-coach" element={
              <ProtectedRoute role="jobseeker">
                <ResumeCoach />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute role="jobseeker">
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute role="jobseeker">
                <SettingsPage />
              </ProtectedRoute>
            } />
            <Route path="/profile/:userId" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/company" element={
              <ProtectedRoute role="company">
                <Navigate to="/company/dashboard" replace />
              </ProtectedRoute>
            } />
            <Route path="/company/dashboard" element={
              <ProtectedRoute role="company">
                <CompanyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/company/analytics" element={
              <ProtectedRoute role="company">
                <CompanyAnalytics />
              </ProtectedRoute>
            } />
            <Route path="/company/jobs" element={
              <ProtectedRoute role="company">
                <CompanyJobs />
              </ProtectedRoute>
            } />
            <Route path="/company/applicants" element={
              <ProtectedRoute role="company">
                <CompanyApplicants />
              </ProtectedRoute>
            } />
            <Route path="/company/interviews" element={
              <ProtectedRoute role="company">
                <CompanyInterviews />
              </ProtectedRoute>
            } />
            <Route path="/company/quiz" element={
              <ProtectedRoute role="company">
                <CompanyQuiz />
              </ProtectedRoute>
            } />
            <Route path="/company/settings" element={
              <ProtectedRoute role="company">
                <CompanySettings />
              </ProtectedRoute>
            } />
            <Route path="/company/jobs/:jobId/applicants" element={
              <ProtectedRoute role="company">
                <CompanyApplicants />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </AppErrorBoundary>
    </BrowserRouter>
  )
}

export default App
