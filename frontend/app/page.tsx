import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold">Welcome to Metro Service</h1>

        <Image
          src="/metro-image.png"
          alt="Metro illustration"
          width={300}
          height={200}
          className="rounded-lg shadow-md"
        />

        <div className="flex flex-col gap-4 w-full max-w-[176px]">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-12 px-5 w-full"
            href="/signup"
          >
            Sign Up
          </Link>
          <Link
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-12 px-5 w-full"
            href="/signin"
          >
            Sign In
          </Link>
        </div>
      </main>
    </div>
  )
}

