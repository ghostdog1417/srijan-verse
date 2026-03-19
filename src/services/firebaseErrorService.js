const getErrorText = (error) => {
  if (!error) return ''
  if (typeof error === 'string') return error.toLowerCase()

  const message = typeof error.message === 'string' ? error.message : ''
  const code = typeof error.code === 'string' ? error.code : ''

  return `${code} ${message}`.toLowerCase()
}

export const getFirebaseActionErrorMessage = (error, actionLabel) => {
  const text = getErrorText(error)

  if (text.includes('invalid-api-key') || text.includes('api key not valid')) {
    return 'Firebase API key is invalid or missing. Add all VITE_FIREBASE_* variables in Vercel and redeploy.'
  }

  if (text.includes('permission-denied')) {
    return `Permission denied while trying to ${actionLabel}. Update Firebase Firestore/Storage rules for authenticated admin users.`
  }

  if (text.includes('unauthenticated') || text.includes('auth/')) {
    return `You are not authenticated. Please login again and retry ${actionLabel}.`
  }

  if (text.includes('storage/unauthorized')) {
    return 'Storage write is blocked. Update Firebase Storage rules to allow authenticated uploads.'
  }

  if (text.includes('storagebucket') || text.includes('bucket')) {
    return 'Firebase Storage bucket is misconfigured. Check VITE_FIREBASE_STORAGE_BUCKET in deployment env vars.'
  }

  if (text.includes('network-request-failed')) {
    return 'Network request failed. Check internet connection and Firebase project status.'
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }

  return `Unable to ${actionLabel}. Please check Firebase setup and permissions.`
}
