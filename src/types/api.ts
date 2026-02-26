/** Generic API response wrapper for success cases. */
export interface ApiResponse<T> {
  data: T;
  status: 'success';
}

/** Generic API error response. */
export interface ApiError {
  message: string;
  status: 'error';
  code?: string;
}

/** Union type for API results. */
export type ApiResult<T> = ApiResponse<T> | ApiError;

/** WebSocket connection states. */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

/** Real-time vehicle update message from the WebSocket. */
export interface VehicleUpdate {
  vehicleId: string;
  fields: Record<string, unknown>;
  timestamp: string;
}
