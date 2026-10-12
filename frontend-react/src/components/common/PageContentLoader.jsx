import { motion } from 'framer-motion'
import { Loader2, Brain, Sparkles } from 'lucide-react'

const PageContentLoader = ({
  title = 'Loading data...',
  subtitle = 'Please wait while we fetch the latest information for you.',
  type = 'cards', // 'cards' | 'table' | 'dashboard' | 'list' | 'detail' | 'simple'
  count = 4,
  compact = false,
}) => {
  return (
    <div className={`w-full space-y-6 ${compact ? 'py-2' : 'py-4'}`}>
      {/* Central Rotating Loader Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center justify-center bg-white rounded-3xl border border-indigo-50 shadow-sm text-center ${
          compact ? 'p-5' : 'p-7'
        }`}
      >
        <div className="relative mb-3.5">
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 animate-pulse">
            <Brain className="w-7 h-7" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center border border-indigo-100">
            <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          </div>
        </div>

        <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
          {title}
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 max-w-sm mt-1">
            {subtitle}
          </p>
        )}
      </motion.div>

      {/* Skeleton Placeholders */}
      {type === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white border border-gray-100 p-4 space-y-3 animate-pulse">
                <div className="w-8 h-8 rounded-xl bg-gray-200" />
                <div className="h-6 w-16 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 rounded-2xl bg-white border border-gray-100 p-6 animate-pulse" />
            <div className="h-64 rounded-2xl bg-white border border-gray-100 p-6 animate-pulse" />
          </div>
        </div>
      )}

      {type === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-gray-100 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
                <div className="h-6 w-20 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {type === 'list' && (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {type === 'table' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-11 bg-gray-50/80 border-b border-gray-100 px-6 flex items-center gap-4 animate-pulse">
            <div className="h-3.5 w-1/6 bg-gray-200 rounded" />
            <div className="h-3.5 w-1/4 bg-gray-200 rounded" />
            <div className="h-3.5 w-1/5 bg-gray-200 rounded" />
            <div className="h-3.5 w-1/6 bg-gray-200 rounded" />
          </div>
          <div className="divide-y divide-gray-50 p-2">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4 animate-pulse">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-200 rounded w-2/5" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
                <div className="h-7 w-20 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'detail' && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-gray-100 space-y-2.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-3 p-6 bg-white rounded-2xl border border-gray-100 space-y-5 animate-pulse">
            <div className="h-7 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-100 rounded w-full" />
              <div className="h-4 bg-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
            </div>
            <div className="h-28 bg-gray-50 rounded-xl" />
          </div>
        </div>
      )}
    </div>
  )
}

export default PageContentLoader
