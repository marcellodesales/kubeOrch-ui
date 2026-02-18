export type NotificationChannelType =
  | "slack"
  | "discord"
  | "telegram"
  | "pagerduty"
  | "teams"
  | "webhook";

export interface NotificationChannelTypeInfo {
  type: NotificationChannelType;
  name: string;
  description: string;
  fields: NotificationFormField[];
  helpLink?: { prefix: string; linkText: string; url: string };
}

export interface NotificationFormField {
  key: string;
  label: string;
  type: "text" | "password";
  placeholder: string;
  required: boolean;
  helpText?: string;
}

export const NOTIFICATION_CHANNEL_TYPES: NotificationChannelTypeInfo[] = [
  {
    type: "slack",
    name: "Slack",
    description: "Send alerts to a Slack channel via incoming webhook",
    fields: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        type: "password",
        placeholder: "https://hooks.slack.com/services/T.../B.../...",
        required: true,
      },
    ],
    helpLink: {
      prefix: "Create an incoming webhook at",
      linkText: "api.slack.com/apps",
      url: "https://api.slack.com/apps",
    },
  },
  {
    type: "discord",
    name: "Discord",
    description: "Send alerts to a Discord channel via webhook",
    fields: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        type: "password",
        placeholder: "https://discord.com/api/webhooks/...",
        required: true,
      },
    ],
    helpLink: {
      prefix: "Create a webhook in",
      linkText: "Discord channel settings",
      url: "https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks",
    },
  },
  {
    type: "telegram",
    name: "Telegram",
    description: "Send alerts to a Telegram chat via bot",
    fields: [
      {
        key: "bot_token",
        label: "Bot Token",
        type: "password",
        placeholder: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
        required: true,
      },
      {
        key: "chat_id",
        label: "Chat ID",
        type: "text",
        placeholder: "-1001234567890",
        required: true,
        helpText: "Use @userinfobot or @RawDataBot to find your chat ID",
      },
    ],
    helpLink: {
      prefix: "Create a bot with",
      linkText: "@BotFather on Telegram",
      url: "https://t.me/BotFather",
    },
  },
  {
    type: "pagerduty",
    name: "PagerDuty",
    description: "Trigger PagerDuty incidents via Events API v2",
    fields: [
      {
        key: "routing_key",
        label: "Integration / Routing Key",
        type: "password",
        placeholder: "R0XXXXXXXXXXXXXXXXXXXXXXXXXX",
        required: true,
        helpText:
          "The 32-character integration key from your PagerDuty service",
      },
    ],
    helpLink: {
      prefix: "Create an Events API v2 integration in",
      linkText: "PagerDuty service settings",
      url: "https://support.pagerduty.com/docs/services-and-integrations",
    },
  },
  {
    type: "teams",
    name: "Microsoft Teams",
    description: "Send alerts to a Teams channel via webhook",
    fields: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        type: "password",
        placeholder: "https://outlook.office.com/webhook/...",
        required: true,
      },
    ],
    helpLink: {
      prefix: "Create a webhook in",
      linkText: "Teams channel connectors",
      url: "https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook",
    },
  },
  {
    type: "webhook",
    name: "Generic Webhook",
    description: "Send raw JSON alerts to any HTTP endpoint",
    fields: [
      {
        key: "url",
        label: "Webhook URL",
        type: "text",
        placeholder: "https://example.com/webhook",
        required: true,
      },
    ],
  },
];

export function getNotificationTypeInfo(
  type: NotificationChannelType
): NotificationChannelTypeInfo | undefined {
  return NOTIFICATION_CHANNEL_TYPES.find(t => t.type === type);
}
