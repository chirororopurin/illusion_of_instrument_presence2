// --- DOM取得 ---
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");
const videoEl = document.getElementById("video");
const playBtn = document.getElementById("playBtn");
const ratingEl = document.getElementById("rating");
const ratingValue = document.getElementById("rating-value");
const nextBtn = document.getElementById("nextBtn");
const penColorSelect = document.getElementById("penColor");
const expectedColorText = document.getElementById("expectedColorText");
const instrumentYesEl = document.getElementById("yes");
const instrumentNoEl = document.getElementById("no");
const instrumentCountEl = document.getElementById("instrument-count");

// --- 動画リスト ---
const videoFiles = [
  "output_with_sound_A_1_1.mp4",
  "output_with_sound_A_1_2.mp4",
  "output_with_sound_A_1_3.mp4",
  "output_with_sound_A_1_4.mp4",
  "output_with_sound_B_1_1.mp4",
  "output_with_sound_B_1_2.mp4",
  "output_with_sound_B_1_3.mp4",
  "output_with_sound_B_1_4.mp4"
];

// --- ペン色リスト ---
const colorList = [
  { num: 1, name: "Red", code: "rgba(255,0,0,0.7)" },
  { num: 2, name: "Blue", code: "rgba(0,0,255,0.7)" },
  { num: 3, name: "Green", code: "rgba(0,255,0,0.7)" },
  { num: 4, name: "Yellow", code: "rgba(255,255,0,0.7)" },
  { num: 5, name: "Cyan", code: "rgba(0,255,255,0.7)" },
  { num: 6, name: "Magenta", code: "rgba(255,0,255,0.7)" },
  { num: 7, name: "Orange", code: "rgba(255,165,0,0.7)" },
  { num: 8, name: "Purple", code: "rgba(128,0,128,0.7)" },
  { num: 9, name: "Brown", code: "rgba(165,42,42,0.7)" },
  { num: 10, name: "Black", code: "rgba(0,0,0,0.7)" }
];

// --- Attention Check 指定色 ---
const attentionColorOrder = [
  { num: 1, name: "Red" },
  { num: 2, name: "Blue" },
  { num: 10, name: "Black" },
  { num: 1, name: "Red" },
  { num: 4, name: "Yellow" },
  { num: 2, name: "Blue" },
  { num: 3, name: "Green" },
  { num: 10, name: "Black" }
];

// --- 状態変数 ---
let shuffledVideos = [...videoFiles];

for (let i = shuffledVideos.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [shuffledVideos[i], shuffledVideos[j]] = [shuffledVideos[j], shuffledVideos[i]];
}

let currentIndex = 0;
let points = [];
let drawing = false;

// --- participantId の取得ロジック ---
function getParticipantIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('pid'); 
}

const participantId = getParticipantIdFromUrl();

if (!participantId) {
  status.textContent = "Error: Participant ID not found. Please start over from the introduction page.";
  nextBtn.disabled = true;
  playBtn.disabled = true;
  // エラー処理（この行のthrowは意図通りに維持）
  throw new Error("Participant ID not found.");
}
// --- participantId の取得ロジック終了 ---

// --- ペン色選択リスト生成 ---
colorList.forEach(c => {
  const option = document.createElement("option");
  option.value = c.num;
  option.textContent = `${c.num}: ${c.name}`;
  penColorSelect.appendChild(option);
});
penColorSelect.value = 1;

// --- 描画 ---
canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", e => { if (drawing) draw(e); });

let videoStartTime = null; // 再生開始時刻を保持

function draw(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const selectedNum = parseInt(penColorSelect.value);
  // 保存は動画ピクセル座標
  const videoX = Math.round((x / canvas.width) * videoEl.videoWidth);
  const videoY = Math.round((y / canvas.height) * videoEl.videoHeight);
  const colorObj = colorList.find(c => c.num === selectedNum);
  ctx.fillStyle = colorObj ? colorObj.code : "rgba(255,0,0,0.7)";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  // 経過時間を秒で計算
  const timestamp = videoStartTime ? (performance.now() - videoStartTime) / 1000 : 0;
  points.push({ x: videoX, y: videoY, timestamp });
}

// --- 2フレームごとサンプリング ---
function getSampledPoints(points) {
  const sampled = [];
  for (let i = 0; i < points.length; i += 2) {
    const p = points[i];
    // 描画データは整数に丸めることでノイズを低減し、タイムスタンプの精度を維持
    sampled.push({
      x: Math.round(p.x),
      y: Math.round(p.y),
      timestamp: Math.round(p.timestamp * 1000) / 1000
    });
  }
  return sampled;
}

// --- スライダー ---
ratingEl.addEventListener("input", () => {
  ratingValue.textContent = ratingEl.value;
});

// --- ラジオボタンで instrumentYesNo / Count 入力制御 ---
instrumentYesEl.addEventListener("change", () => {
  if (instrumentYesEl.checked) {
    instrumentCountEl.disabled = false;
  }
});

