import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { convertToModelMessages, streamText, UIMessage } from 'ai'

export const maxDuration = 30

const bedrock = createAmazonBedrock({
  region: 'eu-central-1',
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
  const origin = req.headers.get('origin')
  
  const {
    messages,
    model,
    reasoning,
  }: { messages: UIMessage[]; model: string; reasoning: string } =
    await req.json()

  const result = streamText({
    model: bedrock(model),
    messages: convertToModelMessages(messages),
    system: 'You are a helpful assistant that can answer questions and help with tasks',
    providerOptions: {
      bedrock: {
        additionalModelRequestFields: {
          reasoning_effort: reasoning,
        },
      },
    },
  })

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
