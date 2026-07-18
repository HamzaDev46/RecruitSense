import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import Dashboard from './pages/jobseeker/Dashboard'
import FeedPage from './pages/jobseeker/FeedPage'
import BrowseJobs from './pages/jobseeker/BrowseJobs'
import MyApplications from './pages/jobseeker/MyApplications'
import ResumeUpload from './pages/jobseeker/ResumeUpload'
import ResumeCoach from './pages/jobseeker/ResumeCoach'
import ProfilePage from './pages/jobseeker/ProfilePage'
import MyNetwork from './pages/jobseeker/MyNetwork'
import NotificationsPage from './pages/jobseeker/NotificationsPage'
import SavedJobs from './pages/jobseeker/SavedJobs'
import RecommendedJobs from './pages/jobseeker/RecommendedJobs'
import JobAlerts from './pages/jobseeker/JobAlerts'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute role="jobseeker">
            <Dashboard />
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
          <ProtectedRoute role="jobseeker">
            <NotificationsPage />
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
        <Route path="/profile/:userId" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
