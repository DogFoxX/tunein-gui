# Tunein GUI

### Created with tauri + svelte

# Prerequisites

1. FMOD Designer v4.44.64
2. [PitCrew](https://modworkshop.net/mod/52455) by FTIW
3. Latest Microsoft [webview2](https://developer.microsoft.com/en-us/Microsoft-edge/webview2/?form=MA13LH#download)

webview2 should already be part of your windows system. Only install if needed!<br>Get the **<ins>Evergreen Standalone Installer</ins>** for your system (x86, x64)

**For Windows 7, get the latest available webview2 version `109.0.1518.140` from [here](https://www.catalog.update.microsoft.com/Search.aspx?q=runtime%20edge%20109.0.1518.140)** for your system (x86, x64)

> [!NOTE]
>
> - Tunein GUI does **NOT** package FMOD Designer, you need to source it yourself.
> - Unsigned software - if you get a pop-up when executing the file, just click **Show more** then **Run Anyway**. The software is not malicious, Code Signing just costs a lot

# Usage

### First run:

Settings will open if required parameters are not set

- Working Directory (required)
    - Location where created Ratio Stations are saved
    - Default `%USERPROFILE%\Tunein\Stations`
- TuneinCrew Path & Install (required)
    - Set path to existing TuneinCrew (if available)
    - Deafult `%USERPROFILE%\Tunein\TuneinCrew`
- Set `fmod_designercl.exe` location (required)
    - Note `cl` at the end - **commmand-line version**
    - By default this can be found at `C:\Program Files (x86)\FMOD SoundSystem\FMOD Designer`

### Creating a Radio:

- Choose a logo image (dxt5 dds, bmp, jpg or png) (not required)
    - The app will convert bmp, jpg and png image files to a compatible DXT5 DDS file
    - 1:1 square image - recommended 512x512px
- Set Radio ID & Name (required)
- Set Global Force
    - See (\*)
- Set Target Volume
    - See (\*\*)
- Add Tracks: pulls meta data if available
    - Set Track Info as needed
    - Optionally Analyze Tracks
- :rocket: Create Radio

> [!IMPORTANT]
>
> ### \*:
>
> **Force** is the km/h value at which the music fully fades in - default `80`.
> Set this to `0` to disable the effect completely - no fade-in; always full volume - or up to a max value of `300`
>
> ### \*\*:
>
> **Target Volume** is the the dB value to normalize all tracks, e.g. `95`.
> This value is used to calculate a `gain offset` for each track to reach the **Target Volume**.

> [!NOTE]
>
> Run `Analyze Tracks` to get the Measured Volume of each track in your list for Target Volume to take effect.

### After Creating a Radio:

Running **Create Radio** will save the TuneinCrew generated files inside `Working Directory` under a folder with `Radio Name`.

Among these is a `.zip` file that can be installed with PitCrew.

# Bugs! :bug:

This is WIP (Work-In-Progress) software, so expect some bugs.<br>
Report them by creating an issue.

# To-do

### Currently working on:

- ~~**Track Target Volume**~~ - mp3gain-like Target "Normal" Value - **Done**
- ~~**Save Table Sort and Column States**~~ - **Done**
- **Profile Select Enhancements** - Needs a live and dynamic lookup
- **Save Profile** - Create and save a profile for editing later
- **Check, check, check** - Implement a bunch of checks to ensure valid xml, audio files, and much more

### Planned:

- **Jingle Support**

# Credits

:star: Thanx to FTIW for:

- PitCrew
    - Source: https://github.com/Telonof/PitCrew
    - ModWorkshop: https://modworkshop.net/mod/52455
- TuneinCrew
    - Source: https://github.com/Telonof/TuneinCrew
    - ModWorkshop: https://modworkshop.net/mod/53708

:star: Everyone who's been testing the app and giving suggestions to shape it into an All-In-One tool!
