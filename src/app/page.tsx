"use client";
import { useCallback, useEffect, useState } from "react";

import Sora from "sora-js-sdk";
import type { ConnectionPublisher } from "sora-js-sdk";

export default function Home() {
  const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
  const [sendrecv, setSendrecv] = useState<ConnectionPublisher | null>(null);

  const handleConnect = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
      const debug = true;
      const signalingUrl = process.env.NEXT_PUBLIC_SORA_SIGNALING_URL as string;
      const channelId = process.env.NEXT_PUBLIC_SORA_CHANNEL_ID as string;
      const metadata = {
        access_token: process.env.NEXT_PUBLIC_ACCESS_TOKEN,
      };
      const options = {
        multistream: true,
      };
      const soraConnection = Sora.connection(signalingUrl, debug);
      const connection = soraConnection.sendrecv(channelId, metadata, options);
      connection.on("track", (event) => {
        const stream = event.streams[0];
        setRemoteStreams((prevStreams) => [...prevStreams, stream]);
      });
      connection.on("removetrack", (event) => {
        const target = event.target as MediaStream;
        setRemoteStreams((prevStreams) =>
          prevStreams.filter((stream) => stream.id !== target.id)
        );
      });
      await connection.connect(stream);
      setSendrecv(connection);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = useCallback(async () => {
    if (sendrecv) {
      await sendrecv.disconnect();
      setRemoteStreams([]);
    }
  }, [sendrecv]);

  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, [handleDisconnect]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <button
        id="connectButton"
        onClick={handleConnect}
        disabled={sendrecv !== null}
      >
        Connect
      </button>
      <button
        id="disconnectButton"
        onClick={handleDisconnect}
        disabled={sendrecv === null}
      >
        Disconnect
      </button>
      <div id="remoteVideos">
        {remoteStreams.map((stream) => (
          <video
            key={stream.id}
            id={`remoteVideo-${stream.id}`}
            autoPlay
            playsInline
            ref={(video) => video && (video.srcObject = stream)}
          />
        ))}
      </div>
    </main>
  );
}
