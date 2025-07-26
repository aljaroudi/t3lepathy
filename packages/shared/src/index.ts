import {
  generateText,
  streamText,
  experimental_generateImage as generateImage,
  type ModelMessage as CoreMessage,
} from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createAnthropic } from "@ai-sdk/anthropic"
import type { Model, Provider } from "./types"

export type { Model, Provider } from "./types"
export type { ImagePart, TextPart, FilePart } from "ai"

function getModel(model: Model, apiKey: string, useSearchGrounding: boolean) {
  switch (model.provider) {
    case "OpenAI":
      const openai = createOpenAI({ apiKey })
      return {
        model: openai(model.name),
        tools: useSearchGrounding
          ? { webSearch: openai.tools.webSearchPreview({}) }
          : undefined,
      }
    case "Google":
      const google = createGoogleGenerativeAI({ apiKey })
      return {
        model: google(model.name),
        tools: useSearchGrounding
          ? { webSearch: google.tools.googleSearch({}) }
          : undefined,
      }
    case "Anthropic":
      const anthropic = createAnthropic({ apiKey })
      return {
        model: anthropic(model.name),
        tools: { webSearch: anthropic.tools.webSearch_20250305() },
      }
  }
}

export async function genImage({
  message,
  apiKey,
}: {
  message: string
  apiKey: string
}) {
  return generateImage({
    model: createOpenAI({ apiKey }).imageModel("dall-e-3"),
    prompt: message,
    seed: getSeed(),
  })
}

export async function generateResponse({
  messages,
  model,
  maxSentences,
  grounding,
  onStepFinish,
  onChunk,
  apiKey,
}: {
  messages: CoreMessage[]
  model: Model
  maxSentences: number | null
  grounding: boolean
  onStepFinish: (usage: {
    inputTokens: number | undefined
    outputTokens: number | undefined
  }) => void
  onChunk: (chunk: string) => Promise<void>
  apiKey: string
}) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const systemPrompt = "You are a friendly assistant!"
      const { model: modelObject, tools } = getModel(model, apiKey, grounding)

      const result = streamText({
        model: modelObject,
        system: maxSentences
          ? systemPrompt + ` You will respond in ${maxSentences} sentences.`
          : systemPrompt,
        messages,
        seed: getSeed(),
        onStepFinish: ({ usage }) => onStepFinish(usage),
        tools,
      })

      for await (const chunk of result.textStream) {
        await onChunk(chunk)
      }
      resolve()
    } catch (error) {
      reject(error)
    }
  })
}

export async function expectsImage({
  prompt,
  model,
  apiKey,
}: {
  prompt: string
  model: Model
  apiKey: string
}): Promise<boolean> {
  if (!model.capabilities.has("image-output")) return false
  return generateText({
    model: getModel(model, apiKey, false).model,
    system:
      "You are a helpful assistant that can determine if a message expects an image. If it does, return 'true'. If it doesn't, return 'false'. If you are not sure, return 'false'.",
    prompt,
  }).then(result => result.text.includes("true"))
}

export async function generateTitle({
  message,
  model,
  apiKey,
}: {
  message: string
  model: Model
  apiKey: string
}) {
  return generateText({
    model: getModel(model, apiKey, false).model,
    system:
      "Generate a short, descriptive title (max 5 words) for this conversation based on the user's first message. The title should capture the main topic or purpose of the discussion.",
    messages: [{ role: "user", content: message }],
  }).then(result => result.text)
}

export const MODELS = [
  {
    provider: "OpenAI",
    title: "GPT-4o Mini",
    name: "gpt-4o-mini",
    description: "Fast, cheap",
    capabilities: new Set(["text-output", "file-input"]),
  },
  {
    provider: "OpenAI",
    title: "GPT-4o",
    name: "gpt-4o",
    description: "Text + image input",
    capabilities: new Set(["text-output", "file-input", "image-input"]),
  },
  {
    provider: "OpenAI",
    title: "DALL·E 3",
    name: "dall-e-3",
    description: "Image generation only",
    capabilities: new Set(["image-output"]),
  },
  {
    provider: "Google",
    title: "Gemini 2.5 Flash Lite",
    name: "gemini-2.5-flash-lite",
    description: "Fastest, cheapest",
    capabilities: new Set(["text-output", "file-input"]),
  },
  {
    provider: "Google",
    title: "Gemini 2.5 Flash",
    name: "gemini-2.5-flash",
    description: "Fast, cheap",
    capabilities: new Set(["text-output", "file-input"]),
  },
  {
    provider: "Google",
    title: "Gemini 2.5 Pro",
    name: "gemini-2.5-pro",
    description: "Advanced",
    capabilities: new Set(["text-output", "file-input"]),
  },
  {
    provider: "Anthropic",
    title: "Claude 4 Sonnet",
    name: "claude-4-sonnet-20250514",
    description: "Smart, balanced Claude",
    capabilities: new Set(["text-output", "file-input"]),
  },
] satisfies Model[]

export const PROVIDERS = ["Google", "OpenAI", "Anthropic"] satisfies Provider[]

function getSeed() {
  return Math.floor(Math.random() * 1_000_000)
}

export function getFileTypes(model: Model) {
  let types = ""
  if (model.capabilities.has("file-input")) {
    types +=
      ".pdf,.doc,.docx,.txt,.md,.rtf,.csv,.xls,.xlsx,.ppt,.pptx,.json,.xml,.html,.js,.ts,.jsx,.tsx,.py,.java,.c,.cpp,.cs,.go,.rb,.php,.sh,.swift,.rs,.kt,.m,.h,.sql,.yml,.yaml,.toml,.ini,.bat,.pl,.lua,.r,.ipynb,.tex,.scss,.sass,.less,.css,"
  }
  if (model.capabilities.has("image-input")) {
    types += "image/*,"
  }
  return types.slice(0, -1)
}

export function getPrice({
  role,
  model,
  tokens,
}: {
  role: "user" | "assistant"
  model: Model["name"]
  tokens: number | null
}) {
  if (!tokens) return null
  if (model === "dall-e-3") return null
  const price =
    role === "user" ? PRICES_INPUT.get(model) : PRICES_OUTPUT.get(model)
  if (!price) return null
  return price * tokens
}

const PRICES_INPUT = new Map<Model["name"], number>([
  // $0.10 per 1M tokens
  ["gemini-2.5-flash-lite", 0.000_000_10],
  // $0.30 per 1M tokens
  ["gemini-2.5-flash", 0.000_000_30],
  // $1.25 per 1M tokens
  ["gemini-2.5-pro", 0.000_001_25],
  // OpenAI
  // $0.15 per 1M tokens
  ["gpt-4o-mini", 0.000_000_15],
  // $2.50 per 1M tokens
  ["gpt-4o", 0.000_002_50],
])

const PRICES_OUTPUT = new Map<Model["name"], number>([
  // $0.30 per 1M tokens
  ["gemini-2.5-flash-lite", 0.000_000_40],
  // $1.25 per 1M tokens
  ["gemini-2.5-flash", 0.000_002_50],
  // $10.00 per 1M tokens
  ["gemini-2.5-pro", 0.000_010_00],
  // OpenAI
  // $0.60 per 1M tokens
  ["gpt-4o-mini", 0.000_000_60],
  // $10.00 per 1M tokens
  ["gpt-4o", 0.000_010_00],
])
