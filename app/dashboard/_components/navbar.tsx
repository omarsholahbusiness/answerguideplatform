import { NavbarRoutes } from "@/components/navbar-routes"
import { MobileSidebar } from "./mobile-sidebar"
import { Logo } from "./logo"

export const Navbar = () => {
    return (
        <div className="py-0 px-4 border-b h-full flex items-center bg-card shadow-sm overflow-visible">
            <MobileSidebar />
            <div className="hidden md:flex items-center rtl:mr-4 ltr:ml-4 h-full">
                <Logo />
            </div>
            <div className="flex items-center gap-x-4 rtl:mr-auto ltr:ml-auto">
                <NavbarRoutes />
            </div>
        </div>
    )
}