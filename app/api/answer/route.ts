import { NextRequest } from 'next/server';
import { Message } from '@/utils/webSearch/types';
import { WebSearchService } from '@/utils/webSearch/webSearch';
import { apiConfig } from '@/utils/webSearch/config';

const webSearchService = new WebSearchService();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { searchResults, toolCall, originalQuery } = body;

        // Get web content if toolCall is provided and searchResults is not empty
        const webContent = toolCall && searchResults.length > 0
            ? await webSearchService.getWebPages(searchResults)
            : [];

        // Prepare messages for summarization
        const msgs: Message[] = [
            {
                role: "system",
                content: toolCall && searchResults.length > 0
                    ? `You are a helpful agent that answers the user's question based on the web content. 
                       Provide a detailed answer for the query and always include the source url at the end as a hyperlink.
                       The final output should be in formatted markdown and have nice formatting and spacing.`
                    : `You are a helpful AI assistant. Answer the question to the best of your ability and think step-by-step for problems that require reasoning, math, or science. 
                       Your responses should be in markdown format and be formatted nicely.`
            },
            {
                role: "user",
                content: originalQuery
            }
        ];

        if (toolCall && searchResults.length > 0) {
            msgs.push(
                {
                    role: "assistant",
                    content: null,
                    tool_calls: [toolCall]
                },
                {
                    role: "tool",
                    name: toolCall.function.name,
                    tool_call_id: toolCall.id,
                    content: webContent.join("\n\n")
                }
            );
        }

        // Make summarization request
        const response = await fetch(apiConfig.baseUrl, {
            method: "POST",
            headers: apiConfig.headers,
            body: JSON.stringify({
                ...apiConfig.defaultRequestConfig,
                messages: msgs,
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body!.getReader();
                const decoder = new TextDecoder();

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        const chunk = decoder.decode(value, { stream: true });
                        controller.enqueue(new TextEncoder().encode(chunk));
                    }
                } catch (error) {
                    controller.error(error);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
