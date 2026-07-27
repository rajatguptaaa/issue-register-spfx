import * as React from "react";
import { ThemeProvider } from "@fluentui/react/lib/Theme";
import { Stack } from "@fluentui/react/lib/Stack";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import styles from "./IssueRegister.module.scss";
import type { IIssueRegisterProps } from "./IIssueRegisterProps";
import { RegisterIssueScreen } from "./RegisterIssueScreen";
import { HomeScreen } from "./HomeScreen";
import { AppHeader } from "./AppHeader";
import { appTheme } from "./theme";
import { DashboardScreen } from "./DashboardScreen";

initializeIcons();

type ScreenName = "home" | "submit" | "dashboard" | "table";

const SCREEN_TITLES: Record<ScreenName, string> = {
  home: "IT Infra Issue Register",
  submit: "Register Issue",
  dashboard: "IT Infra Issue Register - Dashboard",
  table: "Issue Table",
};

const IssueRegister: React.FC<IIssueRegisterProps> = ({
  userEmail,
  issueService,
}) => {
  const [currentScreen, setCurrentScreen] = React.useState<ScreenName>("home");

  return (
    <ThemeProvider theme={appTheme} className={styles.issueRegister}>
      <AppHeader
        title={SCREEN_TITLES[currentScreen]}
        onBack={
          currentScreen === "home" ? undefined : () => setCurrentScreen("home")
        }
        userEmail={userEmail}
      />
      <Stack
        styles={{
          root: {
            background: "linear-gradient(180deg, #eaf1f7 0%, #ffffff 100%)",
            minHeight: 480,
          },
        }}
      >
        {currentScreen === "home" && (
          <HomeScreen onNavigate={(screen) => setCurrentScreen(screen)} />
        )}

        {currentScreen === "submit" && (
          <RegisterIssueScreen
            onBack={() => setCurrentScreen("home")}
            currentUserEmail={userEmail}
            issueService={issueService}
          />
        )}

        {currentScreen === "dashboard" && (
          <DashboardScreen
            issueService={issueService}
            onNavigateToTable={() => setCurrentScreen("table")}
          />
        )}

        {currentScreen === "table" && (
          <div className={styles.screenPlaceholder}>
            <h2>Issue Table (screen not built yet)</h2>
          </div>
        )}
      </Stack>
    </ThemeProvider>
  );
};

export default IssueRegister;
