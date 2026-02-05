"use client";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { getToken } from "@/services/GlobalServices";
import { CoachingExperts } from "@/services/Options";
import { UserButton } from "@stackframe/stack";
import { StreamingTranscriber } from "assemblyai";
import { useQuery } from "convex/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

function DiscussionRoom() {
  const { roomid } = useParams();
  const DiscussionRoomData = useQuery(api.DiscussionRoom.GetDiscussionRoom, {
    id: roomid,
  });
  const [expert, setExpert] = useState();
  const [enableMic, setEnableMic] = useState(false);
  const recorder = useRef(null);
  const RecordRTCRef = useRef(null);
  const realtimeTranscriber = useRef(null);
  const isConnectedRef = useRef(false);
  const skippedChunkCountRef = useRef(0);
  let silenceTimeout;

  useEffect(() => {
    // Load RecordRTC only on client side
    if (typeof window !== "undefined") {
      import("recordrtc").then((module) => {
        RecordRTCRef.current = module.default;
      });
    }
  }, []);

  useEffect(() => {
    if (DiscussionRoomData) {
      const Expert = CoachingExperts.find(
        (item) => item.name === DiscussionRoomData?.expertName
      );
      console.log("Expert Data:", Expert);
      setExpert(Expert);
    }
  }, [DiscussionRoomData]);

//   const connectToServer = async () => {
//     setEnableMic(true);

//     // Init Assembly AI
//     realtimeTranscriber.current = new RealtimeTranscriber({
//       token: await getToken(),
//       sample_rate: 16_000,
//     });

//     realtimeTranscriber.current.on("transcript", async (transcript) => {
//       console.log("Transcript:", transcript);
//     });

//     await realtimeTranscriber.current.connect();
    isConnectedRef.current = true;

//     if (
//       typeof window !== "undefined" &&
//       typeof navigator !== "undefined" &&
//       RecordRTCRef.current
//     ) {
//       navigator.mediaDevices
//         .getUserMedia({ audio: true })
//         .then((stream) => {
//           recorder.current = new RecordRTCRef.current(stream, {
//             type: "audio",
//             mimeType: "audio/webm;codecs=pcm",
//             recorderType: RecordRTCRef.current.StereoAudioRecorder,
//             timeSlice: 250,
//             desiredSampRate: 16000,
//             numberOfAudioChannels: 1,
//             buffersSize: 4096,
//             audioBitsPerSecond: 128000,
//             ondataavailable: async (blob) => {
//               if (!realtimeTranscriber.current) return;
//               // Reset the silence detection timer on audio input
//               clearTimeout(silenceTimeout);
//               const buffer = await blob.arrayBuffer();
//               console.log("Audio Blob Buffer:", buffer);
//               realtimeTranscriber.current.sendAudio(buffer);    
//               // Restart the silence detection timer
//               silenceTimeout = setTimeout(() => {
//                 console.log("User stopped talking");
//                 // Handle user stopped talking (e.g., send final transcript)
//               }, 2000);
//             },
//           });
//           recorder.current.startRecording();
//         })
//         .catch((err) => console.log(err));
//     }
//   };

//   const disconnect = async (e) => {
//     e.preventDefault();
//     await realtimeTranscriber.current.close();
//     if (recorder.current) {
//         recorder.current.pauseRecording();
//     }
//     recorder.current = null;
//     setEnableMic(false);
//   };

const connectToServer = async () => {
  try {
    // Close any existing connection first
    if (realtimeTranscriber.current) {
      try {
        await realtimeTranscriber.current.close();
      } catch (err) {
        console.warn("Error closing previous connection:", err);
      }
      realtimeTranscriber.current = null;
    }

    setEnableMic(true);

    const token = await getToken();
    console.log("AssemblyAI token:", token);

    if (!token) {
      throw new Error("Token missing");
    }

    realtimeTranscriber.current = new StreamingTranscriber({
      token,
      sampleRate: 16000,
    });

    realtimeTranscriber.current.on("turn", (t) => {
      if (t.transcript) console.log("Transcript:", t.transcript);
    });

    realtimeTranscriber.current.on("error", console.error);
    realtimeTranscriber.current.on("close", () => {
      isConnectedRef.current = false;
      console.log("Streaming socket closed");
    });

    await realtimeTranscriber.current.connect();
    isConnectedRef.current = true;
    
    // Wait a bit to ensure socket is fully established
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log("Socket fully established, starting recording");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    recorder.current = new RecordRTCRef.current(stream, {
      type: "audio",
      recorderType: RecordRTCRef.current.StereoAudioRecorder,
      desiredSampRate: 16000,
      numberOfAudioChannels: 1,
      timeSlice: 250,
      ondataavailable: async (blob) => {
        // First check
        if (!realtimeTranscriber.current) {
          skippedChunkCountRef.current++;
          
          // Stop after 30 skipped chunks to prevent infinite loop (silently)
          if (skippedChunkCountRef.current > 30) {
            if (recorder.current) {
              try {
                recorder.current.stopRecording();
                recorder.current = null;
              } catch (e) {
                // Silent
              }
            }
            setEnableMic(false);
            return;
          }
          
          // Silent skip
          return;
        }
        
        // Reset skip counter when we successfully send
        skippedChunkCountRef.current = 0;
        
        if (!isConnectedRef.current) {
          return;
        }
        
        try {
          // Safety check before async operation
          if (!realtimeTranscriber.current) {
            return;
          }
          
          const buffer = await blob.arrayBuffer();
          console.log("Sending audio chunk:", buffer.byteLength, "bytes");
          
          // Final check before send
          if (!realtimeTranscriber.current) {
            return;
          }
          
          realtimeTranscriber.current.sendAudio(buffer);
        } catch (err) {
          // Socket closed is expected, just log as warning not error
          if (err.message && err.message.includes("Socket is not open")) {
            console.warn("Socket closed during audio transmission (expected)");
            isConnectedRef.current = false;
            if (recorder.current) {
              try {
                recorder.current.stopRecording();
                recorder.current = null;
              } catch (e) {
                console.warn("Error stopping recorder:", e);
              }
            }
          } else {
            // Only log unexpected errors
            console.error("Unexpected error sending audio:", err);
          }
        }
      },
    });

    recorder.current.startRecording();
  } catch (err) {
    console.error("❌ connectToServer failed:", err);
    setEnableMic(false);
  }
};


const disconnect = async (e) => {
  e.preventDefault();

  // 🛑 Stop recorder safely
  if (recorder.current) {
    try {
      recorder.current.stopRecording();
    } catch (err) {
      console.warn("Recorder already stopped");
    }
    recorder.current = null;
  }

  // 🛑 Close AssemblyAI socket safely
  if (realtimeTranscriber.current) {
    try {
      await realtimeTranscriber.current.close();
    } catch (err) {
      console.warn("Transcriber already closed");
    }
    realtimeTranscriber.current = null;
  }

  setEnableMic(false);
};


  return (
    <div className="-mt-10">
      <h2 className="text-lg font-bold">
        {DiscussionRoomData?.coachingOption}
      </h2>
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="h-[60vh] bg-secondary border rounded-4xl flex flex-col items-center justify-center relative">
            {expert?.avatar && (
              <Image
                src={expert.avatar}
                alt="Avatar"
                width={200}
                height={200}
                className="h-20 w-20 rounded-full object-cover animate-pulse"
              />
            )}
            <h2 className="text-gray-500 text-sm">{expert?.name}</h2>
            <div className="p-5 bg-gray-200 px-10 rounded-lg absolute bottom-5 right-5">
              <UserButton />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center">
            {!enableMic ? (
              <Button onClick={connectToServer} className="cursor-pointer">
                Connect
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={disconnect}
                className="cursor-pointer"
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>
        <div>
          <div className="h-[60vh] bg-secondary border rounded-4xl flex flex-col items-center justify-center relative">
            <h2>Chat Section</h2>
          </div>
          <h2 className="mt-4 text-gray-400 text-sm">
            At the end of your conversation we will automatically generate
            feedback/notes from your conversation
          </h2>
        </div>
        <div></div>
      </div>
    </div>
  );
}
export default DiscussionRoom; 



