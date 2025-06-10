let classifierModel = null;
let classifierLabels = [];
let drawClassificationState = false;

async function loadClassifier() {
  try {
    classifierModel = await tf.loadLayersModel('localstorage://pose-classifier');
    classifierLabels = JSON.parse(localStorage.getItem('poseClassifierLabels'));
    console.log('Classifier loaded:', classifierLabels);
  } catch (e) {
    console.log('No classifier found. Train first.');
  }
}

// Call this after setup or after training
// loadClassifier();

// function extractFeatures(pose) {
//   // Must match your training feature extraction!
//   return pose.keypoints.flatMap(kp => [kp.position.x, kp.position.y]);
// }

function classifyCurrentPose() {
  if (!classifierModel || !pose) return null;
  const features = extractFeatures(pose);
  const input = tf.tensor2d([features]);
  const prediction = classifierModel.predict(input);
  const predIdx = prediction.argMax(1).dataSync()[0];
  const label = classifierLabels[predIdx];
  input.dispose();
  prediction.dispose();
  return label;
}

function setupClassifierUI() {
  controlsDiv = select('#controls');
  const btn = createButton('Run Classifier');
  btn.parent(controlsDiv);
  btn.mousePressed(() => { 
    loadClassifier().then(() => {
      console.log('Classifier ready. Classifying current pose...');
      //flip the state to draw classification
      if (drawClassificationState) {
        drawClassificationState = false;
        btn.html('Run Classifier');
      } else {
        drawClassificationState = true;
        btn.html('Stop Classifier');
      }
    }).catch(err => {
      console.error('Error loading classifier:', err);
    });
  });
}



function drawClassification() {
  if (!pose || !classifierModel) return;
  if (drawClassificationState){
    let predicted = classifyCurrentPose();
    if (predicted) {
      fill(0, 0, 255);
      textSize(32);
      textAlign(CENTER, CENTER);
      text(`Prediction: ${predicted}`, width / 2, height - 200);
    }
  }
}