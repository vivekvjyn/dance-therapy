# [Dance Therapy](https://amalgah.net/dance-therapy/)
💃 **↑↑↑ Try it now! ↑↑↑** 💃


## About
Dance Therapy is an interactive browser-based game that uses your webcam and machine learning to recognize your dance poses in real time. Record your own poses, train a custom pose classifier, and then play along to music by matching the prompted poses to score points.

## Usage instructions

The easiest way to use the software is to navigate to the deployed version [amalgah.net/dance-therapy/](https://amalgah.net/dance-therapy/)

You will need to agree to webcam access permissions when prompted by your browser.

Or if you wish to run the code locally, clone the repo and host index.html with the following instructions:

### Running a Local HTTP Server

To serve the files locally, you can use Python's built-in HTTP server. In the cloned project directory, run:

```sh
# For Python 3.x
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

Alternatively, you can use [http-server](https://www.npmjs.com/package/http-server) if you have Node.js installed:

```sh
npx http-server
```

### Dependencies
We bundle our required libraries in the repo (see `libs/`):
- p5.js, p5.sound.js
- tensorflow.js
- posenet

### How to play
(these instructions are also included at the bottom of the site)

1. **Record Poses:** Use the controls to record different poses for each dance move. Make sure you have good lighting and are visible to the camera.
2. **Train Model:** Once you have recorded enough samples for each pose, click the "Train" button to train your pose classifier.
3. **Choose a Song:** Select a song from the available options to play during the game.
4. **Play the Game:** Follow the on-screen prompts and perform the poses as they appear. Try to match the poses to score points!