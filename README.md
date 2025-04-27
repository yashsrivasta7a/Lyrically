# YouTube Lyrics Overlay 🎵✨

## Problem
Many people love listening to music on YouTube, but when they want to view the lyrics, they have to open a separate tab or window. This causes distractions and interrupts the listening experience.

## Solution
**YouTube Lyrics Overlay** is a simple Chrome Extension that automatically fetches the lyrics of the currently playing YouTube song and displays them transparently over the video itself.  
No need to switch tabs — enjoy a seamless, immersive experience where the lyrics flow along with your music.

## Features
- 🔎 Automatically fetches lyrics based on the current YouTube video.
- 🖼️ Displays lyrics as an elegant transparent overlay on top of the video.
- 🎨 Minimal and non-intrusive design.
- ⚡ Fast and easy setup.
<<<<<<< HEAD
=======

---

## Setup & Running Instructions

This project consists of a Chrome Extension and a backend Node.js server that fetches the lyrics for the currently playing YouTube song. PM2 is used to manage the server.

### 1. **Clone the Repository**

Clone the repository to your local machine:

```bash
git clone https://github.com/yashsrivasta7a/Lyrically.git
cd Lyrically/backend
```
### 2. **PM2**: Install it globally using npm:

   ```bash
   npm install pm2 -g
   ```
---

### 3. Install node using npm:

   ```bash
   npm install
   node server.js
   ```
---


### 5. ## Automated Script for Easy PM2 Setup

To make it easier to start and manage your Node.js server with PM2, you can use the following script. This script will automatically start your Node.js application and set up PM2 to resurrect it after a system reboot.

### Script:

```powershell
$NodeExePath = "C:\Program Files\nodejs\node.exe"
$Pm2ResurrectCmd = "C:\Users\$env:USERNAME\AppData\Roaming\npm\node_modules\pm2\bin\pm2 resurrect"
$TaskName = "PM2_Resurrect"
$ServerJsPath = "D:\Code\Lyrically\Backend\server.js"  <------------- Update with your actual path ------------->

Write-Host "Starting your Node.js server with PM2..."
pm2 start $ServerJsPath

Write-Host "Saving PM2 process list..."
pm2 save

Write-Host "Creating Scheduled Task for PM2 resurrect..."
$Action = New-ScheduledTaskAction -Execute $NodeExePath -Argument $Pm2ResurrectCmd
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest

Register-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -TaskName $TaskName -Description "Resurrect PM2 processes at user login" -Force

Write-Host "All done! Your Node.js server will now restart automatically after reboot."
```

### How to Run the Script:
1. Open **PowerShell** as Administrator.
2. paste the above command in the PowerShell
3. You're Good to go

This will:
- Start your Node.js app with PM2.
- Save the process list.
- Set up a scheduled task to restart the app after a system reboot.

---

## Conclusion

By using **PM2**, you can efficiently manage your Node.js application, ensuring it runs smoothly and automatically restarts after reboots. The **YouTube Lyrics Overlay** Chrome Extension provides an easy way to enjoy music with synchronized lyrics, making for a seamless listening experience.

Feel free to adjust the scripts and configurations based on your needs. If you have any questions, feel free to open an issue or contact me!

---
>>>>>>> ccada8305cd732080db30adb8e0720994530fd3a
