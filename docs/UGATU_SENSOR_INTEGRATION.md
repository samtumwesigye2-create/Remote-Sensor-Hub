# UGATU Sensor Integration Contract

Status: Draft integration contract for Remote Sensor Hub.

## 1. Purpose

This document defines how Remote Sensor Hub participates in the Uganda National Grid transaction layer without changing or colliding with the existing UGATU driver, dispatch, warehouse, order, billing, administration, security, and analytics registry.

The existing registry explicitly reserves additional ranges for controlled expansion. Sensor/telemetry transactions therefore receive a dedicated provisional block.

## 2. Provisional U-Code registry

| U-Code | Purpose | Event type |
|---|---|---|
| U-9200 | Sensor & Telemetry Center | sensor.center |
| U-9210 | Sensor Reading Received | sensor.reading.received |
| U-9220 | Sensor Threshold Alert | sensor.threshold.alert |
| U-9230 | Sensor Offline / Heartbeat Lost | sensor.offline |
| U-9240 | Sensor Restored | sensor.restored |
| U-9250 | Sensor Data Quality Exception | sensor.data_quality.exception |
| U-9260 | Sensor Calibration / Maintenance Event | sensor.maintenance |
| U-9270 | Sensor Manual Reading | sensor.reading.manual |
| U-9280 | Sensor Event Acknowledged | sensor.event.acknowledged |
| U-9290 | Sensor Integration Audit | sensor.integration.audit |

These codes remain provisional until added to the authoritative UGATU registry.

## 3. Canonical sensor event

Required fields:

- `u_code`
- `event_type`
- `source_system`
- `sensor_id`
- `observed_at`
- `received_at`
- `data`
- `metadata.schema_version`

Optional metadata may include site, device class, firmware, transport, quality flags, geographic reference, and correlation identifiers.

## 4. NEXUS outbound envelope

When NEXUS is configured, Remote Sensor Hub should submit the normalized event as a NEXUS message:

```json
{
  "source_system": "REMOTE-SENSOR-HUB",
  "target_system": "UNG-PULSAR",
  "message_type": "sensor.reading.received",
  "payload": {
    "u_code": "U-9210",
    "sensor_id": "field-sensor-01",
    "observed_at": "2026-09-07T19:44:47-04:00",
    "received_at": "2026-09-07T19:44:47-04:00",
    "data": {"temp_c": 22},
    "metadata": {"schema_version": "1.0"}
  }
}
```

## 5. Security boundary

Sensors must authenticate only to Remote Sensor Hub using a sensor-scoped API credential. Remote sensors must never receive JANUS/IAM, NEXUS, PULSAR, database, or Railway credentials.

The hub is the trust boundary. It validates sensor credentials, normalizes the event, then uses a server-side UNG service credential for NEXUS delivery.

## 6. Delivery behavior

For each accepted sensor event, the hub should record:

- local event ID;
- U-Code;
- normalization status;
- NEXUS delivery status;
- delivery attempts;
- last response code;
- last delivery error;
- first/last attempt timestamps;
- acknowledgement timestamp when available.

Recommended statuses: `accepted`, `queued`, `delivered`, `retrying`, `failed`, `acknowledged`.

Retries should use bounded exponential backoff. Invalid 4xx requests should not be retried except rate-limit or timeout-class responses.

## 7. Event mapping rules

- ordinary valid measurement -> U-9210;
- manual dashboard entry -> U-9270;
- threshold crossing -> U-9220;
- missed heartbeat / stale sensor -> U-9230;
- first good heartbeat after offline -> U-9240;
- malformed, impossible, or failed validation data -> U-9250;
- maintenance/calibration activity -> U-9260;
- downstream acknowledgement -> U-9280;
- integration-level delivery/audit event -> U-9290.

## 8. Compatibility

The Remote Sensor Hub UI may continue to display raw readings for operators. The integration layer should add normalized transaction metadata without removing the original sensor payload.

This preserves the current dashboard behavior while making every sensor event usable by the wider UNG ecosystem.
