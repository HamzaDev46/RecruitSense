/**
 * Evaluates password strength and returns score, percentage, color styles, and helpful next-step guidance.
 * Required policy:
 * - 8+ characters
 * - At least 1 capital letter (A-Z)
 * - At least 1 special character (!@#$%^&* etc.)
 */
export const getPasswordStrength = (pwd) => {
  if (!pwd || pwd.length === 0) {
    return {
      score: 0,
      percent: 0,
      label: '',
      barClass: 'from-gray-300 to-gray-400',
      textClass: 'text-gray-400',
      message: '',
      isFullyValid: false,
    }
  }

  const hasMinLen = pwd.length >= 8
  const hasUpper = /[A-Z]/.test(pwd)
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)

  let score = 0
  if (pwd.length > 0) score += 1
  if (hasMinLen) score += 1
  if (hasUpper) score += 1
  if (hasSpecial) score += 1
  if (hasNumber && pwd.length >= 10) score += 1

  const isFullyValid = hasMinLen && hasUpper && hasSpecial

  if (!isFullyValid) {
    let nextTip = 'Needs 8+ characters'
    if (!hasMinLen) nextTip = `Needs 8+ chars (${pwd.length}/8)`
    else if (!hasUpper) nextTip = 'Add 1 capital letter (A-Z)'
    else if (!hasSpecial) nextTip = 'Add 1 special char (!@#$)'

    if (score <= 1) {
      return {
        score: 1,
        percent: 25,
        label: 'Weak',
        barClass: 'from-rose-500 to-red-500',
        textClass: 'text-rose-600',
        message: nextTip,
        isFullyValid: false,
      }
    }
    if (score === 2) {
      return {
        score: 2,
        percent: 50,
        label: 'Fair',
        barClass: 'from-amber-500 to-orange-500',
        textClass: 'text-amber-600',
        message: nextTip,
        isFullyValid: false,
      }
    }
    return {
      score: 3,
      percent: 75,
      label: 'Good',
      barClass: 'from-indigo-500 to-blue-500',
      textClass: 'text-indigo-600',
      message: nextTip,
      isFullyValid: false,
    }
  }

  return {
    score: 4,
    percent: 100,
    label: 'Strong',
    barClass: 'from-emerald-500 to-teal-500',
    textClass: 'text-emerald-600',
    message: 'Strong password! All rules met ✓',
    isFullyValid: true,
  }
}

