import { Bell, LogOut, Settings as SettingsIcon, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/hooks/useAuth";

interface TopHeaderProps {
  onSearch?: (term: string) => void;
}

export const TopHeader = ({ onSearch }: TopHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:min-h-16 md:px-6 md:py-2">
      <div className="flex flex-wrap items-center gap-2 md:flex-nowrap md:gap-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-11 w-11 shrink-0" />
          <BrandLogo
            showText={false}
            className="hidden shrink-0 sm:flex"
            imageClassName="h-8 w-8 md:h-9 md:w-9"
          />
        </div>

        <div className="order-3 w-full min-w-0 md:order-none md:flex-1 md:px-2">
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-xl text-sm md:max-w-[640px] md:text-base"
            onChange={handleSearchChange}
          />
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-0 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-11 w-11"
            onClick={() => navigate("/recent")}
            title="Recent activity"
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden h-11 w-11 sm:inline-flex"
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" title="Profile menu">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                    {(user?.email?.slice(0, 2) || "CV").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(18rem,calc(100vw-1rem))]">
              <DropdownMenuLabel className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.user_metadata?.display_name || "Clever Vault"}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="min-h-11">
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/security")} className="min-h-11">
                <UserRound className="mr-2 h-4 w-4" />
                Account security
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="min-h-11 text-destructive focus:text-destructive"
                onClick={() => void signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
