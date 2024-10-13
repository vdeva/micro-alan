"use client"

import Webcam from "react-webcam";
import { useCallback, useRef } from "react";

const CustomWebcam = ({ imgSrc, setImgSrc, setShowWebcam }: {imgSrc: any, setImgSrc: any, setShowWebcam: any}) => {
    const webcamRef = useRef<Webcam>(null);

    const capture = useCallback(() => {
        if (webcamRef.current) { // Ensure webcamRef.current is not null
            const imageSrc = webcamRef.current.getScreenshot();
            setImgSrc(imageSrc);
        }
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    return (
        <div className=" h-full w-full bg-black bg-opacity-95 container absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center py-4 px-4">
            <button
                className="absolute top-0 left-0 ml-2 mt-2"
                onClick={() => setShowWebcam((prev: any) => !prev)}
                > 
                <img src="/icons/close.svg" alt="Close" />
                </button>
            {imgSrc ? (
                <img src={imgSrc} alt="webcam" />
            ) : (
                <Webcam className="rounded-xl" height={600} width={600} ref={webcamRef} />
            )}
            <div className="btn-container">
                
                {imgSrc ? (
                    <button className="mt-2 ml-2 bg-white text-black px-2 py-2 rounded-full" onClick={retake}>Retake picture</button>
                ) : (
                    <button className="mt-2 ml-2 bg-white text-black px-2 py-2 rounded-full" onClick={capture}>Take picture</button>
                )}
            </div>
        </div>
    );
};

export default CustomWebcam;
