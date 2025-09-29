# Tunein GUI

### Created with tauri + svelte

## Update v0.1.0 - Beta

### Usage:

> - Settings will open if FMOD Designer Path is not set
>     - This is a good opportunity to change other settings, like Working Directory (default is the exe path)
>     - Experimental TuneinCrew's exe path (best to keep at default)
> - Import an existing XML, or start from scratch
> - Choose a logo image (dxt5 dds, bmp, jpg or png)
>     - The app will convert bmp, jpg and png images file to a compatible DXT5 DDS file
> - Set Radio ID, Name
> - Choose Force options
>     - Global Default will omitt the `<force>` tag to keep it in line with The Crew's default
>     - Global Value will set a value to all `<force>` tags in each `<song>`
>     - Per Track Value will let the user set `<force>` to each track manually
> - Add Tracks: pulls meta data if available
> - Set Track Info as needed
> - :rocket: Create Radio
>
> ### Note
>
> When importing an XML, make sure the Logo Preview has an image **IF** the XML has a value set to `<logo>`
>
> Running **Create Radio** will create a folder with **Radio Name** inside the Working Directory. This folder will contain the TuneinCrew generated files, as well as the logo dds and xml file.

### Prerequisites: [webview2](https://developer.microsoft.com/en-us/Microsoft-edge/webview2/?form=MA13LH#download)

- This should already be part of your windows system. Only install if needed! Get the **Evergreen Standalone Installer** for your system (x86, x64 or arm64)
- Windows 7 support has ended, so the app might not render correctly. 'Tis what it is...

### Note!

- Tunein GUI does **NOT** package FMOD Designer 2010, you need to get that yourself
    - Edit the exported xml `fmod` node with the directory where `fmod_designercl.exe` is located (default `C:\Program Files (x86)\FMOD SoundSystem\FMOD Designer\fmod_designercl.exe`
- Unsigned software - if you get a pop-up when executing the file, just click **Show more** then **Run Anyway**. The software is not malicious, Code Signing just costs a lot

### Bugs! :bug:

This is untested software. Except for myself with 2 windows machines, no one has tested the gui so expect some bugs.
Report them here and I will get to work asap.

### To-do

- **Auto Updater** - Both the app and dependencies
