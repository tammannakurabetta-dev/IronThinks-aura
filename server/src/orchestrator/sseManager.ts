import { Response } from 'express';
import { SSEEventType, SSEMessagePayload } from '@shared/index';

interface SSEClient {
  id: string;
  workflowId: string;
  res: Response;
}

class SSEManager {
  private clients: Map<string, SSEClient[]> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Keep alive heartbeat every 15 seconds
    this.heartbeatInterval = setInterval(() => {
      this.broadcastHeartbeat();
    }, 15000);
  }

  /**
   * Registers an Express Response stream for a given workflowId
   */
  public registerClient(workflowId: string, clientId: string, res: Response): void {
    const list = this.clients.get(workflowId) || [];
    list.push({ id: clientId, workflowId, res });
    this.clients.set(workflowId, list);

    // Initial handshake event
    this.sendEventToClient(res, {
      type: 'CONNECTED',
      workflowId,
      timestamp: new Date().toISOString(),
      data: { message: `SSE Connected for workflow ${workflowId}`, clientId }
    });

    // Cleanup on disconnect
    res.on('close', () => {
      this.removeClient(workflowId, clientId);
    });
  }

  public removeClient(workflowId: string, clientId: string): void {
    const list = this.clients.get(workflowId);
    if (!list) return;

    const filtered = list.filter(c => c.id !== clientId);
    if (filtered.length > 0) {
      this.clients.set(workflowId, filtered);
    } else {
      this.clients.delete(workflowId);
    }
  }

  /**
   * Broadcasts an event to all connected clients for a workflow
   */
  public broadcast(workflowId: string, eventType: SSEEventType, data: any): void {
    const clients = this.clients.get(workflowId);
    if (!clients || clients.length === 0) return;

    const payload: SSEMessagePayload = {
      type: eventType,
      workflowId,
      timestamp: new Date().toISOString(),
      data
    };

    clients.forEach(client => {
      this.sendEventToClient(client.res, payload);
    });
  }

  private sendEventToClient(res: Response, payload: SSEMessagePayload): void {
    try {
      res.write(`event: ${payload.type}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    } catch (err: any) {
      console.warn('Failed to write SSE message to client:', err.message);
    }
  }

  private broadcastHeartbeat(): void {
    const now = new Date().toISOString();
    this.clients.forEach((clients, workflowId) => {
      clients.forEach(c => {
        try {
          c.res.write(`: heartbeat ${now}\n\n`);
        } catch {
          // Client closed
        }
      });
    });
  }
}

export const sseManager = new SSEManager();
