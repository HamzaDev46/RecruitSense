import { motion, AnimatePresence } from 'framer-motion'
import { getPasswordStrength } from '../../utils/passwordStrength'

const PasswordStrengthSlider = ({ password }) => {
  const strength = getPasswordStrength(password)

  return (
    <AnimatePresence>
      {password && password.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="mt-2.5 space-y-1.5 overflow-hidden"
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-medium">Strength:</span>
              <span className={`font-bold transition-colors duration-300 ${strength.textClass}`}>
                {strength.label}
              </span>
            </div>
            <span className={`text-[11px] font-medium transition-colors duration-300 ${strength.textClass}`}>
              {strength.message}
            </span>
          </div>

          {/* Animated Slider Track */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
            <motion.div
              className={`h-full bg-gradient-to-r ${strength.barClass} rounded-full`}
              initial={false}
              animate={{ width: `${strength.percent}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default PasswordStrengthSlider

