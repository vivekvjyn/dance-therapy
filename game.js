let beatsData = {};
let currentBeats = [];
let poseSequence = [];
let nextPoseIndex = 0;
let score = 0;
let totalPoses = 0;
let results = [];

async function loadBeatsData() {
  const response = await fetch('beat_extraction/beats.json');
  const data = await response.json();
  data.forEach(song => {
    beatsData[song.filename] = song.beats;
  });
}

function assignPosesToBeats(songPath) {
  const filename = songPath.split('/').pop();
  // Use every 4th beat
  const allBeats = beatsData[filename] || [];
  currentBeats = allBeats.filter((_, i) => i % 2 === 0);
  poseSequence = currentBeats.map(() => selectRandomPose());
  nextPoseIndex = 0;
  score = 0;
  totalPoses = currentBeats.length;
  results = [];
}


// select random pose from poses array

function selectRandomPose() {
  if (!savedPoses) {
    savedPoses = JSON.parse(localStorage.getItem('savedPoses')) || {};
  }

  if (Object.keys(savedPoses).length === 0){
    console.warn("No saved poses available to select from.");
    return null;
  }
  
  const poseNames = Object.keys(savedPoses);
  const randomIndex = Math.floor(Math.random() * poseNames.length);
  return poseNames[randomIndex];
}



let songSelect, runButton, currentSong, gameActive = false;
const availableSongs = [
  "beat_extraction/songs/Drain Pipe - Low Life.mp3",
  "beat_extraction/songs/Earth, Wind & Fire - Let's Groove.mp3",
  "beat_extraction/songs/The Weeknd - Out of Time.mp3"
];

function setupSongSelectionUI() {
  controlsDiv = select('#controls');
  songSelect = createSelect();
  songSelect.option('Select a song');
  availableSongs.forEach(song => {
    songSelect.option(song);
  });
  songSelect.parent(controlsDiv);

  runButton = createButton('Start game!');
  runButton.parent(controlsDiv);
  runButton.mousePressed(onRunGame);
}

async function onRunGame() {
  const selected = songSelect.value();
  if (selected === 'Select a song') {
    alert('Please select a song!');
    return;
  }

  if (currentSong && currentSong.isPlaying()) {
    currentSong.stop();
  }

  if (Object.keys(beatsData).length === 0) {
    await loadBeatsData();
  }
  assignPosesToBeats(selected);
  loadAndRunClassifier(); // call method from classify.js
  loadSound(selected, song => {
    currentSong = song;
    gameActive = true;
    startGame(song);
    song.onended(() => {
      gameActive = false;
      stopGame();
      endGame();
    });
  });
}

function startGame(song) {
  //start music
  song.play();
}

function stopGame() {
}

function endGame() {
  // Game end logic (e.g., show score, reset UI)
  alert(`Game over! You got ${score} out of ${totalPoses} poses correct.`);
}

function checkPoseAtBeat() {
  if (!gameActive || !currentSong || !currentBeats.length || !classifierModel) return;

  const now = currentSong.currentTime();

  // If it's time for the next pose (within a small window)
  if (
    nextPoseIndex < currentBeats.length &&
    Math.abs(currentBeats[nextPoseIndex] - now) < 0.25 // 250ms window
  ) {
    // Only check once per beat
    if (!results[nextPoseIndex]) {
      const predicted = classifyCurrentPose();
      const expected = poseSequence[nextPoseIndex];
      if (predicted === expected) {
        score++;
        results[nextPoseIndex] = true;
      } else {
        results[nextPoseIndex] = false;
      }
      nextPoseIndex++;
    }
  }
}

// function drawUpcomingPoses() {
//   if (!gameActive || !currentSong || !currentBeats.length) return;

//   const now = currentSong.currentTime();
//   let displayCount = 0;
//   let shown = 0;
//   for (let i = nextPoseIndex; i < poseSequence.length && shown < 3; i++) {
//     const beatTime = currentBeats[i];
//     const timeToBeat = beatTime - now;
//     const midY = height / 2;
//     const speed = 200; // pixels per second
//     // const y = midY + timeToBeat * speed;
//     const y = midY - timeToBeat * speed;
//     if (poseSequence[i]) {
//       drawPoseThumbnail(poseSequence[i], width / 2 - 50, y - 50, 100);
//       shown++;
//     }
//   }
// }

function drawUpcomingPoses() {
  if (!gameActive || !currentSong || !currentBeats.length) return;

  const now = currentSong.currentTime();
  let shown = 0;
  for (let i = nextPoseIndex; i < poseSequence.length && shown < 3; i++) {
    const beatTime = currentBeats[i];
    const timeToBeat = beatTime - now;
    const midY = height / 2;
    const speed = 100; // pixels per second
    const y = midY - timeToBeat * speed;

    if (poseSequence[i]) {
      let poseName = poseSequence[i];
      let isCurrentBeat = Math.abs(beatTime - now) < 0.4;
      push();
      textAlign(CENTER, CENTER);
      if (isCurrentBeat) {
        textSize(64);
        stroke(0);
        strokeWeight(8);
        fill(255, 100, 100); // Highlight color
        text(poseName, width / 2, y);
        // Draw again with no stroke for a solid fill
        noStroke();
        fill(255, 100, 100);
        text(poseName, width / 2, y);
      } else {
        textSize(32);
        noStroke();
        fill(255);
        text(poseName, width / 2, y);
      }
      pop();
      shown++;
    }
  }
}


function drawScore() {
  if (!gameActive) return;
  push();
  textAlign(RIGHT, TOP);
  textSize(20);
  fill(30, 200, 60);
  // noStroke();
  text(`Score: ${score} / ${totalPoses}`, width - 20, 20);
  pop();
}