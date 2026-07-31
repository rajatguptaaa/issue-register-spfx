import * as React from "react";
import { Stack } from "@fluentui/react/lib/Stack";
import { DefaultButton } from "@fluentui/react/lib/Button";
import { Icon } from "@fluentui/react/lib/Icon";

export interface IHomeScreenProps {
  onNavigate: (screen: "submit" | "dashboard" | "table") => void;
}

// Distinct accent per action instead of one uniform color — gives each
// button its own visual identity, matching the reference design.
const ACCENTS = {
  register: { base: "#134074", hover: "#0e2f57" },
  dashboard: { base: "#2b6777", hover: "#1f4e5b" },
  table: { base: "#8a4a2f", hover: "#6e3a25" },
};

export const HomeScreen: React.FC<IHomeScreenProps> = ({ onNavigate }) => {
  return (
    <Stack
      horizontal
      horizontalAlign="center"
      verticalAlign="center"
      tokens={{ childrenGap: 20, padding: 56 }}
    >
      <DefaultButton
        onClick={() => onNavigate("submit")}
        styles={{
          root: {
            background: ACCENTS.register.base,
            color: "#fff",
            height: 48,
            minWidth: 180,
            border: "none",
          },
          rootHovered: { background: ACCENTS.register.hover, color: "#fff" },
        }}
      >
        <Icon iconName="Add" styles={{ root: { marginRight: 8 } }} />
        Register Issue
      </DefaultButton>

      <DefaultButton
        onClick={() => onNavigate("dashboard")}
        styles={{
          root: {
            background: ACCENTS.dashboard.base,
            color: "#fff",
            height: 48,
            minWidth: 180,
            border: "none",
          },
          rootHovered: { background: ACCENTS.dashboard.hover, color: "#fff" },
        }}
      >
        <Icon iconName="BarChart4" styles={{ root: { marginRight: 8 } }} />
        Dashboard
      </DefaultButton>

      <DefaultButton
        onClick={() => onNavigate("table")}
        styles={{
          root: {
            background: ACCENTS.table.base,
            color: "#fff",
            height: 48,
            minWidth: 180,
            border: "none",
          },
          rootHovered: { background: ACCENTS.table.hover, color: "#fff" },
        }}
      >
        <Icon iconName="Table" styles={{ root: { marginRight: 8 } }} />
        Issue Table
      </DefaultButton>
    </Stack>
  );
};
