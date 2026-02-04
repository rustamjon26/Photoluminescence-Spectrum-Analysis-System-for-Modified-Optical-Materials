import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Upload,
  Filter,
  LineChart,
  GitCompare,
  FileText,
} from "lucide-react";
import { Link, useLocation } from "react-router";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Import Data", href: "/import", icon: Upload },
  { name: "Preprocess", href: "/preprocess", icon: Filter },
  { name: "Analysis", href: "/analysis", icon: LineChart },
  { name: "Compare", href: "/compare", icon: GitCompare },
  { name: "Reports", href: "/reports", icon: FileText },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-base font-medium px-4 py-6">
                PL Spectrum Analysis
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => {
                    const isActive =
                      location.pathname === item.href ||
                      (item.href !== "/" &&
                        location.pathname.startsWith(item.href));

                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.href}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-6">
              <SidebarTrigger className="lg:hidden" />
            </div>
          </div>
          <div className="p-8">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
