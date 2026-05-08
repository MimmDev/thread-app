import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { NavLinks } from "@/components/NavLinks";
import { NewThreadButton } from "@/components/NewThreadButton";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SpotlightSearch } from "@/components/SpotlightSearch";

type Thread = { id: string; title: string; status: string };

type AppLayoutProps = {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
  threads?: Thread[];
};

export function AppLayout({ children, sidebarContent, threads = [] }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-3 flex flex-row items-center justify-between">
          <span className="text-sm font-semibold">Thread</span>
          <ThemeToggle />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <NavLinks />
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupContent>
              <NewThreadButton />
              {sidebarContent}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-4 py-3">
          <SignOutButton />
        </SidebarFooter>
      </Sidebar>
      <main className="flex flex-col flex-1 overflow-hidden h-screen">{children}</main>
      <SpotlightSearch threads={threads} />
    </SidebarProvider>
  );
}
