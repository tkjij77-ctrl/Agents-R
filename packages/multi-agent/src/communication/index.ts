/**
 * Communication Layer - Message bus for inter-agent communication
 * 
 * Handles:
 * 1. Direct messages between agents
 * 2. Broadcast messages
 * 3. Request-reply patterns
 * 4. Message history and persistence
 * 5. Event subscriptions
 */

import { Effect, Ref, Queue } from "effect"
import type {
  AgentMessage,
  MessageType,
  AgentEvent,
  AgentEventType,
} from "../agents/types/index.js"

// ============================================================================
// Message Bus Interface
// ============================================================================

export interface MessageBusInterface {
  /** Send a message */
  readonly send: (message: AgentMessage) => Effect.Effect<void>
  
  /** Subscribe to messages for a specific agent */
  readonly subscribe: (agentId: string) => Effect.Effect<Queue.Unbounded<AgentMessage>>
  
  /** Get message history */
  readonly getHistory: (sessionId: string, filter?: MessageFilter) => Effect.Effect<readonly AgentMessage[]>
  
  /** Get pending messages for an agent */
  readonly getPending: (agentId: string) => Effect.Effect<readonly AgentMessage[]>
  
  /** Mark messages as read */
  readonly markRead: (agentId: string, messageIds: readonly string[]) => Effect.Effect<void>
}

export interface MessageFilter {
  readonly type?: MessageType
  readonly from?: string
  readonly to?: string
  readonly after?: number
  readonly before?: number
}

// ============================================================================
// Message Bus Implementation
// ============================================================================

export class MessageBus implements MessageBusInterface {
  private messages: AgentMessage[] = []
  private subscriptions = new Map<string, Queue.Unbounded<AgentMessage>>()
  private pending = new Map<string, AgentMessage[]>()  // agentId -> unread messages
  private readMessages = new Map<string, Set<string>>()  // agentId -> read message IDs

  readonly send = (message: AgentMessage): Effect.Effect<void> =>
    Effect.gen(function* () {
      // Store message
      this.messages.push(message)
      
      // Route to recipient(s)
      if (message.to === "all") {
        // Broadcast to all subscribers
        for (const [, queue] of this.subscriptions) {
          yield* Queue.offer(queue, message)
        }
        // Add to all pending queues
        for (const [agentId] of this.subscriptions) {
          if (agentId !== message.from) {
            const pending = this.pending.get(agentId) ?? []
            pending.push(message)
            this.pending.set(agentId, pending)
          }
        }
      } else {
        // Direct message
        const queue = this.subscriptions.get(message.to)
        if (queue) {
          yield* Queue.offer(queue, message)
        }
        const pending = this.pending.get(message.to) ?? []
        pending.push(message)
        this.pending.set(message.to, pending)
      }
    })

  readonly subscribe = (agentId: string): Effect.Effect<Queue.Unbounded<AgentMessage>> =>
    Effect.gen(function* () {
      const existing = this.subscriptions.get(agentId)
      if (existing) return existing
      
      const queue = yield* Queue.unbounded<AgentMessage>()
      this.subscriptions.set(agentId, queue)
      this.pending.set(agentId, [])
      this.readMessages.set(agentId, new Set())
      return queue
    })

  readonly getHistory = (sessionId: string, filter?: MessageFilter): Effect.Effect<readonly AgentMessage[]> =>
    Effect.gen(function* () {
      let filtered = this.messages.filter(m => m.sessionId === sessionId)
      
      if (filter) {
        if (filter.type) filtered = filtered.filter(m => m.type === filter.type)
        if (filter.from) filtered = filtered.filter(m => m.from === filter.from)
        if (filter.to) filtered = filtered.filter(m => m.to === filter.to || m.to === "all")
        if (filter.after) filtered = filtered.filter(m => m.timestamp > filter.after!)
        if (filter.before) filtered = filtered.filter(m => m.timestamp < filter.before!)
      }
      
      return filtered
    })

  readonly getPending = (agentId: string): Effect.Effect<readonly AgentMessage[]> =>
    Effect.gen(function* () {
      return this.pending.get(agentId) ?? []
    })

  readonly markRead = (agentId: string, messageIds: readonly string[]): Effect.Effect<void> =>
    Effect.gen(function* () {
      const readSet = this.readMessages.get(agentId) ?? new Set()
      for (const id of messageIds) {
        readSet.add(id)
      }
      this.readMessages.set(agentId, readSet)
      
      // Remove from pending
      const pending = this.pending.get(agentId) ?? []
      this.pending.set(agentId, pending.filter(m => !messageIds.includes(m.id)))
    })
}

// ============================================================================
// Message Builder - Helper for creating messages
// ============================================================================

export class MessageBuilder {
  private id: string = ""
  private type: MessageType = "broadcast"
  private from: string = ""
  private to: string = ""
  private sessionId: string = ""
  private payload: unknown = {}
  private replyTo?: string

  static create(): MessageBuilder {
    return new MessageBuilder()
  }

  withId(id: string): MessageBuilder {
    this.id = id
    return this
  }

  withType(type: MessageType): MessageBuilder {
    this.type = type
    return this
  }

  fromAgent(id: string): MessageBuilder {
    this.from = id
    return this
  }

  toAgent(id: string | "all"): MessageBuilder {
    this.to = id
    return this
  }

  inSession(sessionId: string): MessageBuilder {
    this.sessionId = sessionId
    return this
  }

  withPayload(payload: unknown): MessageBuilder {
    this.payload = payload
    return this
  }

  inReplyTo(messageId: string): MessageBuilder {
    this.replyTo = messageId
    return this
  }

  build(): AgentMessage {
    return {
      id: this.id || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type: this.type,
      from: this.from,
      to: this.to,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      payload: this.payload,
      replyTo: this.replyTo,
    }
  }
}

// ============================================================================
// Event Publisher
// ============================================================================

export class EventPublisher {
  private listeners = new Map<AgentEventType, ((event: AgentEvent) => void)[]>()
  
  subscribe(type: AgentEventType, listener: (event: AgentEvent) => void): () => void {
    const list = this.listeners.get(type) ?? []
    list.push(listener)
    this.listeners.set(type, list)
    
    return () => {
      const current = this.listeners.get(type) ?? []
      this.listeners.set(type, current.filter(l => l !== listener))
    }
  }
  
  publish(event: AgentEvent): void {
    const list = this.listeners.get(event.type) ?? []
    for (const listener of list) {
      try { listener(event) } catch {}
    }
    
    // Also notify wildcard listeners
    const allList = this.listeners.get("*" as AgentEventType) ?? []
    for (const listener of allList) {
      try { listener(event) } catch {}
    }
  }
}
