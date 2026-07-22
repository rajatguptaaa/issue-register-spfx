import * as React from 'react';
import styles from './IssueRegister.module.scss';
import type { IIssueRegisterProps } from './IIssueRegisterProps';

type ScreenName = 'home' | 'submit' | 'dashboard' | 'table';

const IssueRegister: React.FC<IIssueRegisterProps> = () => {
  const [currentScreen, setCurrentScreen] = React.useState<ScreenName>('home');

  return (
    <section className={styles.issueRegister}>
      {currentScreen === 'home' && (
        <div className={styles.homeScreen}>
          <h1>IT Infra Issue Register</h1>
          <button onClick={() => setCurrentScreen('submit')}>Register Issue</button>
          <button onClick={() => setCurrentScreen('dashboard')}>Dashboard</button>
          <button onClick={() => setCurrentScreen('table')}>Issue Table</button>
        </div>
      )}

      {currentScreen === 'submit' && (
        <div className={styles.screenPlaceholder}>
          <button onClick={() => setCurrentScreen('home')}>← Home</button>
          <h2>Register Issue (screen not built yet)</h2>
        </div>
      )}

      {currentScreen === 'dashboard' && (
        <div className={styles.screenPlaceholder}>
          <button onClick={() => setCurrentScreen('home')}>← Home</button>
          <h2>Dashboard (screen not built yet)</h2>
        </div>
      )}

      {currentScreen === 'table' && (
        <div className={styles.screenPlaceholder}>
          <button onClick={() => setCurrentScreen('home')}>← Home</button>
          <h2>Issue Table (screen not built yet)</h2>
        </div>
      )}
    </section>
  );
};

export default IssueRegister;