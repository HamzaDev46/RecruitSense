import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

const googleScriptId = 'google-identity-services'

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
  </svg>
)

const GoogleAuthButton = ({ mode = 'signin', role, onSuccess }) => {
  const buttonRef = useRef(null)
  const [scriptReady, setScriptReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (!clientId) return undefined

    const existingScript = document.getElementById(googleScriptId)

    const markReady = () => setScriptReady(true)

    if (window.google?.accounts?.id) {
      markReady()
      return undefined
    }

    if (existingScript) {
      existingScript.addEventListener('load', markReady)
      return () => existingScript.removeEventListener('load', markReady)
    }

    const script = document.createElement('script')
    script.id = googleScriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.addEventListener('load', markReady)
    script.addEventListener('error', () => toast.error('Google sign-in could not load'))
    document.head.appendChild(script)

    return () => {
      script.removeEventListener('load', markReady)
    }
  }, [clientId])

  useEffect(() => {
    if (!clientId || !scriptReady || !window.google?.accounts?.id || !buttonRef.current) return

    buttonRef.current.innerHTML = ''
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        if (!response.credential) {
          toast.error('Google did not return a sign-in token')
          return
        }

        setLoading(true)
        try {
          const res = await api.post('/auth/google', {
            credential: response.credential,
            role,
          })
          onSuccess?.(res.data.user, res.data.token)
        } catch (err) {
          toast.error(err.response?.data?.message || 'Google sign-in failed')
        } finally {
          setLoading(false)
        }
      },
    })

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      text: mode === 'signup' ? 'signup_with' : 'signin_with',
      width: buttonRef.current.offsetWidth || 360,
    })
  }, [clientId, mode, onSuccess, role, scriptReady])

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-400 flex items-center justify-center gap-2"
      >
        <GoogleIcon />
        Add Google client ID
      </button>
    )
  }

  return (
    <div className="relative">
      <div ref={buttonRef} className="w-full min-h-11 flex justify-center" />
      {loading && (
        <div className="absolute inset-0 rounded-xl bg-white/80 flex items-center justify-center">
          <LoaderCircle className="w-5 h-5 animate-spin text-indigo-600" />
        </div>
      )}
    </div>
  )
}

export default GoogleAuthButton
