import axios from 'axios'
import crypto from 'crypto'

interface ConversionEvent {
  email?: string
  phone?: string
  value?: number
  currency?: string
  eventId: string
}

export async function fireMetaConversion(
  pixelId: string,
  accessToken: string,
  event: ConversionEvent
) {
  const hash = (value: string) =>
    crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex')

  const userData: Record<string, string> = {}
  if (event.email) userData.em = hash(event.email)
  if (event.phone) userData.ph = hash(event.phone.replace(/\D/g, ''))

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: 'crm',
        user_data: userData,
        custom_data: {
          value: event.value ?? 0,
          currency: event.currency ?? 'BRL',
        },
      },
    ],
    test_event_code: process.env.META_TEST_EVENT_CODE,
  }

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`
  const res = await axios.post(url, payload)
  return res.data
}
