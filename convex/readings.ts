import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const insert = mutation({
  args: {
    sensorId: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('readings', {
      sensorId: args.sensorId,
      payload: args.payload,
      receivedAt: Date.now(),
    })
  },
})

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('readings').withIndex('by_receivedAt').order('desc').take(100)
    return rows
  },
})

export const checkApiKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('apiKeys')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    return row !== null
  },
})

export const seedApiKey = mutation({
  args: { key: v.string(), label: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('apiKeys')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    if (existing) return
    await ctx.db.insert('apiKeys', { key: args.key, label: args.label })
  },
})

export const listApiKeys = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('apiKeys').collect()
  },
})

export const createApiKey = mutation({
  args: { label: v.string() },
  handler: async (ctx, args) => {
    const key = Array.from({ length: 32 }, () =>
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('')
    await ctx.db.insert('apiKeys', { key, label: args.label })
    return key
  },
})

export const deleteApiKey = mutation({
  args: { id: v.id('apiKeys') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
