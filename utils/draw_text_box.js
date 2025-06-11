function drawTextBox({
  textStr,
  x,
  y,
  textSizeVal = 20,
  paddingX = 18,
  paddingY = 10,
  cornerRadius = 16,
  boxColor = [255, 153, 102, 230], // #ff9966 with alpha
  textColor = [255, 255, 255],     // white
  align = 'center'
}) {
  push();
  textSize(textSizeVal);
  let tw = textWidth(textStr);
  let th = textAscent() + textDescent();
  let x1, y1, x2, y2;
  if (align === 'right') {
    x2 = x;
    x1 = x2 - tw - paddingX * 2;
  } else if (align === 'left') {
    x1 = x;
    x2 = x1 + tw + paddingX * 2;
  } else { // center
    x1 = x - (tw / 2) - paddingX;
    x2 = x + (tw / 2) + paddingX;
  }
  y1 = y;
  y2 = y1 + th + paddingY * 2;

  // Optional: shadow for depth
  drawingContext.shadowColor = 'rgba(255,94,98,0.25)';
  drawingContext.shadowBlur = 8;

  noStroke();
  fill(...boxColor);
  rect(x1, y1, x2 - x1, y2 - y1, cornerRadius);

  // Remove shadow for text
  drawingContext.shadowBlur = 0;

  fill(...textColor);
  textAlign(CENTER, CENTER);
  text(textStr, (x1 + x2) / 2, (y1 + y2) / 2);
  pop();
}