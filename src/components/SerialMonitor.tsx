
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Monitor, Trash2, Download } from 'lucide-react';

interface SerialDataEntry {
  timestamp: Date;
  data: string;
  type: 'raw' | 'parsed' | 'error';
}

interface SerialMonitorProps {
  isConnected: boolean;
}

const SerialMonitor: React.FC<SerialMonitorProps> = ({ isConnected }) => {
  const [dataEntries, setDataEntries] = useState<SerialDataEntry[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Listen for serial data
  useEffect(() => {
    const handleData = (data: string) => {
      const newEntry: SerialDataEntry = {
        timestamp: new Date(),
        data: data.trim(),
        type: 'raw'
      };

      setDataEntries(prev => {
        const updated = [newEntry, ...prev.slice(0, 199)]; // Keep last 200 entries
        return updated;
      });
    };

    // Add to global window for debugging
    (window as any).serialMonitorLog = handleData;

    return () => {
      delete (window as any).serialMonitorLog;
    };
  }, []);

  // Auto scroll to bottom when new data arrives
  useEffect(() => {
    if (isAutoScroll && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [dataEntries, isAutoScroll]);

  const clearData = () => {
    setDataEntries([]);
  };

  const exportData = () => {
    const dataText = dataEntries
      .map(entry => `[${entry.timestamp.toISOString()}] ${entry.data}`)
      .join('\n');
    
    const blob = new Blob([dataText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-data-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString() + '.' + timestamp.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <Card className="border-army-khaki/30 bg-card/90">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Serial Data Monitor
            {isConnected && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                Live
              </span>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearData}
              disabled={dataEntries.length === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportData}
              disabled={dataEntries.length === 0}
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Entries: {dataEntries.length}/200</span>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAutoScroll}
              onChange={(e) => setIsAutoScroll(e.target.checked)}
              className="w-3 h-3"
            />
            Auto-scroll
          </label>
        </div>
        
        <ScrollArea className="h-64 w-full border rounded-md bg-black/50 p-2" ref={scrollAreaRef}>
          {dataEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {isConnected ? 'Waiting for data...' : 'Connect to serial port to see data'}
            </div>
          ) : (
            <div className="space-y-1 font-mono text-xs">
              {dataEntries.map((entry, index) => (
                <div key={index} className="flex gap-2 hover:bg-white/5 px-1 rounded">
                  <span className="text-gray-400 shrink-0 w-20">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                  <span className="text-green-400 shrink-0 w-8">
                    {entry.type === 'raw' ? 'RAW' : entry.type === 'parsed' ? 'OK' : 'ERR'}
                  </span>
                  <span className="text-white break-all">
                    {entry.data}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        <div className="text-xs text-muted-foreground">
          Monitor shows real-time serial data. Expected format: <code>nodeX:Y</code> where X is node number and Y is 0/1.
        </div>
      </CardContent>
    </Card>
  );
};

export default SerialMonitor;
