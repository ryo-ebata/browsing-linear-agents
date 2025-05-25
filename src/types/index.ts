import { Request } from 'express';

export interface TokenData {
  access_token: string;
  organization_id: string;
  error?: string;
}

export interface Tokens {
  [organizationId: string]: string;
}

export interface AppUserNotification {
  id: string;
  type?: string;
  action: NotificationType;
  createdAt?: string;
  organizationId: string;
  oauthClientId: string;
  appUserId: string;
  userId: string;
  issue?: {
    id: string;
    title?: string;
  };
  comment?: {
    id: string;
    body?: string;
  };
}

export enum NotificationType {
  IssueMention = 'issueMention',
  IssueCommentMention = 'issueCommentMention',
  IssueAssignedToYou = 'issueAssignedToYou',
  IssueUnassignedFromYou = 'issueUnassignedFromYou',
  IssueNewComment = 'issueNewComment',
  IssueStatusChanged = 'issueStatusChanged',
  IssueEmojiReaction = 'issueEmojiReaction',
  IssueCommentReaction = 'issueCommentReaction'
}

export interface WebhookRequest extends Request {
  body: {
    type: string;
    action?: string;
    organizationId: string;
    appUserId: string;
    notification: AppUserNotification;
  };
  headers: {
    'linear-signature'?: string;
    [key: string]: string | string[] | undefined;
  };
}

