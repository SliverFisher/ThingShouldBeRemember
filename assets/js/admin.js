const PASSWORD = "6324";
let techs = JSON.parse(JSON.stringify(window.TECHNICIANS || []));
let selectedNumber = techs[0]?.number || "";
let rootHandle = null;
let mediaDirHandle = null;
const objectUrls = new Map();

const els = {
  lockScreen: document.getElementById("lockScreen"),
  adminApp: document.getElementById("adminApp"),
  password: document.getElementById("passwordInput"),
  unlock: document.getElementById("unlockBtn"),
  lockError: document.getElementById("lockError"),
  chooseFolder: document.getElementById("chooseFolder"),
  saveAll: document.getElementById("saveAll"),
  addTech: document.getElementById("addTech"),
  deleteTech: document.getElementById("deleteTech"),
  resourceInput: document.getElementById("resourceInput"),
  searchInput: document.getElementById("searchInput"),
  folderStatus: document.getElementById("folderStatus"),
  techList: document.getElementById("techList"),
  countText: document.getElementById("countText"),
  editorTitle: document.getElementById("editorTitle"),
  editorSub: document.getElementById("editorSub"),
  coverPreview: document.getElementById("coverPreview"),
  mediaGrid: document.getElementById("mediaGrid"),
  number: document.getElementById("numberInput"),
  category: document.getElementById("categoryInput"),
  appearance: document.getElementById("appearanceInput"),
  figure: document.getElementById("figureInput"),
  cup: document.getElementById("cupInput"),
  scale: document.getElementById("scaleInput"),
  age: document.getElementById("ageInput"),
  singing: document.getElementById("singingInput"),
  comment: document.getElementById("commentInput")
};

function normalizePassword(value) {
  return String(value || "").replace(/[０-９]/g, (ch) => String(ch.charCodeAt(0) - 0xff10)).replace(/\s+/g, "");
}

function showAdmin() {
  els.lockScreen.hidden = true;
  els.lockScreen.style.display = "none";
  els.adminApp.hidden = false;
  els.adminApp.removeAttribute("hidden");
  els.adminApp.style.display = "block";
  renderAll();
}

function unlock() {
  if (normalizePassword(els.password.value) !== PASSWORD) {
    els.lockError.textContent = "密码不正确";
    return;
  }
  showAdmin();
}

window.massageAdminUnlock = unlock;

function sortTechs() {
  techs.sort((a, b) => Number(a.number) - Number(b.number));
}

function currentTech() {
  return techs.find((tech) => tech.number === selectedNumber);
}

function ensureInfo(tech) {
  tech.info ||= { number: tech.number, scores: {}, comment: "" };
  tech.info.number = tech.number;
  tech.info.scores ||= {};
  for (const key of ["appearance", "figure", "cup", "scale", "age", "singing"]) tech.info.scores[key] ||= "";
  tech.media ||= [];
}

function renderList() {
  sortTechs();
  els.countText.textContent = techs.length + " 位";
  const q = els.searchInput.value.trim();
  els.techList.innerHTML = "";
  techs.filter((tech) => !q || tech.number.includes(q)).forEach((tech) => {
    const row = document.createElement("button");
    row.className = "tech-row" + (tech.number === selectedNumber ? " active" : "");
    row.type = "button";
    row.innerHTML = `<strong>${tech.number}</strong><small>${tech.media?.length || 0} 资源</small>`;
    row.addEventListener("click", () => {
      syncForm();
      selectedNumber = tech.number;
      renderAll();
    });
    els.techList.appendChild(row);
  });
}

function fillForm() {
  const tech = currentTech();
  if (!tech) return;
  ensureInfo(tech);
  const scores = tech.info.scores;
  els.editorTitle.textContent = "编辑 " + tech.number;
  els.editorSub.textContent = (tech.media?.length || 0) + " 个资源";
  els.number.value = tech.number;
  els.category.value = tech.category || "";
  els.appearance.value = scores.appearance || "";
  els.figure.value = scores.figure || "";
  els.cup.value = scores.cup || "";
  els.scale.value = scores.scale || "";
  els.age.value = scores.age || "";
  els.singing.value = scores.singing || "";
  els.comment.value = tech.info.comment || "";
}

