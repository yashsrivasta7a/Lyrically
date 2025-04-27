# Lyrically 🎵✨


![🎬 Lyrically Demo](https://github.com/yashsrivasta7a/Lyrically/raw/main/Demo.mp4)  

## 🔍 The Problem

When listening to music on YouTube, viewers often want to follow along with the lyrics. Traditionally, this requires opening a separate tab or window to search for lyrics, which disrupts the viewing experience.

## 💡 Our Solution

**Lyrically** seamlessly integrates lyrics into your YouTube experience by:
- Automatically detecting the currently playing song
- Fetching the corresponding lyrics
- Displaying them as an elegant overlay directly on the video player

## ✨ Key Features

- 🎯 **Automatic Detection** - Intelligently identifies the current song from YouTube metadata
- 🌟 **Elegant Overlay** - Non-intrusive transparent lyrics display over your video
- 🎨 **Minimalist Design** - Clean interface that doesn't distract from the music
- ⚡ **Lightweight** - Fast performance with minimal resource usage
- 🛠️ **Easy Setup** - Simple installation and configuration

## 🚀 Getting Started

### Prerequisites
- Node.js
- npm
- Chrome browser
- A Genius API key

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yashsrivasta7a/Lyrically.git
cd Lyrically/backend
```

#### 2. Install PM2 Globally
```bash
npm install pm2 -g
```

#### 3. Install Dependencies
```bash
npm install
```

#### 4. Configure Genius API Token

1. Visit [Genius API Clients](https://genius.com/api-clients)
2. Create a new API client and obtain your access token
3. Create .env file and paste your 
```bash
Genius_Token = YOUR_API_KEY;
```

## 🖥️ Running the Server

### Option A: One-Time Run
For temporary usage:
```bash
node server.js
```

### Option B: Persistent Server with PM2
For always-on operation that survives system restarts:

1. **Create a startup script** (save as `setup-pm2.ps1`):

```powershell
$NodeExePath = "C:\Program Files\nodejs\node.exe"
$Pm2ResurrectCmd = "C:\Users\$env:USERNAME\AppData\Roaming\npm\node_modules\pm2\bin\pm2 resurrect"
$TaskName = "PM2_Resurrect"
$ServerJsPath = "$PWD\server.js"  # Uses current directory

Write-Host "Starting your Node.js server with PM2..."
pm2 start $ServerJsPath

Write-Host "Saving PM2 process list..."
pm2 save

Write-Host "Creating Scheduled Task for PM2 resurrect..."
$Action = New-ScheduledTaskAction -Execute $NodeExePath -Argument $Pm2ResurrectCmd
$Trigger = New-ScheduledTaskTrigger -AtLogOn
$Principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest

Register-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -TaskName $TaskName -Description "Resurrect PM2 processes at user login" -Force

Write-Host "✅ Setup complete! Your server will automatically restart after system reboots."
```

2. **Run the script** with Administrator privileges:
```powershell
powershell -ExecutionPolicy Bypass -File setup-pm2.ps1
```

## 🔄 Quick Reference

| Operation | Command |
|-----------|---------|
| Start server (one-time) | `node server.js` |
| Start with PM2 | `pm2 start server.js` |
| Check PM2 processes | `pm2 list` |
| Stop PM2 server | `pm2 stop server` |
| View logs | `pm2 logs` |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
