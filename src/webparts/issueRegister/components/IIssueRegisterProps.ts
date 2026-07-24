import { IssueService } from '../services/IssueService';

export interface IIssueRegisterProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  userDisplayName: string;
  userEmail: string;
  issueService: IssueService;
}