"use client"

import { v4 as uuidv4 } from 'uuid';

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { db, storage } from '@/firebase';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { generateEmbeddings } from '@/actions/generateEmbeddings';

export enum StatusText {
    UPLOADING = "Uploading file...",
    UPLOADED = "File Uploaded Successfully!",
    SAVING = "Saving FIle to the Database...",
    GENERATING = "Generating AI Embeddings...",
}

export type Status = StatusText[keyof StatusText]
function useUpload() {
    const [progress, setProgress] = useState<number | null>(null)
    const [fileId, setFileId] = useState<string | null>(null)
    const [status, setStatus] = useState<Status | null>(null)

    const { user } = useUser()
    const router = useRouter()

    const handleUpload = async (file: File) => {
        if (!file || !user) return

        const fileIdToUpload = uuidv4()

        const storageRef = ref(storage, `files/${user.id}/files/${fileIdToUpload}`)

        const uploadTask = uploadBytesResumable(storageRef, file)

        uploadTask.on("state_changed", (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)

            setStatus(StatusText.UPLOADING)
            setProgress(percent)
        }, (error) => {
            console.error("Error Uploading File", error)
        }, async () => {
            setStatus(StatusText.UPLOADED)

            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)

            setStatus(StatusText.SAVING)

            await setDoc(doc(db, "users", user.id, "files", fileIdToUpload), {
                name: file.name,
                size: file.size,
                type: file.type,
                downloadURL: downloadURL,
                ref: uploadTask.snapshot.ref.fullPath,
                createdAt: new Date()
            })

            setStatus(StatusText.GENERATING)

            // await generateEmbeddings(fileIdToUpload)
            
            setFileId(fileIdToUpload)
        })
    }
    return { handleUpload, status, progress, fileId }
}

export default useUpload


