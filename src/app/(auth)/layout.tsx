import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#ECECF8] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md my-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 mb-5 cursor-pointer"
          >
            <div className="w-10 h-10 bg-[#6C6FDF] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C6FDF]/30">
              <i className="fa-solid fa-calendar-check text-white"></i>
            </div>
            <span className="text-2xl font-extrabold text-[#1A1A2E]">
              Klok
            </span>
          </Link>
        </div>
        {children}
        <p className="text-center text-xs text-[#9CA3AF] mt-6">
          By continuing you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
