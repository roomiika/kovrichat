import axios from 'axios'

interface SendMessageParams {
  instanceName: string
  to: string
  text: string
}

export function createEvolutionClient(baseUrl: string, apiKey: string) {
  const client = axios.create({
    baseURL: baseUrl,
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
    },
  })

  return {
    async sendText({ instanceName, to, text }: SendMessageParams) {
      const res = await client.post(`/message/sendText/${instanceName}`, {
        number: to,
        text,
      })
      return res.data
    },

    async getInstances() {
      const res = await client.get('/instance/fetchInstances')
      return res.data
    },
  }
}
