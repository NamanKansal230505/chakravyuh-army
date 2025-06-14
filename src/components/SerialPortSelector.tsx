
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Usb, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SerialPortInfo {
  port: SerialPort;
  name: string;
  vendorId?: number;
  productId?: number;
}

interface SerialPortSelectorProps {
  availablePorts: SerialPortInfo[];
  isConnected: boolean;
  loading: boolean;
  onConnect: (portInfo: SerialPortInfo) => Promise<boolean>;
  onDisconnect: () => Promise<void>;
  onRequestNewPort: () => Promise<boolean>;
  onRefreshPorts: () => Promise<void>;
}

const SerialPortSelector: React.FC<SerialPortSelectorProps> = ({
  availablePorts,
  isConnected,
  loading,
  onConnect,
  onDisconnect,
  onRequestNewPort,
  onRefreshPorts
}) => {
  const [selectedPortIndex, setSelectedPortIndex] = React.useState<string>('');

  const handleConnect = async () => {
    const portIndex = parseInt(selectedPortIndex, 10);
    if (!isNaN(portIndex) && availablePorts[portIndex]) {
      await onConnect(availablePorts[portIndex]);
    }
  };

  const handleRequestNewPort = async () => {
    const success = await onRequestNewPort();
    if (success) {
      // Auto-select the newly added port
      setSelectedPortIndex((availablePorts.length - 1).toString());
    }
  };

  return (
    <Card className="border-army-khaki/30 bg-card/90">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Usb className="h-4 w-4" />
          LoRaWAN Serial Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={selectedPortIndex}
              onValueChange={setSelectedPortIndex}
              disabled={isConnected || loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select COM Port" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border">
                {availablePorts.map((port, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {port.name}
                    {port.vendorId && ` (VID: ${port.vendorId.toString(16).toUpperCase()})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefreshPorts}
            disabled={loading}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <>
              <Button
                onClick={handleConnect}
                disabled={!selectedPortIndex || loading}
                className="flex-1 bg-gradient-to-r from-army-green to-army-green/90"
              >
                <Wifi className="h-4 w-4 mr-2" />
                Connect
              </Button>
              <Button
                onClick={handleRequestNewPort}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                <Usb className="h-4 w-4 mr-2" />
                Add Port
              </Button>
            </>
          ) : (
            <Button
              onClick={onDisconnect}
              variant="destructive"
              className="flex-1"
            >
              <WifiOff className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          {isConnected ? (
            <span className="text-green-500">✓ Connected - Listening for LoRaWAN data</span>
          ) : (
            <span>Select a COM port to connect to your LoRaWAN master node</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SerialPortSelector;
