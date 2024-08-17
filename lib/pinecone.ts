import { Pinecone } from '@pinecone-database/pinecone';

if (!process.env.PINECONE_API_KEY) {
    throw new Error("Pinecone API_KEY is not set")
}

export const pineconeClient = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});