instrumentNoEl.addEventListener("change", () => {
  if (instrumentNoEl.checked) {
    instrumentCountEl.value = 0;
    instrumentCountEl.disabled = true;
  }
});

// --- 動画再生 ---
playBtn.addEventListener("click", async () => {
  try {
    videoEl.muted = false;
    await videoEl.play();
    playBtn.disabled = true;
    videoStartTime = performance.now(); // 再生開始時の高精度タイムスタンプを取得
  } catch (err) {
    status.textContent = "Autoplay blocked. Click again to play.";
  }
});

videoEl.addEventListener("pause", () => { if (!videoEl.ended) videoEl.play(); });

// --- 次ページボタン ---
nextBtn.addEventListener("click", async () => {
  nextBtn.disabled = true;
  status.textContent = "Processing data...";

  const instrumentYesNo = instrumentYesEl.checked ? "yes" : "no";
  let countValue = parseInt(instrumentCountEl.value);
  if (isNaN(countValue) || countValue < 0) countValue = 0;

  // ----------------------------------------------------
  // ★★★ データの矛盾チェック（アテンションチェックの一部） ★★★
  // ----------------------------------------------------
  // 矛盾の定義: Yesと答えたが、描画データがない（points配列の長さが0）
  const isContradictory = (instrumentYesNo === "yes") && (points.length === 0);

  if (isContradictory) {
    // 矛盾が検出された場合、サーバーへの送信を試みず即時終了
    console.error("❌ CRITICAL ERROR: Attention Check Failed - Yes but No Drawing.");
    
    // UIを更新し、進行をブロック
    status.textContent = "CRITICAL ERROR: Instruction Check Failed. Experiment terminated.";
    alert("CRITICAL ERROR: You failed the instruction check (Answered 'Yes' but did not draw). Your submission is invalid.");
    
    // ★ error.html へリダイレクトさせ、報酬がないことを明確に伝える
    window.location.href = `error.html`; 
    
    return; // 関数を終了
  }
  // ----------------------------------------------------
  // ----------------------------------------------------
  // ★★★ データの矛盾チェック（新規追加） ★★★
  // ----------------------------------------------------
  // 矛盾の定義: Yes と答えたのに instrumentCount が 0
  const isCountContradictory = (instrumentYesNo === "yes") && (countValue === 0);

  if (isCountContradictory) {
    console.error("❌ CRITICAL ERROR: Attention Check Failed - Yes but Count = 0.");

    status.textContent = "CRITICAL ERROR: Instruction Check Failed. Experiment terminated.";
    alert("CRITICAL ERROR: You failed the instruction check (Answered 'Yes' but selected Count = 0). Your submission is invalid.");

    window.location.href = `error.html`;

    return;
  }
  // ----------------------------------------------------

  
  const data = {
    video: shuffledVideos[currentIndex],
    rating: ratingEl.value,
    points: getSampledPoints(points),
    penNum: parseInt(penColorSelect.value),
    expectedPen: attentionColorOrder[currentIndex],
    instrumentYesNo: instrumentYesNo,
    instrumentCount: countValue
  };

  const filename = `${participantId}_${shuffledVideos[currentIndex]}.json`;

  try {
    const res = await fetch("/.netlify/functions/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, filename, data })
    });

    if (!res.ok) throw new Error(await res.text());
    console.log("✅ データ送信成功:", data);

    status.textContent = "Data saved successfully!";

    // 保存完了後に次の動画へ
    currentIndex++;
    points = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentIndex >= shuffledVideos.length) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      window.location.href = "end.html"; // 最終ページへ
      return;
    }

    // 次の試行へ
    window.scrollTo({ top: 0, behavior: "smooth" }); 
    videoEl.src = shuffledVideos[currentIndex];
    videoEl.load();
    playBtn.disabled = false;
    ratingEl.value = 4;
    ratingValue.textContent = 4;
    penColorSelect.value = 1;
    instrumentYesEl.checked = true;
    instrumentCountEl.disabled = false;
    instrumentCountEl.value = 0;

    const expected = attentionColorOrder[currentIndex];
    expectedColorText.textContent = `${expected.num}. ${expected.name}`;

    status.textContent = "";
    nextBtn.disabled = false;

  } catch (err) {
    console.error("❌ 保存エラー:", err);
    status.textContent = "Error saving data. Please contact the researcher.";
    // 致命的なサーバーエラーの場合も、実験終了ではなく研究者への連絡を促す
    nextBtn.disabled = true; // サーバーエラー時はボタンを無効化
  }
});

// --- 初期設定 ---
function initializeTrial() {
    videoEl.src = shuffledVideos[0];
    videoEl.load();
    const initialExpected = attentionColorOrder[0];
    expectedColorText.textContent = `${initialExpected.num}. ${initialExpected.name}`;
    instrumentYesEl.checked = true;
    instrumentCountEl.disabled = false;
    instrumentCountEl.value = 0;
}

window.onload = initializeTrial;