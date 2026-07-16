import { useState } from 'react'
import AuthContext from './auth-context'

const getSavedUser = () => {
  const savedUser = localStorage.getItem('user')
  if (!savedUser) return null

  try {
    return JSON.parse(savedUser)
  } catch {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getSavedUser)
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const login = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    localStorage.setItem('token', userToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateUser = (updates) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser

      const nextUser = { ...currentUser, ...updates }
      localStorage.setItem('user', JSON.stringify(nextUser))
      return nextUser
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading: false }}>
      {children}
    </AuthContext.Provider>
  )
}
