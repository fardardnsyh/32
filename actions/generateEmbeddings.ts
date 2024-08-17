"use server"

import { generateEmbeddingsForDoc } from "@/lib/langchain"
import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

export async function generateEmbeddings(docId: string) {
    auth().protect()

    await generateEmbeddingsForDoc(docId)

    revalidatePath('/dashboard')

    return { completed: true }
}