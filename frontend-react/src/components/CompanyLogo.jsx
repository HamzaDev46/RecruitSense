const sizes = {
  sm: 'w-10 h-10 rounded-xl text-sm',
  md: 'w-12 h-12 rounded-xl text-base',
  lg: 'w-14 h-14 rounded-2xl text-xl',
  xl: 'w-16 h-16 rounded-2xl text-2xl',
}

const CompanyLogo = ({ company, size = 'md', className = '' }) => {
  const label = company?.name || 'Company'
  const initials = label
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className={`${sizes[size] || sizes.md} bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
      {company?.logo_url ? (
        <img src={company.logo_url} alt={`${label} logo`} className="w-full h-full object-cover" />
      ) : (
        initials || 'C'
      )}
    </div>
  )
}

export default CompanyLogo
