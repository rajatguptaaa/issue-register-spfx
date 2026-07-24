import * as React from "react";
import { ThemeProvider } from "@fluentui/react/lib/Theme";
import { initializeIcons } from "@fluentui/react/lib/Icons";
import styles from "./IssueRegister.module.scss";
import type { IIssueRegisterProps } from "./IIssueRegisterProps";
import { RegisterIssueScreen } from "./RegisterIssueScreen";
import { HomeScreen } from "./HomeScreen";
import { appTheme } from "./theme";

initializeIcons();

type ScreenName = "home" | "submit" | "dashboard" | "table";

const IssueRegister: React.FC<IIssueRegisterProps> = ({ userEmail, issueService }) => {
  const [currentScreen, setCurrentScreen] = React.useState<ScreenName>("home");

  return (
    <ThemeProvider theme={appTheme} className={styles.issueRegister}>
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
        <div className={styles.screenPlaceholder}>
          <button onClick={() => setCurrentScreen("home")}>← Home</button>
          <h2>Dashboard (screen not built yet)</h2>
        </div>
      )}

      {currentScreen === "table" && (
        <div className={styles.screenPlaceholder}>
          <button onClick={() => setCurrentScreen("home")}>← Home</button>
          <h2>Issue Table (screen not built yet)</h2>
        </div>
      )}
    </ThemeProvider>
  );
};

export default IssueRegister;