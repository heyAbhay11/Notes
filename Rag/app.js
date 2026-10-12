import {  PDFParse } from 'pdf-parse'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config();
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MistralAIEmbeddings } from '@langchain/mistralai';
import { Pinecone } from '@pinecone-database/pinecone'


const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index("cohort2-rag");                  //setup pinecone


// let dataBuffer = fs.readFileSync('./story.pdf')

// const parser = new PDFParse({
//     data: dataBuffer
// })

// const data = await parser.getText() //"PDF-parser"-it read all the pdf and give it to you in terminal 

const embeddings = new MistralAIEmbeddings({
    apiKey: process.env.MISTRAL_API_KEY,    //Make embeddings/coordinates of chunks.                
    model: "mistral-embed"

})

//Text splitter -> is use to split the text unko tukdo ma todna 
// const splitter = new RecursiveCharacterTextSplitter({
//     chunkSize: 500,   //chunksize:it count word
//     chunkOverlap: 0
// })


// const chunks = await splitter.splitText(data.text)
// // console.log(chunks, chunks.length)
// const docs = await Promise.all(chunks.map(async (chunk) => {
//     const embedding = await embeddings.embedQuery(chunk)
//     return {
//         text: chunk,
//         embedding
//     }
// }))

// const result = await index.upsert({     // storing data in pinecone vector store
//     records: docs.map((doc, i) => ({
//         id: `doc-${i}`,
//         values: doc.embedding,
//         metadata: {
//             text: doc.text
//         }
//     }))
// })



// User query to vector store 

const queryEmbedding = await embeddings.embedQuery('how was the internship experience?') 
//embedding user query 

const result = await index.query({
    vector:queryEmbedding,          // give query to vector store and he find exact match related 
                                    // to query
    topK: 2,                //it give 2 results which match properly
    includeMetadata:true
})

console.log(JSON.stringify(result))