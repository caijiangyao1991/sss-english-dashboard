const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const netdiskBase = "https://pan.baidu.com/s/1WbFWTcVA1rKsO_QnmR1erQ";
const netdiskSurl = "WbFWTcVA1rKsO_QnmR1erQ";
const netdiskCode = "7bem";
const sssNetdisk = (folder) => ({ link: `${netdiskBase}?pwd=${netdiskCode}#list/path=${encodeURIComponent(`/我的资源/小糍粑资料/sss儿歌/${folder}`)}`, code: netdiskCode });
const netdiskFileIds = {
  1: "480898532590471", 2: "326182912954260", 3: "671951900054927", 4: "1038528746088758",
  5: "985858145498788", 8: "130021507687595", 9: "798661563784283", 10: "734203251911417",
  11: "359508055581896", 12: "67017818405518", 13: "535989135989604", 15: "652376479987496",
  16: "730580723356795", 17: "1112884598520857", 18: "876534290846817", 20: "354140135246272",
  22: "34163348726285", 23: "853424066411974", 24: "522730039550731", 25: "79640314951908",
  26: "30086539411587", 27: "681860785147989", 29: "697189525553563", 30: "45247313370152",
  31: "1061017857854670", 32: "1108714937774966", 33: "261329902375109", 34: "25331026988136"
};
const sssFileNetdisk = (day) => ({ link: `https://pan.baidu.com/pfile/shareVideoNew?surl=${netdiskSurl}&fid=${netdiskFileIds[day]}&pwd=${netdiskCode}`, code: netdiskCode });
const netdiskSelections = {
  1: ["DAY01 儿歌视频 Head Shoulders Knees & Toes", "Head Shoulders Knees & Toes (Sing It) 英文软字幕.mp4"],
  2: ["DAY02 绘本视频 Where Is Baby's Belly Button", "平铺绘本讲Where Is Baby's Belly Button.mp4"],
  3: ["DAY03 儿歌视频 One Little Finger", "One Little Finger - Noodle & Pals 英文软字幕.mp4"],
  4: ["DAY04 绘本视频 Go Away Big Green Monster", "Go Away Big Green Monster Song - Sing Along Book - Electronic ver.mp4"],
  5: ["DAY05 儿歌视频 Me！", "Me! - Noodle & Pals 英文软字幕.mp4"],
  8: ["DAY08 儿歌视频 Walking Walking", "Walking Walking - Noodle & Pals 英文软字幕.mp4"],
  9: ["DAY09 绘本视频 From Head to Toe", "From Head to Toe by Eric Carle New Song 2025.mp4"],
  10: ["DAY10 儿歌视频 Follow Me", "Follow Me - Noodle & Pals 英文软字幕.mp4"],
  11: ["DAY11 绘本视频和音频 Silly Sally", "Silly Sally by Audrey Wood - read aloud.mp4"],
  12: ["DAY12 儿歌视频 Move", "Move! - The Roundabouts 英文软字幕.mp4"],
  13: ["DAY13 拓展动画", "Sports Day - Peppa Pig.mp4"],
  15: ["DAY15 If You're Happy……", "If You’re Happy - Noodle & Pals 英文软字幕.mp4"],
  16: ["DAY16 How Do YOU Feel", "How Do YOU Feel by Anthony Browne - read aloud.mp4"],
  17: ["DAY17 This Is A Happy Face", "This Is A Happy Face - Noodle & Pals 英文软字幕.mp4"],
  18: ["DAY18 The Feelings Book", "THE FEELINGS BOOK by Todd Parr - Story Time Pals read to children.mp4"],
  20: ["DAY20 STEAM拓展视频", "Lava Lamp Experiment (Chemistry)  - BeardedScienceGuy 英文软字幕.mp4"],
  22: ["DAY22 Baby Shark", "Baby Shark - Finny The Shark 英文软字幕.mp4"],
  23: ["DAY23 Me And My Family Tree", "Me and My Family Tree - Read Along - Teacher Wendy.mp4"],
  24: ["DAY24 Skidamarink", "Skidamarink 英文软字幕.mp4"],
  25: ["DAY25 Guess How Much I Love You", "Guess How Much I Love You - Animated.mp4"],
  26: ["DAY26 The People In My Family", "The People In My Family - Toodly Doodly 英文软字幕.mp4"],
  27: ["DAY27 拓展视频", "The Family Book by Todd Parr - Center for eLearning  FSCJ 英文软字幕.mp4"],
  29: ["DAY29 This The Way", "This Is The Way - Noodle & Pals 英文软字幕.mp4"],
  30: ["DAY30 Olivia", "Olivia by Ian Falconer - Venie Henny.mp4"],
  31: ["DAY31 I Like You", "I Like You - Milo's Monster School Vlog 英文软字幕.mp4"],
  32: ["DAY32 Things I Like", "Things I Like - Read Aloud - Winmer English Library.mp4"],
  33: ["DAY33 Brush Your Teeth", "Brush Your Teeth - Finny The Shark 英文软字幕.mp4"],
  34: ["DAY34 STEAM视频", "Why It's Important To Brush Your Teeth - Caitie 英文软字幕.mp4"]
};
const localPlaybackEnabled = false;
const localVideos = Object.fromEntries(Object.keys(netdiskSelections).map((day) => [day, `assets/videos/day${String(day).padStart(2, "0")}.mp4`]));
const thumbnails = Object.fromEntries(Object.keys(netdiskSelections).map((day) => [day, `assets/thumbs/day${String(day).padStart(2, "0")}.jpg`]));

