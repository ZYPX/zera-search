'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/ui/search/SearchBar'
import { SourceLinks } from '@/components/ui/search/SourceLinks'
import { SearchSummary } from '@/components/ui/search/SearchSummary'
import { SuggestedSearches } from '@/components/ui/search/SuggestedSearches'
import { Check, Clipboard, Link2, MessageSquare, Sparkles } from 'lucide-react'
import EnhancedWeatherWidget, { WeatherData } from '@/components/ui/weather/weatherWidget'

interface SearchResult {
    url: string;
    title: string;
    favicon: string;
}

export default function App() {
    const [isSearching, setIsSearching] = useState<boolean>(false)
    const [isAnswering, setIsAnswering] = useState<boolean>(false)
    const [searchPerformed, setSearchPerformed] = useState<boolean>(false)
    const [sources, setSources] = useState<SearchResult[]>([])
    const [summary, setSummary] = useState<string>('')
    const [suggestedSearches, setSuggestedSearches] = useState<string[]>([])
    const [copied, setCopied] = useState(false)
    const [currentQuery, setCurrentQuery] = useState('')
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    const [isLoadingWeather, setIsLoadingWeather] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(summary)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSearch = async (query: string) => {
        setCurrentQuery(query)
        setSummary("");
        setWeatherData(null);
        setIsSearching(true);
        setSearchPerformed(true);
        setIsAnswering(true);
        setIsLoadingWeather(false);

        try {
            const toolCall = await fetch('/api/results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({query}),
            });

            if (!toolCall.body) {
                throw new Error('Response body is null');
            }

            const searchData = await toolCall.json();
            if (searchData.relatedSearches.length > 0 && searchData.searchResults.length > 0) {
                setSuggestedSearches(searchData.relatedSearches);
                setSources(searchData.searchResults);
            }
            setIsSearching(false);

            const llmResponse = await fetch('/api/answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchData),
            });
            if (!llmResponse.body) {
                throw new Error('Response body is null');
            }
            setIsAnswering(false)
            await processStream(llmResponse);

        } catch (error) {
            setIsSearching(false);
            setIsAnswering(false);
            setSuggestedSearches([]);
            setSources([]);
            setSummary("No results.");
            console.error('Error:', error);
        }
    }

    async function processStream(response: Response) {
        try {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            let currentToolCall: {
                id?: string;
                name?: string;
                arguments: string;
            } = {
                arguments: ''
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.startsWith("data: ") && line !== "data: [DONE]") {
                        try {
                            const json = JSON.parse(line.slice(6));

                            // Handle tool calls
                            const toolCallDelta = json.choices[0]?.delta?.tool_calls?.[0];
                            if (toolCallDelta) {
                                // Start of new tool call
                                if (toolCallDelta.id) {
                                    currentToolCall.id = toolCallDelta.id;
                                    if (toolCallDelta.function?.name === 'getWeatherData') {
                                        setIsLoadingWeather(true); // Start loading when we detect weather tool call
                                    }
                                }

                                // Function name
                                if (toolCallDelta.function?.name) {
                                    currentToolCall.name = toolCallDelta.function.name;
                                }

                                // Accumulate arguments
                                if (toolCallDelta.function?.arguments) {
                                    currentToolCall.arguments += toolCallDelta.function.arguments;
                                }

                                // Check if this is the end of the tool call
                                if (currentToolCall.id && currentToolCall.name === 'getWeatherData') {
                                    try {
                                        const argumentsJson = JSON.parse(currentToolCall.arguments);
                                        setWeatherData(argumentsJson);
                                        setIsLoadingWeather(false); // Stop loading once we have the data
                                        currentToolCall = { arguments: '' };
                                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                                    } catch (e) {
                                        // Not complete JSON yet, continue accumulating
                                    }
                                }
                            }

                            // Handle regular content
                            const content = json.choices[0]?.delta?.content;
                            if (content) {
                                setSummary((prev) => prev + content);
                            }
                        } catch (error) {
                            console.error("Error parsing JSON:", error);
                        }
                    }
                }
            }
        } catch (e) {
            setIsLoadingWeather(false); // Make sure to reset loading state on error
            throw new Error("Streaming error: " + e);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
            <div className={`transition-all duration-500 ease-in-out ${searchPerformed ? 'pt-5' : 'pt-[30vh]'}`}>
                <SearchBar
                    onSearch={handleSearch}
                    isSearching={isSearching}
                    isInitialState={!searchPerformed}
                    initialQuery={currentQuery}
                />
                {searchPerformed && (
                    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50">
                                    <Link2 className="w-3.5 h-3.5 text-blue-500" />
                                </div>
                                <h2 className="text-sm font-medium text-gray-700">Sources</h2>
                            </div>
                            <SourceLinks sources={sources} isLoading={isSearching} />
                        </div>

                        <div className="border-t border-gray-200" />

                        <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-50">
                                        <MessageSquare className="w-3.5 h-3.5 text-purple-500"/>
                                    </div>
                                    <h2 className="text-sm font-medium text-gray-700">Answer</h2>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="p-2 text-gray-500 hover:text-gray-700
                   hover:bg-gray-50 rounded-full transition-all duration-200"
                                    title="Copy to clipboard"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-green-500"/>
                                    ) : (
                                        <Clipboard className="w-4 h-4"/>
                                    )}
                                </button>
                            </div>
                            {(isLoadingWeather || weatherData) && (
                                <div className="mb-4 rounded-lg border border-gray-200 p-4">
                                    {isLoadingWeather ? (
                                        <div className="flex items-center justify-center space-x-2 py-8">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                                            <span className="text-gray-700">Gathering weather data...</span>
                                        </div>
                                    ) : weatherData ? (
                                        <EnhancedWeatherWidget data={weatherData} />
                                    ) : null}
                                </div>
                            )}
                            {(isAnswering || summary) && (
                                <SearchSummary summary={summary} isLoading={isAnswering} />
                            )}
                        </div>

                        <div className="border-t border-gray-200"/>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-50">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500"/>
                                </div>
                                <h2 className="text-sm font-medium text-gray-700">Related Searches</h2>
                            </div>
                            <SuggestedSearches
                                searches={suggestedSearches}
                                onSearch={handleSearch}
                                isLoading={isSearching}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}