import axios from "axios";
import { CoachingOptions } from "./Options";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";

export const getToken = async () => {
  const res = await axios.post("/api/getToken");

  console.log("getToken API response:", res.data);

  return res.data?.token;
};

export const AIModel = async (topic, coachingOption, msg) => {
  try {
    // Validate inputs
    if (!msg || msg.trim() === "") {
      console.warn("AIModel: Empty message provided, skipping API call");
      return null;
    }

    if (!topic || !coachingOption) {
      console.warn("AIModel: Missing topic or coachingOption", { topic, coachingOption });
      return null;
    }

    // Validate API key
    const apiKey = process.env.NEXT_PUBLIC_AI_OPENROUTER;
    if (!apiKey) {
      throw new Error("OpenRouter API key not found in NEXT_PUBLIC_AI_OPENROUTER");
    }

    const option = CoachingOptions.find((item) => item.name === coachingOption);
    const PROMPT = option?.prompt.replace("{user_topic}", topic) || `You are an AI voice assistant providing information on ${topic}.`;

    console.log("Calling AI Model with:", { topic, coachingOption, msgLength: msg?.length });

    // Use axios directly for better error handling
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          { role: "system", content: PROMPT },
          { role: "user", content: msg }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      },
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
          "X-Title": "AI Interview Voice Agent",
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log("AI Response:", aiResponse);
    return aiResponse;
  } catch (error) {
    console.error("AIModel error details:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    if (error.response?.status === 400) {
      console.error("400 Bad Request: Check your API key format and request payload");
    }
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("401/403 Unauthorized: Your API key is invalid or expired");
    }
    if (error.response?.status === 429) {
      console.warn("Rate limit hit. Waiting before retry...");
    }
    throw error;
  }
}


export const ConvertTextToSpeech = async (text, expertName) => {
    const pollyClient = new PollyClient({
        region: "us-east-1",
        credentials: {
            accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_KEY,
        },
    })

    const command = new SynthesizeSpeechCommand({
        OutputFormat: "mp3",
        Text: text,
        VoiceId: expertName,
    });

    try {
        const { AudioStream } = await pollyClient.send(command);
        const audioArrayBuffer = await AudioStream.transformToByteArray();
        const audioBlob = new Blob([audioArrayBuffer], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);
        return audioUrl;
    } catch(e) {
        console.error("Error converting text to speech:", e);
        throw e;
    }
}