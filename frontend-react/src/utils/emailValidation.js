/**
 * Strict trusted email validation for RecruitSense.
 */

export const TRUSTED_EMAIL_DOMAINS = [
  // Google
  'gmail.com',
  'googlemail.com',

  // Microsoft
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',

  // Yahoo
  'yahoo.com',
  'ymail.com',
  'rocketmail.com',
  'yahoo.co.uk',
  'yahoo.com.pk',
  'yahoo.ca',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.com.au',
  'yahoo.in',

  // Apple
  'icloud.com',
  'me.com',
  'mac.com',

  // Privacy & Popular Webmail
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'zohomail.com',
  'aol.com',
  'gmx.com',
  'mail.com',
  'fastmail.com',

  // Platform
  'recruitsense.com',
]

/**
 * Validates whether an email string belongs strictly to a trusted provider or recognized .edu academic domain.
 * @param {string} email
 * @returns {{ isValid: boolean, message: string, isBlocked: boolean, domain: string }}
 */
export const validateTrustedEmail = (email) => {
  const trimmed = (email || '').trim().toLowerCase()
  if (!trimmed) {
    return { isValid: false, message: 'Email is required', isBlocked: false, domain: '' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Please enter a valid email address', isBlocked: false, domain: '' }
  }

  const domain = trimmed.split('@')[1] || ''

  const isTrustedProvider = TRUSTED_EMAIL_DOMAINS.includes(domain)
  const isInstitutional =
    domain.endsWith('.edu') ||
    domain.endsWith('.edu.pk') ||
    domain.endsWith('.ac.uk') ||
    domain.endsWith('.edu.au')

  if (isTrustedProvider || isInstitutional) {
    return {
      isValid: true,
      isBlocked: false,
      domain,
      message: '',
    }
  }

  return {
    isValid: false,
    isBlocked: true,
    domain,
    message: 'Please use a trusted email provider (e.g. Gmail, Yahoo, Outlook, Hotmail, iCloud, Proton, or .edu).',
  }
}

/**
 * Quick check if email is considered trusted
 */
export const isTrustedEmail = (email) => validateTrustedEmail(email).isValid
