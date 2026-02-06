import { Button } from "@/components/ui/button";
import React, { useEffect, useRef } from "react";
import "./chatbox.css";

function ChatBox({ conversation }) {
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when conversation updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation]);
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
    </div>
  );
}

export default ChatBox;
