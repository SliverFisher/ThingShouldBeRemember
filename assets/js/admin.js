const PASSWORD = "6324";
const API_BASE = location.port === "5174" ? "" : "http://127.0.0.1:5174";
let techs = JSON.parse(JSON.stringify(window.TECHNICIANS || []));
let selectedNumber = techs[0]?.number || "";

const els = {
  lockScreen: document.getElementById("lockScreen"),
  adminApp: document.getElementById("adminApp"),
  password: document.getElementById("passwordInput"),
  unlock: document.getElementById("unlockBtn"),
  lockError: document.getElementById("lockError"),
  saveTop: document.getElementById("saveTop"),
  saveCurrent: document.getElementById("saveCurrent"),
  addTech: document.getElementById("addTech"),
  deleteTech: document.getElementById("deleteTech"),
  resourceInput: document.getElementById("resourceInput"),
  searchInput: document.getElementById("searchInput"),
  saveStatus: document.getElementById("saveStatus"),
  toast: document.getElementById("toast"),
  techList: document.getElementById("techList"),
  techSelect: document.getElementById("techSelect"),
  editorTechSelect: document.getElementById("editorTechSelect"),
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

function setStatus(message) {
  els.saveStatus.textContent = message;
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    els.toast.hidden = true;
  }, 2200);
}

function renderSelect() {
  const selects = [els.techSelect, els.editorTechSelect].filter(Boolean);
  selects.forEach((select) => {
    select.innerHTML = "";
  });
  techs.forEach((tech) => {
    selects.forEach((select) => {
      const option = document.createElement("option");
      option.value = tech.number;
      option.textContent = tech.number + "（" + (tech.media?.length || 0) + " 资源）";
      option.selected = tech.number === selectedNumber;
      select.appendChild(option);
    });
  });
}

function renderList() {
  sortTechs();
  els.countText.textContent = techs.length + " 位";
  renderSelect();
  const q = els.searchInput.value.trim();
  els.techList.innerHTML = "";
  techs.filter((tech) => !q || tech.number.includes(q)).forEach((tech) => {
    const option = document.createElement("option");
    option.value = tech.number;
    option.textContent = tech.number + "    " + (tech.media?.length || 0) + " 资源";
    option.selected = tech.number === selectedNumber;
    els.techList.appendChild(option);
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
    tech.media.forEach((media) => {
      media.title = media.title.replace(oldNumber, newNumber);
      media.src = media.src.replace(`assets/media/${oldNumber}/`, `assets/media/${newNumber}/`);
    });
    if (tech.avatar) tech.avatar = tech.avatar.replace(`assets/media/${oldNumber}/`, `assets/media/${newNumber}/`);
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

async function renderCover() {
  const tech = currentTech();
  els.coverPreview.innerHTML = "";
  if (!tech?.avatar) {
    els.coverPreview.textContent = "暂无封面";
    return;
  }
  const media = tech.media.find((item) => item.src === tech.avatar);
  const el = document.createElement(media?.type === "video" ? "video" : "img");
  el.src = tech.avatar;
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
    const preview = document.createElement(media.type === "video" ? "video" : "img");
    preview.src = media.src;
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
      setStatus("封面已修改，记得保存");
      renderAll();
    });
    const remove = document.createElement("button");
    remove.className = "btn danger";
    remove.type = "button";
    remove.textContent = "移出页面";
    remove.addEventListener("click", () => {
      tech.media = tech.media.filter((item) => item !== media);
      if (tech.avatar === media.src) tech.avatar = tech.media.find((item) => item.type === "image")?.src || tech.media[0]?.src || "";
      setStatus("资源已移出页面，记得保存");
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

function dataJsText() {
  syncForm();
  sortTechs();
  return "window.TECHNICIANS = " + JSON.stringify(techs, null, 2) + ";\n";
}

async function saveAll() {
  try {
    const res = await fetch(API_BASE + "/api/save-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: dataJsText() })
    });
    if (!res.ok) throw new Error(await res.text());
    setStatus("已保存到本地 data.js");
    showToast("保存成功，已写入本地 data.js");
    renderAll();
  } catch (error) {
    alert("保存失败：写入接口没连上或 5174 端口被占用。\\n" + error.message);
  }
}

function nextFileName(tech, file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  const prefix = file.type.startsWith("video/") ? "video" : "photo";
  let index = 1;
  const names = new Set(tech.media.map((item) => item.src.split("/").pop()));
  while (names.has(`${prefix}-${index}${ext}`)) index += 1;
  return `${prefix}-${index}${ext}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function addResources(event) {
  const tech = currentTech();
  if (!tech) return;
  for (const file of event.target.files) {
    const name = nextFileName(tech, file);
    const type = file.type.startsWith("video/") ? "video" : "image";
    const dataUrl = await fileToDataUrl(file);
    const res = await fetch(API_BASE + "/api/upload-resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: tech.number, fileName: name, dataUrl })
    });
    if (!res.ok) {
      alert("上传失败：" + await res.text());
      continue;
    }
    const result = await res.json();
    tech.media.push({ type, title: `${tech.number} ${type === "video" ? "视频" : "照片"} ${tech.media.length + 1}`, src: result.src });
    if (!tech.avatar && type === "image") tech.avatar = result.src;
  }
  event.target.value = "";
  setStatus("资源已写入本地，记得保存 data.js");
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
  setStatus("已新增，填写资料后保存");
  renderAll();
}

function deleteTech() {
  const tech = currentTech();
  if (!tech) return;
  if (!confirm("只从页面数据移除此技师，不删除资源文件夹。确定继续？")) return;
  techs = techs.filter((item) => item !== tech);
  selectedNumber = techs[0]?.number || "";
  setStatus("已移出页面，记得保存");
  renderAll();
}

els.unlock.addEventListener("click", unlock);
els.password.addEventListener("keydown", (event) => {
  if (event.key === "Enter") unlock();
});
els.password.addEventListener("input", () => {
  if (normalizePassword(els.password.value) === PASSWORD) unlock();
});
[els.number, els.category, els.appearance, els.figure, els.cup, els.scale, els.age, els.singing, els.comment].forEach((el) => {
  el.addEventListener("input", () => {
    syncForm();
    setStatus("有未保存修改");
  });
});
els.searchInput.addEventListener("input", renderList);
els.techList.addEventListener("change", () => {
  syncForm();
  selectedNumber = els.techList.value;
  renderAll();
});
els.techSelect.addEventListener("change", () => {
  syncForm();
  selectedNumber = els.techSelect.value;
  renderAll();
});
els.editorTechSelect.addEventListener("change", () => {
  syncForm();
  selectedNumber = els.editorTechSelect.value;
  renderAll();
});
els.saveTop.addEventListener("click", saveAll);
els.saveCurrent.addEventListener("click", saveAll);
els.addTech.addEventListener("click", addTech);
els.deleteTech.addEventListener("click", deleteTech);
els.resourceInput.addEventListener("change", addResources);

renderAll();
