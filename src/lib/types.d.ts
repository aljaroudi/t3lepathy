import type { DBSchema } from "idb"
import type { createOpenAI } from "@ai-sdk/openai"
import type { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { createAnthropic } from "@ai-sdk/anthropic"

export type Chat = {
  id: string
  title: string
}

export type Message = {
  id: string
  chatId: string
  content: string
  role: "user" | "assistant"
  date: Date
}

export interface ChatDB extends DBSchema {
  chats: {
    key: string
    value: Chat
  }
  messages: {
    key: string
    value: Message
    indexes: { chatId: string }
  }
}

// Model options are not exported by the SDKs, so we need to infer them from the parameters of the create functions
type OpenAIModel = Parameters<ReturnType<typeof createOpenAI>>[0]
type GoogleModel = Parameters<ReturnType<typeof createGoogleGenerativeAI>>[0]
type AnthropicModel = Parameters<ReturnType<typeof createAnthropic>>[0]

export type Model =
  | { provider: "OpenAI"; name: OpenAIModel; title: string }
  | { provider: "Google"; name: GoogleModel; title: string }
  | { provider: "Anthropic"; name: AnthropicModel; title: string }
