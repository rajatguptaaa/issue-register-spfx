import * as React from "react";
import { Stack } from "@fluentui/react/lib/Stack";
import { Text } from "@fluentui/react/lib/Text";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { Icon } from "@fluentui/react/lib/Icon";
import { useTheme } from "@fluentui/react/lib/Theme";

export interface IHomeScreenProps {
  onNavigate: (screen: "submit" | "dashboard" | "table") => void;
}

export const HomeScreen: React.FC<IHomeScreenProps> = ({ onNavigate }) => {
  const theme = useTheme();

  return (
    <Stack
      horizontalAlign="center"
      verticalAlign="center"
      tokens={{ childrenGap: 8, padding: 56 }}
      styles={{ root: { minHeight: 480 } }}
    >
      <Text variant="xxLarge" styles={{ root: { color: theme.palette.themePrimary, fontWeight: 600 } }}>
        IT Infra Issue Register
      </Text>
      <Text variant="medium" styles={{ root: { color: theme.palette.neutralSecondary, marginBottom: 32 } }}>
        Log, track, and resolve IT infrastructure issues
      </Text>

      <Stack
        tokens={{ childrenGap: 14, padding: 28 }}
        styles={{
          root: {
            width: 340,
            background: theme.palette.white,
            boxShadow: theme.effects.elevation16,
            borderRadius: theme.effects.roundedCorner6,
          },
        }}
      >
        <PrimaryButton onClick={() => onNavigate("submit")} styles={{ root: { height: 44 } }}>
          <Icon iconName="Add" styles={{ root: { marginRight: 8 } }} />
          Register Issue
        </PrimaryButton>
        <DefaultButton onClick={() => onNavigate("dashboard")} styles={{ root: { height: 44 } }}>
          <Icon iconName="BarChart4" styles={{ root: { marginRight: 8 } }} />
          Dashboard
        </DefaultButton>
        <DefaultButton onClick={() => onNavigate("table")} styles={{ root: { height: 44 } }}>
          <Icon iconName="Table" styles={{ root: { marginRight: 8 } }} />
          Issue Table
        </DefaultButton>
      </Stack>
    </Stack>
  );
};