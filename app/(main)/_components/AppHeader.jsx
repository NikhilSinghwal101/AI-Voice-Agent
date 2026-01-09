import { UserButton } from "@stackframe/stack";
import Image from "next/image";
import React from "react";

function AppHeader() {
    return (
        <div className="px-4 shadow-sm flex items-center justify-between">
            <Image src="/logo.png" alt="Logo" width={80} height={40} />
            <UserButton />
        </div>
    )
}

export default AppHeader;   