let video;
let pose;
let posenetModel;

function setup() {
  createCanvas(640, 640);
  video = createCapture(VIDEO);
  video.size(width, height-160);
  video.hide();
  
  // Wait for video to be ready before loading posenet and starting detection
  video.elt.onloadedmetadata = () => {
    console.log("Video is ready, loading PoseNet...");
    loadPosenet();
  };

  setupPoseUI();
  setupTrainUI();
  setupClassifierUI();
}

function draw() {
  background(220);
  // Mirror the video
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height-160);
  pop();

  if (!posenetModel) {
    fill(0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text('Loading...', width / 2, height / 2);  
  }

  if (pose) {
    drawKeypoints(pose.keypoints, 0.5, color(0, 255, 0)); // Draw keypoints in green
    drawSkeleton(pose.keypoints, 0.5, color(255, 0, 0)); // Draw skeleton in red
  }

  drawCountdown();

  drawClassification();

  let names = Object.keys(savedPoses);

  let thumbnailY = height - 140;
  for (let i = 0; i < names.length; i++) {
    drawPoseThumbnail(names[i], 20 + i * 120, thumbnailY, 100);
  }
}

async function loadPosenet() {
  console.log("Loading PoseNet model...");
  posenetModel = await posenet.load({
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width: 640, height: 480 },
    multiplier: 0.75
  });
  console.log("PoseNet model loaded.");
  detectPose();
}

async function detectPose() {
  while (true) {
    const poses = await posenetModel.estimateSinglePose(video.elt, {
      flipHorizontal: true,
      // decodingMethod: 'single-person',
    });
    pose = poses;
    await new Promise(r => setTimeout(r, 30)); // ~30 FPS
  }
}