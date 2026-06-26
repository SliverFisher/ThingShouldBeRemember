const techs = window.TECHNICIANS || [];

const grid = document.getElementById("techGrid");
const summary = document.getElementById("summary");
const detail = document.getElementById("detail");
const viewer = document.getElementById("viewer");
const gallery = document.getElementById("gallery");
const viewerBody = document.getElementById("viewerBody");
const viewerTitle = document.getElementById("viewerTitle");
const detailNumber = document.getElementById("detailNumber");
const detailNote = document.getElementById("detailNote");
const detailInfo = document.getElementById("detailInfo");

let activeMedia = [];
let activeMediaIndex = 0;

summary.textContent = "共 " + techs.length + " 位";

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null && text !== "") el.textContent = text;
  return el;
}

function scoresOf(tech) {
  return tech.info?.scores || {};
}

function singingOf(scores) {
  return scores.singing || scores.voice || scores.vocal || scores.song || "";
}

function infoItems(tech) {
  const scores = scoresOf(tech);
  return [
    ["颜值", scores.appearance || "-"],
    ["身材", scores.figure || "-"],
    ["罩杯", scores.cup || "-"],
    ["尺度", scores.scale || "-"],
    ["年龄", scores.age || "-"],
    ["歌声", singingOf(scores) || "-"]
  ];
}

function shortLine(tech) {
  const scores = scoresOf(tech);
  return [
    scores.appearance && "颜值 " + scores.appearance,
    scores.figure && "身材 " + scores.figure,
    scores.scale && "尺度 " + scores.scale
  ].filter(Boolean).join(" · ");
}

function renderViewerMedia() {
  const media = activeMedia[activeMediaIndex];
  if (!media) return;
  viewerTitle.textContent = media.title || "查看";
  viewerBody.innerHTML = "";

  const stage = makeEl("div", "viewer-stage");
  const prev = makeEl("button", "viewer-nav viewer-prev", "‹");
  const next = makeEl("button", "viewer-nav viewer-next", "›");
  const content = makeEl("div", "viewer-content");
  prev.type = "button";
  next.type = "button";
  prev.setAttribute("aria-label", "上一个");
  next.setAttribute("aria-label", "下一个");

  if (media.type === "video") {
    const video = document.createElement("video");
    video.src = media.src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    content.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = media.src;
    img.alt = media.title || "照片";
    content.appendChild(img);
  }

  prev.disabled = activeMedia.length <= 1;
  next.disabled = activeMedia.length <= 1;
  prev.addEventListener("click", () => switchViewer(-1));
  next.addEventListener("click", () => switchViewer(1));
  stage.append(prev, content, next);
  viewerBody.appendChild(stage);
}

function openViewer(mediaList, index) {
  activeMedia = mediaList || [];
  activeMediaIndex = index || 0;
  renderViewerMedia();
  viewer.showModal();
}

function switchViewer(delta) {
  if (activeMedia.length <= 1) return;
  activeMediaIndex = (activeMediaIndex + delta + activeMedia.length) % activeMedia.length;
  renderViewerMedia();
}

function renderDetailNote(tech) {
  detailInfo.innerHTML = "";
  const comment = tech.info?.comment || "";
  if (!comment) return;
  const box = makeEl("section", "comment-box");
  box.appendChild(makeEl("div", "comment-title", "备注"));
  box.appendChild(makeEl("div", "comment-text", comment));
  detailInfo.appendChild(box);
}

function openDetail(tech) {
  detailNumber.textContent = tech.number;
  detailNote.textContent = "共 " + tech.media.length + " 个资源";
  gallery.innerHTML = "";
  renderDetailNote(tech);

  tech.media.forEach((media, index) => {
    const item = makeEl("button", "media");
    item.type = "button";
    if (media.type === "video") {
      const video = document.createElement("video");
      video.src = media.src;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      item.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = media.src;
      img.alt = media.title || "照片";
      item.appendChild(img);
    }
    item.appendChild(makeEl("div", "media-caption", media.title || "资源"));
    item.addEventListener("click", () => openViewer(tech.media, index));
    gallery.appendChild(item);
  });
  detail.showModal();
}

techs.forEach((tech) => {
  const card = makeEl("button", "card");
  card.type = "button";
  card.addEventListener("click", () => openDetail(tech));

  const avatar = makeEl("div", "avatar");
  const img = document.createElement("img");
  img.src = tech.avatar;
  img.alt = "技师 " + tech.number + " 头像";
  avatar.appendChild(img);

  const info = makeEl("div", "card-info");
  const head = makeEl("div", "card-head");
  head.appendChild(makeEl("div", "number", tech.number));
  if (tech.category) head.appendChild(makeEl("div", "tag", tech.category));
  info.appendChild(head);

  const line = shortLine(tech);
  if (line) info.appendChild(makeEl("div", "meta", line));

  const facts = makeEl("div", "facts");
  infoItems(tech).forEach(([label, value]) => {
    const item = makeEl("div", "fact");
    item.appendChild(makeEl("span", "fact-label", label));
    item.appendChild(makeEl("strong", "fact-value", value));
    facts.appendChild(item);
  });
  if (facts.children.length) {
    info.appendChild(facts);
  } else {
    info.appendChild(makeEl("div", "meta", "资料待补"));
  }

  card.append(avatar, info);
  grid.appendChild(card);
});

document.getElementById("closeDetail").addEventListener("click", () => detail.close());
document.getElementById("closeViewer").addEventListener("click", () => {
  viewer.close();
  viewerBody.innerHTML = "";
  activeMedia = [];
  activeMediaIndex = 0;
});

detail.addEventListener("click", (event) => {
  if (event.target === detail) detail.close();
});

viewer.addEventListener("click", (event) => {
  if (event.target !== viewer) return;
  viewer.close();
  viewerBody.innerHTML = "";
  activeMedia = [];
  activeMediaIndex = 0;
});

document.addEventListener("keydown", (event) => {
  if (!viewer.open) return;
  if (event.key === "ArrowLeft") switchViewer(-1);
  if (event.key === "ArrowRight") switchViewer(1);
});
