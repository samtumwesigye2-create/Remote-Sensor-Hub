# Macaly Remote Sensor Hub -> UGATU/NEXUS implementation

Status: implementation handoff for the live Macaly Remote Sensor Hub.

The live application remains hosted on Macaly Cloud. This document defines the outbound hook that should be added to that live application without moving or replacing it.

## Required server-side configuration

- `UNG_NEXUS_BASE_URL`
- `UNG_SERVICE_TOKEN` (or the approved JANUS/IAM service credential mechanism)
- `UNG_SENSOR_INTEGRATION_ENABLED=true`

Never expose these values to browser JavaScript or remote sensors.

## Trigger

After a sensor reading has passed the hub's existing authentication/validation and has been durably accepted by the hub, invoke the outbound integration asynchronously. Failure to reach NEXUS must not discard the locally accepted sensor reading.

## Normalization

Automatic hardware/API reading:

```json
{
  "u_code": "U-9210",
  "event_type": "sensor.reading.received",
  "source_system": "REMOTE-SENSOR-HUB",
  "sensor_id": "<existing sensor id>",
  "observed_at": "<sensor observation time if supplied>",
  "received_at": "<hub receipt time>",
  "data": {},
  "metadata": {
    "schema_version": "1.0",
    "origin": "macaly"
  }
}
```

Manual dashboard reading uses `U-9270` / `sensor.reading.manual`.

Preserve the original `data` object unchanged inside the normalized payload.

## NEXUS message

Submit the normalized event through the existing protected NEXUS message-ingress contract using a server-side bearer/service credential. The logical envelope is:

```json
{
  "source_system": "REMOTE-SENSOR-HUB",
  "target_system": "UNG-PULSAR",
  "message_type": "sensor.reading.received",
  "payload": { "...normalized sensor event...": "..." }
}
```

Use the actual NEXUS route/schema already deployed; do not invent a second public ingestion API.

## Delivery state

Persist an integration record keyed to the local sensor reading/event ID with:

- `u_code`
- `status`: accepted | queued | delivered | retrying | failed | acknowledged
- `attempts`
- `last_response_code`
- `last_error`
- `first_attempt_at`
- `last_attempt_at`
- `delivered_at`
- `acknowledged_at`

Use bounded exponential retry for network errors, timeouts, 429, and retryable 5xx responses. Do not endlessly retry ordinary validation/authentication 4xx responses.

## Idempotency

Generate one stable integration event ID per locally accepted reading and reuse it on every retry so downstream systems can deduplicate delivery.

## Existing UI

Do not remove or redesign the current Remote Sensor Hub reading table, Quick test control, manual JSON form, or sensor API-key workflow. Add delivery state only as a secondary operator-visible field/status if desired.

The existing Quick test reading must be marked as test/synthetic in metadata and must never be confused with physical hardware telemetry.

## Acceptance

The integration is accepted only after all of these are observed:

1. Macaly accepts a sensor reading locally.
2. The same event receives the expected U-Code.
3. NEXUS accepts the authenticated message.
4. The integration record changes to `delivered`.
5. PULSAR/downstream processing can correlate the same stable event ID.
6. A deliberate NEXUS outage leaves the local reading intact and queues/retries delivery.
7. No JANUS/NEXUS credentials appear in client-side responses or sensor configuration.

Do not claim end-to-end acceptance from a dashboard-only test.