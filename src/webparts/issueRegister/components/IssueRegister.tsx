import * as React from "react";
import { ThemeProvider } from "@fluentui/react/lib/Theme";
import { Stack } from "@fluentui/react/lib/Stack";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import styles from "./IssueRegister.module.scss";
import type { IIssueRegisterProps } from "./IIssueRegisterProps";
import { RegisterIssueScreen } from "./RegisterIssueScreen";
import { HomeScreen } from "./HomeScreen";
import { DashboardScreen } from "./DashboardScreen";
import { AllIssuesScreen } from "./AllIssuesScreen";
import { IssueLevel } from "../utils/issueLogic";
import { AppHeader } from "./AppHeader";
import { appTheme } from "./theme";
import { IssueDetailScreen } from "./IssueDetailScreen";
import { IssueTableScreen } from "./IssueTableScreen";

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
  const [selectedIssueId, setSelectedIssueId] = React.useState<
    number | undefined
  >(undefined);
  const [detailOrigin, setDetailOrigin] = React.useState<"allIssues" | "table">(
    "allIssues",
  );
  const [blockNavigation, setBlockNavigation] = React.useState(false);

  const backTargets: Partial<Record<ScreenName, ScreenName>> = {
    submit: "home",
    dashboard: "home",
    allIssues: "dashboard",
    table: "home",
    detail: detailOrigin,
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
            width: "100%",
            minWidth: 0,
            overflowX: "hidden",
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
              setDetailOrigin("allIssues");
              setCurrentScreen("detail");
            }}
          />
        )}

        {currentScreen === "table" && (
          <IssueTableScreen
            issueService={issueService}
            onViewIssue={(id) => {
              setSelectedIssueId(id);
              setDetailOrigin("table");
              setCurrentScreen("detail");
            }}
          />
        )}

        {currentScreen === "detail" && selectedIssueId !== undefined && (
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
