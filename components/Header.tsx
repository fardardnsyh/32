import { SignedIn, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "./ui/button"
import { FilePlus2 } from "lucide-react"

function Header() {
  return (
    <div className="flex justify-between items-center p-5 border-b shadow-sm">
      <Link href="/dashboard" className="text-2xl">
        Chat to <span className="text-indigo-600">PDF</span>
      </Link>

      <SignedIn>
        <div className="flex items-center space-x-2">
          <Button asChild variant="link" className="hidden md:flex">
            <Link href="/dashboard/pricing">Pricing</Link>
          </Button>

          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/dashboard/">My Docs</Link>
          </Button>

          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/dashboard/upload">
              <FilePlus2 className="text-indigo-600" />
            </Link>
          </Button>
          <UserButton />
        </div>
      </SignedIn >
    </div >
  )
}

export default Header