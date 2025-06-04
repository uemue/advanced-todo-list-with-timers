# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Features

- **Task Management:**
    - Add tasks with a name and estimated duration.
    - Mark tasks as complete or incomplete.
    - Delete tasks.
    - Reorder tasks by dragging and dropping.
- **Task Timers:**
    - Start, pause, and reset a timer for each task.
    - Timers count down the estimated duration.
    - If the timer finishes, it notifies the user and then starts counting up to track overtime.
- **Persistence:**
    - Tasks are stored in local storage to persist them across sessions.
- **User Experience:**
    - Dark mode support, with a toggle and detection of system preference.
    - Notifications for events like timer completion.
    - Uses the Screen Wake Lock API to keep the screen on while a timer is running (falls back gracefully if unsupported).
