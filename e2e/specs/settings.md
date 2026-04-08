# Settings Page

## Overview
A settings page accessible from the drawer nav. Currently contains Claude API key
management for the 📷 scan feature.

## Test Cases

### 1. Settings accessible from drawer
- Open the drawer
- Tap SETTINGS
- Settings page is shown with "⚙ SETTINGS" heading

### 2. API key input and action buttons are present
- Navigate to Settings
- An input labelled "Claude API key" is visible
- A "Test API key" button is visible
- A "Save API key" button is visible

### 3. No key set — status badge shows NO KEY SET
- Ensure no API key in localStorage
- Navigate to Settings
- "NO KEY SET" badge is visible

### 4. Saving a key updates the status badge
- Navigate to Settings
- Type a fake key into the input
- Click Save
- "KEY ACTIVE" badge is visible

### 5. Forget key clears status
- Set a key in localStorage, navigate to Settings
- Click "Forget API key"
- "NO KEY SET" badge is visible
- FORGET KEY button is gone

### 6. Scan button with no key navigates to Settings
- Ensure no API key set
- Go to Party, open the edit modal for any slot
- Click "Scan game screens"
- Settings page is shown
