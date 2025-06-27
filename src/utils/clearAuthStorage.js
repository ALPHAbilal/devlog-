export const clearCorruptedAuthStorage = () => {
  try {
    const authKey = 'journey-log-auth'
    const authData = localStorage.getItem(authKey)
    
    if (authData) {
      try {
        JSON.parse(authData)
        console.log('Auth data in localStorage is valid JSON')
        return true
      } catch (e) {
        console.warn('Clearing corrupted auth data:', e)
        localStorage.removeItem(authKey)
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('localStorage access error:', error)
    return false
  }
}