"use client";
import React, { useContext, useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { UserContext } from "@/app/_context/UserContext";
import { api } from "@/convex/_generated/api";
import { CoachingOptions } from "@/services/Options";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import moment from "moment";
import Link from "next/link";

function History() {
  const convex = useConvex();
  const { userData } = useContext(UserContext);
  const [discussionRoomList, setDiscussionRoomList] = useState([]);

  useEffect(() => {
    userData && getDiscussionRooms();
  }, [userData]);

  const getDiscussionRooms = async () => {
    const result = await convex.query(api.DiscussionRoom.GetAllDiscussionRoom, {
      uid: userData?._id,
    });
    console.log("Discussion Rooms List:", result);
    setDiscussionRoomList(result);
  };

  const GetAbstractImages = (option) => {
    const coachingOption = CoachingOptions.find((item) => item.name === option);
    return coachingOption?.abstract ?? "/ab1.png";
  };

  return (
    <div>
      <h2 className="font-bold text-sm">Your Previous Lectures</h2>
      {discussionRoomList?.length === 0 && (
        <p className="text-gray-400 text-xs">
          Your don't have any previous lectures
        </p>
      )}
      <div className="mt-5">
        {discussionRoomList?.map(
          (item, index) =>
            (item?.coachingOption == "Topic Base Lecture" ||
              item?.coachingOption == "Learn Language") && (
              <div key={index} className="border-b pb-3 mb-4 group flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-7">
                  <Image
                    src={GetAbstractImages(item?.coachingOption)}
                    alt="Abstract Image"
                    width={70}
                    height={70}
                    className="rounded-full h-12.5 w-12.5 object-cover"
                  />
                  <div>
                    <h2 className="font-bold text-sm">{item?.topic}</h2>
                    <h2 className="text-gray-400 text-sm">{item?.coachingOption}</h2>
                    <h2 className="text-gray-400 text-xs">{moment(item?._creationTime).fromNow()}</h2>
                  </div>
                </div>
                <Link href={`/view-summary/${item?._id}`}>
                  <Button variant="outline" className="invisible group-hover:visible cursor-pointer">View Notes</Button>
                </Link>
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default History;