const state = {
  selectedMood: "😊",
  currentBookPage: 0,
  currentWeek: 1,
  currentDay: 1,
  filter: "all",
  resources: [
    { id: "day-1", ...sssNetdisk("DAY01 儿歌视频 Head Shoulders Knees & Toes"), type: "song", title: "Head Shoulders Knees & Toes", desc: "百度网盘 DAY01 儿歌，先完整听一遍，再跟着节奏做动作。", icon: "🎵", day: 1 },
    { id: "day-2", ...sssNetdisk("DAY02 绘本视频 Where Is Baby's Belly Button"), type: "book", title: "Where Is Baby's Belly Button", desc: "DAY02 主题绘本，按宝宝兴趣打开共读。", icon: "📚", day: 2 },
    { id: "day-3", ...sssNetdisk("DAY03 儿歌视频 One Little Finger"), type: "song", title: "One Little Finger", desc: "百度网盘 DAY03 儿歌，边唱边做手指动作。", icon: "🎵", day: 3 },
    { id: "day-4", ...sssNetdisk("DAY04 绘本视频 Go Away Big Green Monster"), type: "book", title: "Go Away Big Green Monster", desc: "DAY04 主题绘本，跟着画面一起读。", icon: "📚", day: 4 },
    { id: "day-5", ...sssNetdisk("DAY05 儿歌视频 Me！"), type: "song", title: "Me!", desc: "百度网盘 DAY05 儿歌，轻松认识自己。", icon: "🎵", day: 5 },
    { id: "day-8", ...sssNetdisk("DAY08 儿歌视频 Walking Walking"), type: "song", title: "Walking Walking", desc: "百度网盘 DAY08 儿歌，配合走、停、跳动作。", icon: "🎵", day: 8 },
    { id: "day-9", ...sssNetdisk("DAY09 绘本视频 From Head to Toe"), type: "book", title: "From Head to Toe", desc: "DAY09 主题绘本，跟着动物一起动起来。", icon: "📚", day: 9 },
    { id: "day-10", ...sssNetdisk("DAY10 儿歌视频 Follow Me"), type: "song", title: "Follow Me", desc: "百度网盘 DAY10 儿歌，跟着节奏一起走。", icon: "🎵", day: 10 },
    { id: "day-11", ...sssNetdisk("DAY11 绘本视频和音频 Silly Sally"), type: "book", title: "Silly Sally", desc: "DAY11 绘本和音频，适合亲子共读。", icon: "📚", day: 11 },
    { id: "day-12", ...sssNetdisk("DAY12 儿歌视频 Move"), type: "song", title: "Move", desc: "百度网盘 DAY12 儿歌，边听边活动身体。", icon: "🎵", day: 12 },
    { id: "day-13-a", ...sssNetdisk("DAY13 STEAM拓展视频"), type: "book", title: "STEAM 拓展视频", desc: "DAY13 拓展内容，亲子一起探索。", icon: "📚", day: 13 },
    { id: "day-13-b", ...sssNetdisk("DAY13 拓展动画"), type: "book", title: "拓展动画", desc: "DAY13 拓展动画，按兴趣观看。", icon: "📚", day: 13 },
    { id: "day-15", ...sssNetdisk("DAY15 If You're Happy……"), type: "song", title: "If You're Happy", desc: "百度网盘 DAY15 儿歌，唱出开心的动作。", icon: "🎵", day: 15 },
    { id: "day-16", ...sssNetdisk("DAY16 How Do YOU Feel"), type: "book", title: "How Do YOU Feel", desc: "DAY16 情绪主题绘本，边读边认识不同心情。", icon: "📚", day: 16 },
    { id: "day-17", ...sssNetdisk("DAY17 This Is A Happy Face"), type: "song", title: "This Is A Happy Face", desc: "百度网盘 DAY17 儿歌，认识开心表情。", icon: "🎵", day: 17 },
    { id: "day-18", ...sssNetdisk("DAY18 The Feelings Book"), type: "book", title: "The Feelings Book", desc: "DAY18 情绪主题内容，和宝宝聊聊感受。", icon: "📚", day: 18 },
    { id: "day-20", ...sssNetdisk("DAY20 STEAM拓展视频"), type: "book", title: "STEAM 拓展视频", desc: "DAY20 拓展内容，亲子一起探索。", icon: "📚", day: 20 },
    { id: "day-22", ...sssNetdisk("DAY22 Baby Shark"), type: "song", title: "Baby Shark", desc: "百度网盘 DAY22 儿歌，跟着鲨鱼一家唱起来。", icon: "🎵", day: 22 },
    { id: "day-23", ...sssNetdisk("DAY23 Me And My Family Tree"), type: "book", title: "Me And My Family Tree", desc: "DAY23 家庭主题绘本，边读边认识家庭成员。", icon: "📚", day: 23 },
    { id: "day-24", ...sssNetdisk("DAY24 Skidamarink"), type: "song", title: "Skidamarink", desc: "百度网盘 DAY24 儿歌，温柔表达爱。", icon: "🎵", day: 24 },
    { id: "day-25", ...sssNetdisk("DAY25 Guess How Much I Love You"), type: "book", title: "Guess How Much I Love You", desc: "DAY25 亲子主题绘本，共读表达爱。", icon: "📚", day: 25 },
    { id: "day-26", ...sssNetdisk("DAY26 The People In My Family"), type: "song", title: "The People In My Family", desc: "百度网盘 DAY26 内容，认识家庭中的人。", icon: "🎵", day: 26 },
    { id: "day-27", ...sssNetdisk("DAY27 拓展视频"), type: "book", title: "拓展视频", desc: "DAY27 拓展内容，按兴趣观看。", icon: "📚", day: 27 },
    { id: "day-29", ...sssNetdisk("DAY29 This The Way"), type: "song", title: "This The Way", desc: "百度网盘 DAY29 儿歌，跟着生活动作一起唱。", icon: "🎵", day: 29 },
    { id: "day-30", ...sssNetdisk("DAY30 Olivia"), type: "song", title: "Olivia", desc: "百度网盘 DAY30 内容，轻松听故事。", icon: "🎵", day: 30 },
    { id: "day-31", ...sssNetdisk("DAY31 I Like You"), type: "song", title: "I Like You", desc: "百度网盘 DAY31 内容，练习表达喜欢。", icon: "🎵", day: 31 },
    { id: "day-32", ...sssNetdisk("DAY32 Things I Like"), type: "song", title: "Things I Like", desc: "百度网盘 DAY32 内容，说说喜欢的东西。", icon: "🎵", day: 32 },
    { id: "day-33", ...sssNetdisk("DAY33 Brush Your Teeth"), type: "song", title: "Brush Your Teeth", desc: "百度网盘 DAY33 儿歌，把刷牙唱进生活。", icon: "🎵", day: 33 },
    { id: "day-34", ...sssNetdisk("DAY34 STEAM视频"), type: "book", title: "STEAM 视频", desc: "DAY34 拓展内容，亲子一起探索。", icon: "📚", day: 34 }
  ],
  moments: JSON.parse(localStorage.getItem("sssMoments") || "[]")
};

