import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  type AppTheme,
  useAppSettingsStore,
} from "@/stores/app-settings";

const THEME_LABELS: Record<AppTheme, string> = {
  light: "Светлая",
  dark: "Тёмная",
};

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
} satisfies Record<AppTheme, typeof Sun>;

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const theme = useAppSettingsStore((state) => state.theme);
  const saveTheme = useAppSettingsStore((state) => state.setTheme);
  const ActiveIcon = THEME_ICONS[theme];

  function handleThemeChange(value: string) {
    const nextTheme = value as AppTheme;
    setTheme(nextTheme);
    void saveTheme(nextTheme);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Выбрать тему">
          <ActiveIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={theme} onValueChange={handleThemeChange}>
          {Object.entries(THEME_LABELS).map(([value, label]) => {
            const Icon = THEME_ICONS[value as AppTheme];
            return (
              <DropdownMenuRadioItem key={value} value={value}>
                <Icon />
                {label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
