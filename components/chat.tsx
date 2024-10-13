"use client";

import { useEffect, useState } from "react";
import { CustomWebcam } from "@/components/CustomWebcam";
import Link from "next/link";
import { ArrowLeft, Camera, Send } from "lucide-react";

export function Chat() {
  const [messages, setMessages] = useState([
    {
      text: "Hello, what medical problem can I help you with?",
      from: "Doctor",
    },
  ]);
  const [input, setInput] = useState("");
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [containsRisk, setContainsRisk] = useState(false);

  const handleSend = async () => {
    if (input.trim() === "" && !imgSrc) return;

    const userMessage = { text: input, from: "user", image: imgSrc || null };

    // Append user message to messages state
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Sending the message and history to the API
      const response = await fetch("/api/chat-example", {
        method: "POST",
        body: JSON.stringify({
          text: input,
          image: imgSrc,
          history: messages.map((msg) => ({ text: msg.text, from: msg.from })), // Send full message history
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.body) {
        throw new Error("No body in response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = "";
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        result += decoder.decode(value, { stream: true });
      }

      // Append bot response to messages state
      const botMessage = { text: result, from: "bot" };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error in AI response generation:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, something went wrong.", from: "bot" },
      ]);
    } finally {
      setLoading(false);
      setImgSrc(null); // Clear the image after sending
    }
  };

  useEffect(() => {
    const foundRisk = messages.some(
      (message) =>
        message.from !== "user" &&
        message.text.toLowerCase().includes("increased risk"),
    );
    setContainsRisk(foundRisk);
  }, [messages]);

  return (
    <div className="flex h-full w-full flex-col justify-between">
      {/* Header */}
      <div className="flex w-full flex-row items-center justify-between bg-gradient-to-b from-[#f5f6ff] to-white px-5 pb-4 pt-8">
        <Link href={"/"} className="flex w-[80px] flex-col items-center">
          <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-[#f0f2ff] py-3 text-[#6a57f1] transition-all ease-in-out hover:bg-[#f7f8ff]">
            <ArrowLeft size={28} />
          </div>
        </Link>
        <p className="text-2xl font-semibold text-neutral-700">Chat</p>
        <div className="w-[80px]"></div>
      </div>

      {/* Messages */}
      <div className="no-scrollbar flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`${
                  message.from === "user"
                    ? "bg-[#dfe1ff] text-neutral-800"
                    : "bg-[#f0f2ff] text-neutral-800"
                } max-w-xs rounded-lg p-3 ${
                  message.from === "user"
                    ? "rounded-br-none"
                    : "rounded-bl-none"
                }`}
              >
                {message.text}
                {/* Affichage de l'image si présente */}
                {message.image && (
                  <img
                    src={message.image}
                    alt="Image envoyée par l'utilisateur"
                    className="mt-2 max-w-full rounded-lg"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Composant CustomWebcam pour capturer une image */}
        {showWebcam && (
          <CustomWebcam
            imgSrc={imgSrc}
            setImgSrc={setImgSrc}
            setShowWebcam={setShowWebcam}
          />
        )}
      </div>

      {containsRisk && (
        <div className="p-2">
          <div className="flex w-full flex-col items-center justify-center rounded-xl bg-red-500/10 p-4 font-semibold">
            <p className="font-bold text-red-600">INCREASED RISK PRIORITY</p>
            <p className="mt-2 px-4 text-center">
              A medical professional will be assigned to your chat urgently.
            </p>
          </div>
        </div>
      )}

      {/* Input pour le message texte */}
      <div className="border-t border-gray-300 bg-white p-4">
        <div className="flex">
          <input
            type="text"
            className="flex-1 rounded-lg border p-2 text-black outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask your questions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="ml-2 flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#dfe1ff] text-neutral-700 transition-all duration-200 ease-in-out hover:shadow-lg"
            onClick={() => setShowWebcam((prev) => !prev)}
          >
            <Camera size={25} />
          </button>
          <button
            className="ml-2 flex h-[42px] w-[42px] items-center justify-center rounded-lg bg-[#d5f2e3] text-neutral-700 transition-all duration-200 ease-in-out hover:shadow-lg"
            onClick={handleSend}
            disabled={loading}
          >
            <Send size={25} />
          </button>
        </div>

        {/* Bouton pour afficher la webcam */}
      </div>
    </div>
  );
}
