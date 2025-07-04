'use server';

/**
 * @fileOverview A flow to generate a summary of the events leading up to a vote to kick.
 *
 * - summarizeVoteKick - A function that generates the vote kick summary.
 * - SummarizeVoteKickInput - The input type for the summarizeVoteKick function.
 * - SummarizeVoteKickOutput - The return type for the summarizeVoteKick function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeVoteKickInputSchema = z.object({
  reason: z.string().describe('The reason provided for the vote to kick.'),
  trainId: z.string().describe('The ID of the train journey.'),
  userToKickName: z.string().describe('The name of the user being voted to kick.'),
  initiatorName: z.string().describe('The name of the user who initiated the vote to kick.'),
});
export type SummarizeVoteKickInput = z.infer<typeof SummarizeVoteKickInputSchema>;

const SummarizeVoteKickOutputSchema = z.object({
  summary: z.string().describe('A brief, neutral summary of the events leading up to the vote.'),
});
export type SummarizeVoteKickOutput = z.infer<typeof SummarizeVoteKickOutputSchema>;

export async function summarizeVoteKick(input: SummarizeVoteKickInput): Promise<SummarizeVoteKickOutput> {
  return summarizeVoteKickFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeVoteKickPrompt',
  input: {schema: SummarizeVoteKickInputSchema},
  output: {schema: SummarizeVoteKickOutputSchema},
  prompt: `You are an assistant that summarizes votes to kick in a chat application.

  Given the following information about the vote to kick, create a brief, neutral summary of the events leading up to the vote. The summary should be no more than two sentences.

  Reason: {{{reason}}}
  Train ID: {{{trainId}}}
  User to Kick: {{{userToKickName}}}
  Initiator: {{{initiatorName}}}

  Summary: `,
});

const summarizeVoteKickFlow = ai.defineFlow(
  {
    name: 'summarizeVoteKickFlow',
    inputSchema: SummarizeVoteKickInputSchema,
    outputSchema: SummarizeVoteKickOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
