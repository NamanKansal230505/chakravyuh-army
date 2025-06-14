
import { Node, Alert, NetworkConnection, NetworkStatus, AlertType } from "./types";

// Serial port interface for Web Serial API
interface SerialPortInfo {
  port: SerialPort;
  name: string;
  vendorId?: number;
  productId?: number;
}

// Serial communication class
class SerialCommunication {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isConnected = false;
  private onDataCallback: ((data: string) => void) | null = null;

  // Get available serial ports
  async getAvailablePorts(): Promise<SerialPortInfo[]> {
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API not supported');
      }
      
      const ports = await navigator.serial.getPorts();
      return ports.map((port, index) => ({
        port,
        name: `COM${index + 1}`,
        vendorId: port.getInfo().usbVendorId,
        productId: port.getInfo().usbProductId
      }));
    } catch (error) {
      console.error('Error getting serial ports:', error);
      return [];
    }
  }

  // Request access to a new serial port
  async requestPort(): Promise<SerialPortInfo | null> {
    try {
      if (!navigator.serial) {
        throw new Error('Web Serial API not supported');
      }

      const port = await navigator.serial.requestPort();
      return {
        port,
        name: `COM${Date.now()}`,
        vendorId: port.getInfo().usbVendorId,
        productId: port.getInfo().usbProductId
      };
    } catch (error) {
      console.error('Error requesting serial port:', error);
      return null;
    }
  }

  // Connect to a serial port
  async connect(portInfo: SerialPortInfo, baudRate: number = 9600): Promise<boolean> {
    try {
      if (this.isConnected) {
        await this.disconnect();
      }

      this.port = portInfo.port;
      await this.port.open({ baudRate });
      
      if (this.port.readable) {
        this.reader = this.port.readable.getReader();
        this.isConnected = true;
        this.startReading();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error connecting to serial port:', error);
      return false;
    }
  }

  // Disconnect from serial port
  async disconnect(): Promise<void> {
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }

      this.isConnected = false;
    } catch (error) {
      console.error('Error disconnecting from serial port:', error);
    }
  }

  // Start reading serial data
  private async startReading(): Promise<void> {
    if (!this.reader) return;

    try {
      while (this.isConnected && this.reader) {
        const { value, done } = await this.reader.read();
        
        if (done) break;
        
        if (value) {
          const text = new TextDecoder().decode(value);
          if (this.onDataCallback) {
            this.onDataCallback(text);
          }
        }
      }
    } catch (error) {
      console.error('Error reading serial data:', error);
      this.isConnected = false;
    }
  }

  // Set callback for received data
  onData(callback: (data: string) => void): void {
    this.onDataCallback = callback;
  }

  // Check if connected
  isPortConnected(): boolean {
    return this.isConnected;
  }
}

// Create singleton instance
export const serialComm = new SerialCommunication();

// Parse LoRaWAN data format
export const parseLoRaWANData = (data: string): { nodeId: string; alertType: AlertType; value: number } | null => {
  try {
    // Expected format: "node1:gun:1" or "node2:motion:0"
    const parts = data.trim().split(':');
    if (parts.length !== 3) return null;

    const [nodeId, alertType, valueStr] = parts;
    const value = parseInt(valueStr, 10);

    if (isNaN(value)) return null;

    // Validate alert type
    const validAlertTypes: AlertType[] = ['gun', 'footsteps', 'motion', 'whisper', 'suspicious_activity', 'drone', 'help'];
    if (!validAlertTypes.includes(alertType as AlertType)) return null;

    return {
      nodeId: nodeId.toLowerCase(),
      alertType: alertType as AlertType,
      value
    };
  } catch (error) {
    console.error('Error parsing LoRaWAN data:', error);
    return null;
  }
};

// Generate default empty network status
export const getDefaultNetworkStatus = (): NetworkStatus => ({
  activeNodes: 0,
  totalNodes: 0,
  networkHealth: 0
});

// Generate default empty connections
export const getDefaultConnections = (): NetworkConnection[] => [];
