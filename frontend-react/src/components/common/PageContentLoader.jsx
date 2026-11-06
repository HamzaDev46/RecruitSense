import { motion } from 'framer-motion'
import { Loader2, Brain, Sparkles } from 'lucide-react'
import {
  ProfileSkeleton,
  DashboardSkeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  WidgetSkeleton,
} from './Skeletons'

const PageContentLoader = ({
  title = 'Loading...',
  subtitle = '',
  type = 'cards', // 'profile' | 'dashboard' | 'cards' | 'table' | 'list' | 'detail' | 'widget' | 'simple'
  count = 4,
  compact = false,
  showBanner = false, // Pure clean wireframe skeletons by default (no clunky banners)
}) => {
  return (
    <div className={`w-full space-y-5 ${compact ? 'py-1' : 'py-3'}`}>
      {/* Optional Central Banner (Only shown if explicitly requested via showBanner={true}) */}
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex flex-col items-center justify-center bg-white rounded-2xl border border-indigo-50 shadow-sm text-center ${
            compact ? 'p-4' : 'p-6'
          }`}
        >
          <div className="relative mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 animate-pulse">
              <Brain className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center border border-indigo-100">
              <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            {title}
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 max-w-sm mt-0.5">
              {subtitle}
            </p>
          )}
        </motion.div>
      )}

      {/* High-Fidelity Skeletons */}
      {type === 'profile' && <ProfileSkeleton />}

      {type === 'dashboard' && <DashboardSkeleton />}

      {type === 'cards' && <CardSkeleton count={count} />}

      {type === 'table' && <TableSkeleton count={count} />}

      {type === 'list' && <ListSkeleton count={count} />}

      {type === 'widget' && <WidgetSkeleton />}

      {type === 'detail' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-2.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-5 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-3.5 bg-gray-100 rounded w-full" />
              <div className="h-3.5 bg-gray-100 rounded w-5/6" />
              <div className="h-3.5 bg-gray-100 rounded w-3/4" />
            </div>
            <div className="h-32 bg-gray-50 rounded-xl" />
          </div>
        </div>
      )}

      {type === 'simple' && (
        <div className="h-36 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse" />
      )}
    </div>
  )
}

export default PageContentLoader
