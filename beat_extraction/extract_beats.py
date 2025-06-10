import essentia.standard as es
import json
import os


def main():
    # Define the directory containing audio files
    audio_path = "songs/"

    # Define the output json file
    output_json_file = "beats.json"
    beats_data = []

    # Loop through each audio file in the specified directory
    audio_files = [f for f in os.listdir(audio_path) if f.endswith('.mp3') or f.endswith('.wav')]
    for audio_file in audio_files:

        # Load the audio file
        audio = es.MonoLoader(filename=os.path.join(audio_path, audio_file))()

        # Compute beat positions
        rhythm_extractor = es.RhythmExtractor2013(method="multifeature")
        _, beats, _, _, _ = rhythm_extractor(audio)

        # Store the beat positions in a dictionary
        beats_data.append({
            "filename": audio_file,
            "beats": beats.tolist(),
        })

        # # Uncomment this to mark beat positions in the audio and write it to a file
        # marker = es.AudioOnsetsMarker(onsets=beats, type='beep')
        # marked_audio = marker(audio)
        # es.MonoWriter(filename=f"*marked* {audio_file}")(marked_audio)

    # Write the beats data to a JSON file
    with open(output_json_file, "w") as f:
        json.dump(beats_data, f, indent=4)


if __name__ == "__main__":
    main()
