'use server';

/**
 * @fileOverview Summarizes user reviews for a product using AI.
 *
 * - summarizeReviews - A function that takes product reviews as input and returns a summary.
 * - SummarizeReviewsInput - The input type for the summarizeReviews function.
 * - SummarizeReviewsOutput - The return type for the summarizeReviews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeReviewsInputSchema = z.object({
  reviews: z.array(z.string()).describe('An array of user reviews for a product.'),
});
export type SummarizeReviewsInput = z.infer<typeof SummarizeReviewsInputSchema>;

const SummarizeReviewsOutputSchema = z.object({
  summary: z.string().describe('A summary of the user reviews.'),
});
export type SummarizeReviewsOutput = z.infer<typeof SummarizeReviewsOutputSchema>;

export async function summarizeReviews(input: SummarizeReviewsInput): Promise<SummarizeReviewsOutput> {
  return summarizeReviewsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeReviewsPrompt',
  input: {schema: SummarizeReviewsInputSchema},
  output: {schema: SummarizeReviewsOutputSchema},
  prompt: `You are an AI assistant that summarizes product reviews.

  Summarize the following reviews:

  {{#each reviews}}
  - {{{this}}}
  {{/each}}
  `,
});

const summarizeReviewsFlow = ai.defineFlow(
  {
    name: 'summarizeReviewsFlow',
    inputSchema: SummarizeReviewsInputSchema,
    outputSchema: SummarizeReviewsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
