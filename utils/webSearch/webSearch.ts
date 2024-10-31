import TurndownService from 'turndown';
import { defaultHeaders } from "./config";

export interface SearchResult {
    url: string;
    title: string;
    favicon: string;
}

export class WebSearchService {
    async search(query: string): Promise<string[]> {
        const searchResults = await this.getSearchResults(query);
        if (!searchResults) return [];
        return this.getWebPages(searchResults);
    }

    async getSearchResults(query: string): Promise<SearchResult[] | undefined> {
        try {
            const response = await fetch(`https://search.brave.com/search?q=${encodeURIComponent(query)}`, {
                method: "GET",
                headers: defaultHeaders,
            });
            const html = await response.text();

            // Updated regex to match the new HTML structure
            const regex = /<div[^>]*data-type="web"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>.*?<img[^>]*class="favicon[^"]*"[^>]*src="([^"]*)".*?<div[^>]*class="title[^"]*"[^>]*>([^<]*)<\/div>/g;

            const matches = html.matchAll(regex);
            const results: SearchResult[] = [];

            for (const match of matches) {
                try {
                    const url = new URL(match[1]).toString();

                    // Filter out unwanted URLs
                    if (!url.includes('brave.com/brave-news') && !url.includes('wikipedia.org')) {
                        const favicon = match[2];
                        const title = match[3].trim();

                        results.push({
                            url,
                            title,
                            favicon
                        });
                    }
                } catch (e) {
                    console.error('Error processing match:', e);
                }
            }

            if (results.length === 0) {
                throw new Error("No search results found for query");
            }
            return results;

        } catch (e) {
            console.error('Error in getSearchResults:', e);
            return undefined;
        }
    }

    async getWebPages(links: SearchResult[]): Promise<string[]> {
        const webPages: string[] = [];
        let numPagesFetched = 0;
        for (const link of links) {
            if (numPagesFetched === 1) break; // Still limiting to 1 page for content processing

            try {
                const response = await fetch(link.url, {
                    method: "GET",
                    headers: defaultHeaders,
                });

                if (response.ok) {
                    const html = await response.text();

                    // Create metadata section with URL
                    const metadata = `### Source URL: ${link}\n\n`;

                    // Convert content to markdown and combine with metadata
                    const content = await this.convertToMarkdown(html);
                    const fullContent = `${metadata}${content}\n\n---\n\n`;

                    webPages.push(fullContent);
                    numPagesFetched++;
                }
            } catch (error) {
                console.error(`Failed to fetch ${link}:`, error);
            }
        }
        return webPages;
    }

    private async convertToMarkdown(html: string): Promise<string> {
        const turndownService = new TurndownService();
        const elements = ["head", "footer", "style", "script", "header", "nav", "navbar"];
        const pattern = new RegExp(`<(${elements.join('|')})[^>]*>.*?</\\1>`, 'gis');
        let cleanedHTML = html.replace(pattern, '');
        const patternWhitespace = /\s\s+/g;
        let markdown = turndownService.turndown(cleanedHTML);
        markdown = markdown.replace(patternWhitespace, "\n");
        markdown = markdown.replace(/-{4,}/g, '');
        return markdown;

    }
}