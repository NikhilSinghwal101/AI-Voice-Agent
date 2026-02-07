"use client";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { AIModel, ConvertTextToSpeech, getToken } from "@/services/GlobalServices";
import { Loader2Icon } from "lucide-react";
import { CoachingExperts } from "@/services/Options";
import { UserButton } from "@stackframe/stack";
import { StreamingTranscriber } from "assemblyai";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import ChatBox from "./_components/ChatBox";

function DiscussionRoom() {
  const { roomid } = useParams();
  const DiscussionRoomData = useQuery(api.DiscussionRoom.GetDiscussionRoom, {
    id: roomid,
  });
  const UpdateConversation = useMutation(api.DiscussionRoom.UpdateDiscussionRoomConversation);
  const [expert, setExpert] = useState();
  const [enableMic, setEnableMic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState();
  const [conversation, setConversation] = useState([
    // {
    //   role: "system",
    //   content: "Hii",
    // },
    // {
    //   role: "user",
    //   content: "Hello",
    // },
  ]);
  const recorder = useRef(null);
  const RecordRTCRef = useRef(null);
  const realtimeTranscriber = useRef(null);
  const isConnectedRef = useRef(false);
  const skippedChunkCountRef = useRef(0);
  const lastProcessedTranscriptRef = useRef("");
  const turnDebounceRef = useRef(null);
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
      setIsLoading(true);
      // Close any existing connection first
      if (realtimeTranscriber.current) {
        try {
          await realtimeTranscriber.current.close();
        } catch (err) {
          console.warn("Error closing previous connection:", err);
        }
        realtimeTranscriber.current = null;
      }

      const token = await getToken();
      console.log("AssemblyAI token:", token);

      if (!token) {
        throw new Error("Token missing");
      }

      realtimeTranscriber.current = new StreamingTranscriber({
        token,
        sampleRate: 16000,
      });

      // When user finishes speaking (on "turn" event):
      realtimeTranscriber.current.on("turn", async (t) => {
        if (t.transcript && t.transcript.trim()) {
          console.log("Turn event received:", t.transcript);
          
          // Clear previous debounce timer
          if (turnDebounceRef.current) {
            clearTimeout(turnDebounceRef.current);
          }

          // Debounce: Wait 2 seconds after turn event before processing
          // This allows the transcriber to complete the full sentence
          turnDebounceRef.current = setTimeout(async () => {
            if (t.transcript !== lastProcessedTranscriptRef.current) {
              lastProcessedTranscriptRef.current = t.transcript;
              console.log("Final Transcript (after debounce):", t.transcript);
              setTranscript((prev) => prev + " " + t.transcript);

              // Add user message to conversation
              setConversation((prev) => [...prev, {
                role: "user",
                content: t.transcript
              }]);

              // Small delay to ensure user message is added first
              await new Promise((resolve) => setTimeout(resolve, 500));

              // Call AI Model to get response
              try {
                const response = await AIModel(
                  DiscussionRoomData?.topic,
                  DiscussionRoomData?.coachingOption,
                  t.transcript
                );
                console.log("AI Response:", response);
                
                // Add AI response to conversation
                if (response) {
                  setConversation((prev) => [...prev, {
                    role: "system",
                    content: response
                  }]);

                  // Convert AI response to speech
                  try {
                    const audioUrl = await ConvertTextToSpeech(response, expert?.name);
                    console.log("Audio URL:", audioUrl);
                    setAudioUrl(audioUrl);
                  } catch (error) {
                    console.error("Text to Speech conversion error:", error);
                  }
                }
              } catch (error) {
                console.error("AI Model error:", error);
              }
            }
          }, 2000); // 2 second delay to ensure full sentence is captured
        }
      });

      realtimeTranscriber.current.on("partial_transcript", (t) => {
        if (t.partial_transcript) {
          setPartialTranscript(t.partial_transcript);
        }
      });

      realtimeTranscriber.current.on("error", console.error);
      realtimeTranscriber.current.on("close", () => {
        isConnectedRef.current = false;
        console.log("Streaming socket closed");
      });

      await realtimeTranscriber.current.connect();
      isConnectedRef.current = true;

      // Wait a bit to ensure socket is fully established
      await new Promise((resolve) => setTimeout(resolve, 500));

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
              console.warn(
                "Socket closed during audio transmission (expected)"
              );
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
      setEnableMic(true);
      setIsLoading(false);
    } catch (err) {
      console.error("❌ connectToServer failed:", err);
      setIsLoading(false);
      setEnableMic(false);
    }
  };

  const disconnect = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Reset transcript tracking
    lastProcessedTranscriptRef.current = "";

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

    setIsLoading(false);
    setEnableMic(false);

    // Save conversation to database
    if (DiscussionRoomData?._id) {
      try {
        await UpdateConversation({
          id: DiscussionRoomData._id,
          conversation: conversation
        });
        console.log("Conversation saved to database");
      } catch (error) {
        console.error("Failed to save conversation:", error);
      }
    }
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
            <audio src={audioUrl} autoPlay type="audio/mp3" />
            <div className="p-5 bg-gray-200 px-10 rounded-lg absolute bottom-5 right-5">
              <UserButton />
            </div>
          </div>
          <div className="mt-5 flex items-center justify-center">
            {!enableMic ? (
              <Button
                onClick={connectToServer}
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                {isLoading ? "Connecting..." : "Connect"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={disconnect}
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                {isLoading ? "Disconnecting..." : "Disconnect"}
              </Button>
            )}
          </div>
        </div>
        <div>
          <div>
            <ChatBox
            //   transcript={transcript}
            //   setTranscript={setTranscript}
            //   partialTranscript={partialTranscript}
            //   setPartialTranscript={setPartialTranscript}
            conversation = {conversation}
            />
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
