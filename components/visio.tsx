"use client";

/**
 * Running a local relay server will allow you to hide your API key
 * and run custom logic on the server
 *
 * Set the local relay server address to:
 * NEXT_PUBLIC_LOCAL_RELAY_SERVER_URL=http://localhost:8081
 *
 * This will also require you to set OPENAI_API_KEY= in a `.env` file
 * You can run it with `npm run relay`, in parallel with `npm start`
 */
const LOCAL_RELAY_SERVER_URL: string =
  process.env.NEXT_PUBLIC_LOCAL_RELAY_SERVER_URL || "";

import { useEffect, useRef, useCallback, useState } from "react";

import { RealtimeClient } from "@openai/realtime-api-beta";
import { ItemType } from "@openai/realtime-api-beta/dist/lib/client.js";
import { WavRecorder, WavStreamPlayer } from "../lib/wavtools/index.js";
import { instructions } from "../utils/conversation_config.js";
import { WavRenderer } from "../utils/wav_renderer";

import { X, Edit, Zap, ArrowUp, ArrowDown } from "react-feather";
import { Button } from "../components/button/Button";
import { Toggle } from "../components/toggle/Toggle";
import Link from "next/link.js";
import { ArrowLeft, PhoneOff } from "lucide-react";
import { Cam } from "./cam";

// import './Visio.scss';

/**
 * Type for result from get_weather() function call
 */

/**
 * Type for all event logs
 */
interface RealtimeEvent {
  time: string;
  source: "client" | "server";
  count?: number;
  event: { [key: string]: any };
}