function syncForm() {
  const tech = currentTech();
  if (!tech) return;
  ensureInfo(tech);
  const rawNumber = els.number.value.trim();
  const newNumber = rawNumber ? rawNumber.padStart(3, "0") : tech.number;
  if (newNumber !== tech.number && !techs.some((item) => item.number === newNumber)) {
    const oldNumber = tech.number;
    tech.number = newNumber;
    tech.info.number = newNumber;
    tech.media.forEach((media) => media.title = media.title.replace(oldNumber, newNumber));
    selectedNumber = newNumber;
  }
  tech.category = els.category.value.trim();
  tech.info.scores.appearance = els.appearance.value.trim();
  tech.info.scores.figure = els.figure.value.trim();
  tech.info.scores.cup = els.cup.value.trim();
  tech.info.scores.scale = els.scale.value.trim();
  tech.info.scores.age = els.age.value.trim();
  tech.info.scores.singing = els.singing.value.trim();
  tech.info.comment = els.comment.value.trim();
}

async function mediaPreview(src) {
  if (!rootHandle || !src.startsWith("assets/media/")) return src;
  if (objectUrls.has(src)) return objectUrls.get(src);
  const parts = src.split("/").slice(2);
  let handle = mediaDirHandle;
  for (let i = 0; i < parts.length - 1; i++) handle = await handle.getDirectoryHandle(parts[i]);
  const file = await (await handle.getFileHandle(parts.at(-1))).getFile();
  const url = URL.createObjectURL(file);
  objectUrls.set(src, url);
  return url;
}

async function renderCover() {
  const tech = currentTech();
  els.coverPreview.innerHTML = "";
  if (!tech?.avatar) {
    els.coverPreview.textContent = "暂无封面";
    return;
  }
  const media = tech.media.find((item) => item.src === tech.avatar);
  const src = await mediaPreview(tech.avatar);
  const el = document.createElement(media?.type === "video" ? "video" : "img");
  el.src = src;
  if (media?.type === "video") el.controls = true;
  els.coverPreview.appendChild(el);
}

async function renderMedia() {
  const tech = currentTech();
  els.mediaGrid.innerHTML = "";
  if (!tech) return;
  for (const media of tech.media || []) {
    const card = document.createElement("div");
    card.className = "media-card";
    const src = await mediaPreview(media.src);
    const preview = document.createElement(media.type === "video" ? "video" : "img");
    preview.src = src;
    if (media.type === "video") preview.controls = true;
    card.appendChild(preview);

    const body = document.createElement("div");
    body.className = "media-card-body";
    const name = document.createElement("div");
    name.className = "media-card-name";
    name.textContent = media.src;
    const actions = document.createElement("div");
    actions.className = "media-card-actions";
    const cover = document.createElement("button");
    cover.className = "btn";
    cover.type = "button";
    cover.textContent = tech.avatar === media.src ? "当前封面" : "设为封面";
    cover.addEventListener("click", () => {
      tech.avatar = media.src;
      renderAll();
    });
    const remove = document.createElement("button");
    remove.className = "btn danger";
    remove.type = "button";
    remove.textContent = "移出页面";
    remove.addEventListener("click", () => {
      tech.media = tech.media.filter((item) => item !== media);
      if (tech.avatar === media.src) tech.avatar = tech.media.find((item) => item.type === "image")?.src || tech.media[0]?.src || "";
      renderAll();
    });
    actions.append(cover, remove);
    if (tech.avatar === media.src) body.appendChild(Object.assign(document.createElement("div"), { className: "cover-badge", textContent: "封面" }));
    body.append(name, actions);
    card.appendChild(body);
    els.mediaGrid.appendChild(card);
  }
}

