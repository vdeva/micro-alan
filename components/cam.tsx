"use client";

import React, { useEffect, useRef } from "react";
import Webcam from "react-webcam";

interface CamProps {
  onCapture: (imageSrc: string) => void; // Callback to pass the captured image back to parent
}

export function Cam({ onCapture }: CamProps) {
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<number | null>(null);

  // Function to capture a frame from the webcam
  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // console.log("Captured image:", imageSrc); // Debugging log to ensure images are captured
        onCapture(imageSrc); // Pass the base64-encoded image back to the parent component
      }
    }
  };

  // Setup interval on component mount
  useEffect(() => {
    if (!intervalRef.current) {
      intervalRef.current = window.setInterval(capture, 500);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current); // Cleanup on unmount
        intervalRef.current = null;
      }
    };
  }, []);

  return (
    <main>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        style={{ width: "100%", height: "auto" }}
      />
    </main>
  );
}
