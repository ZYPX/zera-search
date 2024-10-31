// app/api/llm/route.ts
import { NextRequest } from 'next/server';
import { Message, Tool, ToolCall } from '@/utils/webSearch/types';
import { WebSearchService } from '@/utils/webSearch/webSearch';
import { apiConfig } from '@/utils/webSearch/config';

export async function POST(request: NextRequest) {
    const webSearchService = new WebSearchService();

    try {
        const body = await request.json();
        const prompt = body.query;
        console.log("hiih")
        // Create encoder for streaming
        const encoder = new TextEncoder();

        // Initialize stream
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Initialize messages and tools
        const tools: Tool[] = [{
            type: "function",
            function: {
                name: "webSearch",
                description: "Get real-time or current information from the internet.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "A well constructed google search query.",
                        }
                    },
                    required: ["query"],
                },
            },
        }];

        const msgs: Message[] = [
            {
                role: "system",
                content: `You are a helpful agent with the ability to access to the internet via the tool provided to you. 
                The tool provided is called webSearch and you should use it whenever you need information that is real-time
                or current that is not part of your training data. If you do search the web, make sure to always include 
                the source link in your response. The final output should be in formatted markdown.`
            },
            {
                role: "user",
                content: prompt
            }
        ];

        // Make initial API request
        const response = await fetch(apiConfig.baseUrl, {
            method: "POST",
            headers: apiConfig.headers,
            body: JSON.stringify({
                ...apiConfig.defaultRequestConfig,
                messages: msgs,
                tools,
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        // Process the stream
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        let toolCall: ToolCall = {
            id: "",
            type: "function",
            function: {
                name: "webSearch",
                arguments: ""
            }
        };

        // Process chunks and detect tool calls
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    const jsonString = line.slice(6);
                    try {
                        const chunkJSON = JSON.parse(jsonString);

                        // Stream content to client
                        if (chunkJSON.choices?.[0]?.delta?.content) {
                            await writer.write(encoder.encode(`data: ${JSON.stringify({
                                type: 'content',
                                content: chunkJSON.choices[0].delta.content
                            })}\n\n`));
                        }

                        // Detect tool calls
                        if (chunkJSON.choices?.[0]?.delta?.tool_calls?.[0]) {
                            const currentCall = chunkJSON.choices[0].delta.tool_calls[0];
                            if (currentCall.id) {
                                toolCall.id = currentCall.id;
                                toolCall.function.name = currentCall.function.name;
                            }
                            toolCall.function.arguments += currentCall.function.arguments || '';
                        }
                    } catch (e) {
                        console.error("Error processing chunk:", e);
                    }
                }
            }
        }

        // Handle tool call if detected
        if (toolCall.id !== "") {
            const searchQuery = JSON.parse(toolCall.function.arguments);

            // Get search results with metadata
            const searchResults = await webSearchService.getSearchResults(searchQuery.query);
            // Stream the first 10 results with metadata to client
            if (searchResults) {
                const smallPayload = { type: 'searchResults', results: [{ url: "test-url" }] };
                await writer.write(encoder.encode(`data: ${JSON.stringify(smallPayload)}\n\n`));
                console.log('After writer.write');
            }
            console.log('hhijhoh')
            // Continue with web content fetching...
            const webContent = await webSearchService.getWebPages(searchResults!
            );
            console.log("webContent" + webContent);
            // Add tool call and web content to messages
            msgs.push({
                role: "assistant",
                content: null,
                tool_calls: [toolCall]
            });

            msgs.push({
                role: "tool",
                name: toolCall.function.name,
                tool_call_id: toolCall.id,
                content: webContent.join("\n\n")
            });

            // Make follow-up request
            const followUpResponse = await fetch(apiConfig.baseUrl, {
                method: "POST",
                headers: apiConfig.headers,
                body: JSON.stringify({
                    ...apiConfig.defaultRequestConfig,
                    messages: msgs,
                }),
            });

            if (!followUpResponse.ok) {
                throw new Error(`Follow-up API request failed: ${followUpResponse.status}`);
            }

            // Stream follow-up response
            const followUpReader = followUpResponse.body?.getReader();
            if (!followUpReader) throw new Error("No reader available for follow-up");

            while (true) {
                const { done, value } = await followUpReader.read();
                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        const jsonString = line.slice(6);
                        try {
                            const chunkJSON = JSON.parse(jsonString);
                            if (chunkJSON.choices?.[0]?.delta?.content) {
                                await writer.write(encoder.encode(`data: ${JSON.stringify({
                                    type: 'content',
                                    content: chunkJSON.choices[0].delta.content
                                })}\n\n`));
                            }
                        } catch (e) {
                            console.error("Error processing follow-up chunk:", e);
                        }
                    }
                }
            }
        }

        await writer.close();

        return new Response(stream.readable, {
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