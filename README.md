# Remote Sensor Hub

Remote Sensor Hub is the Uganda National Grid edge-ingestion service for field and remote sensor readings.

## UNG integration target

The service is designed to normalize remote sensor readings into UGATU-compatible sensor events and forward them into the UNG integration backbone.

Target flow:

`Remote Sensor / Device -> Remote Sensor Hub -> UGATU Sensor Event -> UNG-NEXUS -> UNG-PULSAR / downstream systems`

The current UGATU registry already reserves controlled expansion space by domain. This repository uses that model rather than changing existing U-Codes.

## Proposed sensor U-Code block

A dedicated sensor/telemetry block should be added as a new controlled expansion range rather than reusing existing driver, warehouse, billing, administration, security, or analytics codes.

Suggested initial block:

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

These codes are proposed for the next UGATU registry revision and should remain provisional until merged into the master UGATU registry.

## Canonical event envelope

```json
{
  "u_code": "U-9210",
  "event_type": "sensor.reading.received",
  "source_system": "REMOTE-SENSOR-HUB",
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

## Integration contract

Remote Sensor Hub must:

1. validate `sensor_id` and JSON payloads;
2. timestamp every accepted reading;
3. normalize readings to the canonical event envelope;
4. preserve the original sensor payload inside `data`;
5. assign a UGATU U-Code based on event type;
6. emit events to NEXUS when configured;
7. persist delivery status / retry metadata locally or in the backing database;
8. never expose UNG internal service credentials to sensors or browsers.

See `docs/UGATU_SENSOR_INTEGRATION.md` for the detailed contract.
