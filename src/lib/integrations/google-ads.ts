import axios from 'axios'

interface GoogleConversionEvent {
  conversionId: string
  conversionLabel: string
  value?: number
  currency?: string
  orderId: string
}

export async function fireGoogleConversion(event: GoogleConversionEvent) {
  const payload = {
    conversions: [
      {
        gclid: null,
        conversion_action: `customers/${event.conversionId}/conversionActions/${event.conversionLabel}`,
        conversion_date_time: new Date().toISOString(),
        conversion_value: event.value ?? 0,
        currency_code: event.currency ?? 'BRL',
        order_id: event.orderId,
      },
    ],
  }

  // Google Ads Conversion Adjustment / Offline Conversion Upload
  // Requires OAuth2 — implementar com google-ads-api quando credenciais disponíveis
  console.log('[Google Ads] Conversion payload:', JSON.stringify(payload, null, 2))
  return payload
}
