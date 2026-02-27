'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

import type { Vehicle } from '@/types/vehicle';
import type { ConnectionStatus, VehicleUpdate } from '@/types/api';
import { VehicleWebSocket } from '@/lib/websocket';

/** Return type of the useVehicleStream hook. */
export interface UseVehicleStreamReturn {
  /** Map of vehicle ID to latest vehicle state. */
  vehicles: Map<string, Vehicle>;
  /** Current WebSocket connection status. */
  connectionStatus: ConnectionStatus;
  /** Manually trigger a reconnection attempt. */
  reconnect: () => void;
}

/** WebSocket URL from environment — empty disables WebSocket. */
const WS_URL = process.env.NEXT_PUBLIC_WS_URL
  ? `${process.env.NEXT_PUBLIC_WS_URL}/api/ws`
  : '';

/**
 * Hook for real-time vehicle telemetry via WebSocket.
 *
 * Manages WebSocket lifecycle (connect on mount, disconnect on unmount),
 * maintains a vehicle state map, and tracks connection status.
 * Falls back gracefully when no WS endpoint is configured.
 *
 * @param initialVehicles — Initial vehicle data (from server render or mock data)
 * @param sessionToken — Auth token for WebSocket authentication
 */
export function useVehicleStream(
  initialVehicles: Vehicle[],
  sessionToken?: string,
): UseVehicleStreamReturn {
  const [vehicleMap, setVehicleMap] = useState<Map<string, Vehicle>>(() => {
    const map = new Map<string, Vehicle>();
    initialVehicles.forEach((v) => map.set(v.id, v));
    return map;
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  const wsRef = useRef<VehicleWebSocket | null>(null);

  // Handle incoming vehicle update — merge partial fields into existing state
  const handleUpdate = useCallback((update: VehicleUpdate) => {
    setVehicleMap((prev) => {
      const existing = prev.get(update.vehicleId);
      if (!existing) return prev;

      const next = new Map(prev);
      next.set(update.vehicleId, { ...existing, ...update.fields } as Vehicle);
      return next;
    });
  }, []);

  // Connect/disconnect lifecycle
  useEffect(() => {
    if (!WS_URL || !sessionToken) {
      // No WebSocket configured — stay on initial data
      return;
    }

    const ws = new VehicleWebSocket(WS_URL, sessionToken);
    ws.onUpdate = handleUpdate;
    ws.onStatusChange = setConnectionStatus;

    wsRef.current = ws;
    ws.connect();

    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, [sessionToken, handleUpdate]);

  // Sync initial vehicles when they change (e.g., SWR revalidation)
  useEffect(() => {
    setVehicleMap((prev) => {
      const next = new Map<string, Vehicle>();
      initialVehicles.forEach((v) => {
        // Preserve any real-time updates over server data
        const existing = prev.get(v.id);
        next.set(v.id, existing ?? v);
      });
      return next;
    });
  }, [initialVehicles]);

  const reconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current?.connect();
  }, []);

  return {
    vehicles: vehicleMap,
    connectionStatus,
    reconnect,
  };
}
