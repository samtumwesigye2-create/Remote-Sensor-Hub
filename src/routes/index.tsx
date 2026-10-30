import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useState } from 'react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const readings = useQuery(api.readings.latest)
  const apiKeys = useQuery(api.readings.listApiKeys)
  const insertReading = useMutation(api.readings.insert)
  const createApiKey = useMutation(api.readings.createApiKey)
  const deleteApiKey = useMutation(api.readings.deleteApiKey)

  const [sensorId, setSensorId] = useState('')
  const [payloadText, setPayloadText] = useState('{"temp_c": 22}')
  const [formError, setFormError] = useState('')
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  async function sendTestReading() {
    await insertReading({
      sensorId: 'test-sensor',
      payload: JSON.stringify({ temp_c: Math.round((15 + Math.random() * 15) * 10) / 10 }),
    })
  }

  async function submitManualReading(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!sensorId.trim()) {
      setFormError('Sensor ID is required.')
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(payloadText)
    } catch {
      setFormError('Data must be valid JSON, e.g. {"temp_c": 22}')
      return
    }
    await insertReading({ sensorId: sensorId.trim(), payload: JSON.stringify(parsed) })
    setSensorId('')
  }

  async function handleCreateKey() {
    const label = newKeyLabel.trim() || 'unnamed'
    const key = await createApiKey({ label })
    setRevealedKey(key)
    setNewKeyLabel('')
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Remote Sensor Hub</h1>
          <p className="text-muted-foreground">
            {readings === undefined
              ? 'Loading...'
              : `${readings.length} reading${readings.length === 1 ? '' : 's'} received`}
          </p>
        </div>

        {/* Readings table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Sensor ID</th>
                <th className="text-left p-3">Received</th>
                <th className="text-left p-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {readings?.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-muted-foreground">
                    No readings yet — send a test reading below, or wait for a sensor to report in.
                  </td>
                </tr>
              )}
              {readings?.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="p-3 font-mono">{r.sensorId}</td>
                  <td className="p-3">{new Date(r.receivedAt).toLocaleString()}</td>
                  <td className="p-3 font-mono text-xs">{r.payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Send test reading */}
        <div className="rounded-lg border p-4 space-y-2">
          <h2 className="font-medium">Quick test</h2>
          <p className="text-sm text-muted-foreground">
            Generates a fake reading instantly, so you can confirm the dashboard updates without needing real hardware.
          </p>
          <button
            onClick={sendTestReading}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Send test reading
          </button>
        </div>

        {/* Manual entry form */}
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-medium">Log a reading manually</h2>
          <form onSubmit={submitManualReading} className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Sensor ID</label>
              <input
                value={sensorId}
                onChange={(e) => setSensorId(e.target.value)}
                placeholder="e.g. field-sensor-01"
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Data (JSON)</label>
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm font-mono bg-background"
              />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              Log reading
            </button>
          </form>
        </div>

        {/* API key management */}
        <div className="rounded-lg border p-4 space-y-3">
          <h2 className="font-medium">Sensor API keys</h2>
          <p className="text-sm text-muted-foreground">
            Each real sensor should use its own key in the <code>x-api-key</code> header when it posts to{' '}
            <code>/api/report</code>.
          </p>

          <div className="flex gap-2">
            <input
              value={newKeyLabel}
              onChange={(e) => setNewKeyLabel(e.target.value)}
              placeholder="Label, e.g. backyard-sensor"
              className="flex-1 rounded-md border px-3 py-2 text-sm bg-background"
            />
            <button
              onClick={handleCreateKey}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap"
            >
              Create key
            </button>
          </div>

          {revealedKey && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="mb-1">
                New key created — copy it now, it won't be shown in full again:
              </p>
              <p className="font-mono break-all">{revealedKey}</p>
            </div>
          )}

          <div className="rounded-lg border overflow-hidden mt-2">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2">Label</th>
                  <th className="text-left p-2">Key</th>
                  <th className="text-left p-2"></th>
                </tr>
              </thead>
              <tbody>
                {apiKeys?.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-muted-foreground">
                      No keys yet.
                    </td>
                  </tr>
                )}
                {apiKeys?.map((k) => (
                  <tr key={k._id} className="border-t">
                    <td className="p-2">{k.label}</td>
                    <td className="p-2 font-mono text-xs">
                      {k.key.slice(0, 6)}...{k.key.slice(-4)}
                    </td>
                    <td className="p-2 text-right">
                      <button
                        onClick={() => deleteApiKey({ id: k._id })}
                        className="text-xs text-destructive underline"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
