'use client'

import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { Clipboard, Check } from 'lucide-react'

interface SearchSummaryProps {
    summary: string;
    isLoading: boolean;
}

export function SearchSummary({ summary, isLoading }: SearchSummaryProps) {
    const [parsedSummary, setParsedSummary] = useState('')

    useEffect(() => {
        const parseMd = async () => {
            if (summary) {
                const parsed = await marked.parse(summary)
                setParsedSummary(parsed)
            }
        }
        parseMd()
    }, [summary])

    if (isLoading) {
        return (
            <div className="mt-6 space-y-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                ))}
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="max-w-none bg-white rounded-lg shadow-sm p-6 text-gray-800
                    hover:shadow-md transition-shadow duration-200 text-wrap">
                <div className="prose prose-sm prose-zinc" dangerouslySetInnerHTML={{ __html: parsedSummary }}></div>
            </div>
        </div>
    )
}