function renderAll() {
  renderList();
  fillForm();
  renderCover();
  renderMedia();
}

async function chooseFolder() {
  if (!window.showDirectoryPicker) {
    alert("当前浏览器不支持写入本地文件夹。请用新版 Chrome 或 Edge 打开 admin.html。");
    return;
  }
  rootHandle = await window.showDirectoryPicker({ mode: "readwrite" });
  mediaDirHandle = await (await rootHandle.getDirectoryHandle("assets")).getDirectoryHandle("media");
  els.folderStatus.textContent = "已选择：" + rootHandle.name;
  renderAll();
}

function dataJsText() {
  syncForm();
  sortTechs();
  return "window.TECHNICIANS = " + JSON.stringify(techs, null, 2) + ";\n";
}

async function saveAll() {
  if (!rootHandle) {
    alert("请先选择项目文件夹。");
    return;
  }
  const handle = await rootHandle.getFileHandle("data.js", { create: true });
  const writable = await handle.createWritable();
  await writable.write(dataJsText());
  await writable.close();
  alert("已保存 data.js");
  renderAll();
}

function nextFileName(tech, file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  const prefix = file.type.startsWith("video/") ? "video" : "photo";
  let index = 1;
  const names = new Set(tech.media.map((item) => item.src.split("/").pop()));
  while (names.has(`${prefix}-${index}${ext}`)) index += 1;
  return `${prefix}-${index}${ext}`;
}

async function addResources(event) {
  const tech = currentTech();
  if (!tech) return;
  if (!rootHandle || !mediaDirHandle) {
    alert("请先选择项目文件夹。");
    event.target.value = "";
    return;
  }
  const dir = await mediaDirHandle.getDirectoryHandle(tech.number, { create: true });
  for (const file of event.target.files) {
    const name = nextFileName(tech, file);
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(file);
    await writable.close();
    const type = file.type.startsWith("video/") ? "video" : "image";
    const src = `assets/media/${tech.number}/${name}`;
    tech.media.push({ type, title: `${tech.number} ${type === "video" ? "视频" : "照片"} ${tech.media.length + 1}`, src });
    if (!tech.avatar && type === "image") tech.avatar = src;
  }
  event.target.value = "";
  renderAll();
}

function addTech() {
  syncForm();
  let base = "001";
  while (techs.some((tech) => tech.number === base)) base = String(Number(base) + 1).padStart(3, "0");
  techs.push({
    number: base,
    category: "",
    note: "",
    avatar: "",
    media: [],
    info: { number: base, scores: { appearance: "", figure: "", cup: "", scale: "", age: "", singing: "" }, comment: "" }
  });
  selectedNumber = base;
  renderAll();
}

function deleteTech() {
  const tech = currentTech();
  if (!tech) return;
  if (!confirm("只从页面数据移除此技师，不删除资源文件夹。确定继续？")) return;
  techs = techs.filter((item) => item !== tech);
  selectedNumber = techs[0]?.number || "";
  renderAll();
}

els.unlock.addEventListener("click", unlock);
els.password.addEventListener("keydown", (event) => {
  if (event.key === "Enter") unlock();
});
[els.number, els.category, els.appearance, els.figure, els.cup, els.scale, els.age, els.singing, els.comment].forEach((el) => el.addEventListener("input", syncForm));
els.searchInput.addEventListener("input", renderList);
els.chooseFolder.addEventListener("click", chooseFolder);
els.saveAll.addEventListener("click", saveAll);
els.addTech.addEventListener("click", addTech);
els.deleteTech.addEventListener("click", deleteTech);
els.resourceInput.addEventListener("change", addResources);

if (!els.adminApp.hidden) renderAll();

els.password.addEventListener("input", () => {
  if (normalizePassword(els.password.value) === PASSWORD) unlock();
});
