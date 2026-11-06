import { Brain, Loader2 } from 'lucide-react'

/**
 * RecruitSense Design System - Standardized Skeleton & Loading Suite
 * 1. ProfileSkeleton: 1:1 match for LinkedIn/RecruitSense candidate profiles
 * 2. DashboardSkeleton: 1:1 match for jobseeker/recruiter dashboards
 * 3. CardSkeleton: for job postings, feed updates, applications
 * 4. TableSkeleton: for candidate tables, admin users, company rosters
 * 5. ListSkeleton: for network connections, notifications, search results
 * 6. WidgetSkeleton: for compact sidebar cards & mini metrics
 * 7. FullPageLoader: for cold app start and primary route transitions
 */

// Shimmer helper class for consistent luxury shimmer effect
const shimmerClass = 'bg-gradient-to-r from-gray-100 via-gray-200/70 to-gray-100 bg-[length:200%_100%] animate-pulse'

export const ProfileSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-4" aria-busy="true" aria-label="Loading profile">
      {/* Main Profile Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        {/* Banner Cover Skeleton */}
        <div className={`h-44 sm:h-52 w-full ${shimmerClass}`} />

        <div className="px-6 pb-6">
          {/* Avatar and Action Buttons Row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-gray-200 shadow-sm shrink-0 animate-pulse" />
            <div className="flex items-center gap-2.5 pt-2 sm:pt-0">
              <div className="h-9 w-24 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-9 w-28 rounded-full bg-gray-200 animate-pulse" />
              <div className="h-9 w-9 rounded-full bg-gray-100 animate-pulse" />
            </div>
          </div>

          {/* Name & Headline */}
          <div className="space-y-2.5 max-w-xl">
            <div className="h-7 w-56 rounded-lg bg-gray-200 animate-pulse" />
            <div className="h-4 w-full sm:w-96 rounded bg-gray-100 animate-pulse" />
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="h-3.5 w-28 rounded bg-gray-100 animate-pulse" />
              <span className="text-gray-300">•</span>
              <div className="h-3.5 w-36 rounded bg-gray-100 animate-pulse" />
              <span className="text-gray-300">•</span>
              <div className="h-3.5 w-24 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>

          {/* Contact / Metrics Pills */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
            <div className="h-6 w-28 rounded-full bg-indigo-50/80 animate-pulse" />
            <div className="h-6 w-32 rounded-full bg-purple-50/80 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Analytics / Highlights Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 space-y-2 animate-pulse">
              <div className="h-5 w-14 rounded bg-gray-200" />
              <div className="h-3 w-28 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      {/* About Section Skeleton */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3.5">
        <div className="h-5 w-28 rounded bg-gray-200 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3.5 w-full rounded bg-gray-100 animate-pulse" />
          <div className="h-3.5 w-11/12 rounded bg-gray-100 animate-pulse" />
          <div className="h-3.5 w-4/5 rounded bg-gray-100 animate-pulse" />
        </div>
      </div>

      {/* Experience Section Skeleton */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 rounded bg-gray-200 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
        </div>
        <div className="space-y-4 divide-y divide-gray-100">
          {[1, 2].map((i) => (
            <div key={i} className={`flex items-start gap-4 ${i > 1 ? 'pt-4' : ''}`}>
              <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0 animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-44 rounded bg-gray-200 animate-pulse" />
                <div className="h-3.5 w-32 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-gray-50 animate-pulse mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Badges Skeleton */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="h-5 w-24 rounded bg-gray-200 animate-pulse" />
        <div className="flex flex-wrap gap-2.5">
          {[20, 24, 16, 28, 22, 18, 26].map((w, idx) => (
            <div
              key={idx}
              className={`h-8 rounded-full bg-gray-100 animate-pulse`}
              style={{ width: `${w * 4}px` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export const DashboardSkeleton = () => {
  return (
    <div className="w-full space-y-6" aria-busy="true" aria-label="Loading dashboard">
      {/* 4 Top KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-50/70" />
              <div className="h-3.5 w-12 rounded bg-gray-100" />
            </div>
            <div className="space-y-1.5 pt-1">
              <div className="h-6 w-16 rounded bg-gray-200" />
              <div className="h-3 w-28 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-Column Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Feed / Job Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-100 flex items-start gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-100" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-5 w-16 rounded-full bg-gray-100" />
                    <div className="h-5 w-20 rounded-full bg-gray-100" />
                  </div>
                </div>
                <div className="h-8 w-20 rounded-full bg-gray-100 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1 Col): Sidebar Widgets */}
        <div className="space-y-5">
          {/* Profile Strength / Action Widget */}
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-4 animate-pulse">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-2.5 w-full rounded-full bg-gray-100" />
            <div className="space-y-2 pt-1">
              <div className="h-3 w-5/6 rounded bg-gray-100" />
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
            <div className="h-9 w-full rounded-xl bg-indigo-50/70" />
          </div>

          {/* Quick Networking Widget */}
          <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3.5 animate-pulse">
            <div className="h-4 w-36 rounded bg-gray-200" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-24 rounded bg-gray-200" />
                  <div className="h-3 w-32 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const CardSkeleton = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4 animate-pulse"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2 pt-1">
            <div className="h-3 bg-gray-100 rounded w-full" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
              <div className="h-6 w-20 bg-gray-100 rounded-full" />
            </div>
            <div className="h-8 w-20 bg-indigo-50/70 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export const TableSkeleton = ({ count = 5 }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" aria-busy="true">
      {/* Header */}
      <div className="h-12 bg-gray-50/80 border-b border-gray-100 px-6 flex items-center gap-6 animate-pulse">
        <div className="h-3.5 w-1/5 bg-gray-200 rounded" />
        <div className="h-3.5 w-1/4 bg-gray-200 rounded" />
        <div className="h-3.5 w-1/5 bg-gray-200 rounded hidden sm:block" />
        <div className="h-3.5 w-1/6 bg-gray-200 rounded ml-auto" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-gray-50 p-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="px-4 py-4 flex items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-2/5" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded-full hidden sm:block" />
            <div className="h-8 w-24 bg-gray-100 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const ListSkeleton = ({ count = 4 }) => {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4 animate-pulse"
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-full bg-gray-100 shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
          <div className="h-8 w-24 bg-gray-100 rounded-xl shrink-0" />
        </div>
      ))}
    </div>
  )
}

export const WidgetSkeleton = ({ title = true }) => {
  return (
    <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm space-y-3.5 animate-pulse" aria-busy="true">
      {title && <div className="h-4 w-32 rounded bg-gray-200 mb-2" />}
      <div className="h-3.5 w-full rounded bg-gray-100" />
      <div className="h-3.5 w-5/6 rounded bg-gray-100" />
      <div className="h-3.5 w-3/4 rounded bg-gray-100" />
    </div>
  )
}

export const InlineLoader = ({ size = 'sm', text = 'Loading...' }) => {
  return (
    <span className="inline-flex items-center gap-1.5 text-current opacity-90">
      <Loader2 className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} animate-spin`} />
      {text && <span>{text}</span>}
    </span>
  )
}

export const FullPageLoader = ({ message = 'Loading RecruitSense...' }) => {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-6" aria-busy="true">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25 animate-pulse">
          <Brain className="w-8 h-8" />
        </div>
        <div className="absolute -inset-1 rounded-3xl border border-indigo-200/50 animate-ping pointer-events-none" />
      </div>

      <div className="text-center space-y-2 max-w-xs">
        <p className="text-xl font-bold text-gray-900">
          Recruit<span className="text-indigo-600">Sense</span>
        </p>
        <p className="text-xs text-gray-500">{message}</p>
        <div className="flex items-center justify-center gap-1.5 pt-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce [animation-delay:120ms]" />
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  )
}

export default {
  ProfileSkeleton,
  DashboardSkeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  WidgetSkeleton,
  FullPageLoader,
}