export function Visio() {
  /**
   * Ask user for API Key
   * If we're using the local relay server, we don't need this
   */
  const apiKey = LOCAL_RELAY_SERVER_URL
    ? ""
    : localStorage.getItem("tmp::voice_api_key") ||
      prompt("OpenAI API Key") ||
      "";
  if (apiKey !== "") {
    localStorage.setItem("tmp::voice_api_key", apiKey);
  }

  /**
   * Instantiate:
   * - WavRecorder (speech input)
   * - WavStreamPlayer (speech output)
   * - RealtimeClient (API client)
   */
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 }),
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 }),
  );
  const clientRef = useRef<RealtimeClient>(
    new RealtimeClient(
      LOCAL_RELAY_SERVER_URL
        ? { url: LOCAL_RELAY_SERVER_URL }
        : {
            apiKey: apiKey,
            dangerouslyAllowAPIKeyInBrowser: true,
          },
    ),
  );

  /**
   * References for
   * - Rendering audio visualization (canvas)
   * - Autoscrolling event logs
   * - Timing delta for event log displays
   */
  const clientCanvasRef = useRef<HTMLCanvasElement>(null);
  const serverCanvasRef = useRef<HTMLCanvasElement>(null);
  const eventsScrollHeightRef = useRef(0);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<string>(new Date().toISOString());

  const SILENCE_THRESHOLD = 0.01; // Threshold for silence detection
  const NOISE_DURATION = 500; // Duration of the noise chunk in milliseconds
  const NOISE_AMPLITUDE = 0.05; // Amplitude for the noise chunk

  const sendNoiseIfSilent = useCallback(() => {
    let silenceStartTimestamp: number | null = null;
    let silenceTimeout: ReturnType<typeof setTimeout> | null = null;

    return (audioData: Int16Array) => {
      // Convert Int16Array to Float32Array (normalized to the range -1.0 to 1.0)
      const floatAudioData = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        floatAudioData[i] = audioData[i] / 32768;
      }

      // Check if the audio data is below the silence threshold
      const maxVolume = Math.max(...Array.from(floatAudioData).map(Math.abs));

      if (maxVolume < SILENCE_THRESHOLD) {
        // If silence is detected and we haven't started counting silence, start the timer
        if (!silenceStartTimestamp) {
          silenceStartTimestamp = Date.now();
        }

        // Clear any previous timeout and set a new one to trigger noise after 3 seconds of silence
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
        }

        silenceTimeout = setTimeout(() => {
          console.log("3 seconds of silence detected, sending noise chunk...");

          // Generate a noise chunk
          const noiseChunk = new Float32Array(NOISE_DURATION).map(
            () => (Math.random() - 0.5) * NOISE_AMPLITUDE,
          );

          // Send noise chunk to the client
          clientRef.current.appendInputAudio(noiseChunk);

          // Reset silence tracking after noise has been sent
          silenceStartTimestamp = null;
          silenceTimeout = null;
        }, 3000); // 3 seconds of silence
      } else {
        // Reset if there's sound
        silenceStartTimestamp = null;
        if (silenceTimeout) {
          clearTimeout(silenceTimeout);
          silenceTimeout = null;
        }
      }
    };
  }, []);

  const latestImageStringRef = useRef<string | null>(null);

  const [latestImageString, setLatestImageString] = useState<string | null>(
    null,
  );

  interface AIResponse {
    success: boolean;
    response?: string;
    error?: string;
  }

  interface CallResponse {
    success: boolean;
    message?: string;
    error?: string;
  }

  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch function to send the image URL for analysis
  const analyzeImage = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/pixtral", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: latestImageString,
          // model: 'pixtral-12b', // Optional, modify or omit as needed
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.statusText}`);
      }

      const data: AIResponse = await response.json();

      if (data.success && data.response) {
        setResult(data.response);
      } else {
        setError(data.error ?? "Unknown error occurred.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Event handler for the button click
  const handleButtonClick = (): void => {
    analyzeImage();
  };

  const handleCapture = (imageSrc: string) => {
    // Update the latest image string in state, will be captured by useEffect
    setLatestImageString(imageSrc);
    latestImageStringRef.current = imageSrc; // Update the ref
  };

  /**
   * All of our variables for displaying application state
   * - items are all conversation items (dialog)
   * - realtimeEvents are event logs, which can be expanded
   * - memoryKv is for set_memory() function
   * - coords, marker are for get_weather() function
   */
  const [items, setItems] = useState<ItemType[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});
  const [places, setPlaces] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [canPushToTalk, setCanPushToTalk] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [memoryKv, setMemoryKv] = useState<{ [key: string]: any }>({});

  /**
   * Utility for formatting the timing of logs
   */
  const formatTime = useCallback((timestamp: string) => {
    const startTime = startTimeRef.current;
    const t0 = new Date(startTime).valueOf();
    const t1 = new Date(timestamp).valueOf();
    const delta = t1 - t0;
    const hs = Math.floor(delta / 10) % 100;
    const s = Math.floor(delta / 1000) % 60;
    const m = Math.floor(delta / 60_000) % 60;
    const pad = (n: number) => {
      let s = n + "";
      while (s.length < 2) {
        s = "0" + s;
      }
      return s;
    };
    return `${pad(m)}:${pad(s)}.${pad(hs)}`;
  }, []);

  /**
   * When you click the API key
   */
  const resetAPIKey = useCallback(() => {
    const apiKey = prompt("OpenAI API Key");
    if (apiKey !== null) {
      localStorage.clear();
      localStorage.setItem("tmp::voice_api_key", apiKey);
      window.location.reload();
    }
  }, []);

  /**
   * Connect to conversation:
   * WavRecorder taks speech input, WavStreamPlayer output, client is API client
   */
  const connectConversation = useCallback(async () => {
    await changeTurnEndType("server_vad");

    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;

    // Set state variables
    startTimeRef.current = new Date().toISOString();
    setIsConnected(true);
    setRealtimeEvents([]);
    setItems(client.conversation.getItems());

    // Connect to microphone
    await wavRecorder.begin();

    // Connect to audio output
    await wavStreamPlayer.connect();

    // Connect to realtime API
    await client.connect();
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `Hello!`,
        // text: `For testing purposes, I want you to list ten car brands. Number each item, e.g. "one (or whatever number you are one): the item name".`
      },
    ]);

    if (client.getTurnDetectionType() === "server_vad") {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
  }, []);

  /**
   * Disconnect and reset conversation state
   */
  const disconnectConversation = useCallback(async () => {
    setIsConnected(false);
    setRealtimeEvents([]);
    setItems([]);
    setMemoryKv({});

    const client = clientRef.current;
    client.disconnect();

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();
  }, []);

  const deleteConversationItem = useCallback(async (id: string) => {
    const client = clientRef.current;
    client.deleteItem(id);
  }, []);

  /**
   * In push-to-talk mode, start recording
   * .appendInputAudio() for each sample
   */
  const startRecording = async () => {
    setIsRecording(true);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const trackSampleOffset = await wavStreamPlayer.interrupt();
    if (trackSampleOffset?.trackId) {
      const { trackId, offset } = trackSampleOffset;
      await client.cancelResponse(trackId, offset);
    }
    await wavRecorder.record((data) => {
      // Append audio data to the client
      client.appendInputAudio(data.mono);

      // Check for silence and send noise if needed
      sendNoiseIfSilent(data.mono);
    });
  };

  /**
   * In push-to-talk mode, stop recording
   */
  const stopRecording = async () => {
    setIsRecording(false);
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.pause();
    client.createResponse();
  };

  /**
   * Switch between Manual <> VAD mode for communication
   */
  const changeTurnEndType = async (value: string) => {
    const client = clientRef.current;
    const wavRecorder = wavRecorderRef.current;
    if (value === "none" && wavRecorder.getStatus() === "recording") {
      await wavRecorder.pause();
    }
    client.updateSession({
      turn_detection: value === "none" ? null : { type: "server_vad" },
    });
    if (value === "server_vad" && client.isConnected()) {
      await wavRecorder.record((data) => client.appendInputAudio(data.mono));
    }
    setCanPushToTalk(value === "none");
  };

  /**
   * Auto-scroll the event logs
   */
  useEffect(() => {
    if (eventsScrollRef.current) {
      const eventsEl = eventsScrollRef.current;
      const scrollHeight = eventsEl.scrollHeight;
      // Only scroll if height has just changed
      if (scrollHeight !== eventsScrollHeightRef.current) {
        eventsEl.scrollTop = scrollHeight;
        eventsScrollHeightRef.current = scrollHeight;
      }
    }
  }, [realtimeEvents]);

  /**
   * Auto-scroll the conversation logs
   */
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll("[data-conversation-content]"),
    );
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement;
      conversationEl.scrollTop = conversationEl.scrollHeight;
    }
  }, [items]);

  /**
   * Set up render loops for the visualization canvas
   */
  useEffect(() => {
    let isLoaded = true;

    const wavRecorder = wavRecorderRef.current;
    const clientCanvas = clientCanvasRef.current;
    let clientCtx: CanvasRenderingContext2D | null = null;

    const wavStreamPlayer = wavStreamPlayerRef.current;
    const serverCanvas = serverCanvasRef.current;
    let serverCtx: CanvasRenderingContext2D | null = null;

    const render = () => {
      if (isLoaded) {
        if (clientCanvas) {
          if (!clientCanvas.width || !clientCanvas.height) {
            clientCanvas.width = clientCanvas.offsetWidth;
            clientCanvas.height = clientCanvas.offsetHeight;
          }
          clientCtx = clientCtx || clientCanvas.getContext("2d");
          if (clientCtx) {
            clientCtx.clearRect(0, 0, clientCanvas.width, clientCanvas.height);
            const result = wavRecorder.recording
              ? wavRecorder.getFrequencies("voice")
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              clientCanvas,
              clientCtx,
              result.values,
              "#dadeff",
              10,
              0,
              8,
            );
          }
        }
        if (serverCanvas) {
          if (!serverCanvas.width || !serverCanvas.height) {
            serverCanvas.width = serverCanvas.offsetWidth;
            serverCanvas.height = serverCanvas.offsetHeight;
          }
          serverCtx = serverCtx || serverCanvas.getContext("2d");
          if (serverCtx) {
            serverCtx.clearRect(0, 0, serverCanvas.width, serverCanvas.height);
            const result = wavStreamPlayer.analyser
              ? wavStreamPlayer.getFrequencies("voice")
              : { values: new Float32Array([0]) };
            WavRenderer.drawBars(
              serverCanvas,
              serverCtx,
              result.values,
              "#6a57f1",
              10,
              0,
              8,
            );
          }
        }
        window.requestAnimationFrame(render);
      }
    };
    render();

    return () => {
      isLoaded = false;
    };
  }, []);

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current;
    const client = clientRef.current;

    // Set instructions
    client.updateSession({ instructions: instructions });
    // Set transcription, otherwise we don't get user transcriptions back
    client.updateSession({ input_audio_transcription: { model: "whisper-1" } });

    // Add tools
    client.addTool(
      {
        name: "set_memory",
        description: "Saves important data about the user into memory.",
        parameters: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description:
                "The key of the memory value. Always use lowercase and underscores, no other characters.",
            },
            value: {
              type: "string",
              description: "Value can be anything represented as a string",
            },
          },
          required: ["key", "value"],
        },
      },
      async ({ key, value }: { [key: string]: any }) => {
        setMemoryKv((memoryKv) => {
          const newKv = { ...memoryKv };
          newKv[key] = value;
          return newKv;
        });
        return { ok: true };
      },
    );

    client.addTool(
      {
        name: "look_through_webcam",
        description: `Allows you to look through the user's webcam. You give a prompt to ask what you want to look for through the user's webcam.`,
        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "What you want to look for.",
            },
          },
          required: ["prompt"],
        },
      },
      async ({ prompt }: { prompt: string }) => {
        try {
          // Use the ref to get the latest captured image string
          const imageSrc = latestImageStringRef.current;

          if (!imageSrc) {
            throw new Error("No image available for analysis.");
          }

          // console.log("Using image:", imageSrc);

          // Send the image for analysis
          const response = await fetch("/api/pixtral", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageUrl: imageSrc,
              prompt: prompt,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.statusText}`);
          }

          const data: AIResponse = await response.json();

          // Return the result to the AI
          if (data.success && data.response) {
            return { result: data.response };
          } else {
            return { error: data.error ?? "Unknown error occurred." };
          }
        } catch (error) {
          return {
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred.",
          };
        }
      },
    );

    client.addTool(
      {
        name: "find_places",
        description: `Finds places based on the user's query, such as "Hospitals in Paris" or "Restaurants near me."`,
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "A text query to search for places, such as 'Hospitals in Paris', 'Restaurants near me', etc.",
            },
          },
          required: ["query"],
        },
      },
      async ({ query }: { query: string }) => {
        try {
          const response = await fetch("/api/places", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }), // Pass the query to the API
          });

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.statusText}`);
          }

          const data = await response.json();

          setPlaces((prevPlaces) => [...prevPlaces, data.places]);

          // Return the result to the AI
          if (data.places) {
            return { result: data.places };
          } else {
            return { error: data.error ?? "No places found." };
          }
        } catch (error) {
          return {
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred.",
          };
        }
      },
    );

    client.addTool(
      {
        name: "call_number",
        description: `Launches a call with a provided number and prompt. Do not use to call doctors.`,
        parameters: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description:
                "The reason you are making this call. Be very specific.",
            },
            phoneNumber: {
              type: "string",
              description:
                "The full international phone number you are calling.",
            },
          },
          required: ["subject", "phoneNumber"],
        },
      },
      async ({
        subject,
        phoneNumber,
      }: {
        subject: string;
        phoneNumber: string;
      }) => {
        try {
          const response = await fetch("/api/call-real", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subject: subject,
              phoneNumber: phoneNumber,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.statusText}`);
          }

          const data: CallResponse = await response.json();

          // Return the result to the AI
          if (data.success && data.message) {
            return { result: data.message };
          } else {
            return { error: data.error ?? "Unknown error occurred." };
          }
        } catch (error) {
          return {
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred.",
          };
        }
      },
    );

    client.addTool(
      {
        name: "make_doctor_appointment",
        description: `Launches a call with a doctor to take an appointment.`,
        parameters: {
          type: "object",
          properties: {
            subject: {
              type: "string",
              description:
                "Why you are calling a doctor. Be very specific. Give as much information as possible. Feel free to include every little detail of the conversation youve had.",
            },
          },
          required: ["subject"],
        },
      },
      async ({ subject }: { subject: string }) => {
        try {
          const response = await fetch("/api/call", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subject: subject,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP Error: ${response.statusText}`);
          }

          const data: CallResponse = await response.json();

          // Return the result to the AI
          if (data.success && data.message) {
            return { result: data.message };
          } else {
            return { error: data.error ?? "Unknown error occurred." };
          }
        } catch (error) {
          return {
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred.",
          };
        }
      },
    );

    // handle realtime events from client + server for event logging
    client.on("realtime.event", (realtimeEvent: RealtimeEvent) => {
      setRealtimeEvents((realtimeEvents) => {
        const lastEvent = realtimeEvents[realtimeEvents.length - 1];
        if (lastEvent?.event.type === realtimeEvent.event.type) {
          // if we receive multiple events in a row, aggregate them for display purposes
          lastEvent.count = (lastEvent.count || 0) + 1;
          return realtimeEvents.slice(0, -1).concat(lastEvent);
        } else {
          return realtimeEvents.concat(realtimeEvent);
        }
      });
    });
    client.on("error", (event: any) => console.error(event));
    client.on("conversation.interrupted", async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt();
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset;
        await client.cancelResponse(trackId, offset);
      }
    });
    client.on("conversation.updated", async ({ item, delta }: any) => {
      const items = client.conversation.getItems();
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id);
      }
      if (item.status === "completed" && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000,
        );
        item.formatted.file = wavFile;
      }
      setItems(items);
    });

    setItems(client.conversation.getItems());

    return () => {
      // cleanup; resets to defaults
      client.reset();
    };
  }, []);

  const hasConnected = useRef(false);

  const connectConversationOnce = useCallback(async () => {
    if (hasConnected.current) return; // Prevent double connection

    hasConnected.current = true; // Mark as connected
    try {
      await changeTurnEndType("server_vad");

      await connectConversation(); // Your existing connect logic
    } catch (error) {
      console.error("Error connecting:", error);
    }
  }, [connectConversation]);

  /**
   * Automatically connect the conversation on load
   */
  useEffect(() => {
    connectConversationOnce(); // Ensure this runs only once, despite strict mode

    // No cleanup for now; we are focusing on ensuring single connection
  }, [connectConversationOnce]);

  /**
   * Render the application
   */
  return (
    <div data-component="" className="w-full px-10 pb-12 pt-10">
      {/* <p>{latestImageString?.slice(-2)}</p> */}
      {/* <div>
        <button onClick={handleButtonClick} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {result && <p>Result: {result}</p>}
      </div> */}
      <div className="">
        <div className="">
          {!LOCAL_RELAY_SERVER_URL && (
            <Button
              icon={Edit}
              iconPosition="end"
              buttonStyle="flush"
              label={`api key: ${apiKey.slice(0, 3)}...`}
              onClick={() => resetAPIKey()}
            />
          )}
        </div>
      </div>
      <div className="content-main">
        <div className="content-logs">
          <div className="content-block events">
            <div className="flex flex-col items-center gap-7">
              <div className="flex h-[230px] flex-col items-center justify-end rounded-2xl border-4 border-[#dadeff]">
                <canvas ref={serverCanvasRef} />
              </div>
              <div className="flex h-[230px] flex-col items-center overflow-hidden rounded-2xl border-4 border-[#dadeff]">
                <Cam onCapture={handleCapture} />
              </div>
            </div>
          </div>
          <Link
            onClick={isConnected ? disconnectConversation : connectConversation}
            href={"/"}
            className="mt-8 flex w-full flex-col items-center"
          >
            <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-[#ffe3e3] py-3 text-[#ff5b5b] transition-all ease-in-out hover:bg-[#ffeded] hover:text-[#ff7575]">
              <PhoneOff size={28} />
            </div>
          </Link>
          {/* <p>{JSON.stringify(places)}</p> */}
          <div className="flex flex-col gap-6 mt-8">
            {places[0]?.map((place: any) => (
              <div
                key={place.id}
                className="w-full rounded-lg border p-4 shadow-md transition-shadow hover:shadow-lg"
              >
                <h2 className="mb-2 text-xl font-semibold text-blue-600">
                  {place.displayName?.text}
                </h2>
                <p className="text-gray-700">{place.formattedAddress}</p>
                <p className="mt-2 text-gray-500">
                  <strong>Phone:</strong>{" "}
                  {place.internationalPhoneNumber || "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
