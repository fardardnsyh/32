import { auth } from "@clerk/nextjs/server"
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai"
import { pineconeClient } from "./pinecone"
import { Index, RecordMetadata } from "@pinecone-database/pinecone"
import { PineconeStore } from "@langchain/pinecone"
import { adminDb } from "@/firebaseAdmin"
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"

const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-4o",
})

export const indexName = "chat"

async function namespaceExists(index: Index<RecordMetadata>, namespace: string) {
    if (namespace == null) throw new Error("No namesapce is provided")
    const { namespaces } = await index.describeIndexStats()
    return namespaces?.[namespace] !== undefined
}

async function generateDocs(docId: string) {
    const { userId } = await auth()

    if (!userId) {
        throw new Error("Not logged in")
    }

    // Fetch download URL from Firebase Admin
    const docRef = await adminDb.collection("users").doc(userId).collection("files").doc(docId).get()

    const downloadURL = docRef.data()?.downloadUrl

    if (!downloadURL) {
        throw new Error("No download URL found")
    }

    const response = await fetch(downloadURL)

    const data = await response.blob()    // Turning PDF into binary objects

    // Loading PDF document
    const loader = new PDFLoader(data)
    const docs = await loader.load()

    const splitter = new RecursiveCharacterTextSplitter()
    const splitDocs = await splitter.splitDocuments(docs)

    return splitDocs
}
export async function generateEmbeddingsForDoc(docId: string) {
    const { userId } = await auth()

    if (!userId) {
        throw new Error("Not logged in")
    }

    let pineconeVectorStore;

    const embeddings = new OpenAIEmbeddings()

    const index = await pineconeClient.index(indexName)

    const nameSpaceAlreadyExists = await namespaceExists(index, docId)

    if (nameSpaceAlreadyExists) {
        console.log('Namespace already exists, reusing it!');
        pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
            namespace: docId
        })

        return pineconeVectorStore
    } else {
        const splitDocs = await generateDocs(docId)

        pineconeVectorStore = await PineconeStore.fromDocuments(
            splitDocs,
            embeddings,
            {
                pineconeIndex: index,
                namespace: docId
            }
        )
        return pineconeVectorStore
    }
}