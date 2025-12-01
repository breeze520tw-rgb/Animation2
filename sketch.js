let idleSheet, walkSheet, jumpSheet, powerSheet, lightSheet;
let idleAnimation = [], walkAnimation = [], jumpAnimation = [], powerAnimation = [], lightAnimation = [];

const idleFrameCount = 8;
const walkFrameCount = 8;
const jumpFrameCount = 13;
const powerFrameCount = 8; // 修正：集氣動畫的角色部分只有8幀
const lightFrameCount = 4; // 假設能量球有4幀動畫，如果不同請修改

let characterX, characterY;
let speed = 5;
let direction = 1; // 1 for right, -1 for left
let state = 'idle'; // 'idle', 'walk', 'jump', or 'power'

// 跳躍相關變數
let isJumping = false;
let jumpFrameIndex = 0;
let jumpStartY;
let jumpSpeed = 8;
const JUMP_APEX_FRAME = 7; // 動畫到第7幀時為最高點

// 攻擊相關變數
let isAttacking = false;
let attackFrameIndex = 0;
let projectiles = [];
const ATTACK_FRAME_TO_FIRE = 6; // 修正：在第7幀(索引6)發射，配合新的動畫長度

// 能量球物件
class Projectile {
  constructor(x, y, dir) {
    this.x = x;
    this.y = y;
    this.direction = dir;
    this.speed = 15;
    this.animation = lightAnimation;
  }

  update() {
    this.x += this.speed * this.direction;
  }

  draw() {
    let currentFrame = this.animation[floor(frameCount / 4) % this.animation.length];
    push();
    translate(this.x, this.y);
    scale(this.direction, 1);
    imageMode(CENTER);
    image(currentFrame, 0, 0);
    pop();
  }
}

function preload() {
  // 預先載入站立和走路的圖片精靈
  idleSheet = loadImage('1/stop/stop-1-all.png');
  walkSheet = loadImage('1/walk/walk-1-all.png');
  jumpSheet = loadImage('1/jump/jump-1-all.png');
  powerSheet = loadImage('1/power/power-1-all.png');
  lightSheet = loadImage('1/light/light-1-all.png');
}

function setup() {
  // 建立一個全視窗的畫布
  createCanvas(windowWidth, windowHeight);
  
  // --- 處理站立動畫 ---
  let idleW = floor(idleSheet.width / idleFrameCount);
  let idleH = idleSheet.height;
  for (let i = 0; i < idleFrameCount; i++) {
    let frame = idleSheet.get(i * idleW, 0, idleW, idleH);
    idleAnimation.push(frame);
  }

  // --- 處理走路動畫 ---
  let walkW = floor(walkSheet.width / walkFrameCount);
  let walkH = walkSheet.height;
  for (let i = 0; i < walkFrameCount; i++) {
    let frame = walkSheet.get(i * walkW, 0, walkW, walkH);
    walkAnimation.push(frame);
  }
  
  // --- 處理跳躍動畫 ---
  let jumpW = floor(jumpSheet.width / jumpFrameCount);
  let jumpH = jumpSheet.height;
  for (let i = 0; i < jumpFrameCount; i++) {
    let frame = jumpSheet.get(i * jumpW, 0, jumpW, jumpH);
    jumpAnimation.push(frame);
  }

  // --- 處理攻擊動畫 ---
  // 修正：由於 power-1-all.png 的幀寬度不均勻，我們需要手動定義每一幀的座標和寬度
  const powerFramesData = [
    { x: 0, w: 155 },
    { x: 155, w: 155 },
    { x: 310, w: 155 },
    { x: 465, w: 155 },
    { x: 620, w: 155 },
    { x: 775, w: 270 },
    { x: 1045, w: 320 },
    { x: 1365, w: 320 }
  ];
  let powerH = powerSheet.height;
  for (const frameData of powerFramesData) {
    let frame = powerSheet.get(frameData.x, 0, frameData.w, powerH);
    powerAnimation.push(frame);
  }

  // --- 處理能量球動畫 ---
  let lightW = floor(lightSheet.width / lightFrameCount); 
  let lightH = lightSheet.height;
  for (let i = 0; i < lightFrameCount; i++) {
    let frame = lightSheet.get(i * lightW, 0, lightW, lightH);
    lightAnimation.push(frame);
  }

  // 初始化角色位置在畫面中央
  characterX = windowWidth / 2;
  characterY = windowHeight / 2;
  jumpStartY = characterY; // 記錄地面高度
}

