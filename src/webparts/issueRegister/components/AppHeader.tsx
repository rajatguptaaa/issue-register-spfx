import * as React from "react";
import { Stack } from "@fluentui/react/lib/Stack";
import { Text } from "@fluentui/react/lib/Text";
import { IconButton } from "@fluentui/react/lib/Button";
import { useTheme } from "@fluentui/react/lib/Theme";
import logo from "../assets/mjunction-logo.png";

export interface IAppHeaderProps {
  title: string;
  onBack?: () => void;
  userEmail: string;
}

export const AppHeader: React.FC<IAppHeaderProps> = ({ title, onBack, userEmail }) => {
  const theme = useTheme();
  return (
    <Stack
      horizontal
      verticalAlign="center"
      horizontalAlign="space-between"
      styles={{
        root: {
          background: theme.palette.themePrimary,
          padding: "8px 24px",
          minHeight: 56,
        },
      }}
    >
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
        {onBack && (
          <IconButton
            iconProps={{ iconName: "ChevronLeft" }}
            onClick={onBack}
            styles={{
              root: { color: theme.palette.white },
              rootHovered: { color: theme.palette.white, background: "rgba(255,255,255,0.15)" },
            }}
          />
        )}
        <img src={logo} alt="mjunction" style={{ height: 32, width: "auto" }} />
        <Text variant="xLarge" styles={{ root: { color: theme.palette.white, fontWeight: 600 } }}>
          {title}
        </Text>
      </Stack>
      <Text variant="medium" styles={{ root: { color: theme.palette.white, fontWeight: 600 } }}>
        {userEmail}
      </Text>
    </Stack>
  );
};