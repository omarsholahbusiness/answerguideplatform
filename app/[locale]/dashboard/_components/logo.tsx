import Image from "next/image";
import Link from "next/link";

export const Logo = () => {
    return (
        <Link href="/dashboard" className="flex items-center h-full">
            <Image
                height={100}
                width={100}
                alt="Logo"
                src="/logo.png"
                className="object-contain h-full w-auto"
                priority
                unoptimized
            />
        </Link>
    )
}