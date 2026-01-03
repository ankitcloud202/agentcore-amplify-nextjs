/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 30

const bedrock = createAmazonBedrock({
  region: 'eu-west-2',
  credentialProvider: fromNodeProviderChain(),
})

export async function OPTIONS(req: Request) {
  const origin = req.headers.get('origin')
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amzn-Trace-Id, X-Amzn-Bedrock-AgentCore-Runtime-Session-Id',
      'Access-Control-Allow-Credentials': 'true',
    },
  })
}

export async function POST(req: Request) {
  // Handle CORS preflight
  const origin = req.headers.get('origin')
  
  const {
    messages,
    model,
    reasoning,
  }: { messages: UIMessage[]; model: string; reasoning: string } =
    await req.json()

  // Only enable reasoning for Claude 3.5 Sonnet and Claude 3 Opus (confirmed working models)
  const supportsReasoning = model.includes('claude-3-5-sonnet') || model === 'anthropic.claude-3-opus-20240229-v1:0'

  const streamTextOptions: unknown = {
    model: bedrock(model),
    messages: convertToModelMessages(messages),
    system: 'You are a helpful assistant that can answer questions and help with tasks',
  }

  // Only add reasoning_effort for confirmed supported models
  if (supportsReasoning && reasoning) {
    (streamTextOptions as any).providerOptions = {
      bedrock: {
        additionalModelRequestFields: {
          reasoning_effort: reasoning,
        },
      },
    }
  }

  const result = streamText(streamTextOptions as any)

  const response = result.toUIMessageStreamResponse({
    sendSources: true,
    sendReasoning: true,
  })

  // Add CORS headers to the response
  response.headers.set('Access-Control-Allow-Origin', origin || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Amzn-Trace-Id, X-Amzn-Bedrock-AgentCore-Runtime-Session-Id')
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  return response
}
