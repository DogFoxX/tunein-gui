# Tunein GUI

### Created with tauri + svelte

# Prerequisites

1. FMOD Designer v4.44.64
2. [PitCrew](https://modworkshop.net/mod/52455) by FTIW
3. Latest Microsoft [webview2](https://developer.microsoft.com/en-us/Microsoft-edge/webview2/?form=MA13LH#download)

<sub>webview2 should already be part of your windows system. Only install if needed!<br>Get the **<ins>Evergreen Standalone Installer</ins>** for your system (x86, x64 or arm64)</sub>

**For Windows 7, get the latest available webview2 version `109.0.1518.140` from [here](https://www.catalog.update.microsoft.com/Search.aspx?q=runtime%20edge%20109.0.1518.140)** for your system (x86, x64 or arm64)

# Usage

### First run:

- Settings will open if FMOD Designer Path is not set
    - Set `fmod_designercl.exe` location
    - This is a good opportunity to change other settings, like Working Directory (default is the exe path)
    - **<ins>Experimental</ins>** TuneinCrew's exe path (best to keep at default)

### Creating a Radio:

- Import an existing XML, or start from scratch
- Choose a logo image (dxt5 dds, bmp, jpg or png)
    - The app will convert bmp, jpg and png image files to a compatible DXT5 DDS file
- Set Radio ID, Name
- Choose Force options
    - Global Default will omit the `<force>` tag to keep it in line with The Crew's default
    - Global Value **(RECOMMENDED)** will set a value to all `<force>` tags in each `<song>`
    - Per Track Value will let the user set `<force>` to each track manually
- Add Tracks: pulls meta data if available
    - Set Track Info as needed
- :rocket: Create Radio

### After Creating a Radio:

Running **Create Radio** will create a folder with your **Radio Name** - e.g. Awesome FM - inside the Working Directory. This folder will contain the TuneinCrew generated files, as well as the logo dds and xml file.

When tuneinCrew successfully exists a `.zip` file will be generated in your Radio Station Folder. Install the `.zip` file with PitCrew

### Note!

- Tunein GUI does **NOT** package FMOD Designer, you need to source it yourself.
- Unsigned software - if you get a pop-up when executing the file, just click **Show more** then **Run Anyway**. The software is not malicious, Code Signing just costs a lot

# Bugs! :bug:

This is WIP (Work-In-Progress) software, so expect some bugs.<br>
Report them by creating an issue.

# To-do

### Currently working on:

- **Track Target Volume** - mp3gain-like Target "Normal" Value
- **Profile Select Enhancements** - Needs a live and dynamic lookup
- **Save Profile** - Create and save a profile for editing later
- **Check, check, check** - Implement a bunch of checks to ensure valid xml, audio files, and much more

### Planned:

- **Jingle Support**
- **Track Audio Volume Adjuster** - Set a target volume for tracks to match in-game music
    - User definable
    - Global or per track
    - Or suggested best target volume.
