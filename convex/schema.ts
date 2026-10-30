import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

// Stores every reading a remote sensor sends in.
export default defineSchema({
  readings: defineTable({
    sensorId: v.string(),
    payload: v.string(), // JSON string of whatever the sensor sent
    receivedAt: v.number(), // ms since epoch
  }).index('by_receivedAt', ['receivedAt']),

  apiKeys: defineTable({
    key: v.string(),
    label: v.string(),
  }).index('by_key', ['key']),
})
