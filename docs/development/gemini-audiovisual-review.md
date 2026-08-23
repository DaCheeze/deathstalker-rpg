# Gemini Audiovisual Combat Review

This local-first utility sends two explicitly selected combat clips to the Gemini
Files API and requests a timestamped audiovisual comparison. It exists because the
regular Gemini web upload path used during the first review exposed sampled frames
but not the clips' audio streams.

## Privacy and cost

- This is a **hybrid** workflow: file selection and report storage are local, while
  audiovisual analysis runs in Gemini's cloud because the local Codex model cannot
  directly consume video audio.
- The selected clips leave the computer and are processed by Google. Do not run the
  command with material that should not be uploaded.
- FFmpeg extracts each clip's first audio stream to a temporary lossless FLAC file.
  The temporary files are deleted locally after the run.
- The tool deletes its Gemini Files API uploads after success or failure unless
  `--keep-uploads` is supplied. Gemini documents automatic expiry after 48 hours.
- API usage can incur charges under the Google account that owns the key.
- The API key is read only from `GEMINI_API_KEY` and is never written to the report.

## Run it

From PowerShell, set the key for only the current shell without typing it into shell
history:

```powershell
$geminiSecret = Read-Host 'Gemini API key' -AsSecureString
$env:GEMINI_API_KEY = [System.Net.NetworkCredential]::new('', $geminiSecret).Password
```

Validate the paths and FFmpeg extraction without uploading anything:

```powershell
npm run gemini:compare -- --current 'C:\path\current-demo.mp4' --reference 'C:\path\original-fight.mp4' --dry-run
```

Run the comparison:

```powershell
npm run gemini:compare -- --current 'C:\path\current-demo.mp4' --reference 'C:\path\original-fight.mp4' --output 'docs\development\gemini-combat-comparison.md'
```

Clear the key afterward:

```powershell
Remove-Item Env:GEMINI_API_KEY
```

The default model is `gemini-3.7-flash`. Override it with `--model` if the account
does not expose that model.

## FFmpeg and audio handling

By default, the tool uses FFmpeg to extract synchronized lossless audio from both
videos and uploads those tracks alongside the videos. This avoids relying on the
video-upload path to expose its embedded audio. Set `FFMPEG_PATH` or pass
`--ffmpeg 'C:\path\ffmpeg.exe'` when the executable is not available as `ffmpeg`.

Use `--no-extract-audio` only to test Gemini's handling of the audio embedded in the
video containers.

## Pre-extracted audio override

To bypass FFmpeg extraction, supply synchronized audio-only files for both clips:

```powershell
npm run gemini:compare -- --current 'C:\path\current-demo.mp4' --reference 'C:\path\original-fight.mp4' --current-audio 'C:\path\current-demo.wav' --reference-audio 'C:\path\original-fight.wav' --output 'docs\development\gemini-combat-comparison.md'
```

Explicit audio paths take precedence over automatic extraction. The tool performs
an audio-access probe before requesting the comparison. Each clip
must produce an explicit `AUDIO_STREAM_ACCESSIBLE: YES` plus timestamped non-speech
events. Otherwise it writes the probe results, aborts the comparison, and prevents
visual-only guesses from being mistaken for audio evidence.

Supported video extensions are MP4, MOV, MKV, and WebM. Supported separate-audio
extensions are WAV, MP3, M4A, AAC, AIFF, FLAC, and OGG.
