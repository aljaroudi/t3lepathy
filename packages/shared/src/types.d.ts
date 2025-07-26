import type { createOpenAI } from "@ai-sdk/openai"
import type { createGoogleGenerativeAI } from "@ai-sdk/google"
import type { createAnthropic } from "@ai-sdk/anthropic"

type OpenAIModel = Parameters<ReturnType<typeof createOpenAI>>[0]
type GoogleModel = Parameters<ReturnType<typeof createGoogleGenerativeAI>>[0]
type AnthropicModel = Parameters<ReturnType<typeof createAnthropic>>[0]
type Capabilities =
  | "image-input"
  | "file-input"
  | "text-output"
  | "image-output"

type Model =
  | {
      provider: "OpenAI"
      name: OpenAIModel
      title: string
      description: string
      capabilities: Set<Capabilities>
    }
  | {
      provider: "Google"
      name: GoogleModel
      title: string
      description: string
      capabilities: Set<Capabilities>
    }
  | {
      provider: "Anthropic"
      name: AnthropicModel
      title: string
      description: string
      capabilities: Set<Capabilities>
    }

type Provider = Model["provider"]