function draw() {
  // 設定背景顏色
  background('#e8e3f6');

  // --- 更新和繪製能量球 ---
  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].update();
    projectiles[i].draw();
    // 如果能量球飛出畫面，就從陣列中移除
    if (projectiles[i].x > windowWidth + 50 || projectiles[i].x < -50) {
      projectiles.splice(i, 1);
    }
  }

  // --- 狀態管理 ---
  // 1. 檢查是否要觸發攻擊 (優先級最高)
  if (keyIsDown(32) && !isJumping && !isAttacking) { // 32是空白鍵的 keycode
    isAttacking = true;
    attackFrameIndex = 0;
  }

  // 2. 如果正在攻擊，處理攻擊邏輯
  if (isAttacking) {
    state = 'power';
    attackFrameIndex += 0.25; // 控制攻擊動畫速度

    // 在特定幀產生能量球
    if (floor(attackFrameIndex) === ATTACK_FRAME_TO_FIRE && floor(attackFrameIndex - 0.25) < ATTACK_FRAME_TO_FIRE) {
      let proj = new Projectile(characterX + (60 * direction), characterY - 20, direction);
      projectiles.push(proj);
    }

    if (attackFrameIndex >= powerFrameCount) {
      isAttacking = false;
    }
  }
  // 3. 檢查是否要觸發跳躍
  else if (keyIsDown(UP_ARROW) && !isJumping) {
    isJumping = true;
    jumpFrameIndex = 0; // 從第一幀動畫開始
  }

  // 4. 如果正在跳躍，處理跳躍邏輯
  if (isJumping) {
    state = 'jump';
    
    // 根據動畫幀數決定向上或向下移動
    if (jumpFrameIndex < JUMP_APEX_FRAME) {
      characterY -= jumpSpeed;
    } else {
      characterY += jumpSpeed;
    }

    // 播放跳躍動畫 (每4幀畫面更新一次動畫)
    jumpFrameIndex += 0.25; 

    // 如果動畫播放完畢
    if (jumpFrameIndex >= jumpFrameCount) {
      isJumping = false;
      characterY = jumpStartY; // 重設回地面
    }
  } 
  // 5. 如果不在跳躍或攻擊，處理走路邏輯
  else if (keyIsDown(RIGHT_ARROW)) {
    direction = 1;
    state = 'walk';
    characterX += speed;
  } else if (keyIsDown(LEFT_ARROW)) {
    direction = -1;
    state = 'walk';
    characterX -= speed;
  } else {
    // 6. 如果沒在做任何事，就站著 (且不在攻擊中)
    if (!isAttacking) {
      state = 'idle';
    }
  }

  // --- 根據狀態選擇要播放的動畫 ---
  let currentFrame;
  if (state === 'power') {
    let frameIndex = min(floor(attackFrameIndex), powerFrameCount - 1);
    currentFrame = powerAnimation[frameIndex];
  } else if (state === 'jump') {
    // 跳躍動畫只播放一次
    // 確保索引不會超出陣列範圍，防止在最後一幀消失
    let frameIndex = min(floor(jumpFrameIndex), jumpFrameCount - 1);
    currentFrame = jumpAnimation[frameIndex];
  } else if (state === 'walk') {
    // 走路動畫循環播放
    currentFrame = walkAnimation[floor(frameCount / 8) % walkAnimation.length];
  } else {
    // 站立動畫循環播放
    currentFrame = idleAnimation[floor(frameCount / 8) % idleAnimation.length];
  }

  // --- 繪製角色 ---
  push(); // 保存目前的繪圖設定
  translate(characterX, characterY); // 將原點移動到角色位置
  scale(direction, 1); // 根據方向翻轉畫布
  imageMode(CENTER); // 將圖片的繪製模式設定為中心點對齊
  image(currentFrame, 0, 0); // 在新的原點(0,0)繪製圖片
  pop(); // 恢復原本的繪圖設定
}
