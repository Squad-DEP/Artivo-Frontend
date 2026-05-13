import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50">
      <Image
        src="/icons/auth/logo_primary.svg"
        alt="Artivo icon"
        width={47}
        height={47}
        priority
        className="w-12 h-12 sm:w-16 sm:h-16"
      />

      <div className="text-center mt-8">
        {/* Bouncing dots */}
        <div className="flex space-x-2 justify-center items-center mb-6">
          <div className="w-3 h-3 bg-orange rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-orange rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-orange rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
