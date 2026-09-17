# Remote Sensor Hub — merged into UNG-CONSTELLATION

**Status:** The Remote Sensor Hub is no longer a standalone runtime. Its sensor-ingestion function has been merged into `samtumwesigye2-create/UNG-CONSTELLATION` and is now maintained there as a native CONSTELLATION capability.

The original integration contract is retained below for historical/reference purposes. No separate Macaly-hosted runtime is required by the merged architecture.

## Original UNG integration contract

Remote Sensor Hub is the Uganda National Grid edge-ingestion function for field and remote sensor readings. It normalizes remote sensor readings into UGATU-compatible sensor events and forwards them into the UNG integration backbone.

Current merged flow:

`Remote Sensor / Device -> UNG-CONSTELLATION Remote Sensor Hub -> UGATU Sensor Event -> UNG-NEXUS -> UNG-PULSAR / downstream systems`

## Sensor U-Code block

- `U-9200` Sensor & Telemetry Center
- `U-9210` Sensor Reading Received
- `U-9220` Sensor Threshold Alert
- `U-9230` Sensor Offline / Heartbeat Lost
- `U-9240` Sensor Restored
- `U-9250` Sensor Data Quality Exception
- `U-9260` Sensor Calibration / Maintenance Event
- `U-9270` Sensor Manual Reading
- `U-9280` Sensor Event Acknowledged
- `U-9290` Sensor Integration Audit

## Canonical event envelope

```json
{
  "u_code": "U-9210",
  "event_type": "sensor.reading.received",
  "source_system": "UNG-CONSTELLATION",
  "source_function": "REMOTE-SENSOR-HUB",
  "sensor_id": "field-sensor-01",
  "observed_at": "2026-09-07T19:44:47-04:00",
  "received_at": "2026-09-07T19:44:47-04:00",
  "data": {
    "temp_c": 22
  },
  "metadata": {
    "schema_version": "1.0",
    "transport": "https"
  }
}
```

The merged implementation validates `sensor_id` and JSON payloads, timestamps accepted readings, preserves the original sensor payload inside `data`, assigns the UGATU U-Code, forwards through NEXUS when configured, persists delivery state in CONSTELLATION PostgreSQL, and does not expose UNG internal credentials to field sensors or browsers.
