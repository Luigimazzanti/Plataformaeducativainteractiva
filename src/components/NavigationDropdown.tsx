import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ChevronDown } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface NavigationItem {
  value: string;
  label: string;
  icon: LucideIcon;
  mobileLabel?: string;
  badge?: number;
  pulseBadge?: boolean;
}

interface NavigationDropdownProps {
  items: NavigationItem[];
  activeValue: string;
  onValueChange: (value: string) => void;
}

export function NavigationDropdown({ items, activeValue, onValueChange }: NavigationDropdownProps) {
  const activeItem = items.find(item => item.value === activeValue);
  const ActiveIcon = activeItem?.icon;

  return (
    <>
      {/* Mobile Dropdown */}
      <div className="lg:hidden w-full">
        <Select value={activeValue} onValueChange={onValueChange}>
          <SelectTrigger className="w-full h-12 bg-card shadow-sm hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-2">
              {ActiveIcon && <ActiveIcon className="w-4 h-4" />}
              <span className="font-medium">
                {activeItem?.mobileLabel || activeItem?.label}
              </span>
            </div>
          </SelectTrigger>
          <SelectContent className="w-[calc(100vw-2rem)] max-w-md">
            {items.map((item) => {
              const ItemIcon = item.icon;
              return (
                <SelectItem 
                  key={item.value} 
                  value={item.value}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    <ItemIcon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Tabs - Modern Style */}
      <div className="hidden lg:flex items-center gap-2 bg-card p-1.5 rounded-lg shadow-sm border border-border w-full">
        {items.map((item) => {
          const ItemIcon = item.icon;
          const isActive = item.value === activeValue;
          return (
            <button
              key={item.value}
              onClick={() => onValueChange(item.value)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md transition-all duration-200 relative ${
                isActive
                  ? 'bg-primary text-white shadow-sm scale-105'
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              <ItemIcon className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
              {item.badge && item.badge > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg ${item.pulseBadge ? 'animate-pulse' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