const legacyMomentNotes = new Set([
  "听到 lamb 时，安安学着小羊咩咩叫了！",
  "第一次主动跟着说出 Good morning。",
  "特别喜欢 Five Little Ducks，连续听了三遍。"
]);
state.moments = state.moments.filter((moment) => !legacyMomentNotes.has(moment.note));

state.resources = state.resources.map((item) => {
  const selection = netdiskSelections[item.day];
  return selection ? { ...item, ...sssFileNetdisk(item.day), thumbnail: thumbnails[item.day] } : item;
});

const weekThemes = [
  { title: "我的身体", english: "My Body Parts", color: "coral" },
  { title: "动起来", english: "My Movements", color: "mint" },
  { title: "我的五感", english: "My Five Senses", color: "cyan" },
  { title: "我爱我家", english: "My Family", color: "blue" },
  { title: "我的一天", english: "My Daily Routines", color: "purple" },
  { title: "好吃的食物", english: "Yummy Food", color: "yellow" },
  { title: "动物王国", english: "Animals", color: "pink" },
  { title: "车轮转转", english: "Transportation", color: "coral" },
  { title: "天气和我", english: "Weather & Me", color: "mint" },
  { title: "神奇的形与色", english: "Shapes & Colors", color: "cyan" },
  { title: "比一比，数一数", english: "Opposites & Counting", color: "yellow" },
  { title: "小小故事家", english: "Story & Imagination", color: "purple" }
];
const totalPlanDays = 90;
const publishedThroughDay = Math.max(...state.resources.map((item) => item.day || 0));
const dayPhrases = {
  1: [["摸摸头", "Touch your head.", "摸摸你的头。"], ["拍拍肩膀", "Touch your shoulders.", "拍拍你的肩膀。"], ["找找脚趾", "Where are your toes?", "你的脚趾在哪里？"]],
  2: [["找找肚脐", "Where is your belly button?", "你的肚脐在哪里？"], ["找到了", "There it is!", "找到了！"], ["给妈妈看看", "Can you show me?", "给妈妈看看好吗？"]],
  3: [["动动小手指", "Move your little finger.", "动动你的小手指。"], ["指指鼻子", "Can you point to your nose?", "你能指指鼻子吗？"], ["我们再来一次", "Let's do it again.", "我们再来一次。"]],
  4: [["怪兽走开", "Go away, big green monster!", "大绿怪兽，走开！"], ["你看到眼睛了吗", "Can you see the eyes?", "你看到眼睛了吗？"], ["不用害怕", "Don't be scared.", "不用害怕。"]],
  5: [["这是我", "This is me.", "这是我。"], ["你是谁呀", "Who are you?", "你是谁呀？"], ["指指自己", "Can you point to yourself?", "你能指指自己吗？"]],
  8: [["一起走起来", "Let's go walking.", "我们一起走起来。"], ["停一下", "Let's stop for a moment.", "我们停一下。"], ["再走一走", "Let's keep walking.", "我们继续走吧。"]],
  9: [["你能做到吗", "Can you do it?", "你能做到吗？"], ["我能做到", "I can do it!", "我能做到！"], ["跟动物一起动", "Let's move like an animal.", "我们像动物一样动起来。"]],
  10: [["跟我来", "Follow me.", "跟我来。"], ["准备出发", "Come with me.", "和我一起出发。"], ["准备好了吗", "Are you ready?", "准备好了吗？"]],
  11: [["Silly Sally 出发啦", "Silly Sally went to town.", "Silly Sally 出发去城里啦。"], ["我们倒着走", "Let's walk backwards.", "我们倒着走吧。"], ["一起做个鬼脸", "Let's be silly together.", "我们一起做个鬼脸。"]],
  12: [["动动身体", "Move your body.", "动动你的身体。"], ["跳一跳", "Can you jump?", "你能跳一跳吗？"], ["转个圈", "Can you turn around?", "你能转个圈吗？"]],
  15: [["拍拍手", "Clap your hands.", "拍拍你的手。"], ["跺跺脚", "Stomp your feet.", "跺跺你的脚。"], ["开心喊出来", "Shout hooray!", "开心地喊出来！"]],
  16: [["问问心情", "How do you feel?", "你感觉怎么样？"], ["我很开心", "I feel happy.", "我感觉很开心。"], ["我有点难过", "I feel sad.", "我感觉有点难过。"]],
  17: [["做个笑脸", "Make a happy face.", "做一个开心的脸。"], ["笑一笑", "Can you smile?", "你能笑一笑吗？"], ["你今天开心吗", "Are you happy today?", "你今天开心吗？"]],
  18: [["你感觉怎么样", "How do you feel?", "你感觉怎么样？"], ["每种感觉都可以", "Every feeling is okay.", "每一种感觉都可以。"], ["告诉妈妈吧", "Tell me about it.", "告诉妈妈吧。"]],
  22: [["小鲨鱼来啦", "Baby shark is here!", "小鲨鱼来啦！"], ["我们一起游", "Let's swim together.", "我们一起游吧。"], ["跟着节奏唱", "Sing along with me.", "跟我一起唱。"]],
  23: [["这是我的家庭树", "This is my family tree.", "这是我的家庭树。"], ["这是我的妈妈", "This is my mom.", "这是我的妈妈。"], ["我们是一家人", "We are a family.", "我们是一家人。"]],
  24: [["我爱你", "I love you.", "我爱你。"], ["抱抱妈妈", "Give me a hug.", "抱抱妈妈。"], ["我们在一起", "You and me together.", "你和我在一起。"]],
  25: [["猜猜有多爱你", "Guess how much I love you.", "猜猜我有多爱你。"], ["爱这么多", "I love you this much.", "我爱你这么多。"], ["把手伸开", "Stretch your arms wide.", "把手臂伸开。"]],
  26: [["我的家人", "These are my family.", "这些是我的家人。"], ["我们一起唱", "Sing with me.", "和我一起唱。"], ["你家里有谁", "Who is in your family?", "你家里有谁？"]],
  29: [["就是这样做", "This is the way.", "就是这样做。"], ["和我一起做", "Do it with me.", "和我一起做。"], ["我们完成啦", "We are all done.", "我们完成啦。"]],
  33: [["该刷牙啦", "It's time to brush your teeth.", "该刷牙啦。"], ["上下刷一刷", "Brush up and down.", "上下刷一刷。"], ["刷得干干净净", "Brush them nice and clean.", "刷得干干净净。"]]
};

