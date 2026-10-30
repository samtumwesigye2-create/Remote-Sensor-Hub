import { httpRouter } from 'convex/server'
import { httpAction } from './_generated/server'
import { api } from './_generated/api'

const http = httpRouter()

const NEXUS_INBOUND_URL = 'https://ung-nexus-production.up.railway.app/v1/inbound'

async function forwardToNexus(sensorId: string, payload: unknown, receivedAtIso: string) {
  const janusServiceCredential = process.env.UNG_SERVICE_TOKEN
  if (!janusServiceCredential) {
    console.error('UNG_SERVICE_TOKEN is not configured; NEXUS forwarding skipped')
    return
  }

  try {
    const response = await fetch(NEXUS_INBOUND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${janusServiceCredential}`,
      },
      body: JSON.stringify({
        message_id: crypto.randomUUID(),
        source_system: 'REMOTE-SENSOR-HUB',
        target_system: 'UNG-PULSAR',
        message_type: 'sensor.reading.received',
        sent_at: new Date().toISOString(),
        payload: {
          u_code: 'U-9210',
          sensor_id: sensorId,
          observed_at: receivedAtIso,
          received_at: receivedAtIso,
          data: payload,
        },
      }),
    })

    if (!response.ok) {
      console.error(`NEXUS forward rejected with HTTP ${response.status}`)
    }
  } catch (err) {
    console.error('Failed to forward reading to NEXUS', err)
  }
}

http.route({
  path: '/api/report',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing x-api-key header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const isValid = await ctx.runQuery(api.readings.checkApiKey, { key: apiKey })
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let body: { sensor_id?: string; payload?: unknown }
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!body.sensor_id) {
      return new Response(JSON.stringify({ error: 'sensor_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const receivedAtIso = new Date().toISOString()
    const payload = body.payload ?? {}

    await ctx.runMutation(api.readings.insert, {
      sensorId: body.sensor_id,
      payload: JSON.stringify(payload),
    })

    await forwardToNexus(body.sensor_id, payload, receivedAtIso)

    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }),
})

export default http
