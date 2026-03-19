import { addDoc, collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../config/firebase'
import { getFirebaseActionErrorMessage } from './firebaseErrorService'

const songsCollection = collection(db, 'songs')

const sortByNewest = (a, b) => {
  const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0
  const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0
  return bTime - aTime
}

const mapSnapshotToSongs = (snapshot) =>
  snapshot.docs.map((doc) => {
    const data = doc.data()

    return {
      id: doc.id,
      title: data.title || 'Untitled',
      artist: data.artist || 'Srijan Dwivedi',
      cover: data.cover || '',
      file: data.file || '',
      lyrics: data.lyrics || '',
      createdAt: data.createdAt,
      source: 'firebase',
    }
  })

const uploadAsset = async (file, folder) => {
  const safeName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
  const fileRef = ref(storage, `${folder}/${safeName}`)
  await uploadBytes(fileRef, file)
  return getDownloadURL(fileRef)
}

export const subscribeToFirebaseSongs = (onData, onError) =>
  onSnapshot(
    songsCollection,
    (snapshot) => {
      const firebaseSongs = mapSnapshotToSongs(snapshot).sort(sortByNewest)
      onData(firebaseSongs)
    },
    onError,
  )

export const createFirebaseSong = async ({ title, artist, audioFile, coverFile, lyricsFile }) => {
  try {
    const [file, cover, lyrics] = await Promise.all([
      uploadAsset(audioFile, 'songs'),
      uploadAsset(coverFile, 'covers'),
      lyricsFile ? uploadAsset(lyricsFile, 'lyrics') : Promise.resolve(''),
    ])

    const payload = {
      title: title.trim(),
      artist: artist.trim() || 'Srijan Dwivedi',
      file,
      cover,
      lyrics,
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(songsCollection, payload)

    return {
      id: docRef.id,
      ...payload,
      source: 'firebase',
    }
  } catch (error) {
    throw new Error(getFirebaseActionErrorMessage(error, 'upload song'))
  }
}
