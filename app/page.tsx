"use client";

import { useState } from 'react';
import CustomWebcam from '@/components/CustomWebcam';

export default function Home() {
  const [messages, setMessages] = useState([
    { text: 'Hello, what medical problem can I help you with?', from: 'Doctor' },
  ]);
  const [input, setInput] = useState('');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);

  const handleSend = async () => {
    if (input.trim() === '' && !imgSrc) return;

    const userMessage = { text: input, from: 'user', image: imgSrc || null };
    
    // Append user message to messages state
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Sending the message and history to the API
      const response = await fetch('/api/chat-example', {
        method: 'POST',
        body: JSON.stringify({
          text: input,
          image: imgSrc,
          history: messages.map(msg => ({ text: msg.text, from: msg.from })), // Send full message history
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.body) {
        throw new Error('No body in response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        result += decoder.decode(value, { stream: true });
      }

      // Append bot response to messages state
      const botMessage = { text: result, from: 'bot' };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error('Error in AI response generation:', error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, something went wrong.", from: 'bot' },
      ]);
    } finally {
      setLoading(false);
      setImgSrc(null); // Clear the image after sending
    }
  };
  

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="p-4 bg-blue-600 text-white text-center font-bold text-lg">
        Chatbot
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.from === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`${
                  message.from === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'
                } p-3 rounded-lg max-w-xs  ${
                  message.from === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
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
        {showWebcam && <CustomWebcam imgSrc={imgSrc} setImgSrc={setImgSrc} setShowWebcam={setShowWebcam} />}
      </div>

      {/* Input pour le message texte */}
      <div className="p-4 bg-white border-t border-gray-300">
        <div className="flex">
          <input
            type="text"
            className="flex-1 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Tapez votre message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}              
          />
          <button
            className="ml-2 bg-black text-white rounded-full w-[42px] h-[42px] flex justify-center items-center"
            onClick={() => setShowWebcam((prev) => !prev)}
          >
            <img src='/icons/camera.svg' alt='Camera' />
          </button>
          <button
            className="ml-2 bg-blue-500 text-white rounded-lg w-[42px] h-[42px] flex justify-center items-center"
            onClick={handleSend}
            disabled={loading}
          >
            <img src='/icons/send.svg' alt='Send' />
          </button>
        </div>

        {/* Bouton pour afficher la webcam */}
        
      </div>
    </div>
  );
}
