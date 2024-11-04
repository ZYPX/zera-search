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

        const weatherToolDefinition = {
            type: "function",
            function: {
                name: "getWeatherData",
                description: "Get detailed weather information for a location in a standardized format for the weather widget",
                parameters: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string",
                            description: "Always 'weatherWidget'",
                            enum: ["weatherWidget"]
                        },
                        location: {
                            type: "string",
                            description: "Location for the weather data"
                        },
                        currentTime: {
                            type: "string",
                            description: "Current time in 24-hour format (HH:MM)",
                            pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                        },
                        temperatureUnit: {
                            type: "string",
                            enum: ["C", "F"],
                            description: "Temperature unit, prefer Fahrenheit ('F') if available, otherwise use Celsius ('C')",
                            default: "F"
                        },
                        windSpeedUnit: {
                            type: "string",
                            enum: ["km/h", "mph"],
                            description: "WindSpeed unit, use 'mph' if temperature unit is 'F' and 'km/h' if temperature unit is 'C'",
                            default: "mph"
                        },
                        current: {
                            type: "object",
                            properties: {
                                temperature: {
                                    type: "number",
                                    description: "Current temperature in the specified unit"
                                },
                                condition: {
                                    type: "string",
                                    enum: ["clear", "cloudy", "rainy", "snowy", "thunderstorm", "foggy", "hail", "showers", "partly cloudy"],
                                    description: "Current weather condition"
                                },
                                humidity: {
                                    type: "number",
                                    description: "Current humidity percentage (0-100)",
                                    minimum: 0,
                                    maximum: 100
                                },
                                windSpeed: {
                                    type: "number",
                                    description: "Current wind speed in miles per hour (mph)",
                                    minimum: 0
                                },
                                sunrise: {
                                    type: "string",
                                    description: "Sunrise time in 24-hour format (HH:MM)",
                                    pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                                },
                                sunset: {
                                    type: "string",
                                    description: "Sunset time in 24-hour format (HH:MM)",
                                    pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$"
                                },
                                precipitation: {
                                    type: "number",
                                    description: "Percentage chance of precipitation (0-100)",
                                    minimum: 0,
                                    maximum: 100
                                }
                            },
                            required: ["temperature", "condition", "humidity", "windSpeed", "sunrise", "sunset", "precipitation"]
                        },
                        forecast: {
                            type: "array",
                            description: "Weather forecast for up to 7 days after the current day. Include if data is available.",
                            maxItems: 7,
                            minItems: 7,
                            items: {
                                type: "object",
                                properties: {
                                    day: {
                                        type: "string",
                                        enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                                        description: "Day of the forecast"
                                    },
                                    highTemp: {
                                        type: "number",
                                        description: "Highest temperature forecast in the specified unit"
                                    },
                                    lowTemp: {
                                        type: "number",
                                        description: "Lowest temperature forecast in the specified unit"
                                    },
                                    condition: {
                                        type: "string",
                                        enum: ["clear", "cloudy", "rainy", "snowy", "thunderstorm", "foggy", "hail", "showers", "partly cloudy"],
                                        description: "Forecast weather condition"
                                    },
                                    precipitation: {
                                        type: "number",
                                        description: "Percentage chance of precipitation (0-100)",
                                        minimum: 0,
                                        maximum: 100
                                    }
                                },
                                required: ["day", "highTemp", "lowTemp", "condition", "precipitation"]
                            }
                        }
                    },
                    required: ["title", "location", "currentTime", "temperatureUnit", "current"]
                }
            }
        };

        // Prepare messages for summarization
        const msgs: Message[] = [
            {
                role: "system",
                content: toolCall && searchResults.length > 0
                    ? `You are a helpful agent that answers the user's question based on the web content. 
                       Provide a detailed answer for the query and always include the source url at the end as a hyperlink.
                       The final output should be in formatted markdown and have nice formatting and spacing.
                       
                       If the user's question is in regard to the current weather at a location, use the tool getWeatherData and use context from the scraped web page to fill it with data.
                       `
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
                tools: [weatherToolDefinition]
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
