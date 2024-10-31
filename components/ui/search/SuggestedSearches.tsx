import { Search, ArrowRight } from 'lucide-react'

export function SuggestedSearches({
                                      searches,
                                      onSearch,
                                      isLoading
                                  }: {
    searches: string[];
    onSearch: (query: string) => void;
    isLoading: boolean;
}) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-2">
            {searches.map((search, index) => (
                <button
                    key={index}
                    onClick={() => onSearch(search)}
                    className="flex items-center justify-between p-3 text-sm text-gray-900 bg-white rounded-lg
                   shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 group"
                >
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                        <span>{search}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100
                               group-hover:text-blue-500 transition-all duration-200 transform
                               group-hover:translate-x-1" />
                </button>
            ))}
        </div>
    )
}