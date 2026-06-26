const techs = window.TECHNICIANS || [];

const grid = document.getElementById("techGrid");
const summary = document.getElementById("summary");
const detail = document.getElementById("detail");
const viewer = document.getElementById("viewer");
const gallery = document.getElementById("gallery");
const viewerBody = document.getElementById("viewerBody");
const viewerTitle = document.getElementById("viewerTitle");

summary.textContent = "共 " + techs.length + " 位技师";

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function openViewer(media) {
  viewerTitle.textContent = media.title || "查看";
  viewerBody.innerHTML = "";

  if (media.type === "video") {
    const video = document.createElement("video");
    video.src = media.src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    viewerBody.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = media.src;
    img.alt = media.title || "照片";
    viewerBody.appendChild(img);
  }

  viewer.showModal();
}

function openDetail(tech) {
  document.getElementById("detailNumber").textContent = tech.number;
  document.getElementById("detailNote").textContent = "共 " + tech.media.length + " 个资源";
  gallery.innerHTML = "";

  tech.media.forEach((media) => {
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
    item.addEventListener("click", () => openViewer(media));
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
  info.appendChild(makeEl("div", "number", tech.number));
  info.appendChild(makeEl("div", "meta", "共 " + tech.media.length + " 个资源"));

  card.append(avatar, info);
  grid.appendChild(card);
});

document.getElementById("closeDetail").addEventListener("click", () => detail.close());
document.getElementById("closeViewer").addEventListener("click", () => {
  viewer.close();
  viewerBody.innerHTML = "";
});
