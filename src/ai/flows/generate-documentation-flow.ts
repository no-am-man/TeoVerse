
'use server';
/**
 * @fileOverview A flow to generate technical documentation about the project.
 *
 * - generateDocumentation - The main endpoint function.
 * - GenerateDocumentationInput - The input type for the function.
 * - GenerateDocumentationOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { promises as fs } from 'fs';
import path from 'path';
import { geny } from './geny-flow';
import { adminDb } from '@/lib/firebase-admin';
import { federationConfig } from '@/config';
import crypto from 'crypto';

const DOCS_CACHE_COLLECTION = 'documentationCache';

// Zod Schemas for input and output
const GenerateDocumentationInputSchema = z.object({
  topic: z.string().describe('The topic for the documentation article, e.g., "Passport Management".'),
});
export type GenerateDocumentationInput = z.infer<typeof GenerateDocumentationInputSchema>;

const GenerateDocumentationOutputSchema = z.object({
  topic: z.string().describe('The topic of the article.'),
  article: z.string().describe('The generated documentation article in Markdown format.'),
  imageUrl: z.string().describe('Data URI for a header image for the article.'),
});
export type GenerateDocumentationOutput = z.infer<typeof GenerateDocumentationOutputSchema>;

const getCacheKey = (topic: string, version: string): string => {
    return crypto.createHash('sha256').update(`${topic}-${version}`).digest('hex');
};

/**
 * A tool that allows the AI to read the content of project files.
 * This provides the necessary context for writing accurate documentation.
 */
const getFileContentTool = ai.defineTool(
  {
    name: 'getFileContent',
    description: 'Reads the content of a specific source file to understand how the system works. Use this to get context before writing documentation. You must read at least one file to understand the topic.',
    inputSchema: z.object({
      filePath: z.string().describe('The path to the file relative to the project root, e.g., "src/services/passport-service.ts".'),
    }),
    outputSchema: z.string(),
  },
  async ({ filePath }) => {
    // Security: Ensure the path is within the 'src' directory to prevent arbitrary file access.
    const projectRoot = process.cwd();
    const absolutePath = path.join(projectRoot, filePath);
    const resolvedPath = path.resolve(absolutePath);
    const srcPath = path.resolve(path.join(projectRoot, 'src'));

    if (!resolvedPath.startsWith(srcPath)) {
      throw new Error('Access denied. Only files within the "src" directory can be read.');
    }

    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Failed to read file: ${filePath}`, error);
      return `Error: Could not read file at path: ${filePath}. The file might not exist.`;
    }
  }
);

/**
 * The main flow for generating documentation.
 */
const generateDocumentationFlow = ai.defineFlow(
  {
    name: 'generateDocumentationFlow',
    inputSchema: GenerateDocumentationInputSchema,
    outputSchema: GenerateDocumentationOutputSchema,
  },
  async (input, context) => {
    const { topic } = input;
    const cacheKey = getCacheKey(topic, federationConfig.version);
    const docRef = adminDb.collection(DOCS_CACHE_COLLECTION).doc(cacheKey);

    // Check for a cached version first.
    const docSnap = await docRef.get();
    if (docSnap.exists) {
      console.log('Returning cached documentation.');
      const data = docSnap.data();
      if (data) {
        return data as GenerateDocumentationOutput;
      }
    }
    
    console.log(`Generating new documentation for topic: "${topic}".`);

    // Generate article and image in parallel.
    const [llmResponse, imageResponse] = await Promise.all([
      ai.generate({
        prompt: `Write a technical documentation article about the following TeoVerse feature: "${topic}"`,
        model: 'googleai/gemini-2.0-flash',
        tools: [getFileContentTool],
        system: `You are an expert technical writer for the TeoVerse project. Your task is to write a clear, concise, and professional documentation article about a specific feature.

First, you MUST use the getFileContentTool to read the relevant source code files to understand the feature implementation. You should look for files in 'src/app/(app)/...', 'src/services/...', and 'src/ai/flows/...'.

Once you have the context from the source code, write a markdown article explaining the feature. The article should be easy for a new developer to understand.

- Start with a high-level overview of the feature and its purpose.
- Explain the key components (e.g., UI, services, AI flows).
- Describe the user flow or data flow involved.
- Use markdown for formatting, including headers, lists, and code blocks for short snippets if necessary.
- Do NOT just copy the file content. Synthesize and explain it in your own words.
- The article should be about the feature, not about how to use the documentation generation tool itself.`,
      }),
      geny({
        prompt: `A futuristic, abstract, cyberpunk-style technical illustration representing the concept of "${topic}". Use a dark theme with vibrant orange (#f56502) and green (#15b56d) highlights.`,
        salt: new Date().toISOString(), // Salt to ensure unique image even if topic is the same
      })
    ]);
    
    const article = llmResponse.text;
    if (!article) {
      throw new Error("The AI model did not return a text response for the article.");
    }

    if (!imageResponse?.dataUri) {
        throw new Error("The Geny service did not return an image data URI.");
    }
    
    const docData: GenerateDocumentationOutput & { version: string } = { 
      topic: input.topic, 
      article, 
      imageUrl: imageResponse.dataUri,
      version: federationConfig.version,
    };
    
    await docRef.set(docData);
    
    return docData;
  }
);


/**
 * Main endpoint function to generate documentation.
 * @param input The payload containing the documentation topic.
 * @returns The generated article in markdown format and an image data URI.
 */
export async function generateDocumentation(input: GenerateDocumentationInput): Promise<GenerateDocumentationOutput> {
  return generateDocumentationFlow(input);
}
