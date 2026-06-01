# Privacy Policy - Time-Tracker

**Last updated:** 2026

## Overview

Time-Tracker is a Chrome extension that helps users track and manage their daily browser usage. This privacy policy explains how the extension handles data.

## Data Collection

Time-Tracker does **not** collect, transmit, or share any personal data.

All data is stored exclusively in Chrome's local storage on your device and is never sent to any external server or third party.

## Data Stored Locally

The following data is stored only on your device:

- Daily browsing time per website (domain names only)
- Total daily usage time
- User settings (time limits, reset schedule, notifications preferences)
- List of blocked websites configured by the user
- Usage history for reports (up to 90 days)

## Permissions Used

| Permission | Reason |
|------------|--------|
| `tabs` | Detect the active tab to track time per website |
| `storage` | Save usage data and settings locally on your device |
| `alarms` | Trigger daily reset at a configured time |
| `idle` | Pause tracking when the user is inactive or screen is off |
| `notifications` | Alert the user when the daily time limit is exceeded |
| `scripting` | Inject a small timer widget overlay into web pages |
| `webNavigation` | Detect page navigation to enforce site blocking rules |
| `host permissions` | Required to track and optionally block any website |

## Third Party Services

FocusWatch does not use any third-party services, analytics, or tracking tools.

## Changes to This Policy

Any updates to this policy will be reflected on this page.

## Contact

For questions or concerns, please open an issue on the [GitHub repository](https://github.com/a0556775895-lgtm/Time-Tracker).
