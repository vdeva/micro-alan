import { CircleUserRound, MapPin, MessageCircle, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center pb-32">
      <div className="flex w-full flex-row items-center justify-between bg-gradient-to-b from-[#fce8e0] to-white px-5 pb-4 pt-8">
        <p className="text-2xl font-semibold text-neutral-700">Hello, John !</p>
        <div className="text-neutral-700">
          <CircleUserRound size={28} />
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center">
        <Image width={350} height={0} src={"/marmot.png"} alt="logo" />
      </div>
      <div className="flex flex-col items-center px-5">
        <div>
          <p className="text-lg font-semibold text-neutral-700">
            Automated Health Professionals
          </p>
          <p className="text-sm font-semibold text-neutral-500">
            Contact one of our health professionals, get advice, find
            consultations
          </p>
        </div>
        <div className="flex w-full flex-row items-center justify-between gap-3 pt-6">
          <Link href={"/chat"} className="flex w-full flex-col items-center">
            <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-[#f0f2ff] py-3 text-[#6a57f1] transition-all ease-in-out hover:bg-[#f7f8ff]">
              <MessageCircle size={28} />
            </div>
            <p className="mt-3 font-bold text-neutral-700">Chat</p>
          </Link>
          <Link href={"/consult"} className="flex w-full flex-col items-center">
            <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-[#f0f2ff] py-3 text-[#6a57f1] transition-all ease-in-out hover:bg-[#f7f8ff]">
              <Video size={28} />
            </div>
            <p className="mt-3 font-bold text-neutral-700">Consult</p>
          </Link>
          <Link href={"/locate"} className="flex w-full flex-col items-center">
            <div className="flex w-full flex-col items-center justify-center rounded-2xl bg-[#f0f2ff] py-3 text-[#6a57f1] transition-all ease-in-out hover:bg-[#f7f8ff]">
              <MapPin size={28} />
            </div>
            <p className="mt-3 font-bold text-neutral-700">Locate</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
