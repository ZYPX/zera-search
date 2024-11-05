
# Zera Search

Zera Search is an open-source, AI-assisted search engine that leverages Next.js 15 and React 19 to deliver an experience similar to Perplexity or SearchGPT. The application scrapes web pages using AI to generate relevant answers for search queries powered by Brave Search. It also includes a dynamic 7-day weather widget with unit switching.

## Demo
[Basic Search](https://x.com/ZYPX4/status/1851795088432636318)

[Weather Widget](https://x.com/ZYPX4/status/1853219280076099996)

## Features

- **AI-assisted search**: Uses Brave Search and AI-driven web scraping to provide relevant answers to search queries.
- **Markdown support**: Uses `marked.js` to render Markdown as HTML.
- **HTML to Markdown conversion**: Uses `turndown` to convert web pages to LLM-ready Markdown documents.
- **Weather widget**: Interactive weather widget with a 7-day forecast and unit conversion.
- **Customizable AI model**: Supports OpenRouter.ai for AI inference with configurable parameters.

## Getting Started

### Prerequisites

- Node.js and npm installed.
- A `.env` file in the root directory containing `OR_KEY` with an OpenRouter API key.

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd zera-search
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

   **Note**: If there are issues compiling, try removing the `--turbo` flag in `package.json`.

## Configuration

In `config.ts`, the API settings and default model for AI inference are configured. The relevant code is as follows:

```typescript
export const apiConfig: APIConfig = {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultRequestConfig: {
        model: "openai/gpt-4o-mini",
        temperature: 1,
        stream: true,
        tool_choice: "auto",
        max_tokens: 4096,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
    },
    headers: apiHeaders
};
```

- **Model**: The default AI model is set to `openai/gpt-4o-mini`, but it can be customized in `config.ts`.
- **Tool Support**: Ensure the chosen model supports tool calling for full functionality.
- **Environment Variable**: Ensure that the `.env` file includes `OR_KEY` with a valid OpenRouter API key.

### API Route Overrides

The default API configuration values in `config.ts` can be changed directly or overridden, as shown in the following example:

```javascript
const response = await fetch(apiConfig.baseUrl, {
    method: "POST",
    headers: apiConfig.headers,
    body: JSON.stringify({
        ...apiConfig.defaultRequestConfig,
        messages: msgs,
        tools: [weatherToolDefinition]
    }),
});
```

### Web Search Configuration

By default, Zera Search scrapes a single page for each search result. To increase the number of pages, modify the line in `webSearch.ts`:

```javascript
if (numPagesFetched === 1) break;
```

Adjust the number from `1` to the desired value.

## Technologies Used

- **Next.js 15 App Router**
- **React 19**
- **Tailwind CSS**: For styling
- **Marked.js**: Markdown to HTML conversion
- **Turndown**: HTML to Markdown conversion for LLM-ready documents
- **OpenRouter.ai**: AI inference via configurable API calls

## License

This project is licensed under the MIT License.
