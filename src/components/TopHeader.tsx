import { Bell, Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BrandLogo } from "@/components/BrandLogo";

interface TopHeaderProps {
  onSearch?: (term: string) => void;
}

export const TopHeader = ({ onSearch }: TopHeaderProps) => {
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch?.(e.target.value);
  };

  return (
    <header className="border-b border-border bg-background px-3 py-2 md:h-16 md:px-6 md:py-0">
      <div className="grid w-full grid-cols-[auto,1fr,auto] items-center gap-2 md:grid-cols-[auto,1fr,auto]">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="shrink-0" />
          <BrandLogo
            showText={false}
            className="hidden shrink-0 sm:flex"
            imageClassName="h-8 w-8 md:h-9 md:w-9"
          />
        </div>

        <div className="order-3 col-span-3 w-full min-w-0 md:order-none md:col-span-1 md:mx-6">
          <Input
            type="search"
            placeholder="Search..."
            className="w-full text-sm md:text-base"
            onChange={handleSearchChange}
          />
        </div>

        <div className="flex items-center justify-end gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 md:h-10 md:w-10"
            onClick={() => navigate("/recent")}
            title="Recent activity"
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-10 md:w-10"
            onClick={() => navigate("/settings")}
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
