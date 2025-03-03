import Image from "next/image"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold text-primary">Welcome to Metro Service</h1>

        <Image
          src="/metro-image.png"
          alt="Metro illustration"
          width={300}
          height={200}
          className="rounded-lg shadow-md"
        />

        <div className="flex flex-col gap-4 w-full max-w-[176px]">
          <Link
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-primary text-primary-foreground gap-2 hover:bg-primary/90 text-sm sm:text-base h-12 px-5 w-full"
            href="/signup"
          >
            Sign Up
          </Link>
          <Link
            className="rounded-full border border-solid border-primary/20 transition-colors flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 text-sm sm:text-base h-12 px-5 w-full"
            href="/signin"
          >
            Sign In
          </Link>
        </div>
      </main>
    </div>
  )
}