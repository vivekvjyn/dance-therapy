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
  //set button id
  btn.id('runClassifierBtn');
  btn.parent(controlsDiv);
  btn.mousePressed(loadAndRunClassifier);
}

async function loadAndRunClassifier() { 
  loadClassifier().then(() => {
    console.log('Classifier ready. Classifying current pose...');
    //flip the state to draw classification
    if (drawClassificationState) {
      drawClassificationState = false;
      // btn.html('Run Classifier');
      // set runButtonIdclassifer to Run Classifier
      select('#runClassifierBtn').html('Run Classifier');
    } else {
      drawClassificationState = true;
      // btn.html('Stop Classifier');
      select('#runClassifierBtn').html('Stop Classifier');

    }
  }).catch(err => {
    console.error('Error loading classifier:', err);
  });
}

function drawClassification() {
  if (!pose || !classifierModel) return;
  if (drawClassificationState){
    let predicted = classifyCurrentPose();
    if (predicted) {
      fill(0, 0, 255);
      textSize(20);
      textAlign(LEFT, TOP);
      text(`Prediction: ${predicted}`, 20, 20);
    }
  }
}