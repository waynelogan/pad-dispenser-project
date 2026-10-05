'use client';
import { useState, useEffect } from 'react';

export default function LocalTime({ timestamp }: { timestamp: string }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(
      new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, [timestamp]);

  return <>{time}</>;
}