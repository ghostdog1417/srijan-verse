import { addDoc, collection, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { getFirebaseActionErrorMessage } from './firebaseErrorService'

const poemsCollection = collection(db, 'poems')

const sortByNewest = (a, b) => {
  const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.parse(a.date || 0)
  const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Date.parse(b.date || 0)
  return bTime - aTime
}

const mapSnapshotToPoems = (snapshot) =>
  snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      content: data.content || '',
      author: data.author || 'Srijan Dwivedi',
      date: data.date || new Date().toISOString().split('T')[0],
      createdAt: data.createdAt,
      source: 'firebase',
    }
  })

export const fetchFirebasePoems = async () => {
  const snapshot = await getDocs(poemsCollection)
  return mapSnapshotToPoems(snapshot).sort(sortByNewest)
}

export const subscribeToFirebasePoems = (onData, onError) =>
  onSnapshot(
    poemsCollection,
    (snapshot) => {
      const poems = mapSnapshotToPoems(snapshot).sort(sortByNewest)
      onData(poems)
    },
    onError,
  )

export const createFirebasePoem = async (poem) => {
  try {
    const payload = {
      title: poem.title,
      excerpt: poem.excerpt,
      content: poem.content,
      author: poem.author || 'Srijan Dwivedi',
      date: poem.date || new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(poemsCollection, payload)

    return {
      id: docRef.id,
      ...payload,
      source: 'firebase',
    }
  } catch (error) {
    throw new Error(getFirebaseActionErrorMessage(error, 'publish poem'))
  }
}
