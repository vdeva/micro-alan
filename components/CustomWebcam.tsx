"use client";

import Webcam from "react-webcam";
import { useCallback, useRef } from "react";
import { CircleX } from "lucide-react";

export const CustomWebcam = ({
  imgSrc,
  setImgSrc,
  setShowWebcam,
}: {
  imgSrc: any;
  setImgSrc: any;
  setShowWebcam: any;
}) => {
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      // Ensure webcamRef.current is not null
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
  };

  return (
    <div className="container absolute left-1/2 top-1/2 flex h-[667px] w-[390px] -translate-x-1/2 -translate-y-1/2 transform flex-col items-center justify-center rounded-3xl bg-black bg-opacity-95 px-4 py-4">
      <button
        className="absolute left-0 top-0 ml-2 mt-2 text-white"
        onClick={() => setShowWebcam((prev: any) => !prev)}
      >
        <CircleX size={32} />
      </button>
      {imgSrc ? (
        <img src={imgSrc} alt="webcam" />
      ) : (
        <Webcam
          className="rounded-xl"
          height={600}
          width={600}
          ref={webcamRef}
        />
      )}
      <div className="btn-container">
        {imgSrc ? (
          <button
            className="ml-2 mt-2 rounded-full bg-white px-4 py-2 text-black"
            onClick={retake}
          >
            Retake picture
          </button>
        ) : (
          <button
            className="ml-2 mt-2 rounded-full bg-white px-4 py-2 text-black"
            onClick={capture}
          >
            Take picture
          </button>
        )}
      </div>
    </div>
  );
};
