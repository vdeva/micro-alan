"use client"

import { useState } from 'react';

import CustomWebcam from '@/components/CustomWebcam';
import { Camera } from 'react-camera-pro';


export default function Home() {
  const [messages, setMessages] = useState([
    { text: 'Bonjour ! Comment puis-je vous aider aujourd’hui ?', from: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [imgSrc, setImgSrc] = useState(null);

  const handleSend = () => {
    if (input.trim() === '') return;
    
    setMessages([...messages, { text: input, from: 'user' }]);
    setInput('');
    
    // Simuler une réponse du bot
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { text: "Je suis un bot, je vais réfléchir à ça...", from: 'bot' },
      ]);
    }, 1000);
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
                  message.from === 'user' ? 'bg-blue-500' : 'bg-gray-300'
                } p-3 rounded-lg max-w-xs text-white ${
                  message.from === 'user' ? 'rounded-br-none' : 'rounded-bl-none'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>
        <CustomWebcam imgSrc={imgSrc} setImgSrc={setImgSrc}/>
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-300">
        <div className="flex">
          <input
            type="text"
            className="flex-1 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tapez votre message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded-lg"
            onClick={handleSend}
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
