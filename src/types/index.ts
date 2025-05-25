import { Request } from 'express';

export interface TokenData {
  access_token: string;
  organization_id: string;
  [key: string]: any;
}

export interface Tokens {
  [organizationId: string]: string;
}

export interface AppUserNotification {
  type: string;
  action: NotificationType;
  createdAt: string;
  organizationId: string;
  oauthClientId: string;
  appUserId: string;
  notification: Notification;
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

export interface Notification {
  id: string;
  issue?: {
    id: string;
    title?: string;
    [key: string]: any;
  };
  comment?: {
    id: string;
    body?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface WebhookRequest extends Request {
  body: AppUserNotification;
  headers: {
    'linear-signature'?: string;
    [key: string]: string | string[] | undefined;
  };
}

