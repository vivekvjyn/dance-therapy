let savedPoses = {}; // { poseName: [samples] }
let savingPose = false;
let countdownStartTime = 0;
let countdownDuration = 3; // seconds
let recordingDuration = 2; // seconds
let samplesPerSecond = 15;
let currentPoseName = '';
let samples = [];
let recordingStartTime = 0;

function setupPoseUI() {
  controlsDiv = select('#controls');
  let input = createInput('');
  input.attribute('placeholder', 'Pose name');
  input.id('poseNameInput');
  input.parent(controlsDiv);

  let btn = createButton('Record Pose');
  btn.parent(controlsDiv);
  btn.mousePressed(() => startPoseCountdown());

  let btnClear = createButton('Clear All Data');
  btnClear.parent(controlsDiv);
  btnClear.mousePressed(() => {
    if (confirm('Are you sure you want to clear all saved poses and classifier?')) {
      // empty localStorage fully
      localStorage.clear();
      savedPoses = {}; // clear saved poses so the display of thumbnails is empty
    }
  });

}

function startPoseCountdown() {
  let input = select('#poseNameInput');

  if (!input) return;
  let poseName = input.value().trim();
  console.log(`Starting countdown for pose: ${poseName}`);
  if (!poseName) {
    alert('Please enter a pose name!');
    return;
  }
  if (!savingPose) {
    currentPoseName = poseName;
    savingPose = true;
    countdownStartTime = millis();
    samples = [];
  }
}

function drawCountdown() {
  if (savingPose) {
    let elapsed = (millis() - countdownStartTime) / 1000;
    let remaining = countdownDuration - elapsed;

    if (remaining > 0) {
      fill(255, 0, 0);
      textSize(32);
      textAlign(CENTER, CENTER);
      text(`Recording in ${Math.ceil(remaining)}...`, width / 2, height / 2);
    } else {
      text("Recording pose... hold it!", width / 2, height / 2);
      // Start recording samples
      if (samples.length === 0) {
        recordingStartTime = millis();
      }
      recordPoseSamples();
    }
  }
}

function recordPoseSamples() {
  let elapsed = (millis() - recordingStartTime) / 1000;
  if (elapsed < recordingDuration) {
    // Sample at desired rate
    if (frameCount % Math.round(60 / samplesPerSecond) === 0 && pose) {
      samples.push(JSON.parse(JSON.stringify(pose)));
    }
  } else {
    // Save samples to localStorage
    if (!savedPoses[currentPoseName]) savedPoses[currentPoseName] = [];
    savedPoses[currentPoseName] = savedPoses[currentPoseName].concat(samples);
    localStorage.setItem('savedPoses', JSON.stringify(savedPoses));
    savingPose = false;
    console.log(`Saved ${samples.length} samples for pose "${currentPoseName}"`);
  }
}

// On page load, restore saved poses
window.addEventListener('DOMContentLoaded', () => {
  let data = localStorage.getItem('savedPoses');
  if (data) savedPoses = JSON.parse(data);
});