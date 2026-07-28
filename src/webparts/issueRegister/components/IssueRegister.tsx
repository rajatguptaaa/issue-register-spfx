import * as React from "react";
import { ThemeProvider } from "@fluentui/react/lib/Theme";
import { Stack } from "@fluentui/react/lib/Stack";
import { Text } from "@fluentui/react/lib/Text";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import styles from "./IssueRegister.module.scss";
import type { IIssueRegisterProps } from "./IIssueRegisterProps";
import { RegisterIssueScreen } from "./RegisterIssueScreen";
import { HomeScreen } from "./HomeScreen";
import { DashboardScreen } from "./DashboardScreen";
import { AllIssuesScreen, IssueLevel } from "./AllIssuesScreen";
import { AppHeader } from "./AppHeader";
import { appTheme } from "./theme";
import { IssueDetailScreen } from "./IssueDetailScreen";


initializeIcons();

type ScreenName =
  | "home"
  | "submit"
  | "dashboard"
  | "allIssues"
  | "table"
  | "detail";

const SCREEN_TITLES: Record<ScreenName, string> = {
  home: "IT Infra Issue Register",
  submit: "Register Issue",
  dashboard: "IT Infra Issue Register - Dashboard",
  allIssues: "IT Infra Issue Register - All Issues",
  table: "Issue Table",
  detail: "Issue Detail",
};

const IssueRegister: React.FC<IIssueRegisterProps> = ({
  userEmail,
  userDisplayName,
  issueService,
}) => {
  const [currentScreen, setCurrentScreen] = React.useState<ScreenName>("home");
  const [allIssuesFilter, setAllIssuesFilter] = React.useState<{
    status: "Open" | "Closed";
    level: IssueLevel | "All";
  }>({
    status: "Open",
    level: "All",
  });
  const [selectedIssueId, setSelectedIssueId] = React.useState<number | null>(
    null,
  );
  const [blockNavigation, setBlockNavigation] = React.useState(false);
  // Where "back" goes depends on which screen is currently showing —
  // e.g. All Issues came from Dashboard, so back should return there,
  // not to Home.
  const backTargets: Partial<Record<ScreenName, ScreenName>> = {
    submit: "home",
    dashboard: "home",
    allIssues: "dashboard",
    table: "home",
    detail: "allIssues", // TODO: once Issue Table exists, track real origin (allIssues vs table)
  };

  return (
    <ThemeProvider theme={appTheme} className={styles.issueRegister}>
      <AppHeader
        title={SCREEN_TITLES[currentScreen]}
        onBack={
          !blockNavigation && backTargets[currentScreen]
            ? () => setCurrentScreen(backTargets[currentScreen] as ScreenName)
            : undefined
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
            onNavigateToAllIssues={(status, level) => {
              setAllIssuesFilter({ status, level });
              setCurrentScreen("allIssues");
            }}
          />
        )}

        {currentScreen === "allIssues" && (
          <AllIssuesScreen
            issueService={issueService}
            initialFilter={allIssuesFilter}
            onViewIssue={(id) => {
              setSelectedIssueId(id);
              setCurrentScreen("detail");
            }}
          />
        )}

        {currentScreen === "table" && (
          <div className={styles.screenPlaceholder}>
            <h2>Issue Table (screen not built yet)</h2>
          </div>
        )}

        {currentScreen === "detail" && selectedIssueId !== null && (
          <IssueDetailScreen
            issueId={selectedIssueId}
            issueService={issueService}
            currentUserEmail={userEmail}
            currentUserDisplayName={userDisplayName}
            onBusyChange={setBlockNavigation}
          />
        )}
      </Stack>
    </ThemeProvider>
  );
};

export default IssueRegister;
