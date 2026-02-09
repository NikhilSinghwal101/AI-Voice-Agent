"use client";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import React, { useEffect, useRef, useState } from "react";
import "./chatbox.css";
import { AIModelToGenerateFeedbackAndNotes } from "@/services/GlobalServices";
import { LoaderCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

function ChatBox({ conversation, enableFeedbackNotes, coachingOption, discussionRoomId }) {
  const chatEndRef = useRef(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const updateSummary = useMutation(
    api.DiscussionRoom.UpdateDiscussionRoomSummary
  );

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);

  const GenerateFeedbackNotes = async () => {
    try {
      setLoadingFeedback(true);
      const result = await AIModelToGenerateFeedbackAndNotes(
        coachingOption,
        conversation
      );
      console.log(result);
      
      // Only update if we have a valid discussion room ID
      if (discussionRoomId) {
        await updateSummary({
          id: discussionRoomId,
          summary: result,
        });
      }
      setLoadingFeedback(false);

      toast('Feedback/Notes saved!');
    } catch (error) {
      console.error("Error generating feedback/notes:", error);
      setLoadingFeedback(false);
      toast('Error generating feedback/notes!');
      return;
    }
  };

  return (
    <div>
      <div className="h-[60vh] bg-secondary border rounded-xl flex flex-col p-4 relative overflow-y-auto scrollbar-hide">
        {conversation && conversation.length > 0 ? (
          <>
            {conversation.map((item, index) => (
              <div
                key={index}
                className={`text-sm flex ${item.role === "user" && "justify-end"}`}
              >
                {item.role === "system" ? (
                  <h2 className="p-1 px-2 mt-1 bg-primary text-white inline-block rounded-md">
                    {item.content}
                  </h2>
                ) : (
                  <h2 className="p-1 px-2 mt-1 bg-gray-200 inline-block rounded-md justify-end">
                    {item.content}
                  </h2>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">
                👋 Welcome to the Discussion Room!
              </p>
              <p className="text-gray-400 text-xs">
                Click the Connect button and start speaking to begin the
                conversation...
              </p>
            </div>
          </div>
        )}
      </div>
      {!enableFeedbackNotes ? (
        <h2 className="mt-4 text-gray-400 text-sm">
          At the end of your conversation we will automatically generate
          feedback/notes from your conversation
        </h2>
      ) : (
        <Button
          onClick={GenerateFeedbackNotes}
          disabled={loadingFeedback}
          className="mt-5 w-full cursor-pointer"
        >
          {loadingFeedback && <LoaderCircle className="animate-spin" />}
          {loadingFeedback ? "Generating..." : "Generate Feedback/Notes"}
        </Button>
      )}
    </div>
  );
}

export default ChatBox;
