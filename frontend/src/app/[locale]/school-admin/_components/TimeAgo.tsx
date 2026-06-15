'use client';

import { useEffect, useRef, useState } from 'react';

export function TimeAgo({ dateStr, serverTime }: { dateStr: string; serverTime?: string }) {
  const [relative, setRelative] = useState('');
  const offsetRef = useRef(0);

  useEffect(() => {
    if (serverTime) {
      offsetRef.current = Date.now() - new Date(serverTime).getTime();
    }
  }, [serverTime]);

  useEffect(() => {
    const update = () => {
      const now = Date.now() - offsetRef.current;
      const then = new Date(dateStr).getTime();
      const seconds = Math.floor((now - then) / 1000);

      if (seconds < 60) { setRelative('Just now'); return; }
      const mins = Math.floor(seconds / 60);
      if (mins < 60) { setRelative(`${mins}m ago`); return; }
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) { setRelative(`${hrs}h ago`); return; }
      const days = Math.floor(hrs / 24);
      if (days < 7) { setRelative(`${days}d ago`); return; }
      setRelative(new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    };

    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [dateStr, serverTime]);

  return <span>{relative}</span>;
}
