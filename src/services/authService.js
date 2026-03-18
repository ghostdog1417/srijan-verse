import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../config/firebase'

export const loginAdmin = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return { success: true, user: result.user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const logoutAdmin = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export const getCurrentAdmin = () => {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      resolve(user)
    })
  })
}
