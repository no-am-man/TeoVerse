
'use server';

import { federationConfig } from '@/config';
import { getAvailableDocumentation } from '@/services/documentation-service';
import type { GenerateDocumentationOutput } from '@/ai/flows/generate-documentation-flow';

/**
 * Fetches all cached documentation articles for the current app version.
 * @returns A promise that resolves to a record mapping topic to its documentation.
 */
export async function fetchAvailableDocs(): Promise<Record<string, GenerateDocumentationOutput>> {
  try {
    const { version } = federationConfig;
    return await getAvailableDocumentation(version);
  } catch (error) {
    console.error("Failed to fetch available documentation:", error);
    return {};
  }
}
