import { useState, useEffect } from 'react'
import { Search, Sparkles } from 'lucide-react'

interface SearchBarProps {
    onSearch: (query: string) => void;
    isSearching: boolean;
    isInitialState?: boolean;
    initialQuery?: string; // New prop to set initial query
}

export function SearchBar({ onSearch, isSearching, isInitialState = false, initialQuery = '' }: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery)

    // Update query when initialQuery prop changes
    useEffect(() => {
        setQuery(initialQuery)
    }, [initialQuery])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            onSearch(query)
        }
    }

    const exampleQueries = [
        "What is quantum computing?",
        "When is the best time to go to japan?",
        "Explain machine learning",
        "What time is it in Toronto?"
    ]

    return (
        <div className={`${isInitialState ? 'text-center' : ''}`}>
            {isInitialState && (
                <div className="flex items-center justify-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <h1 className="text-xl font-medium text-gray-700">Ask me anything</h1>
                </div>
            )}
            <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto px-4">
                <div className="relative group">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="What would you like to know?"
                        className={`w-full text-base text-gray-900 bg-white 
              border-0 ring-1 ring-gray-200 
              focus:ring-2 focus:ring-blue-500 
              group-hover:ring-gray-300 
              transition-all duration-200
              placeholder:text-gray-400
              outline-none
              ${isInitialState
                            ? 'h-14 pl-14 pr-6 rounded-full shadow-lg hover:shadow-xl'
                            : 'h-12 pl-12 pr-4 rounded-full shadow-sm hover:shadow-md'}`}
                        disabled={isSearching}
                    />
                    <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 
            flex items-center justify-center
            ${isInitialState ? 'w-6 h-6' : 'w-5 h-5'}`}>
                        <Search className={`text-gray-400 group-hover:text-blue-400 transition-colors duration-200
              ${isInitialState ? 'w-5 h-5' : 'w-4 h-4'}`}/>
                    </div>
                </div>
            </form>
            {isInitialState && (
                <div className="mt-6 px-4">
                    <p className="text-sm text-gray-500 mb-3">Try asking about:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {exampleQueries.map((exampleQuery, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setQuery(exampleQuery)
                                    onSearch(exampleQuery)
                                }}
                                className="px-4 py-2 text-sm text-gray-600 bg-white rounded-full
                  border border-gray-200 hover:border-gray-300 hover:bg-gray-50
                  transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                {exampleQuery}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}