import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 }
      );
    }

    // For the new Universal Streaming API, return the API key directly
    // The RealtimeTranscriber will handle authentication
    return NextResponse.json({ token: apiKey });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get token", details: error.message },
      { status: 500 }
    );
  }
}
