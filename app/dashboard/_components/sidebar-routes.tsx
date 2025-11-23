"use client";

import { BarChart, Compass, Layout, List, Wallet, Shield, Users, Eye, TrendingUp, BookOpen, FileText, Award, PlusSquare, Key, Ticket } from "lucide-react";
import { SidebarItem } from "./sidebar-item";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/lib/use-translations";

export const SidebarRoutes = ({ closeOnClick = false }: { closeOnClick?: boolean }) => {
    const pathName = usePathname();
    const { t } = useTranslations();

    const guestRoutes = [
        {
            icon: Layout,
            label: t("dashboard"),
            href: "/dashboard",
        },
        {
            icon: Compass,
            label: t("courses"),
            href: "/dashboard/search",
        },
        {
            icon: Wallet,
            label: t("balance"),
            href: "/dashboard/balance",
        },
    ];

    const teacherRoutes = [
        {
            icon: List,
            label: t("courses"),
            href: "/dashboard/teacher/courses",
        },
        {
            icon: FileText,
            label: t("quizzes"),
            href: "/dashboard/teacher/quizzes",
        },
        {
            icon: Award,
            label: t("grades"),
            href: "/dashboard/teacher/grades",
        },
        {
            icon: BarChart,
            label: t("analytics"),
            href: "/dashboard/teacher/analytics",
        },
        {
            icon: Users,
            label: t("manageStudents"),
            href: "/dashboard/teacher/users",
        },
        {
            icon: Wallet,
            label: t("manageBalances"),
            href: "/dashboard/teacher/balances",
        },
        {
            icon: BookOpen,
            label: t("addRemoveCourses"),
            href: "/dashboard/teacher/add-courses",
        },
        {
            icon: Key,
            label: t("passwords"),
            href: "/dashboard/teacher/passwords",
        },
        {
            icon: Shield,
            label: t("createAccount"),
            href: "/dashboard/teacher/create-account",
        },
        {
            icon: Ticket,
            label: t("promocodes"),
            href: "/dashboard/teacher/promocodes",
        },
    ];

    const adminRoutes = [
        {
            icon: Users,
            label: t("manageUsers"),
            href: "/dashboard/admin/users",
        },
        {
            icon: List,
            label: t("courses"),
            href: "/dashboard/admin/courses",
        },
        {
            icon: FileText,
            label: t("quizzes"),
            href: "/dashboard/admin/quizzes",
        },
        {
            icon: Award,
            label: t("grades"),
            href: "/dashboard/admin/grades",
        },
        {
            icon: Shield,
            label: t("createAccount"),
            href: "/dashboard/admin/create-account",
        },
        {
            icon: Eye,
            label: t("passwords"),
            href: "/dashboard/admin/passwords",
        },
        {
            icon: Wallet,
            label: t("manageBalances"),
            href: "/dashboard/admin/balances",
        },
        {
            icon: TrendingUp,
            label: t("studentProgress"),
            href: "/dashboard/admin/progress",
        },
        {
            icon: BookOpen,
            label: t("addRemoveCourses"),
            href: "/dashboard/admin/add-courses",
        },
        {
            icon: Ticket,
            label: t("promocodes"),
            href: "/dashboard/admin/promocodes",
        },
    ];

    const isTeacherPage = pathName?.includes("/dashboard/teacher");
    const isAdminPage = pathName?.includes("/dashboard/admin");
    const routes = isAdminPage ? adminRoutes : isTeacherPage ? teacherRoutes : guestRoutes;

    return (
        <div className="flex flex-col w-full pt-0">
            {routes.map((route) => (
                <SidebarItem
                  key={route.href}
                  icon={route.icon}
                  label={route.label}
                  href={route.href}
                  closeOnClick={closeOnClick}
                />
            ))}
        </div>
    );
}