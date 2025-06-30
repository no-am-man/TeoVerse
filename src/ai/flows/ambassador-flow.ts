
'use server';
/**
 * @fileOverview An AI ambassador for a user's public federation page.
 *
 * - ambassador - The main endpoint function that handles chat questions.
 * - AmbassadorInput - The input type for the ambassador function.
 * - AmbassadorOutput - The return type for the ambassador function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { federationConfig } from '@/config';
import { adminDb } from '@/lib/firebase-admin';
import type { IpToken, PhysicalAsset } from '@/services/passport-service';

// Schema for the public data we will expose via the tool.
const PublicFederationDataSchema = z.object({
  federationName: z.string().describe('The name of the federation.'),
  tokenSymbol: z.string().describe('The symbol for the federation currency (e.g., TEO).'),
  ipTokens: z.array(z.object({
    id: z.string(),
    name: z.string().describe('The name or title of the intellectual property.'),
    value: z.string().describe('The value of the IP token in USD.'),
  })).describe('A list of intellectual property tokens available for sale.'),
  physicalAssets: z.array(z.object({
    id: z.string(),
    name: z.string().describe('The name of the physical asset.'),
    type: z.string().describe('The type or category of the physical asset.'),
    value: z.string().describe('The value of the physical asset in USD.'),
  })).describe('A list of physical assets available for sale.'),
});

// Tool for the AI to get information about the federation.
const getFederationDataTool = ai.defineTool(
  {
    name: 'getFederationData',
    description: "Retrieves public data for the specified federation, including its name, configuration, and a list of the user's IP and physical assets available for sale. This tool MUST be called to answer any user question.",
    inputSchema: z.object({
      userId: z.string().describe("The unique ID of the federation's owner (capital state)."),
    }),
    outputSchema: PublicFederationDataSchema,
  },
  async ({ userId }) => {
    const passportRef = adminDb.collection('passports').doc(userId);
    const passportSnap = await passportRef.get();

    if (!passportSnap.exists) {
      throw new Error('Federation not found for the given user ID.');
    }
    const passportData = passportSnap.data();

    const ipTokensForSale = (passportData?.ipTokens || []).filter((token: IpToken) => token.forSale);
    const physicalAssetsForSale = (passportData?.physicalAssets || []).filter((asset: PhysicalAsset) => asset.forSale);

    return {
      federationName: federationConfig.federationName,
      tokenSymbol: federationConfig.tokenSymbol,
      ipTokens: ipTokensForSale,
      physicalAssets: physicalAssetsForSale,
    };
  }
);

// Define the input and output schemas for the main flow.
const AmbassadorInputSchema = z.object({
  userId: z.string().describe("The ID of the user whose federation is being queried."),
  question: z.string().describe("The visitor's question."),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({ text: z.string() })),
  })).optional().describe("The history of the conversation so far."),
});
export type AmbassadorInput = z.infer<typeof AmbassadorInputSchema>;

const AmbassadorOutputSchema = z.object({
  answer: z.string().describe("The AI ambassador's answer."),
});
export type AmbassadorOutput = z.infer<typeof AmbassadorOutputSchema>;


const ambassadorFlow = ai.defineFlow(
  {
    name: 'ambassadorFlow',
    inputSchema: AmbassadorInputSchema,
    outputSchema: AmbassadorOutputSchema,
  },
  async (input) => {
    const response = await ai.generate({
      prompt: input.question,
      model: 'googleai/gemini-2.0-flash',
      tools: [getFederationDataTool],
      toolConfig: {
        autoToolCall: {
          force: [{ name: 'getFederationData', args: { userId: input.userId } }],
        },
      },
      system: `You are the AI Ambassador for a TeoVerse federation. Your role is to answer questions from potential investors about the federation and its assets (both intellectual property and physical) that are for sale.

You are helpful, professional, and slightly futuristic. Your primary goal is to generate interest in the assets.

Use the getFederationData tool to get the necessary information about the federation and its assets. Do not answer questions about any other topic. Do not reveal the user's ID or any private information.

When asked about IP assets or physical assets, describe them based on the data available and mention their value in USD.
When asked about the federation, you can talk about its name and currency symbol.`,
      history: input.history,
    });

    const answer = response.text;

    if (!answer) {
      throw new Error("The AI model did not return a response.");
    }

    return { answer };
  }
);

/**
 * Main endpoint function for the AI Ambassador.
 * @param input The payload containing the userId, question, and chat history.
 * @returns The AI's answer.
 */
export async function ambassador(input: AmbassadorInput): Promise<AmbassadorOutput> {
  return ambassadorFlow(input);
}
