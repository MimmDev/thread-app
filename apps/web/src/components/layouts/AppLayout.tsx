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

type AppLayoutProps = {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
};

export function AppLayout({ children, sidebarContent }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-3">
          <span className="text-sm font-semibold">Thread</span>
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
    </SidebarProvider>
  );
}
