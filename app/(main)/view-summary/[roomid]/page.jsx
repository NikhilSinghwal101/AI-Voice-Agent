"use client";
import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { CoachingOptions } from "@/services/Options";
import Image from "next/image";
import moment from "moment";
import ChatBox from "../../discussion-room/[roomid]/_components/ChatBox";
import SummaryBox from "../_components/SummaryBox";

function ViewSummary() {
  const { roomid } = useParams();
  const DiscussionRoomData = useQuery(api.DiscussionRoom.GetDiscussionRoom, {
    id: roomid,
  });
  console.log("DiscussionRoomData: ", DiscussionRoomData);

  const GetAbstractImages = (option) => {
    const coachingOption = CoachingOptions.find((item) => item.name === option);
    return coachingOption?.abstract ?? "/ab1.png";
  };
  return (
    <div>
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-7">
          <Image
            src={GetAbstractImages(DiscussionRoomData?.coachingOption)}
            alt="Abstract Image"
            width={100}
            height={100}
            className="h-17.5 w-17.5 object-cover rounded-full"
          />
          <div>
            <h2 className="font-bold text-lg">{DiscussionRoomData?.topic}</h2>
            <h2 className="text-gray-400 text-sm">
              {DiscussionRoomData?.coachingOption}
            </h2>
          </div>
        </div>
        <h2 className="text-gray-400 text-sm">
          {moment(DiscussionRoomData?._creationTime).fromNow()}
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-5">
        <div className="col-span-3">
            <h2 className="font-bold text-lg mb-4">Summary of Your Conversation</h2>
            <SummaryBox summary={DiscussionRoomData?.summary} />
        </div>
        <div className="col-span-2">
            <h2 className="font-bold text-lg mb-4">Your Conversation</h2>
            <ChatBox 
            conversation={DiscussionRoomData?.conversation}
            coachingOption={DiscussionRoomData?.coachingOption}
            enableFeedbackNotes={false}
            />
        </div>
      </div>
    </div>
  );
}

export default ViewSummary;
