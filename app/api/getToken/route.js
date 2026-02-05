// import { NextResponse } from "next/server";
// import { AssemblyAI } from "assemblyai";

// export async function POST() {
//   try {
//     const apiKey = process.env.ASSEMBLYAI_API_KEY;
//     if (!apiKey) {
//       return NextResponse.json(
//         { error: "Missing ASSEMBLYAI_API_KEY" },
//         { status: 500 }
//       );
//     }

//     const client = new AssemblyAI({ apiKey });
//     const token = await client.streaming.createTemporaryToken({
//       expires_in_seconds: 600,
//     });

//     return NextResponse.json({ token });
//   } catch (error) {
//     console.error(error);
//     return NextResponse.json(
//       { error: "Failed to generate token" },
//       { status: 500 }
//     );
//   }
// }