const typeLabels = { song: "SSS 儿歌", phrase: "当天口语", book: "主题绘本" };
const typeIcons = { song: "🎵", phrase: "💬", book: "📚" };

function getAvailableDays() {
  return [...new Set(state.resources.map((item) => item.day).filter(Boolean))].sort((left, right) => left - right);
}

function moveToAvailableDay(direction) {
  state.currentDay = Math.min(publishedThroughDay, Math.max(1, state.currentDay + direction));
  renderWorkspace();
  renderCalendar();
}

function formatToday() {
  const date = new Date();
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  $("#currentDate").textContent = `${date.getMonth() + 1}月${date.getDate()}日 · ${weekdays[date.getDay()]}`;
}

function switchView(viewName) {
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
  $$("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  $(".sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateTaskProgress() {
  const taskState = JSON.parse(localStorage.getItem("sssTasks") || "{}");
  $$('[data-task]').forEach((input) => {
    input.checked = Boolean(taskState[`${input.dataset.task}-day-${state.currentDay}`]);
  });
  $("#completedTasks").textContent = taskState[`song-day-${state.currentDay}`] ? 1 : 0;
  const completedWeekDays = Array.from({ length: totalPlanDays }, (_, index) => taskState[`day-${index + 1}`]).filter(Boolean).length;
  $("#weekCompleted").textContent = completedWeekDays;
  if ($("#planCompletedDays")) $("#planCompletedDays").textContent = completedWeekDays;
  $("#weekProgressBar").style.width = `${completedWeekDays / totalPlanDays * 100}%`;
  $("#sidebarWeekProgress").textContent = `${completedWeekDays} / ${totalPlanDays} 天`;
  const checkedIn = state.moments.some((moment) => Number(moment.day) === state.currentDay);
  $("#submitCheckin").disabled = checkedIn;
  $("#submitCheckin").innerHTML = checkedIn ? "今日已打卡 <span>✓</span>" : "完成今日打卡 <span>→</span>";
}

function bindTasks() {
  $$('[data-task]').forEach((input) => input.addEventListener("change", () => {
    const taskState = JSON.parse(localStorage.getItem("sssTasks") || "{}");
    taskState[`${input.dataset.task}-day-${state.currentDay}`] = input.checked;
    localStorage.setItem("sssTasks", JSON.stringify(taskState));
    renderWorkspace();
    updateTaskProgress();
  }));
}

function showToast(title = "打卡成功！", message = "今天的陪伴也很闪亮") {
  const toast = $("#toast");
  $("strong", toast).textContent = title;
  $("p", toast).textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function renderCalendar() {
  if (!$("#calendarGrid")) return;
  const taskState = JSON.parse(localStorage.getItem("sssTasks") || "{}");
  $("#calendarGrid").innerHTML = Array.from({ length: publishedThroughDay }, (_, index) => {
    const day = index + 1;
    const resources = state.resources.filter((item) => item.day === day);
    const primary = resources.find((item) => item.type === "song") || resources[0];
    const done = Boolean(taskState[`day-${day}`]);
    const tags = resources.map((item) => `<span>${typeLabels[item.type]}</span>`).join("") || "<span>待整理</span>";
    return `<article class="day-card ${done ? "done" : ""} ${day === state.currentDay ? "today" : ""} ${resources.length ? "" : "empty"}">
      <span class="day-status">${resources.length ? (done ? "✓ 已完成" : day === state.currentDay ? "今天" : "待学习") : "休息日"}</span>
      <div class="day-thumb">${primary?.thumbnail ? `<img src="${primary.thumbnail}" alt="DAY ${day} 封面">` : primary?.icon || "—"}</div>
      <div class="day-info"><small>DAY ${day}</small><h3>${primary?.title || "今天休息一下"}</h3><p>${primary?.desc || "这一天没有安排内容，陪宝宝玩一玩、抱一抱，也是在积累。"}</p><div class="day-tags">${tags}</div></div>
    </article>`;
  }).join("");
}

function renderThemeJourney() {
  const currentWeek = Math.min(12, Math.floor((state.currentDay - 1) / 7) + 1);
  $("#themeJourney").innerHTML = weekThemes.map((theme, index) => {
    const week = index + 1;
    const startDay = (week - 1) * 7 + 1;
    const endDay = Math.min(totalPlanDays, week * 7);
    return `<button class="theme-stop ${theme.color} ${week === currentWeek ? "active" : ""}" data-theme-week="${week}" aria-label="第${week}周 ${theme.title}"><b>第${week}周</b><strong>${theme.title}</strong><small>${theme.english}</small><em>DAY ${startDay}-${endDay}</em></button>`;
  }).join("");
}

function renderDailyLesson(dayResources) {
  const song = dayResources.find((item) => item.type === "song");
  const book = dayResources.find((item) => item.type === "book");
  const phraseCard = $(".phrase-card");
  const songCard = $(".song-card");
  const bookCard = $(".book-card");
  const phrases = dayPhrases[state.currentDay] || [];
  const hasContent = dayResources.length > 0;
  const videoPath = localPlaybackEnabled ? localVideos[state.currentDay] : "";
  const lessonVideo = $("#lessonVideo");
  const bookVideo = $("#bookVideo");
  const hasSongVideo = Boolean(song && videoPath);
  const hasBookVideo = Boolean(book && videoPath);

  if (lessonVideo) lessonVideo.pause();
  if (bookVideo) bookVideo.pause();
  if (lessonVideo) lessonVideo.removeAttribute("src");
  if (bookVideo) bookVideo.removeAttribute("src");
  if (lessonVideo) lessonVideo.hidden = !hasSongVideo;
  if (bookVideo) bookVideo.hidden = !hasBookVideo;
  $("#videoPlaceholder").hidden = hasSongVideo;
  $("#bookVideoStage").hidden = !hasBookVideo;
  $("#bookCover").hidden = hasBookVideo;
  if (hasSongVideo && lessonVideo && lessonVideo.getAttribute("src") !== videoPath) lessonVideo.src = videoPath;
  if (hasBookVideo && bookVideo && bookVideo.getAttribute("src") !== videoPath) bookVideo.src = videoPath;
  const thumbnail = thumbnails[state.currentDay];
  $("#lessonThumb").src = thumbnail || "";
  $("#bookThumb").src = thumbnail || "";
  if (lessonVideo) lessonVideo.poster = thumbnail || "";
  if (bookVideo) bookVideo.poster = thumbnail || "";
  const selectedResource = song || book;
  if ($("#openNetdisk")) {
    $("#openNetdisk").href = selectedResource?.link || "#";
    $("#openNetdisk").hidden = localPlaybackEnabled;
  }
  if ($("#openBookNetdisk")) {
    $("#openBookNetdisk").href = book?.link || "#";
    $("#openBookNetdisk").hidden = localPlaybackEnabled;
  }
  if ($("#openBook")) $("#openBook").hidden = localPlaybackEnabled;
  $("#videoStage").classList.toggle("netdisk-mode", !hasSongVideo && Boolean(song));
  $("#bookCover").classList.toggle("netdisk-mode", !hasBookVideo && Boolean(book));

  songCard.hidden = !song;
  bookCard.hidden = !book;
  phraseCard.hidden = !phrases.length;
  $("#sectionHeadingTitle").textContent = hasContent ? "今日学习内容" : "今天休息一下";
  $("#sectionHeadingDescription").textContent = hasContent ? "按当天网盘内容轻松完成，亲子口语自然带入" : "没有安排学习任务，轻松陪伴就是今天最好的打卡";
  $(".completion").hidden = !hasContent;

  if (song) {
    $("#todaySongTitle").textContent = song.title;
    $("#todaySongDescription").textContent = song.desc;
  }
  if (book) {
    $("#bookCardTitle").innerHTML = book.title.replace(/\s+/g, "<br>");
    $("#bookCardDescription").textContent = book.desc;
  }
  if (phrases.length) {
    $("#phraseHeading").textContent = `跟着《${song?.title || book?.title || "今天内容"}》说一说`;
    $("#phraseList").innerHTML = phrases.map(([scene, english, chinese], index) => `<button class="phrase-row" data-speak="${english.replace(/&/g, "&amp;")}"><span class="phrase-scene ${index === 1 ? "yellow" : index === 2 ? "blue" : ""}">${scene}</span><span><strong>${english}</strong><small>${chinese}</small></span><i><svg><use href="#i-volume"/></svg></i></button>`).join("");
  }
}

function renderWorkspace() {
  const dayResources = state.resources.filter((item) => item.day === state.currentDay);
  const currentWeek = Math.min(12, Math.floor((state.currentDay - 1) / 7) + 1);
  renderThemeJourney();
  renderDailyLesson(dayResources);
  const taskState = JSON.parse(localStorage.getItem("sssTasks") || "{}");
  const weekStartDay = (currentWeek - 1) * 7 + 1;
  const weekEndDay = Math.min(publishedThroughDay, currentWeek * 7);
  $("#dayStrip").innerHTML = Array.from({ length: Math.max(0, weekEndDay - weekStartDay + 1) }, (_, index) => {
    const day = weekStartDay + index;
    const resources = state.resources.filter((item) => item.day === day);
    const done = Boolean(taskState[`day-${day}`]);
    const hasContent = resources.length > 0;
    const icon = !hasContent ? "—" : resources.some((item) => item.type === "song") ? "🎵" : "📚";
    return `<button class="day-pill ${day === state.currentDay ? "active" : ""} ${done ? "done" : ""} ${hasContent ? "" : "empty"}" data-day="${day}"><span>DAY ${day}</span><b>${icon}</b>${done ? "<i>✓</i>" : ""}<small>${hasContent ? "" : "休息"}</small></button>`;
  }).join("");
  const activeResource = state.resources.find((item) => item.day === state.currentDay) || state.resources.find((item) => item.type === "song");
  if ($("#todaySongTitle")) $("#todaySongTitle").textContent = activeResource?.title || "今日 SSS 内容";
  updateTaskProgress();
}

function renderResources() {
  const search = $("#resourceSearch").value.trim().toLowerCase();
  const resources = state.resources.filter((item) => (state.filter === "all" || item.type === state.filter) && `${item.title}${item.desc}`.toLowerCase().includes(search));
  $("#resourceGrid").innerHTML = resources.length ? resources.map((item) => `
    <article class="resource-card" data-resource-id="${item.id}">
      <div class="resource-thumb">${item.thumbnail ? `<img src="${item.thumbnail}" alt="${escapeHtml(item.title)}">` : item.url && item.fileType?.startsWith("image") ? `<img src="${item.url}" alt="${item.title}">` : item.url && item.fileType?.startsWith("video") ? `<video src="${item.url}" muted></video>` : `<span>${item.icon || typeIcons[item.type]}</span>`}<em class="resource-type">${typeLabels[item.type]}</em></div>
      <div class="resource-content"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.desc || "暂无陪伴说明")}</p><div class="resource-foot"><span>安排在 DAY ${item.day || 1}</span><button data-preview="${item.id}">${item.link ? "网盘打开 →" : "查看内容 →"}</button></div></div>
    </article>`).join("") : '<div style="grid-column:1/-1;text-align:center;padding:80px;color:#aaa">没有找到相关资源</div>';
  renderManageList();
}

function escapeHtml(value) {
  const node = document.createElement("div");
  node.textContent = value;
  return node.innerHTML;
}

function renderManageList() {
  const uploads = state.resources.filter((item) => item.uploaded);
  $("#manageList").innerHTML = uploads.length ? uploads.map((item) => `<div class="manage-item"><div class="mini-thumb">${typeIcons[item.type]}</div><div><strong>${escapeHtml(item.title)}</strong><small>${typeLabels[item.type]} · DAY ${item.day}</small></div><button data-delete="${item.id}">删除</button></div>`).join("") : '<p style="text-align:center;color:#aaa;font-size:11px;padding:40px">还没有上传资料</p>';
}

function renderGrowth() {
  const checkins = [...state.moments].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const dateKeys = [...new Set(checkins.map((moment) => moment.dateKey).filter(Boolean))].sort().reverse();
  let streak = 0;
  if (dateKeys.length) {
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    const latest = new Date(`${dateKeys[0]}T00:00:00`);
    const gap = Math.round((cursor - latest) / 86400000);
    if (gap <= 1) {
      cursor.setTime(latest.getTime());
      for (const key of dateKeys) {
        if (key !== formatDateKey(cursor)) break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }
    }
  }
  const songDays = checkins.filter((moment) => moment.hasSong).length;
  const bookDays = checkins.filter((moment) => moment.hasBook).length;
  const phraseCount = checkins.reduce((total, moment) => total + Number(moment.phraseCount || 0), 0);
  $("#growthStreak").textContent = streak;
  $("#growthSongs").textContent = songDays;
  $("#growthPhrases").textContent = phraseCount;
  $("#growthBooks").textContent = bookDays;
  $("#streakCount").textContent = streak;
  if ($("#profileLearningDays")) $("#profileLearningDays").textContent = `已陪伴 ${dateKeys.length} 天`;

  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const count = checkins.filter((moment) => moment.dateKey === formatDateKey(date)).length;
    return { count, label: index === 6 ? "今天" : `${date.getMonth() + 1}/${date.getDate()}` };
  });
  $("#barChart").innerHTML = recentDays.map(({ count, label }) => `<div class="bar-item"><div class="bar" data-value="${count ? "已打卡" : "待完成"}" style="height:${count ? 78 : 8}%"></div><small>${label}</small></div>`).join("");
  $("#timeline").innerHTML = checkins.length ? checkins.slice(0, 6).map((moment) => `<article class="moment"><div class="moment-photo">${moment.image ? `<img src="${moment.image}" alt="打卡照片">` : moment.mood}</div><div><strong>${moment.mood} DAY ${moment.day || "—"} · ${escapeHtml(moment.title || "今日闪光")}</strong><p>${escapeHtml(moment.note)}</p><small>${moment.date}</small></div></article>`).join("") : '<div class="growth-empty"><span>🌱</span><strong>还没有成长记录</strong><p>在“今日学习”完成第一次打卡后，这里会自动生成宝贝的成长足迹。</p></div>';

  const badges = [checkins.length >= 1, streak >= 7, songDays >= 10, checkins.length >= 14];
  ["#badgeFirst", "#badgeSeven", "#badgeSongs", "#badgeStar"].forEach((selector, index) => $(selector).classList.toggle("locked", !badges[index]));
  $("#achievementSummary").textContent = badges.some(Boolean) ? `已点亮 ${badges.filter(Boolean).length} 枚` : "等待第一次打卡";
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderBook() {
  const pages = [
    ["🦒", "I am a giraffe.", "I bend my neck. Can you do it?"],
    ["🐧", "I am a penguin.", "I turn my head. Can you do it?"],
    ["🐘", "I am an elephant.", "I stomp my foot. Can you do it?"],
    ["🐒", "I am a monkey.", "I wave my arms. I can do it!"]
  ];
  $("#bookPages").innerHTML = pages.map((page, index) => `<div class="book-page ${index === state.currentBookPage ? "active" : ""}"><div class="big-animal">${page[0]}</div><h3>${page[1]}</h3><p>${page[2]}</p></div>`).join("");
  $("#pageDots").innerHTML = pages.map((_, index) => `<span class="${index === state.currentBookPage ? "active" : ""}"></span>`).join("");
  $("#pageCounter").textContent = `${state.currentBookPage + 1} / ${pages.length}`;
  $("#prevPage").disabled = state.currentBookPage === 0;
  $("#nextPage").disabled = state.currentBookPage === pages.length - 1;
}

function openModal(id) {
  const modal = $(id);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function speak(text) {
  if (!("speechSynthesis" in window)) return showToast("当前浏览器不支持朗读", "可以直接跟着英文文字练习哦");
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  speechSynthesis.speak(utterance);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("sssKidsStudio", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveUploadedResource(resource, file) {
  const db = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    transaction.objectStore("files").put({ id: resource.id, file });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  const stored = JSON.parse(localStorage.getItem("sssUploadedResources") || "[]");
  stored.push({ ...resource, url: undefined });
  localStorage.setItem("sssUploadedResources", JSON.stringify(stored));
}

async function loadUploads() {
  const metadata = JSON.parse(localStorage.getItem("sssUploadedResources") || "[]");
  if (!metadata.length) return;
  const canonicalPrimaryTypes = new Map();
  state.resources.forEach((resource) => {
    if (resource.uploaded || !["song", "book"].includes(resource.type) || canonicalPrimaryTypes.has(resource.day)) return;
    canonicalPrimaryTypes.set(resource.day, resource.type);
  });
  const validMetadata = metadata.filter((resource) => {
    const canonicalType = canonicalPrimaryTypes.get(Number(resource.day));
    const isPrimaryResource = ["song", "book"].includes(resource.type);
    return !canonicalType || !isPrimaryResource || resource.type === canonicalType;
  });
  if (validMetadata.length !== metadata.length) localStorage.setItem("sssUploadedResources", JSON.stringify(validMetadata));
  const db = await openDatabase();
  const records = await new Promise((resolve, reject) => {
    const request = db.transaction("files").objectStore("files").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  validMetadata.forEach((resource) => {
    const record = records.find((item) => item.id === resource.id);
    if (record) resource.url = URL.createObjectURL(record.file);
    state.resources.unshift(resource);
  });
}

async function deleteUpload(id) {
  const db = await openDatabase();
  db.transaction("files", "readwrite").objectStore("files").delete(id);
  state.resources = state.resources.filter((item) => item.id !== id);
  const metadata = JSON.parse(localStorage.getItem("sssUploadedResources") || "[]").filter((item) => item.id !== id);
  localStorage.setItem("sssUploadedResources", JSON.stringify(metadata));
  renderResources();
  showToast("资料已删除", "资源库已同步更新");
}

async function previewResource(resource) {
  if (!resource) return;
  if (resource.link) {
    if (resource.code && navigator.clipboard) {
      try { await navigator.clipboard.writeText(resource.code); } catch (error) { console.warn("提取码复制失败", error); }
    }
    window.open(resource.link, "_blank", "noopener");
    showToast(resource.code ? "提取码已复制" : "正在打开百度网盘", resource.code ? `提取码：${resource.code}` : "请在网盘中直接查看资料");
  } else if (resource.type === "book") {
    state.currentBookPage = 0;
    renderBook();
    openModal("#bookModal");
  } else if (resource.url) {
    window.open(resource.url, "_blank", "noopener");
  } else {
    switchView("today");
    showToast("已打开今日示例", "上传自己的文件后可直接播放");
  }
}

function bindEvents() {
  $$('[data-view]').forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
  $("#mobileMenu").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
  $("#adminEntry").addEventListener("click", () => openModal("#adminModal"));
  $("#libraryUpload").addEventListener("click", () => openModal("#adminModal"));
  $$(".modal-close, .modal-backdrop").forEach((button) => button.addEventListener("click", () => closeModal(button.closest(".modal"))));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") $$(".modal.open").forEach(closeModal); });
  $("#phraseList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-speak]");
    if (button) speak(button.dataset.speak);
  });
  $("#playDemo").addEventListener("click", () => {
    const localVideo = localPlaybackEnabled && localVideos[state.currentDay];
    if (localVideo) {
      const video = state.resources.some((item) => item.day === state.currentDay && item.type === "book") ? $("#bookVideo") : $("#lessonVideo");
      if (video) video.play();
      return;
    }
    const resource = state.resources.find((item) => item.day === state.currentDay) || state.resources.find((item) => item.type === "song");
    if (resource?.link) window.open(resource.link, "_blank", "noopener");
    else previewResource(resource);
  });
  $("#videoPlaceholder").addEventListener("click", (event) => {
    if (event.target.closest("#playDemo")) return;
    const resource = state.resources.find((item) => item.day === state.currentDay);
    if (resource?.link && !localPlaybackEnabled) window.open(resource.link, "_blank", "noopener");
  });
  if ($("#openBook")) $("#openBook").addEventListener("click", () => {
    const resource = state.resources.find((item) => item.type === "book" && item.day === state.currentDay) || state.resources.find((item) => item.type === "book");
    if (resource?.link) window.open(resource.link, "_blank", "noopener");
    else previewResource(resource);
  });
  $("#bookCover").addEventListener("click", () => {
    const resource = state.resources.find((item) => item.type === "book" && item.day === state.currentDay);
    if (resource?.link && !localPlaybackEnabled) window.open(resource.link, "_blank", "noopener");
  });
  $("#prevPage").addEventListener("click", () => { state.currentBookPage--; renderBook(); });
  $("#nextPage").addEventListener("click", () => { state.currentBookPage++; renderBook(); });
  $$("[data-mood]").forEach((button) => button.addEventListener("click", () => {
    state.selectedMood = button.dataset.mood;
    $$("[data-mood]").forEach((item) => item.classList.toggle("selected", item === button));
  }));
  $("#submitCheckin").addEventListener("click", handleCheckin);
  $$("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    $$("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderResources();
  }));
  $("#resourceSearch").addEventListener("input", renderResources);
  $("#focusResourceSearch").addEventListener("click", () => { switchView("library"); $("#resourceSearch").focus(); });
  $("#dayStrip").addEventListener("click", (event) => { const button = event.target.closest("[data-day]"); if (!button) return; state.currentDay = Number(button.dataset.day); renderWorkspace(); });
  $("#themeJourney").addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-week]");
    if (!button) return;
    const firstDay = (Number(button.dataset.themeWeek) - 1) * 7 + 1;
    state.currentDay = Math.min(publishedThroughDay, firstDay);
    renderWorkspace();
  });
  $("#resourceGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-preview]");
    if (button) previewResource(state.resources.find((item) => item.id === button.dataset.preview));
  });
  $$("[data-admin-tab]").forEach((button) => button.addEventListener("click", () => switchAdminTab(button.dataset.adminTab)));
  $("#contentFile").addEventListener("change", (event) => $("#fileName").textContent = event.target.files[0]?.name || "尚未选择文件");
  $("#uploadForm").addEventListener("submit", handleUpload);
  $("#manageList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete]");
    if (button && confirm("确定删除这份资料吗？")) deleteUpload(button.dataset.delete);
  });
  if ($("#saveLead")) $("#saveLead").addEventListener("click", () => showToast("设置已保存", "工作台内容已更新"));
  if ($(".lead-float button")) $(".lead-float button").addEventListener("click", () => showToast("领取入口已触发", "上线时可连接微信、表单或社群二维码"));
}

