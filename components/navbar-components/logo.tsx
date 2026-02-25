import Image from "next/image";
import sdmLogo from "@/public/images/sdm-logo.webp";

export default function Logo() {
  return (
    <Image 
      src={sdmLogo} 
      alt="SDMCET Logo" 
      width={33} 
      height={33} 
      priority
      className="h-auto w-auto"
    />
  )
}
