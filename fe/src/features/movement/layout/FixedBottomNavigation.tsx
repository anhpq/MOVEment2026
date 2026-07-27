import type {ReactNode} from "react";

export type FixedBottomNavigationItem = Readonly<{
  key: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onClick: () => void;
}>;

type FixedBottomNavigationProps = Readonly<{
  items: FixedBottomNavigationItem[];
}>;

export function FixedBottomNavigation({items}: FixedBottomNavigationProps) {
  return (
    <nav className="fixed-bottom-navigation" aria-label="Primary navigation">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={item.active ? "fixed-bottom-navigation__item is-active" : "fixed-bottom-navigation__item"}
          aria-current={item.active ? "page" : undefined}
          onClick={item.onClick}>
          <span className="fixed-bottom-navigation__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="fixed-bottom-navigation__label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