function switchAdminTab(tab) {
  $$("[data-admin-tab]").forEach((button) => button.classList.toggle("active", button.dataset.adminTab === tab));
  $("#uploadForm").hidden = tab !== "upload";
  $("#managePanel").hidden = tab !== "manage";
  if ($("#leadPanel")) $("#leadPanel").hidden = tab !== "lead";
}

async function handleUpload(event) {
  event.preventDefault();
  const file = $("#contentFile").files[0];
  const link = $("#contentLink").value.trim();
  const code = $("#contentCode").value.trim();
  if (!file && !link) return showToast("还没有资料链接", "请上传文件，或粘贴百度网盘分享链接");
  const resource = {
    id: `upload-${Date.now()}`,
    type: $("#contentType").value,
    day: Number($("#contentDay").value),
    title: $("#contentTitle").value.trim(),
    desc: $("#contentDesc").value.trim(),
    fileType: file?.type || "link",
    link,
    code,
    uploaded: true,
    url: file ? URL.createObjectURL(file) : ""
  };
  try {
    if (file) await saveUploadedResource(resource, file);
    else {
      const stored = JSON.parse(localStorage.getItem("sssUploadedResources") || "[]");
      stored.push(resource);
      localStorage.setItem("sssUploadedResources", JSON.stringify(stored));
    }
    state.resources.unshift(resource);
    renderResources();
    event.target.reset();
    $("#contentLink").value = "";
    $("#contentCode").value = "";
    $("#fileName").textContent = "尚未选择文件";
    closeModal($("#adminModal"));
    switchView("library");
    showToast("发布成功！", "资料已出现在启蒙资源库");
  } catch (error) {
    showToast("保存失败", "文件可能过大，请更换较小文件再试");
  }
}

