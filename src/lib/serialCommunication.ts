
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

  // Check if Web Serial API is supported
  isSupported(): boolean {
    return 'serial' in navigator;
  }

  // Get available serial ports
  async getAvailablePorts(): Promise<SerialPortInfo[]> {
    try {
      console.log('Checking for Web Serial API support...');
      
      if (!this.isSupported()) {
        console.error('Web Serial API not supported in this browser');
        throw new Error('Web Serial API not supported in this browser. Please use Chrome, Edge, or Opera with HTTPS.');
      }
      
      console.log('Web Serial API supported, getting ports...');
      const ports = await navigator.serial.getPorts();
      console.log('Found ports:', ports.length);
      
      return ports.map((port, index) => {
        const info = port.getInfo();
        console.log(`Port ${index}:`, info);
        
        return {
          port,
          name: `COM${index + 1}`,
          vendorId: info.usbVendorId,
          productId: info.usbProductId
        };
      });
    } catch (error) {
      console.error('Error getting serial ports:', error);
      return [];
    }
  }

  // Request access to a new serial port
  async requestPort(): Promise<SerialPortInfo | null> {
    try {
      console.log('Requesting new serial port...');
      
      if (!this.isSupported()) {
        throw new Error('Web Serial API not supported in this browser. Please use Chrome, Edge, or Opera with HTTPS.');
      }

      const port = await navigator.serial.requestPort();
      console.log('Port requested successfully:', port);
      
      const info = port.getInfo();
      return {
        port,
        name: `COM${Date.now()}`,
        vendorId: info.usbVendorId,
        productId: info.usbProductId
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

// Parse LoRaWAN motion data format: [node1:1 node2:0 node3:0]
export const parseMotionData = (data: string): { nodeId: string; motion: boolean }[] | null => {
  try {
    // Remove brackets and split by spaces
    const cleanData = data.trim().replace(/[\[\]]/g, '');
    const nodePairs = cleanData.split(' ').filter(pair => pair.length > 0);
    
    const results: { nodeId: string; motion: boolean }[] = [];
    
    for (const pair of nodePairs) {
      const parts = pair.split(':');
      if (parts.length === 2) {
        const nodeId = parts[0].toLowerCase();
        const value = parseInt(parts[1], 10);
        
        if (!isNaN(value) && (value === 0 || value === 1)) {
          results.push({
            nodeId,
            motion: value === 1
          });
        }
      }
    }
    
    return results.length > 0 ? results : null;
  } catch (error) {
    console.error('Error parsing motion data:', error);
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
