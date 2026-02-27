/**
 * WebSocket client for real-time vehicle telemetry.
 *
 * Manages connection lifecycle, reconnection with exponential backoff + jitter,
 * heartbeat detection, and graceful degradation to HTTP polling.
 *
 * Usage:
 *   const ws = new VehicleWebSocket('wss://...', 'session-token');
 *   ws.onUpdate = (update) => { ... };
 *   ws.onStatusChange = (status) => { ... };
 *   ws.connect();
 *   // later:
 *   ws.disconnect();
 */

import type { ConnectionStatus, VehicleUpdate } from '@/types/api';
import {
  WS_RECONNECT_BASE_DELAY,
  WS_RECONNECT_MAX_DELAY,
  WS_RECONNECT_MULTIPLIER,
  WS_RECONNECT_JITTER_FACTOR,
} from './constants';

/** Parsed WebSocket message types. */
type WsMessageType = 'vehicle_update' | 'heartbeat' | 'error';

/** Raw WebSocket message shape. */
interface WsMessage {
  type: WsMessageType;
  payload?: unknown;
}

/** Heartbeat timeout — if no message within this window, consider connection stale. */
const HEARTBEAT_TIMEOUT_MS = 15_000;

/**
 * WebSocket client class for vehicle telemetry.
 * Handles connection, authentication, reconnection, and heartbeat monitoring.
 */
export class VehicleWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  /** Current connection status. */
  status: ConnectionStatus = 'disconnected';

  /** Callback fired when a vehicle update is received. */
  onUpdate: ((update: VehicleUpdate) => void) | null = null;

  /** Callback fired when connection status changes. */
  onStatusChange: ((status: ConnectionStatus) => void) | null = null;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  /** Open the WebSocket connection. */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.intentionalClose = false;
    this.setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch {
      this.scheduleReconnect();
    }
  }

  /** Gracefully close the connection. */
  disconnect(): void {
    this.intentionalClose = true;
    this.clearTimers();
    this.ws?.close();
    this.ws = null;
    this.setStatus('disconnected');
  }

  /** Update the auth token (e.g., after refresh). */
  updateToken(token: string): void {
    this.token = token;
  }

  // --- Internal handlers ---

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.setStatus('connected');

    // Authenticate immediately
    this.send({ type: 'auth', payload: { token: this.token } });
    this.resetHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    this.resetHeartbeat();

    let msg: WsMessage;
    try {
      msg = JSON.parse(event.data as string) as WsMessage;
    } catch {
      return; // Ignore malformed messages
    }

    switch (msg.type) {
      case 'vehicle_update':
        if (msg.payload && this.onUpdate) {
          this.onUpdate(msg.payload as VehicleUpdate);
        }
        break;
      case 'heartbeat':
        // Heartbeat received — timer already reset above
        break;
      case 'error':
        console.error('[VehicleWebSocket] Server error:', msg.payload);
        break;
    }
  }

  private handleClose(): void {
    this.ws = null;
    this.clearHeartbeat();

    if (!this.intentionalClose) {
      this.scheduleReconnect();
    }
  }

  private handleError(): void {
    // Error is always followed by close — reconnection handled there
    this.ws?.close();
  }

  // --- Reconnection with exponential backoff + jitter ---

  private scheduleReconnect(): void {
    this.setStatus('reconnecting');

    const baseDelay = WS_RECONNECT_BASE_DELAY * Math.pow(WS_RECONNECT_MULTIPLIER, this.reconnectAttempts);
    const cappedDelay = Math.min(baseDelay, WS_RECONNECT_MAX_DELAY);
    const jitter = cappedDelay * WS_RECONNECT_JITTER_FACTOR * (Math.random() * 2 - 1);
    const delay = Math.max(0, cappedDelay + jitter);

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  // --- Heartbeat monitoring ---

  private resetHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = setTimeout(() => {
      // No message received within the window — connection is stale
      console.warn('[VehicleWebSocket] Heartbeat timeout, reconnecting...');
      this.ws?.close();
    }, HEARTBEAT_TIMEOUT_MS);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // --- Helpers ---

  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.onStatusChange?.(status);
    }
  }

  private send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}