function handleCheckin() {
  const note = $("#checkinNote").value.trim();
  if (!note) return showToast("写一句成长记录吧", "哪怕只是今天宝宝笑得很开心");
  if (state.moments.some((moment) => Number(moment.day) === state.currentDay)) return showToast("今天已经打卡啦", "成长记录已经同步到宝贝成长");
  const photo = $("#checkinPhoto").files[0];
  const save = (image = "") => {
    const date = new Date();
    const resources = state.resources.filter((item) => item.day === state.currentDay);
    const primary = resources.find((item) => item.type === "song") || resources.find((item) => item.type === "book") || resources[0];
    const phrases = dayPhrases[state.currentDay] || [];
    state.moments.unshift({
      mood: state.selectedMood,
      note,
      image,
      day: state.currentDay,
      title: primary?.title || "今天休息一下",
      hasSong: resources.some((item) => item.type === "song"),
      hasBook: resources.some((item) => item.type === "book"),
      phraseCount: phrases.length,
      date: `${date.getMonth() + 1}月${date.getDate()}日`,
      dateKey: formatDateKey(date),
      timestamp: date.getTime()
    });
    localStorage.setItem("sssMoments", JSON.stringify(state.moments));
    const taskState = JSON.parse(localStorage.getItem("sssTasks") || "{}");
    taskState[`day-${state.currentDay}`] = true;
    if (resources.some((item) => item.type === "song")) taskState[`song-day-${state.currentDay}`] = true;
    localStorage.setItem("sssTasks", JSON.stringify(taskState));
    $("#checkinNote").value = "";
    $("#checkinPhoto").value = "";
    renderWorkspace();
    renderCalendar();
    renderGrowth();
    updateTaskProgress();
    showToast("打卡成功！", "已同步到宝贝成长");
  };
  if (!photo) return save();
  const reader = new FileReader();
  reader.onload = () => save(reader.result);
  reader.readAsDataURL(photo);
}

async function init() {
  formatToday();
  for (let day = 1; day <= totalPlanDays; day++) $("#contentDay").insertAdjacentHTML("beforeend", `<option value="${day}" ${day === state.currentDay ? "selected" : ""}>DAY ${day}</option>`);
  renderCalendar();
  renderWorkspace();
  renderBook();
  renderGrowth();
  bindTasks();
  updateTaskProgress();
  bindEvents();
  try { await loadUploads(); } catch (error) { console.warn("本地上传资料加载失败", error); }
  renderResources();
}

init();
