@echo off
rem Klima Wandel Stadt - stellt den Ordner "strato-upload" fuer den Strato-Webspace zusammen.
rem Doppelklick genuegt. Danach den INHALT von "strato-upload" per SFTP ins
rem Startverzeichnis der Domain hochladen (siehe startseite\README.md).
rem
rem   strato-upload\                 Startseite (aus "startseite")
rem   strato-upload\klima-chancen\   Klima Chancen (aus dem Hauptordner)
rem   strato-upload\entwurfslabor\   Vaals Entwurfslabor
setlocal
cd /d "%~dp0"
set "ZIEL=%~dp0strato-upload"

echo Stelle das Strato-Paket zusammen ...
if exist "%ZIEL%" rmdir /s /q "%ZIEL%"

robocopy "startseite" "%ZIEL%" /E /XF *.md /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto fehler

robocopy "." "%ZIEL%\klima-chancen" /E /XD .git .claude startseite entwurfslabor strato-upload /XF *.md .gitignore .gitattributes *.cmd Thumbs.db .DS_Store /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto fehler

robocopy "entwurfslabor" "%ZIEL%\entwurfslabor" /E /XF *.md Thumbs.db .DS_Store /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 goto fehler

echo.
echo Fertig: %ZIEL%
echo Diesen Ordnerinhalt per SFTP ins Startverzeichnis der Domain hochladen.
start "" explorer "%ZIEL%"
pause
exit /b 0

:fehler
echo.
echo FEHLER beim Kopieren. Ist eine Datei im Ordner "strato-upload" noch geoeffnet?
pause
exit /b 1
