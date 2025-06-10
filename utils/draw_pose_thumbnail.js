function drawPoseThumbnail(poseName, x, y, size = 100) {
  // Load saved poses from localStorage if not already loaded
  let poses = savedPoses;
  if (!poses[poseName]) {
    fill(255, 0, 0);
    textSize(14);
    textAlign(CENTER, CENTER);
    text('No data', x + size / 2, y + size / 2);
    return;
  }
  // Use the first sample for the pose
  let poseSample = poses[poseName][0];
  if (!poseSample) return;

  // Create a graphics buffer for the thumbnail
  let pg = createGraphics(size, size);
  pg.background(40, 40, 40, 220);
  pg.push();
  // Find bounds for normalization
  let xs = poseSample.keypoints.map(kp => kp.position.x);
  let ys = poseSample.keypoints.map(kp => kp.position.y);
  let minX = Math.min(...xs), maxX = Math.max(...xs);
  let minY = Math.min(...ys), maxY = Math.max(...ys);

  // Scale and center the pose in the thumbnail
  let scale = 0.8 * size / Math.max(maxX - minX, maxY - minY);
  let offsetX = (size - (maxX - minX) * scale) / 2;
  let offsetY = (size - (maxY - minY) * scale) / 2;

  // Draw skeleton
  let adjacentKeyPoints = posenet.getAdjacentKeyPoints(poseSample.keypoints, 0.1);
  pg.stroke(255, 120, 120);
  pg.strokeWeight(3);
  adjacentKeyPoints.forEach(([p1, p2]) => {
    let x1 = offsetX + (p1.position.x - minX) * scale;
    let y1 = offsetY + (p1.position.y - minY) * scale;
    let x2 = offsetX + (p2.position.x - minX) * scale;
    let y2 = offsetY + (p2.position.y - minY) * scale;
    pg.line(x1, y1, x2, y2);
  });

  // Draw keypoints
  pg.noStroke();
  pg.fill(120, 200, 255);
  poseSample.keypoints.forEach(kp => {
    let px = offsetX + (kp.position.x - minX) * scale;
    let py = offsetY + (kp.position.y - minY) * scale;
    pg.ellipse(px, py, 10, 10);
  });

  pg.pop();

  // Draw the thumbnail to the main canvas
  image(pg, x, y);

  // Draw the pose name underneath
  fill(255);
  textSize(16);
  textAlign(CENTER, TOP);
  text(poseName, x + size / 2, y + size + 4);
}