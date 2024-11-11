import { NextRequest } from 'next/server';
import { Message, Tool, ToolCallResponse } from '@/utils/webSearch/types';
import { WebSearchService } from '@/utils/webSearch/webSearch';
import { apiConfig } from '@/utils/webSearch/config';

const webSearchService = new WebSearchService();

function processChunk(line: string, toolCall: any) {
    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const jsonString = line.slice(6);
        try {
            const chunkJSON = JSON.parse(jsonString);
            if (chunkJSON.choices?.[0]?.delta?.tool_calls?.[0]) {
                const currentCall = chunkJSON.choices[0].delta.tool_calls[0];
                if (currentCall.id) {
                    toolCall.id = currentCall.id;
                    toolCall.function.name = currentCall.function.name;
                }
                toolCall.function.arguments += currentCall.function.arguments || '';
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            // Silent fail for invalid JSON chunks
            // console.error("Error processing chunk:", e);
        }
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const prompt = body.query;

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
                        },
                        relatedSearches: {
                            type: "array",
                            description: "Generate 4 related search queries that would be helpful for exploring this topic further.",
                            items: {
                                type: "string"
                            },
                            minItems: 4,
                            maxItems: 4
                        }
                    },
                    required: ["query", "relatedSearches"],
                },
            },
        }];

        const msgs: Message[] = [
            {
                role: "system",
                content: `You are a helpful agent with the ability to access to the internet via the tool provided to you. 
                Use the webSearch tool to find relevant information for the user's query.
                If the query is about the current weather at a location, generate the query as "Current weather at LOCATION weather.com ten day forecast".
                If the query relates to news or current events, add the current date to the end of the query. The current date is: ${new Date().toLocaleDateString()}.
                Always generate 4 thoughtful related search queries that would help explore different aspects or angles of the topic.`
            },
            {
                role: "user",
                content: prompt
            }
        ];

        // Make initial API request to get search query
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

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const toolCall = {
            id: "",
            type: "function",
            function: {
                name: "webSearch",
                arguments: ""
            }
        };

        let buffer = '';

        // Process chunks to get tool call
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                // Process any remaining data in buffer
                if (buffer.trim()) {
                    processChunk(buffer, toolCall);
                }
                break;
            }

            // Append new chunk to buffer
            buffer += new TextDecoder().decode(value, { stream: true });

            // Process complete lines
            let newlineIndex;
            while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, newlineIndex);
                buffer = buffer.slice(newlineIndex + 1);

                if (line.trim()) {
                    processChunk(line, toolCall);
                }
            }
        }

        // Get search results if tool call exists
        if (toolCall.id !== "") {
            try {
                const parsedArgs: ToolCallResponse = JSON.parse(toolCall.function.arguments);
                const searchResults = await webSearchService.getSearchResults(parsedArgs.query);

                return new Response(JSON.stringify({
                    searchResults,
                    relatedSearches: parsedArgs.relatedSearches,
                    toolCall,
                    originalQuery: prompt
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } catch (error) {
                console.error('Error parsing tool call arguments:', error);
                throw error;
            }
        }

        return new Response(JSON.stringify({
            searchResults: [],
            relatedSearches: [],
            toolCall: null,
            originalQuery: prompt
        }), {
            headers: {
                'Content-Type': 'application/json',
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