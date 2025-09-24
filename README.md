# Tunein GUI

### Created with tauri + svelte

![alt text](https://cdn.discordapp.com/attachments/1420061770374185052/1420061770654945290/image.png?ex=68d4afd5&is=68d35e55&hm=e26294df174e476b0de231d0a5fa8ff8deea06244f85b0eb7764e7d73981a769&)

### Prerequisites: [webview2](https://developer.microsoft.com/en-us/Microsoft-edge/webview2/?form=MA13LH#download)

- This should already be part of your windows system. Only install if needed! Get the **Evergreen Standalone Installer** for your system (x86, x64 or arm64)
- Windows 7 support has ended, so the app might not render correctly. 'Tis what it is...

### Note!

- This GUI is WiP, so a lot of features are missing. Right now it's just an xml generator which allows you to export.
- It does NOT package FMOD Designer 2010, you need to get that yourself
    - Edit the exported xml `fmod` node with the directory where `fmod_designercl.exe` is located (default `C:\Program Files (x86)\FMOD SoundSystem\FMOD Designer\fmod_designercl.exe`
- Edit the xml with your dds logo file
- It does NOT package TuneinCrew... yet
  Unsigned software - if you get a pop-up when executing the file, just click **Show more** then **Run Anyway**. The software is not malicious, Code Signing just costs a lot :confused:

### Bugs! :bug:

This is untested software. Except for myself with 2 windows machines, no one has tested the gui so expect some bugs.
Report them here and I will get to work asap.

### To-do

- **XML import** - For editing existing XMLs
- **DDS File handling** - Import existing dds files for the logo, alternatively convert image files to dds
- **Settings** - Working directory (where the app will save profiles), set FMOD directrory
- **Add TuneinCrew** - For creating the mod directly within the app
- **Auto Updater** - Both the app and dependencies
- **Console Output** - Still need to test if this is plausible. Just an idea right now, but will be helpful for troubleshooting issues when running TuneinCrew
