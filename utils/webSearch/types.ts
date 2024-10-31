export interface Headers {
    [key: string]: string;
}

export interface ToolCallResponse {
    query: string;
    relatedSearches: string[];  // LLM will generate these
}

export interface ToolFunction {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: {
            query: {
                type: string;
                description: string;
            };
            relatedSearches: {
                type: "array";
                items: {
                    type: "string";
                };
                description: string;
                minItems: number;
                maxItems: number;
            };
            [key: string]: {
                type: string | "array";
                description: string;
                items?: {
                    type: "string";
                };
                minItems?: number;
                maxItems?: number;
            };
        };
        required: string[];
    };
}

export interface Tool {
    type: string;
    function: ToolFunction;
}

export interface Message {
    role: string;
    content: string | null;
    tool_calls?: ToolCall[];
    name?: string;
    tool_call_id?: string;
}

export interface ToolCall {
    id: string;
    type: string;
    function: {
        name: string;
        arguments: string;
    };
}

export interface StreamChunk {
    choices: {
        delta: {
            content?: string;
            tool_calls?: ToolCall[];
        };
    }[];
}