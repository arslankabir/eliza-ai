import { elizaLogger } from "@elizaos/core";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@elizaos/core";
import { generateWebSearch } from "@elizaos/core";
import { SearchResult } from "@elizaos/core";
import { encodingForModel, TiktokenModel } from "js-tiktoken";

const DEFAULT_MAX_WEB_SEARCH_TOKENS = 4000;
const DEFAULT_MODEL_ENCODING = "gpt-3.5-turbo";

function getTotalTokensFromString(
    str: string,
    encodingName: TiktokenModel = DEFAULT_MODEL_ENCODING
) {
    const encoding = encodingForModel(encodingName);
    return encoding.encode(str).length;
}

function MaxTokens(
    data: string,
    maxTokens: number = DEFAULT_MAX_WEB_SEARCH_TOKENS
): string {
    if (getTotalTokensFromString(data) >= maxTokens) {
        return data.slice(0, maxTokens);
    }
    return data;
}

const webSearch: Action = {
    name: "WEB_SEARCH",
    description: "Perform a web search to find information.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return !!runtime.getSetting("TAVILY_API_KEY");
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        try {
            const searchResponse = await generateWebSearch(
                message.content.text,
                runtime
            );

            if (searchResponse?.results?.length) {
                // Use debug log to reduce verbosity
                elizaLogger.debug(`Web Search Results: ${searchResponse.results.length} sources found`);

                const responseText = searchResponse.answer || "Search completed.";
                const resourceLinks = searchResponse.results
                    .map((result: SearchResult, index: number) => 
                        `${index + 1}. [${result.title}](${result.url})`)
                    .join("\n");

                callback({
                    text: MaxTokens(
                        responseText + (resourceLinks ? `\n\nResources:\n${resourceLinks}` : ""), 
                        DEFAULT_MAX_WEB_SEARCH_TOKENS
                    ),
                });
            } else {
                callback({ text: "No search results found." });
            }
        } catch (error) {
            callback({ text: "An error occurred during web search." });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Find the latest news about SpaceX launches." },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here is the latest news about SpaceX launches:",
                    action: "WEB_SEARCH",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Can you find details about the iPhone 16 release?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here are the details I found about the iPhone 16 release:",
                    action: "WEB_SEARCH",
                },
            },
        ],
    ],
} as Action;

export const webSearchPlugin: Plugin = {
    name: "webSearch",
    description: "Search web",
    actions: [webSearch],
    evaluators: [],
    providers: [],
};

export default webSearchPlugin;
