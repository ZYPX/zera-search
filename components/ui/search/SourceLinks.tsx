import { Globe } from 'lucide-react'

interface Source {
    title: string;
    url: string;
    favicon: string;
}

interface SourceLinksProps {
    sources: Source[];
    isLoading: boolean;
}

export function SourceLinks({ sources, isLoading }: SourceLinksProps) {
    if (isLoading) {
        return (
            <div className="overflow-x-auto pb-2 scrollbar-styled">
                <div className="flex space-x-4 w-max">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-64 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-x-scroll pb-2 scrollbar-styled">
            <div className="flex space-x-4 w-max">
                {sources.map((source, index) => (
                    <a
                        key={index}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-x-2 flex-shrink-0 w-64 h-24 px-3 py-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                            {source.favicon ? (
                                <img src={source.favicon} alt="favicon" className="h-5 w-5" />
                            ) : (
                                <Globe className="w-5 h-5 text-gray-600" />
                            )}
                        </div>
                        <div className="flex flex-col gap-y-1 w-full overflow-hidden">
              <span className="text-sm font-medium text-gray-700 truncate max-w-full">
                {source.title}
              </span>
                            <span className="text-xs font-medium text-gray-500 truncate max-w-full">
                {source.url}
              </span>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}