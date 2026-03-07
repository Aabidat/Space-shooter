function hsla(h, s, l, a = 1) {
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
}

export function drawStylizedBullet(ctx, bullet) {
  const style = bullet.style || {};
  const shape = style.shape || "bolt";
  const hue = style.hue ?? 200;
  const sat = style.sat ?? 92;
  const lit = style.lit ?? 62;
  const glow = style.glow ?? 12;
  const cx = bullet.position.x + bullet.width / 2;
  const cy = bullet.position.y + bullet.height / 2;
  const w = bullet.width;
  const h = bullet.height;

  ctx.save();
  ctx.shadowColor = hsla(hue, sat, lit, 0.8);
  ctx.shadowBlur = glow;
  ctx.fillStyle = hsla(hue, sat, lit, 0.95);

  if (shape === "orb") {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "diamond") {
    ctx.beginPath();
    ctx.moveTo(cx, bullet.position.y);
    ctx.lineTo(bullet.position.x + w, cy);
    ctx.lineTo(cx, bullet.position.y + h);
    ctx.lineTo(bullet.position.x, cy);
    ctx.closePath();
    ctx.fill();
  } else if (shape === "lance") {
    ctx.beginPath();
    ctx.moveTo(cx, bullet.position.y - h * 0.18);
    ctx.lineTo(bullet.position.x + w * 0.78, bullet.position.y + h * 0.94);
    ctx.lineTo(bullet.position.x + w * 0.22, bullet.position.y + h * 0.94);
    ctx.closePath();
    ctx.fill();
  } else if (shape === "shard") {
    ctx.beginPath();
    ctx.moveTo(cx, bullet.position.y);
    ctx.lineTo(bullet.position.x + w, bullet.position.y + h * 0.24);
    ctx.lineTo(bullet.position.x + w * 0.86, bullet.position.y + h);
    ctx.lineTo(bullet.position.x + w * 0.14, bullet.position.y + h);
    ctx.lineTo(bullet.position.x, bullet.position.y + h * 0.24);
    ctx.closePath();
    ctx.fill();
  } else {
    // bolt
    const bodyW = w * 0.42;
    const bodyX = bullet.position.x + (w - bodyW) / 2;
    ctx.fillRect(bodyX, bullet.position.y + h * 0.18, bodyW, h * 0.72);
    ctx.beginPath();
    ctx.moveTo(cx, bullet.position.y - h * 0.16);
    ctx.lineTo(bodyX + bodyW, bullet.position.y + h * 0.26);
    ctx.lineTo(bodyX, bullet.position.y + h * 0.26);
    ctx.closePath();
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.beginPath();
  ctx.arc(cx, cy - h * 0.14, Math.max(1.8, w * 0.14), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
