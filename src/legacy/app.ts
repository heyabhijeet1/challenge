// @ts-nocheck
// Original app logic, ported 1:1 from the artifact.
let started = false;
export function initApp() {
  if (started) return;
  started = true;

  const $ = (id) => document.getElementById(id);
  const pop = $("pop");
  function tok(n) {
    const v = getComputedStyle(document.documentElement)
      .getPropertyValue(n)
      .trim();
    const m = v.match(/^var\((--[\w-]+)\)$/);
    return m ? tok(m[1]) : v;
  }
  const C = {
    blue: tok("--blue"),
    purple: tok("--purple"),
    green: tok("--green"),
    orange: tok("--orange"),
    easy: tok("--easy"),
    easy2: tok("--easy-2"),
    medium: tok("--medium"),
    medium2: tok("--medium-2"),
    hard: tok("--hard"),
    hard2: tok("--hard-2"),
    extreme: tok("--extreme"),
    extreme2: tok("--extreme-2"),
  };
  const LV = {
    e: ["Easy", 10, C.easy, 30],
    m: ["Medium", 25, C.medium, 55],
    h: ["Hard", 50, C.hard, 100],
    c: ["Daily", 5, C.blue, 25],
    g: ["Extreme", 100, C.extreme, 150],
  };
  let cur = "e",
    tab = "c",
    curB = "e";
  const BLV = {
    e: ["Easy", C.easy],
    m: ["Medium", C.medium],
    h: ["Hard", C.hard],
    g: ["Extreme", C.extreme],
  };
  let S = { items: [], pts: 0 };
  try {
    S = JSON.parse(localStorage.getItem("ch") || "") || S;
  } catch (e) {}
  S.items = S.items || [];
  S.pts = S.pts || 0;
  function save() {
    try {
      localStorage.setItem("ch", JSON.stringify(S));
    } catch (e) {}
  }
  function key(d) {
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function today() {
    return key(new Date());
  }
  function yday() {
    return key(new Date(Date.now() - 864e5));
  }
  S.log = S.log || [];
  S.notes = S.notes || [];
  S.noteN = S.noteN || 0;
  S.ses = S.ses || [];
  S.sw = S.sw || null;
  S.swRem = S.swRem || 0;
  S.swH = S.swH || 0;
  S.swDay = S.swDay || "";
  S.streak = S.streak || 0;
  S.last = S.last || "";
  S.mute = !!S.mute;
  const LVN = ["Beginner", "Explorer", "Achiever", "Champion", "Legend"],
    LVT = [0, 100, 250, 500, 1000];
  function lvlIdx(p) {
    let k = 0;
    LVT.forEach((t, j) => {
      if (p >= t) k = j;
    });
    return k;
  }
  function bump() {
    if (S.last === today()) return false;
    S.streak = S.last === yday() ? S.streak + 1 : 1;
    S.last = today();
    S.best = Math.max(S.best || 0, S.streak);
    return true;
  }
  const ALLQ = [
      ["Don't wake up to be fucking average", "⚡"],
      ["F*ck your mood follow the plan", "📋"],
      ["F*ck 'em I got dreams to chase", "🌠"],
      ["This Is The Last Chance Work Hard", "⏳"],
      ["Repetition Rewires The Brain", "🧠"],
      ["Fear is an illusion", "🦁"],
      ["1% BETTER EVERYDAY", "💪🏻"],
      ["It's Just Game Of Consistency", "🎮"],
      ["It's YOU vs YOU", "🥊"],
      ["Do it tired...Do it bored... Do it anyway!!", "💥"],
      ["Time For A Fuckin' Comeback", "🔄"],
      ["Quotes Won't Work Unless You Do", "🛠️"],
      ["Stick To The Plan Not Your Mood", "🎯"],
      ["Everything you imagine will be your reality soon", "🌈"],
      ["You're Not Special Work Harder !!", "🔨"],
      ["That Is Your Limit?", "🚀"],
      ["No Risk, No Porsche!", "🏎️"],
      ["Just One Life Bro,  Don't Give Up !", "🌍"],
      ["Master Yourself !", "🧘"],
      ["If You Started It, Finish It !", "🏁"],
      ["Action Cures Anxiety", "🏃"],
      ["STUDY HARD and get out of this stupid place !", "📚"],
      ["One focused year can change your entire bloodline!", "🌳"],
      ["6 months of focus can actually fix your last 5 years of mess", "🔧"],
      ["Consistency Is The Key", "🗝️"],
      ["Lock in SO HARD until your comeback !!", "🔒"],
      ["You Have Crazy Potential If You Lock In", "💎"],
      ["ACTUALLY , YOU CAN !", "✅"],
      ["Better Days Are Coming", "🌅"],
      ["Repetition is the mother of all skills", "🔁"],
      ["Consistency Creates Identity", "🪞"],
      ["Escape The Cult Of Mediocrity", "🚪"],
      ["Locking In Is The Only Way Out", "🔐"],
      ["TRUST THE PROCESS", "🌱"],
      ["Who's In Control You Or The Urge?", "🎛️"],
      ["Finishing Is Your Only Fucking Option!", "🏆"],
      ["If Not Now Then When", "⏰"],
      ["GIVING UP IS NOT IN THE BLOOD SIR", "🩸"],
      ["Your Biggest Enemy Is Your Uncontrolled Mind", "🌀"],
      ["Are You Sure You Want To Waste Your Time And F*ck Your Future?", "⚠️"],
      ["Your Entire Bloodline Is Watching You !", "👁️"],
      ["Get Rich Or Die Tryin'", "💰"],
      ["Do Or Die", "⚔️"],
      ["Bigger Idiots Than You Have Done It", "😤"],
      ["Make It Happen Shock Everyone", "🤯"],
      ["The Modern Devil Is Cheap Dopamine", "😈"],
      ["Jitna Ragda Utna Tagda", "🔥💪🏻"],
      ['The guilt of "I could\'ve done better"', "😮‍💨"],
      ["Good Things Take Time", "🕰️"],
      ["The Problem Is You Think You Have Time", "⌛"],
      ["Jo Nahi Ho Sakta Vahi To Karna Hai", "🔥"],
      ["Stop Feeding Your Urges", "🚫"],
      ["Break the pattern or else accept ab average life", "⛓️"],
      ["You can do literally anything you can think of !", "✨"],
      ["BECOME DELUSIONAL !!", "🦄"],
      ["Prefer dying rather than not trying", "💀"],
      ["It's easy to win, 90% people are distracted", "🥇"],
      ["Life Is Unfair. Deal With It.", "🌪️"],
      ["Next Stop: The Top.", "🏔️"],
      ["No Risk, No Story.", "📖"],
      ["WORK LIKE HELL!", "🔥"],
      ["The Greatest Sin Is to Think Yourself Weak.", "🛡️"],
      ["True Brilliance Comes From Obsession.", "💡"],
      [
        "You Must Break the Pattern Today, or the Loop Will Repeat Tomorrow.",
        "♻️",
      ],
      ["Be Addicted to Bettering Yourself.", "📈"],
      ["Efforts NEVER Betray.", "🤝"],
      ["The More Audacity You Have, the More Life Rewards You.", "🦅"],
      ["Reach Fucking Higher.", "🪜"],
      ["Be Delusional About Your POTENTIAL — It's Free.", "🌌"],
      ["How Can It Be Unrealistic If Other People Have It?", "🤔"],
      ["Decisions Are Portals.", "🧭"],
      ["Your Next Move Matters More Than Your Last Mistake.", "♟️"],
      ["Comfort Is the Worst Addiction.", "🛋️"],
      ["Every Excuse Today Is the Debt You'll Pay Tomorrow.", "🧾"],
      ["A Man Who Lacks Purpose Distracts Himself With Pleasure.", "🎭"],
      [
        "The Road to Heaven Feels Like Hell; the Road to Hell Feels Like Heaven.",
        "🛤️",
      ],
    ],
    BQ = [
      ["Everything you imagine will be your reality soon", "🌈"],
      ["You can do literally anything you can think of !", "✨"],
      ["ACTUALLY , YOU CAN !", "✅"],
      ["BECOME DELUSIONAL !!", "🦄"],
      ["Make It Happen Shock Everyone", "🤯"],
      ["You Have Crazy Potential If You Lock In", "💎"],
      ["Fear is an illusion", "🦁"],
      ["Better Days Are Coming", "🌅"],
      ["No Risk, No Porsche!", "🏎️"],
      ["F*ck 'em I got dreams to chase", "🌠"],
      ["Next Stop: The Top.", "🏔️"],
      ["No Risk, No Story.", "📖"],
      ["The More Audacity You Have, the More Life Rewards You.", "🦅"],
      ["Be Delusional About Your POTENTIAL — It's Free.", "🌌"],
      ["How Can It Be Unrealistic If Other People Have It?", "🤔"],
    ],
    XQ = [
      ["Better Days Are Coming", "🌅"],
      ["Time For A Fuckin' Comeback", "🔄"],
      ["Lock in SO HARD until your comeback !!", "🔒"],
      ["Do it tired...Do it bored... Do it anyway!!", "💥"],
      ["Good Things Take Time", "🕰️"],
      ["Your Next Move Matters More Than Your Last Mistake.", "♟️"],
    ];
  const ALL = [...ALLQ, ...BQ, ...XQ];
  const Q = { c: ALL, m: ALL, b: ALL, l: ALL, x: ALL };
  const lastQ = {};
  function pickQ(k) {
    const a = Q[k];
    let q;
    do {
      q = a[Math.floor(Math.random() * a.length)];
    } while (a.length > 1 && q === lastQ[k]);
    lastQ[k] = q;
    return q;
  }
  function fillQ(el, q) {
    el.innerHTML = "";
    const e = document.createElement("div");
    e.className = "qe";
    e.textContent = q[1];
    const t = document.createElement("div");
    t.className = "qt";
    t.textContent = "“" + q[0] + "”";
    el.appendChild(e);
    el.appendChild(t);
    el.classList.remove("show");
    void el.offsetWidth;
    el.classList.add("show");
  }
  function setQ(k) {
    fillQ($("pq"), pickQ(k));
  }
  let undoData = null,
    undoTimer = null;
  function hideToast() {
    $("toast").style.display = "none";
    clearTimeout(undoTimer);
    undoData = null;
  }
  function showToast(msg) {
    $("tmsg").textContent = msg;
    $("toast").style.display = "flex";
    const tb = $("tbar");
    tb.style.animation = "none";
    void tb.offsetWidth;
    tb.style.animation = "";
    clearTimeout(undoTimer);
    undoTimer = setTimeout(hideToast, 2000);
  }
  function undoNow() {
    if (!undoData) return;
    const u = undoData;
    undoData = null;
    const i = S.items.find((x) => x.id === u.id);
    if (i) i.d = false;
    S.pts = u.pts;
    S.streak = u.streak;
    S.last = u.last;
    S.log = S.log.slice(0, u.log);
    pendLv = null;
    pop.style.display = "none";
    pop.className = "";
    $("lvup").style.display = "none";
    document.querySelectorAll(".c,.sp,.flash").forEach((e) => e.remove());
    hideToast();
    save();
    render();
  }
  let pendLv = null;
  function closePop() {
    pop.style.display = "none";
    pop.className = "";
    if (undoData && $("pb").textContent === "Yay!") showToast("Marked as done");
    if (pendLv !== null) {
      const k = pendLv;
      pendLv = null;
      setTimeout(() => levelUp(k), 250);
    }
  }
  function levelUp(k) {
    $("le").textContent = ["🌱", "🧭", "⚡", "👑", "🏆"][k];
    $("ln").textContent = LVN[k];
    $("lp").textContent = LVT[k + 1]
      ? "Next: " + LVN[k + 1] + " at " + LVT[k + 1] + " points"
      : "You reached the top!";
    $("lvup").style.display = "flex";
    fillQ($("lq"), pickQ("l"));
    fx("l");
    celebrate("h");
  }
  let actx = null;
  function fx(kind) {
    if (S.mute) return;
    const F = {
      e: [660, 880],
      m: [523, 659, 784],
      h: [523, 659, 784, 1047],
      g: [523, 659, 784, 1047, 1319],
      l: [523, 659, 784, 1047, 1319, 1568],
      x: [330, 247],
    }[kind];
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime;
      F.forEach((f, j) => {
        const o = actx.createOscillator(),
          g = actx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        o.connect(g);
        g.connect(actx.destination);
        const st = t + j * 0.13;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.18, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.3);
        o.start(st);
        o.stop(st + 0.32);
      });
    } catch (e) {}
    try {
      navigator.vibrate &&
        navigator.vibrate(
          kind === "x"
            ? [200]
            : kind === "h" || kind === "l" || kind === "g"
              ? [40, 60, 40, 60, 90]
              : [35],
        );
    } catch (e) {}
  }
  function toggleSnd() {
    S.mute = !S.mute;
    save();
    render();
  }
  // older items: quick ones become daily, the rest become milestones
  S.items.forEach((i) => {
    if (!i.type) {
      if (i.q) {
        i.type = "c";
        i.lv = "c";
        i.day = today();
      } else i.type = "m";
    }
  });
  function expire() {
    const t = today(),
      missed = [];
    let ch = false;
    S.items = S.items.filter((i) => {
      if (i.type !== "c" || i.day === t) return true;
      ch = true;
      if (!i.d) missed.push(i);
      if (i.rep) {
        i.d = false;
        i.day = t;
        return true;
      }
      return false;
    });
    if (missed.length) {
      const tot = missed.reduce((a, i) => a + Math.round(LV.c[1] / 2), 0);
      S.pts = Math.max(0, S.pts - tot);
      logE(
        "p",
        -tot,
        missed.length === 1 ? missed[0].t : missed.length + " challenges",
      );
      save();
      $("pe").textContent = "😢";
      $("pt").textContent =
        (missed.length === 1
          ? "Missed: " + missed[0].t
          : missed.length + " challenges missed") +
        "  −" +
        tot +
        " points";
      $("pb").textContent = "OK";
      pop.style.display = "flex";
      fx("x");
      setQ("x");
    } else if (ch) save();
  }
  function setTab(t) {
    tab = t;
    document.body.className = "t-" + t;
    [
      ["c", "tc", "pc"],
      ["m", "tm", "pm"],
      ["b", "tb", "pbk"],
    ].forEach((a) => {
      $(a[1]).className = t === a[0] ? "on" : "";
      $(a[2]).className = t === a[0] ? "" : "hid";
    });
  }
  function drawLv() {
    const b = $("lv");
    b.innerHTML = "";
    for (const k of ["e", "m", "h", "g"]) {
      const x = document.createElement("button");
      x.textContent = LV[k][0] + " · " + LV[k][1];
      if (k === cur) {
        x.className = "on";
        x.style.background = LV[k][2];
        x.style.color = k === "e" || k === "m" ? "var(--on-light)" : "#fff";
      }
      x.onclick = () => {
        cur = k;
        drawLv();
      };
      b.appendChild(x);
    }
  }
  function drawBLv() {
    const b = $("blv");
    b.innerHTML = "";
    for (const k in BLV) {
      const x = document.createElement("button");
      x.textContent = BLV[k][0];
      if (k === curB) {
        x.className = "on";
        x.style.background = BLV[k][1];
        x.style.color = k === "e" || k === "m" ? "var(--on-light)" : "#fff";
      }
      x.onclick = () => {
        curB = k;
        drawBLv();
      };
      b.appendChild(x);
    }
  }
  function burst(x, y, n, emoji, color, dist) {
    for (let k = 0; k < n; k++) {
      const e = document.createElement("div");
      e.className = "sp";
      const a = (Math.PI * 2 * k) / n,
        d = dist * (0.6 + Math.random() * 0.5);
      e.style.left = x + "px";
      e.style.top = y + "px";
      e.style.setProperty("--dx", Math.cos(a) * d + "px");
      e.style.setProperty("--dy", Math.sin(a) * d + "px");
      if (emoji) {
        e.textContent = emoji;
        e.style.fontSize = "20px";
      } else {
        e.style.width = e.style.height = "8px";
        e.style.borderRadius = "50%";
        e.style.background = color;
      }
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 1300);
    }
  }
  function celebrate(lv) {
    const W = innerWidth,
      H = innerHeight;
    if (lv === "e") {
      confetti(40);
      return;
    }
    if (lv === "m") {
      burst(W / 2, H / 2, 22, "✨", null, 150);
      setTimeout(() => burst(W / 2, H / 2, 16, "⭐", null, 100), 250);
      confetti(60);
      return;
    }
    const cols = [C.blue, C.purple, C.green, C.orange];
    const f = document.createElement("div");
    f.className = "flash";
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1100);
    for (let k = 0; k < (lv === "g" ? 10 : 6); k++)
      setTimeout(
        () =>
          burst(
            W * (0.15 + Math.random() * 0.7),
            H * (0.15 + Math.random() * 0.5),
            28,
            null,
            cols[k % cols.length],
            140,
          ),
        k * 260,
      );
    confetti(lv === "g" ? 200 : 130);
  }
  let rp = "w",
    ro = 0;
  function logE(y, p, n) {
    S.log.push({ t: Date.now(), y: y, p: p, a: S.pts, n: n || "" });
    if (S.log.length > 15000) S.log.shift();
  }
  function periodAt(off) {
    const n = new Date();
    if (rp === "w") {
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate()),
        dow = (d.getDay() + 6) % 7;
      const a = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate() - dow + off * 7,
      );
      return [a, new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7)];
    }
    return [
      new Date(n.getFullYear(), n.getMonth() + off, 1),
      new Date(n.getFullYear(), n.getMonth() + off + 1, 1),
    ];
  }
  function statsFor(off) {
    const pr = periodAt(off),
      a = pr[0],
      b = pr[1],
      A = a.getTime(),
      B = b.getTime();
    const E = S.log.filter((e) => e.t >= A && e.t < B);
    const earned = E.filter(
      (e) => e.y === "c" || e.y === "m" || e.y === "f",
    ).reduce((t, e) => t + e.p, 0);
    return { a: a, b: b, A: A, B: B, E: E, earned: earned };
  }
  function openRecap() {
    rp = "w";
    ro = 0;
    hv = "y";
    ho = 0;
    $("recap").style.display = "block";
    renderRecap();
    renderHeat();
  }
  function closeRecap() {
    $("recap").style.display = "none";
  }
  function setRp(x) {
    rp = x;
    ro = 0;
    renderRecap();
  }
  function shiftR(d) {
    ro = Math.min(0, ro + d);
    renderRecap();
  }
  function renderRecap() {
    $("rw").className = rp === "w" ? "on" : "";
    $("rm").className = rp === "m" ? "on" : "";
    const cur = statsFor(ro),
      prev = statsFor(ro - 1),
      E = cur.E,
      word = rp === "w" ? "week" : "month";
    const fd = (d) =>
      d.toLocaleDateString([], { month: "short", day: "numeric" });
    $("rlabel").textContent =
      rp === "w"
        ? fd(cur.a) + " – " + fd(new Date(cur.B - 864e5))
        : cur.a.toLocaleDateString([], { month: "long", year: "numeric" });
    $("rnext").style.visibility = ro < 0 ? "visible" : "hidden";
    const nd = Math.round((cur.B - cur.A) / 864e5),
      days = new Array(nd).fill(0);
    E.forEach((e) => {
      if (e.y === "c" || e.y === "m" || e.y === "f") {
        const dt = new Date(e.t),
          di = Math.round(
            (new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()) - cur.a) /
              864e5,
          );
        if (di >= 0 && di < nd) days[di] += e.p;
      }
    });
    const dIdx = (t) => {
      const dt = new Date(t);
      return Math.round(
        (new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()) - cur.a) /
          864e5,
      );
    };
    const cc = new Array(nd).fill(0),
      mm = new Array(nd).fill(0),
      bb = new Array(nd).fill(0);
    E.forEach((e) => {
      const di = dIdx(e.t);
      if (di >= 0 && di < nd) {
        if (e.y === "c") cc[di]++;
        else if (e.y === "m") mm[di]++;
        else if (e.y === "b") bb[di]++;
      }
    });
    const dateOf = (j) =>
      new Date(
        cur.a.getFullYear(),
        cur.a.getMonth(),
        cur.a.getDate() + j,
      ).toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    const nowD = new Date(),
      T0 = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate());
    const ti = Math.round((T0 - cur.a) / 864e5),
      defIdx = ti >= 0 && ti < nd ? ti : nd - 1;
    const dayLbl = (j) => (j === ti ? "Today · " : "") + dateOf(j);
    const per = rp === "w" ? "Week" : "Month";
    const showP = (j) => {
      const p = [];
      if (cc[j]) p.push(cc[j] + (cc[j] > 1 ? " challenges" : " challenge"));
      if (mm[j]) p.push(mm[j] + (mm[j] > 1 ? " milestones" : " milestone"));
      if (bb[j]) p.push(bb[j] + (bb[j] > 1 ? " dreams" : " dream"));
      $("rday").textContent = dayLbl(j);
      $("rbig").textContent = "⭐ " + days[j] + " points";
      $("rdet").textContent = p.length
        ? p.join(" · ")
        : days[j]
          ? ""
          : "No activity";
      $("rtot").textContent =
        per + " total: ⭐ " + cur.earned + " points · tap a bar to see a day";
    };
    drawBars($("rchart"), days, showP, defIdx);
    const cnt = (y) => E.filter((e) => e.y === y).length;
    $("s1").textContent = cnt("c");
    $("s2").textContent = cnt("m");
    $("s3").textContent = cnt("b");
    let best = 0,
      run = 0;
    days.forEach((v) => {
      if (v > 0) {
        run++;
        best = Math.max(best, run);
      } else run = 0;
    });
    $("s4").textContent = best;
    const pw = ro === 0 ? "last " + word : "the " + word + " before";
    let cmp;
    if (!cur.earned && !prev.earned)
      cmp =
        "Nothing logged yet. Finish a challenge to start your statistics ✨";
    else if (!prev.earned)
      cmp =
        "🚀 A great start. Nothing was logged " +
        (ro === 0 ? "last " + word : "the " + word + " before") +
        ".";
    else {
      const pc = Math.round(((cur.earned - prev.earned) / prev.earned) * 100);
      cmp =
        pc > 0
          ? "🔥 " + pc + "% more than " + pw + "!"
          : pc < 0
            ? -pc + "% less than " + pw + ". Come back stronger 💪"
            : "Same as " + pw + ". Steady wins.";
    }
    $("rcmp").textContent = cmp;
    const before = S.log.filter((e) => e.t < cur.A).pop();
    const st = before ? before.a : E.length ? E[0].a - E[0].p : S.pts;
    const en = E.length ? E[E.length - 1].a : st;
    const l1 = lvlIdx(st),
      l2 = lvlIdx(en);
    $("rlvl").textContent =
      l1 === l2 ? "Level: " + LVN[l2] : "🚀 " + LVN[l1] + " → " + LVN[l2];
    const fd2 = new Array(nd).fill(0);
    let ft = 0;
    sessAll().forEach((x) => {
      if (x.t + x.d > cur.A && x.t < cur.B) {
        for (let di = 0; di < nd; di++) {
          const ds = new Date(
              cur.a.getFullYear(),
              cur.a.getMonth(),
              cur.a.getDate() + di,
            ).getTime(),
            de = new Date(
              cur.a.getFullYear(),
              cur.a.getMonth(),
              cur.a.getDate() + di + 1,
            ).getTime();
          const o = ovl(x.t, x.t + x.d, ds, de);
          if (o) {
            fd2[di] += o;
            ft += o;
          }
        }
      }
    });
    const showF = (j) => {
      $("fday").textContent = dayLbl(j);
      $("fbig").textContent = "⏱️ " + (fd2[j] ? fmtH(fd2[j]) : "0m") + " focus";
      $("fdet").textContent = fd2[j] ? "" : "No focus time";
      $("ftot").textContent =
        per + " total: ⏱️ " + (ft ? fmtH(ft) : "0m") + " focus time";
    };
    drawBars($("fchart"), fd2, showF, defIdx);
    fillQ($("rq"), pickQ("c"));
  }
  function fmt(ms) {
    const t = Math.floor(ms / 1000),
      h = Math.floor(t / 3600),
      m = Math.floor((t % 3600) / 60),
      q = t % 60;
    return [h, m, q].map((n) => String(n).padStart(2, "0")).join(":");
  }
  function fmtH(ms) {
    const m = Math.round(ms / 60000),
      h = Math.floor(m / 60);
    return h ? h + "h " + String(m % 60).padStart(2, "0") + "m" : m + "m";
  }
  function ovl(a1, a2, b1, b2) {
    return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  }
  function todaySw() {
    const n = new Date(),
      ds = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(),
      de = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1).getTime();
    let sum = 0;
    S.ses.forEach((x) => {
      sum += ovl(x.t, x.t + x.d, ds, de);
    });
    if (S.sw) sum += ovl(S.sw, Date.now(), ds, de);
    return sum;
  }
  const FP = 20,
    HR = 3600000;
  function prog() {
    return S.swRem + (S.sw ? Date.now() - S.sw : 0);
  }
  function updSw() {
    $("swt").textContent = fmt(S.sw ? Date.now() - S.sw : 0);
    $("swtoday").textContent = "Today: " + fmtH(todaySw());
    const pr = prog(),
      rem = HR - (pr % HR);
    $("swhint").textContent =
      S.sw || pr > 0
        ? "⏳ Next +" +
          FP +
          " points in " +
          (rem >= HR ? "60:00" : fmt(rem).slice(3))
        : "⏳ Earn " + FP + " points for every full hour you focus";
  }
  function awardFocus(n) {
    const L = FP * n,
      old = S.pts;
    if (S.swDay !== today()) {
      S.swDay = today();
      S.swH = 0;
    }
    S.pts += L;
    S.swH += n;
    bump();
    logE("f", L);
    undoData = null;
    if (lvlIdx(S.pts) > lvlIdx(old)) pendLv = lvlIdx(S.pts);
    save();
    const head =
      n === 1 ? "Hour " + S.swH + " done!" : n + " hours of focus done!";
    $("pe").textContent = "⏱️";
    $("pt").textContent = head + "  +" + L + " points";
    $("pb").textContent = "Yay!";
    pop.className = "";
    setQ("c");
    pop.style.display = "flex";
    confetti(45);
    fx("m");
    render();
  }
  function chkFocus() {
    if (
      !S.sw ||
      pop.style.display === "flex" ||
      $("lvup").style.display === "flex"
    )
      return;
    const n = Math.floor(prog() / HR);
    if (n > 0) {
      S.swRem -= n * HR;
      awardFocus(n);
    }
  }
  setInterval(chkFocus, 1000);
  function renderSw() {
    updSw();
    const b = $("swb");
    b.textContent = S.sw ? "Stop" : "Start";
    b.className = S.sw ? "stop" : "";
    const L = $("swlist");
    L.innerHTML = "";
    const rec = S.ses.slice(-6).reverse();
    if (!rec.length)
      L.innerHTML = '<div class="empty">No sessions yet. Tap Start ✨</div>';
    rec.forEach((x) => {
      const r = document.createElement("div");
      r.className = "srow";
      r.innerHTML = "<span></span><b></b>";
      const d = new Date(x.t);
      r.children[0].textContent =
        d.toLocaleDateString([], { month: "short", day: "numeric" }) +
        " · " +
        d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      r.children[1].textContent = fmt(x.d);
      L.appendChild(r);
    });
    $("swbtn").className = "snd" + (S.sw ? " run" : "");
  }
  function openSw() {
    $("sw").style.display = "block";
    renderSw();
  }
  function closeSw() {
    $("sw").style.display = "none";
  }
  function toggleSw() {
    if (S.sw) {
      const d = Date.now() - S.sw;
      if (d >= 1000) {
        S.ses.push({ t: S.sw, d: d });
        if (S.ses.length > 2000) S.ses.shift();
      }
      const total = S.swRem + d,
        n = Math.floor(total / HR);
      if (n > 0) awardFocus(n);
      else fx("e");
      S.swRem = total - n * HR;
      S.sw = null;
    } else {
      S.sw = Date.now();
      try {
        navigator.vibrate && navigator.vibrate(25);
      } catch (e) {}
    }
    save();
    renderSw();
  }
  setInterval(() => {
    if ($("sw").style.display === "block" && S.sw) updSw();
  }, 500);
  function sessAll() {
    return S.ses.concat(S.sw ? [{ t: S.sw, d: Date.now() - S.sw }] : []);
  }
  function focusOn(cd) {
    const ds = cd.getTime(),
      de = new Date(
        cd.getFullYear(),
        cd.getMonth(),
        cd.getDate() + 1,
      ).getTime();
    return sessAll().reduce((t, x) => t + ovl(x.t, x.t + x.d, ds, de), 0);
  }
  function drawBars(ch, arr, onSel, defIdx) {
    ch.innerHTML = "";
    const mx = Math.max.apply(null, arr.concat([1])),
      top = Math.max.apply(null, arr),
      bi = top > 0 ? arr.indexOf(top) : -1,
      cols = [];
    const sel = (j) => {
      cols.forEach((c) => c.classList.remove("sel"));
      cols[j].classList.add("sel");
      onSel(j);
    };
    arr.forEach((v, j) => {
      const col = document.createElement("div");
      col.className = "rcol";
      col.onclick = () => sel(j);
      const bar = document.createElement("div");
      bar.className = "rbar" + (j === bi ? " best" : "") + (v ? "" : " zero");
      bar.style.height = (v ? 8 + (v / mx) * 92 : 3) + "px";
      const lb = document.createElement("div");
      lb.className = "rlab";
      lb.textContent =
        rp === "w"
          ? "MTWTFSS"[j]
          : j + 1 === 1 || (j + 1) % 5 === 0
            ? String(j + 1)
            : "";
      col.appendChild(bar);
      col.appendChild(lb);
      ch.appendChild(col);
      cols.push(col);
    });
    if (cols.length) sel(Math.min(Math.max(defIdx, 0), cols.length - 1));
  }
  function curStreak() {
    return S.last === today() || S.last === yday() ? S.streak : 0;
  }
  function streakBest(sc) {
    const ks = Object.keys(sc)
      .filter((k) => sc[k] > 0)
      .map((k) => {
        const p = k.split("-").map(Number);
        return Math.round(Date.UTC(p[0], p[1] - 1, p[2]) / 864e5);
      })
      .sort((a, b) => a - b);
    let best = 0,
      run = 0,
      prev = null;
    ks.forEach((d) => {
      run = prev !== null && d - prev === 1 ? run + 1 : 1;
      best = Math.max(best, run);
      prev = d;
    });
    return best;
  }
  function whenStr(t) {
    const d = new Date(t),
      tm = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return key(d) === today()
      ? "Today · " + tm
      : d.toLocaleDateString([], { month: "short", day: "numeric" }) +
          " · " +
          tm;
  }
  function openPts() {
    renderPts();
    $("pts").style.display = "block";
  }
  function renderPts() {
    const li = lvlIdx(S.pts),
      nx = LVT[li + 1];
    $("pgBig").textContent = "⭐ " + S.pts + " points";
    $("pgLvl").textContent = nx
      ? LVN[li] + " · " + (nx - S.pts) + " points to " + LVN[li + 1]
      : LVN[li] + " · max level 🏆";
    $("pgBar").style.width =
      (nx ? Math.round(((S.pts - LVT[li]) / (nx - LVT[li])) * 100) : 100) + "%";
    const n = new Date(),
      dow = (n.getDay() + 6) % 7;
    const d0 = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime(),
      w0 = new Date(n.getFullYear(), n.getMonth(), n.getDate() - dow).getTime();
    let t = 0,
      w = 0,
      a = 0;
    S.log.forEach((e) => {
      if (e.p > 0 && (e.y === "c" || e.y === "m" || e.y === "f")) {
        a += e.p;
        if (e.t >= w0) w += e.p;
        if (e.t >= d0) t += e.p;
      }
    });
    $("pgT").textContent = t;
    $("pgW").textContent = w;
    $("pgA").textContent = a;
    const L = $("pgList");
    L.innerHTML = "";
    const rec = S.log.slice(-15).reverse();
    if (!rec.length)
      L.innerHTML =
        '<div class="empty">No activity yet. Finish something to see it here ✨</div>';
    rec.forEach((e) => {
      const base =
        {
          c: "Challenge",
          m: "Milestone",
          f: "Focus hour",
          b: "Dream achieved",
          p: "Missed",
        }[e.y] || "Activity";
      const lab = e.n ? base + " · " + e.n.slice(0, 36) : base;
      const r = document.createElement("div");
      r.className = "srow";
      const l = document.createElement("div");
      const a1 = document.createElement("div");
      a1.style.cssText = "color:var(--text);font-weight:600";
      a1.textContent = lab;
      const a2 = document.createElement("small");
      a2.textContent = whenStr(e.t);
      l.appendChild(a1);
      l.appendChild(a2);
      const v = document.createElement("b");
      v.textContent = e.p > 0 ? "+" + e.p : e.p < 0 ? "−" + Math.abs(e.p) : "✓";
      v.style.color =
        e.p < 0 ? "var(--danger)" : e.p > 0 ? "var(--green)" : "var(--mute)";
      r.appendChild(l);
      r.appendChild(v);
      L.appendChild(r);
    });
    const M = $("pgMap");
    M.innerHTML = "";
    LVN.forEach((nm, k) => {
      const r = document.createElement("div");
      r.className = "srow" + (k === li ? " cur" : "");
      const l = document.createElement("span");
      l.style.color = k <= li ? "var(--text)" : "var(--mute)";
      l.style.fontWeight = "600";
      l.textContent = (k <= li ? "✓ " : "") + nm;
      const v = document.createElement("b");
      v.textContent = LVT[k] + " pts";
      v.style.color = "var(--mute)";
      r.appendChild(l);
      r.appendChild(v);
      M.appendChild(r);
    });
  }
  function openStk() {
    renderStk();
    $("stk").style.display = "block";
  }
  function stkToStats() {
    $("stk").style.display = "none";
    openRecap();
  }
  function renderStk() {
    const sc = dayScores(),
      n = new Date(),
      T = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    const cur = curStreak(),
      best = Math.max(S.best || 0, streakBest(sc), cur);
    $("stBig").textContent = "🔥 " + cur;
    $("stSub").textContent = cur === 1 ? "day in a row" : "days in a row";
    $("stBest").textContent = best;
    let act = 0;
    for (let i = 0; i < 30; i++) {
      if (sc[key(new Date(T.getFullYear(), T.getMonth(), T.getDate() - i))] > 0)
        act++;
    }
    $("stAct").textContent = act;
    const row = $("st7");
    row.innerHTML = "";
    for (let i = 6; i >= 0; i--) {
      const d = new Date(T.getFullYear(), T.getMonth(), T.getDate() - i),
        on = sc[key(d)] > 0;
      const c = document.createElement("div");
      c.className = "sd" + (on ? " on" : "") + (i === 0 ? " today" : "");
      c.innerHTML = "<i></i><span></span>";
      c.querySelector("i").textContent = on ? "🔥" : "";
      c.querySelector("span").textContent = d
        .toLocaleDateString([], { weekday: "short" })
        .slice(0, 3);
      row.appendChild(c);
    }
    const todayOn = sc[key(T)] > 0;
    $("stMsg").textContent = todayOn
      ? "✓ Today is done. Your streak is safe."
      : cur > 0
        ? "Finish one thing today to keep your streak alive 🔥"
        : "Finish one thing today to start a streak 🔥";
  }
  let hv = "y",
    ho = 0;
  function setH(x) {
    hv = x;
    ho = 0;
    renderHeat();
  }
  function shiftH(d) {
    ho = Math.min(0, ho + d);
    renderHeat();
  }
  function dayScores() {
    const m = {};
    S.log.forEach((e) => {
      const k = key(new Date(e.t));
      if (e.y === "c" || e.y === "m" || e.y === "f") m[k] = (m[k] || 0) + e.p;
      else if (e.y === "b") m[k] = (m[k] || 0) + 10;
    });
    return m;
  }
  function lvlH(v) {
    return !v ? 0 : v < 10 ? 1 : v < 30 ? 2 : v < 60 ? 3 : 4;
  }
  function heatDetail(cd, v) {
    const f = focusOn(cd);
    $("hdet").textContent =
      cd.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) +
      " · " +
      (v || f
        ? (v ? v + " points" : "No points") +
          (f ? " · " + fmtH(f) + " focus" : "")
        : "No activity");
  }
  function renderHeat() {
    const sc = dayScores(),
      n = new Date(),
      T = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    $("hm").className = hv === "m" ? "on" : "";
    $("hy").className = hv === "y" ? "on" : "";
    $("hnav").style.display = hv === "m" ? "flex" : "none";
    $("hdet").textContent = "Tap a day for details";
    const g = $("hgrid");
    g.innerHTML = "";
    let cur = 0;
    const dd = new Date(T);
    if (!sc[key(dd)]) dd.setDate(dd.getDate() - 1);
    while (sc[key(dd)] > 0) {
      cur++;
      dd.setDate(dd.getDate() - 1);
    }
    let active = 0,
      best = 0,
      run = 0;
    if (hv === "y") {
      const rs = new Date(T.getFullYear(), T.getMonth(), T.getDate() - 364);
      const d = new Date(
        rs.getFullYear(),
        rs.getMonth(),
        rs.getDate() - ((rs.getDay() + 6) % 7),
      );
      const wrap = document.createElement("div");
      wrap.className = "hscroll";
      const row = document.createElement("div");
      row.className = "hyear";
      let lastM = -1;
      while (d <= T) {
        const wk = document.createElement("div");
        wk.className = "hwk";
        const lb = document.createElement("div");
        lb.className = "hl";
        if (d.getMonth() !== lastM) {
          lb.textContent = d.toLocaleDateString([], { month: "short" });
          lastM = d.getMonth();
        }
        wk.appendChild(lb);
        for (let q = 0; q < 7; q++) {
          const c = document.createElement("div");
          const cd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + q);
          if (cd > T || cd < rs) {
            c.className = "hc";
            c.style.visibility = "hidden";
          } else {
            const v = sc[key(cd)] || 0;
            c.className =
              "hc h" + lvlH(v) + (cd.getTime() === T.getTime() ? " hnow" : "");
            c.onclick = () => heatDetail(cd, v);
            if (v > 0) {
              active++;
              run++;
              best = Math.max(best, run);
            } else run = 0;
          }
          wk.appendChild(c);
        }
        row.appendChild(wk);
        d.setDate(d.getDate() + 7);
      }
      wrap.appendChild(row);
      g.appendChild(wrap);
      wrap.scrollLeft = wrap.scrollWidth;
    } else {
      const first = new Date(n.getFullYear(), n.getMonth() + ho, 1),
        dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      $("hlabel").textContent = first.toLocaleDateString([], {
        month: "long",
        year: "numeric",
      });
      $("hnext").style.visibility = ho < 0 ? "visible" : "hidden";
      const grid = document.createElement("div");
      grid.className = "hmonth";
      "MTWTFSS".split("").forEach((x) => {
        const h = document.createElement("div");
        h.className = "hdow";
        h.textContent = x;
        grid.appendChild(h);
      });
      for (let i = 0; i < (first.getDay() + 6) % 7; i++)
        grid.appendChild(document.createElement("div"));
      for (let k = 1; k <= dim; k++) {
        const cd = new Date(first.getFullYear(), first.getMonth(), k),
          c = document.createElement("div");
        if (cd > T) c.className = "hmc h0 fut";
        else {
          const v = sc[key(cd)] || 0;
          c.className =
            "hmc h" + lvlH(v) + (cd.getTime() === T.getTime() ? " hnow" : "");
          c.onclick = () => heatDetail(cd, v);
          if (v > 0) {
            active++;
            run++;
            best = Math.max(best, run);
          } else run = 0;
        }
        c.textContent = k;
        grid.appendChild(c);
      }
      g.appendChild(grid);
    }
    $("hs1").innerHTML = "<b>" + active + "</b> active days";
    $("hs2").innerHTML = "Current streak <b>" + cur + "</b>";
    $("hs3").innerHTML = "Best <b>" + best + "</b>";
  }
  let ostep = 0;
  function renderOnb() {
    const b = $("onbody");
    const mouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (ostep === 0) {
      b.innerHTML =
        '<div class="oe">👋</div><div class="oh">Win your day</div><p class="op">Turn what you need to do into small wins.</p>' +
        '<div class="orow"><span>✅</span><div><b>Challenges</b><small>Things to do today. They reset at midnight.</small></div></div>' +
        '<div class="orow"><span>🎯</span><div><b>Milestones</b><small>Bigger goals with deadlines.</small></div></div>' +
        '<div class="orow"><span>🌠</span><div><b>Bucket list</b><small>Dreams that keep you going.</small></div></div>';
    } else if (mouse) {
      b.innerHTML =
        '<div class="oe">✅</div><div class="oh">Click to win</div>' +
        '<div class="item" style="margin:16px 0"><div class="card" style="text-align:left"><div><b>Read for 30 minutes</b><small> · +5 pts</small></div><button class="x">🗑</button><button class="ok">✅</button></div></div>' +
        '<p class="op">Click the check button on the right of a challenge to complete it. You get points and a celebration. Keep your streak and level up. Use the trash button to delete one.</p>' +
        '<p class="op" style="font-size:13px">Shortcuts: N for a new note, S for the stopwatch, Esc to close a screen.</p>';
    } else {
      b.innerHTML =
        '<div class="oe">👉</div><div class="oh">Swipe to win</div>' +
        '<div class="demo"><div class="dh">✓ Complete</div><div class="dc">Read for 30 minutes</div></div>' +
        '<p class="op">Slide a challenge to the right to complete it. You get points and a celebration. Keep your streak and level up.</p>';
    }
    const d = $("odots");
    d.innerHTML = "";
    for (let j = 0; j < 2; j++) {
      const i = document.createElement("i");
      if (j === ostep) i.className = "on";
      d.appendChild(i);
    }
    $("onext").textContent = ostep === 1 ? "Let's go 🚀" : "Next";
  }
  function openOnb() {
    ostep = 0;
    $("onb").style.display = "block";
    renderOnb();
  }
  function nextOnb() {
    if (ostep < 1) {
      ostep++;
      renderOnb();
    } else finishOnb();
  }
  function finishOnb() {
    S.seen = true;
    save();
    $("onb").style.display = "none";
  }
  let cn = null,
    saveT = null,
    msgT = null;
  function flashMsg(m) {
    const e = $("msg");
    e.textContent = m;
    e.style.display = "block";
    clearTimeout(msgT);
    msgT = setTimeout(() => {
      e.style.display = "none";
    }, 1400);
  }
  function copyFb(t, done) {
    const a = document.createElement("textarea");
    a.value = t;
    a.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(a);
    a.select();
    try {
      document.execCommand("copy");
    } catch (e) {}
    a.remove();
    done();
  }
  function copyText(t) {
    const done = () => flashMsg("Copied ✓");
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(t).then(done, () => copyFb(t, done));
    else copyFb(t, done);
  }
  function openEd() {
    $("ntitle").value = cn.title || "";
    $("ntitle").placeholder = cn.isNew
      ? "Quick Note " + (S.noteN + 1)
      : cn.title || "Quick Note";
    $("nbody").value = cn.text || "";
    $("nsaved").textContent = "";
    $("nt").style.display = "block";
    $("nbody").focus();
  }
  function newNote() {
    cn = { id: Date.now(), title: "", text: "", t: Date.now(), isNew: true };
    $("nl").style.display = "none";
    openEd();
  }
  function persist() {
    if (!cn) return;
    const txt = $("nbody").value,
      tt = $("ntitle").value.trim();
    cn.text = txt;
    if (!txt.trim() && !tt) {
      if (!cn.isNew) {
        S.notes = S.notes.filter((n) => n.id !== cn.id);
        save();
      }
      return;
    }
    if (cn.isNew) {
      cn.isNew = false;
      cn.title = tt || "Quick Note " + ++S.noteN;
      S.notes.push(cn);
      $("ntitle").value = cn.title;
    } else cn.title = tt || cn.title || "Quick Note";
    cn.t = Date.now();
    save();
    $("nsaved").textContent = "Saved ✓";
  }
  function onType() {
    clearTimeout(saveT);
    $("nsaved").textContent = "…";
    saveT = setTimeout(persist, 300);
  }
  function closeNote() {
    clearTimeout(saveT);
    persist();
    $("nt").style.display = "none";
    cn = null;
    openNotes();
  }
  function copyNote() {
    persist();
    copyText($("nbody").value);
  }
  function delNote() {
    if (!cn) return;
    if (cn.isNew) {
      $("nt").style.display = "none";
      cn = null;
      openNotes();
      return;
    }
    ask("Delete this note?", "Yes, delete", () => {
      S.notes = S.notes.filter((x) => x.id !== cn.id);
      save();
      $("nt").style.display = "none";
      cn = null;
      openNotes();
    });
  }
  function openNotes() {
    renderNotes();
    $("nl").style.display = "block";
  }
  function closeNotes() {
    $("nl").style.display = "none";
  }
  function renderNotes() {
    const L = $("nlist");
    L.innerHTML = "";
    if (!S.notes.length)
      L.innerHTML =
        '<div class="empty">No notes yet. Tap + to capture an idea ✨</div>';
    S.notes
      .slice()
      .sort((a, b) => b.t - a.t)
      .forEach((n) => {
        const c = document.createElement("div");
        c.className = "card ncard";
        c.innerHTML =
          '<div style="flex:1;min-width:0"><b></b><small class="np"></small><small class="nd"></small></div><div class="nb2"><button class="x nc">📋</button><button class="x ndl">🗑</button></div>';
        c.querySelector("b").textContent = n.title;
        c.querySelector(".np").textContent = (
          n.text.split("\n").find((l) => l.trim()) || ""
        ).slice(0, 80);
        const d = new Date(n.t);
        c.querySelector(".nd").textContent =
          d.toLocaleDateString([], { month: "short", day: "numeric" }) +
          " · " +
          d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        c.onclick = () => {
          cn = n;
          $("nl").style.display = "none";
          openEd();
        };
        c.querySelector(".nc").onclick = (e) => {
          e.stopPropagation();
          copyText(n.text);
        };
        c.querySelector(".ndl").onclick = (e) => {
          e.stopPropagation();
          ask("Delete this note?", "Yes, delete", () => {
            S.notes = S.notes.filter((x) => x.id !== n.id);
            save();
            renderNotes();
          });
        };
        L.appendChild(c);
      });
  }
  function addC() {
    const t = $("ct"),
      v = t.value.trim();
    if (!v) return;
    S.items.push({
      id: Date.now(),
      t: v,
      type: "c",
      lv: "c",
      day: today(),
      rep: $("crep").checked,
      dl: null,
      d: false,
    });
    t.value = "";
    $("crep").checked = false;
    save();
    render();
  }
  function addM() {
    const v = $("mt").value.trim();
    if (!v) return;
    const dv = $("dl").value;
    S.items.push({
      id: Date.now(),
      t: v,
      type: "m",
      lv: cur,
      dl: dv ? new Date(dv).getTime() : null,
      d: false,
    });
    $("mt").value = "";
    $("dl").value = "";
    save();
    render();
  }
  function addB() {
    const t = $("bt"),
      v = t.value.trim();
    if (!v) return;
    S.items.push({ id: Date.now(), t: v, type: "b", lv: curB, d: false });
    t.value = "";
    save();
    render();
  }
  function achieve(id) {
    const i = S.items.find((x) => x.id === id);
    if (!i || i.d) return;
    undoData = {
      id: i.id,
      pts: S.pts,
      streak: S.streak,
      last: S.last,
      log: S.log.length,
    };
    i.d = true;
    bump();
    logE("b", 0, i.t);
    save();
    const lv = i.lv || "e";
    $("pe").innerHTML = badge("bk", lv);
    $("pt").textContent = "Bucket list item achieved: " + i.t;
    $("pb").textContent = "Yay!";
    pop.className = lv === "h" || lv === "g" ? "big" : "";
    pop.style.display = "flex";
    celebrate(lv);
    fx(lv);
    setQ("b");
    render();
  }
  const EM = ["✨", "🌍", "🚀", "🎯", "💫", "🏔️", "🎸", "🏝️"];
  function elB(i) {
    const BL = BLV[i.lv || "e"];
    const w = document.createElement("div");
    w.className = "item" + (i.d ? " gold" : "");
    if (!i.d) {
      w.innerHTML = '<div class="hint">🌟 Achieved</div>';
    }
    const c = document.createElement("div");
    c.className = "card dcard";
    c.innerHTML =
      '<div class="em"></div><div style="flex:1;min-width:0"><b></b><small></small></div><button class="x">🗑</button>';
    c.style.borderLeft = "5px solid " + BL[1];
    c.querySelector(".em").textContent = i.d ? "🏆" : EM[i.id % EM.length];
    c.querySelector(".em").style.background = BL[1] + "26";
    c.querySelector("b").textContent = i.t;
    const sm = c.querySelector("small");
    sm.textContent =
      " · " +
      (i.d
        ? "Achieved ✓"
        : matchMedia("(hover: hover) and (pointer: fine)").matches
          ? "Click ✅ to complete"
          : "Slide right to complete");
    const tg = document.createElement("span");
    tg.className = "tag";
    tg.style.color = BL[1];
    tg.textContent = BL[0];
    sm.prepend(tg);
    c.querySelector(".x").onclick = () =>
      ask("Remove from your bucket list?", "Yes, remove", () => del(i.id));
    if (!i.d) {
      let sx = 0,
        dx = 0;
      c.addEventListener(
        "touchstart",
        (e) => {
          sx = e.touches[0].clientX;
          dx = 0;
          c.style.transition = "none";
        },
        { passive: true },
      );
      c.addEventListener(
        "touchmove",
        (e) => {
          dx = Math.max(0, e.touches[0].clientX - sx);
          c.style.transform = "translateX(" + dx + "px)";
        },
        { passive: true },
      );
      c.addEventListener("touchend", () => {
        c.style.transition = "transform .25s";
        if (dx > 110)
          ask("Did you achieve this?", "Yes, achieved", () => achieve(i.id));
        c.style.transform = "";
      });
      c.ondblclick = () =>
        ask("Did you achieve this?", "Yes, achieved", () => achieve(i.id));
      const ok = document.createElement("button");
      ok.className = "ok";
      ok.textContent = "✅";
      ok.title = "Mark as achieved";
      ok.onclick = () =>
        ask("Did you achieve this?", "Yes, achieved", () => achieve(i.id));
      c.appendChild(ok);
    }
    w.appendChild(c);
    return w;
  }
  let dreamId = null;
  function setDream() {
    const open = S.items.filter((i) => i.type === "b" && !i.d);
    let it = open.find((i) => i.id === dreamId);
    if (!it && open.length) {
      it = open[Math.floor(Math.random() * open.length)];
      dreamId = it.id;
    }
    const e = $("dream");
    if (it) {
      e.style.display = "block";
      e.textContent = "✨ Keep going for: " + it.t;
    } else {
      e.style.display = "none";
      dreamId = null;
    }
  }
  function del(id) {
    S.items = S.items.filter((i) => i.id !== id);
    save();
    render();
  }
  function resetAll() {
    ask(
      "Reset all progress? This deletes every challenge, milestone, bucket list item, your points, streak and level. It cannot be undone.",
      "Continue",
      () =>
        ask(
          "Last warning. Everything will be erased for good. Are you absolutely sure?",
          "Yes, erase all",
          doReset,
        ),
    );
  }
  function doReset() {
    const m = S.mute;
    S = {
      items: [],
      pts: 0,
      streak: 0,
      last: "",
      mute: m,
      log: [],
      ses: [],
      sw: null,
      swRem: 0,
      swH: 0,
      swDay: "",
      seen: true,
      notes: S.notes,
      noteN: S.noteN,
    };
    dreamId = null;
    pendLv = null;
    save();
    setTab("c");
    render();
  }
  function closeAsk() {
    $("ask").style.display = "none";
  }
  function ask(q, label, f) {
    $("aq").textContent = q;
    const y = $("ay");
    y.textContent = label;
    y.onclick = () => {
      closeAsk();
      f();
    };
    $("ask").style.display = "flex";
  }
  const askDone = (id) =>
    ask("Are you sure you have finished this challenge?", "Yes, done", () =>
      complete(id),
    );
  function dueText(ms) {
    const m = Math.round((ms - Date.now()) / 60000),
      a = Math.abs(m);
    const f =
      a < 60
        ? a + "m"
        : a < 1440
          ? Math.floor(a / 60) + "h"
          : Math.floor(a / 1440) + "d";
    return m < 0 ? ["Overdue by " + f, true] : ["Due in " + f, false];
  }
  function checkFails() {
    const now = Date.now(),
      nf = [];
    S.items.forEach((i) => {
      if (i.type === "m" && !i.d && !i.f && i.dl && i.dl < now) {
        const pen = Math.round(LV[i.lv || "e"][1] / 2);
        i.f = true;
        i.pen = pen;
        S.pts = Math.max(0, S.pts - pen);
        logE("p", -pen, i.t);
        nf.push(i);
      }
    });
    if (nf.length) {
      save();
      const tot = nf.reduce((a, i) => a + i.pen, 0);
      $("pe").textContent = "😢";
      $("pt").textContent =
        (nf.length === 1
          ? "Failed to complete: " + nf[0].t
          : nf.length + " milestones failed") +
        "  −" +
        tot +
        " points";
      $("pb").textContent = "OK";
      pop.style.display = "flex";
      fx("x");
      setQ("x");
    }
  }
  const BADGE_COL = {
    e: [C.easy, C.easy2],
    m: [C.medium, C.medium2],
    h: [C.hard, C.hard2],
    g: [C.extreme, C.extreme2],
  };
  const W =
    'fill="#fff" stroke="#fff" stroke-width="3" stroke-linejoin="round"';
  const BADGE_ICON = {
    ms: {
      e: '<path d="M28 18 V64" stroke="#fff" stroke-width="5" stroke-linecap="round"/><path d="M30 20 H56 L48 31 L56 42 H30 Z" fill="#fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>',
      m: '<circle cx="40" cy="40" r="19" fill="none" stroke="#fff" stroke-width="5"/><circle cx="40" cy="40" r="7" fill="#fff"/>',
      h: '<path d="M46 12 L24 44 H38 L34 68 L56 34 H42 Z" ' + W + "/>",
      g:
        '<polygon points="40,19 45.3,33.7 60.9,34.2 48.6,43.8 52.9,58.8 40,50 27.1,58.8 31.4,43.8 19.1,34.2 34.7,33.7" ' +
        W +
        "/>",
    },
    bk: {
      e:
        '<path d="M40 14 C42 30 50 38 66 40 C50 42 42 50 40 66 C38 50 30 42 14 40 C30 38 38 30 40 14 Z" ' +
        W +
        "/>",
      m:
        '<path d="M40 60 C20 46 18 34 26 28 C32 24 38 27 40 32 C42 27 48 24 54 28 C62 34 60 46 40 60 Z" ' +
        W +
        "/>",
      h: '<path d="M14 60 L32 30 L42 46 L50 36 L66 60 Z" ' + W + "/>",
      g:
        '<path d="M18 56 L21 28 L33 40 L40 22 L47 40 L59 28 L62 56 Z" ' +
        W +
        "/>",
    },
  };
  function badge(kind, lv) {
    const g = BADGE_COL[lv] || BADGE_COL.e,
      ic = (BADGE_ICON[kind] || BADGE_ICON.ms)[lv] || BADGE_ICON.ms.e;
    return (
      '<svg class="ck" style="filter:drop-shadow(0 6px 14px ' +
      g[0] +
      '99)" viewBox="0 0 80 80" width="84" height="84"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' +
      g[0] +
      '"/><stop offset="1" stop-color="' +
      g[1] +
      '"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#bg)"/>' +
      ic +
      "</svg>"
    );
  }
  function complete(id) {
    const i = S.items.find((x) => x.id === id);
    if (!i || i.d || i.f) return;
    const L = LV[i.lv || "e"],
      old = S.pts;
    undoData = {
      id: i.id,
      pts: S.pts,
      streak: S.streak,
      last: S.last,
      log: S.log.length,
    };
    i.d = true;
    S.pts += L[1];
    const up = bump();
    logE(i.type, L[1], i.t);
    save();
    if (i.type === "m") $("pe").innerHTML = badge("ms", i.lv || "e");
    else
      $("pe").innerHTML =
        '<svg class="ck" viewBox="0 0 80 80" width="84" height="84"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--blue)"/><stop offset="1" style="stop-color:var(--blue-2)"/></linearGradient></defs><circle cx="40" cy="40" r="36" fill="url(#cg)"/><path class="ckp" d="M24 41 l11 11 l21 -23" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    let ex = "";
    if (lvlIdx(S.pts) > lvlIdx(old)) pendLv = lvlIdx(S.pts);
    if (up && S.streak > 1) ex += "  🔥 " + S.streak + "-day streak";
    $("pt").textContent =
      (i.type === "m" ? "Milestone complete!" : "Challenge complete!") +
      "  +" +
      L[1] +
      " points" +
      ex;
    fx(i.type === "m" ? i.lv || "e" : "e");
    setQ(i.type === "m" ? "m" : "c");
    $("pb").textContent = "Yay!";
    pop.style.display = "flex";
    confetti(L[3]);
    if (i.type === "m" && i.lv === "g") {
      celebrate("g");
      pop.className = "big";
    }
    render();
  }
  function confetti(n) {
    const cols = [C.blue, C.purple, C.green, C.orange];
    for (let k = 0; k < n; k++) {
      const e = document.createElement("div");
      e.className = "c";
      e.style.left = Math.random() * 100 + "vw";
      e.style.background = cols[k % cols.length];
      e.style.animationDelay = Math.random() * 0.4 + "s";
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 2200);
    }
  }
  function el(i) {
    const w = document.createElement("div");
    w.className = "item" + (i.d ? " done" : "") + (i.f ? " fail" : "");
    if (!i.d && !i.f) w.innerHTML = '<div class="hint">✓ Complete</div>';
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML =
      "<div><b></b><small></small></div>" +
      (i.d ? "" : '<button class="x">🗑</button>');
    c.querySelector("b").textContent = i.t;
    const L = LV[i.lv || "e"];
    const tg = c.querySelector("small");
    tg.textContent = i.f
      ? " · Failed to complete · −" + i.pen + " pts"
      : " · +" + L[1] + " pts" + (i.d ? " · Done ✓" : "");
    const lb = document.createElement("span");
    lb.className = "tag";
    lb.style.color = L[2];
    lb.textContent = i.type === "c" ? (i.rep ? "Every day 🔁" : "Today") : L[0];
    tg.prepend(lb);
    if (i.dl && !i.d && !i.f) {
      const o = document.createElement("div"),
        x = dueText(i.dl);
      o.textContent =
        "⏰ " +
        x[0] +
        " · " +
        new Date(i.dl).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      o.style.cssText =
        "margin-top:4px;font-weight:600;font-size:12px;color:" +
        (x[1] ? "var(--danger)" : "var(--mute)");
      tg.appendChild(o);
    }
    const xb = c.querySelector(".x");
    if (xb)
      xb.onclick = () =>
        ask("Delete this challenge?", "Yes, delete", () => del(i.id));
    if (!i.d && !i.f) {
      let sx = 0,
        dx = 0;
      c.addEventListener(
        "touchstart",
        (e) => {
          sx = e.touches[0].clientX;
          dx = 0;
          c.style.transition = "none";
        },
        { passive: true },
      );
      c.addEventListener(
        "touchmove",
        (e) => {
          dx = Math.max(0, e.touches[0].clientX - sx);
          c.style.transform = "translateX(" + dx + "px)";
        },
        { passive: true },
      );
      c.addEventListener("touchend", () => {
        c.style.transition = "transform .25s";
        if (dx > 110) askDone(i.id);
        c.style.transform = "";
      });
      c.ondblclick = () => askDone(i.id);
      const ok = document.createElement("button");
      ok.className = "ok";
      ok.textContent = "✅";
      ok.title = "Mark as done";
      ok.onclick = () => askDone(i.id);
      c.appendChild(ok);
    }
    w.appendChild(c);
    return w;
  }
  function fill(id, arr, empty) {
    const e = $(id);
    e.innerHTML = "";
    if (!arr.length && empty)
      e.innerHTML = '<div class="empty">' + empty + "</div>";
    arr.forEach((i) => e.appendChild(el(i)));
  }
  function render() {
    $("score").textContent = "⭐ " + S.pts + " points";
    $("swbtn").className = "snd" + (S.sw ? " run" : "");
    const sv = S.last === today() || S.last === yday() ? S.streak : 0;
    $("streak").textContent = "🔥 " + sv;
    $("snd").textContent = S.mute ? "🔕" : "🔔";
    const li = lvlIdx(S.pts),
      nx = LVT[li + 1];
    $("lvt").textContent = nx
      ? LVN[li] + " · " + (nx - S.pts) + " points to " + LVN[li + 1]
      : LVN[li] + " · max level 🏆";
    $("lvb").style.width =
      (nx ? Math.round(((S.pts - LVT[li]) / (nx - LVT[li])) * 100) : 100) + "%";
    const C = S.items.filter((i) => i.type === "c"),
      M = S.items.filter((i) => i.type === "m");
    const ca = C.filter((i) => !i.d),
      cd = C.filter((i) => i.d);
    fill("cact", ca, "Nothing for today. Add one ✨");
    fill("cdone", cd);
    $("h2").style.display = cd.length ? "" : "none";
    $("n1").textContent = "(" + ca.length + ")";
    $("n2").textContent = "(" + cd.length + ")";
    const B = S.items.filter((i) => i.type === "b"),
      ba = B.filter((i) => !i.d),
      bd = B.filter((i) => i.d);
    const be = $("bact");
    be.innerHTML = ba.length
      ? ""
      : '<div class="empty">Add something you dream of ✨</div>';
    ba.forEach((i) => be.appendChild(elB(i)));
    const bf = $("bdone");
    bf.innerHTML = "";
    bd.forEach((i) => bf.appendChild(elB(i)));
    $("h7").style.display = bd.length ? "" : "none";
    $("n6").textContent = "(" + ba.length + ")";
    $("n7").textContent = "(" + bd.length + ")";
    $("ptxt").textContent = B.length
      ? "🌠 " + bd.length + " of " + B.length + " dreams achieved"
      : "🌠 Your dreams will show up here";
    $("pbar").style.width =
      (B.length ? Math.round((bd.length / B.length) * 100) : 0) + "%";
    setDream();
    const ma = M.filter((i) => !i.d && !i.f).sort(
      (x, y) => (x.dl || 1e15) - (y.dl || 1e15),
    );
    const md = M.filter((i) => i.d),
      mf = M.filter((i) => i.f);
    fill("mact", ma, "No milestones yet. Add one above ✨");
    fill("mdone", md, "Nothing yet");
    fill("mfail", mf);
    $("h5").style.display = mf.length ? "" : "none";
    $("n3").textContent = "(" + ma.length + ")";
    $("n4").textContent = "(" + md.length + ")";
    $("n5").textContent = "(" + mf.length + ")";
  }
  function tick() {
    expire();
    checkFails();
    render();
  }
  $("ct").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addC();
  });
  $("nbody").addEventListener("input", onType);
  $("ntitle").addEventListener("input", onType);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearTimeout(saveT);
      persist();
    }
  });
  $("bt").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addB();
  });
  $("mt").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addM();
  });
  drawLv();
  drawBLv();
  tick();
  if (!S.seen) {
    if (S.items.length || S.pts || S.log.length) {
      S.seen = true;
      save();
    } else openOnb();
  }
  setInterval(tick, 60000);

  try {
    (window as any).$ = $;
  } catch (e) {}
  try {
    (window as any).addB = addB;
  } catch (e) {}
  try {
    (window as any).addC = addC;
  } catch (e) {}
  try {
    (window as any).addM = addM;
  } catch (e) {}
  try {
    (window as any).closeAsk = closeAsk;
  } catch (e) {}
  try {
    (window as any).closeNote = closeNote;
  } catch (e) {}
  try {
    (window as any).closeNotes = closeNotes;
  } catch (e) {}
  try {
    (window as any).closePop = closePop;
  } catch (e) {}
  try {
    (window as any).closeRecap = closeRecap;
  } catch (e) {}
  try {
    (window as any).closeSw = closeSw;
  } catch (e) {}
  try {
    (window as any).copyNote = copyNote;
  } catch (e) {}
  try {
    (window as any).delNote = delNote;
  } catch (e) {}
  try {
    (window as any).finishOnb = finishOnb;
  } catch (e) {}
  try {
    (window as any).newNote = newNote;
  } catch (e) {}
  try {
    (window as any).nextOnb = nextOnb;
  } catch (e) {}
  try {
    (window as any).openNotes = openNotes;
  } catch (e) {}
  try {
    (window as any).openOnb = openOnb;
  } catch (e) {}
  try {
    (window as any).openPts = openPts;
  } catch (e) {}
  try {
    (window as any).openRecap = openRecap;
  } catch (e) {}
  try {
    (window as any).openStk = openStk;
  } catch (e) {}
  try {
    (window as any).openSw = openSw;
  } catch (e) {}
  try {
    (window as any).resetAll = resetAll;
  } catch (e) {}
  try {
    (window as any).setH = setH;
  } catch (e) {}
  try {
    (window as any).setRp = setRp;
  } catch (e) {}
  try {
    (window as any).setTab = setTab;
  } catch (e) {}
  try {
    (window as any).shiftH = shiftH;
  } catch (e) {}
  try {
    (window as any).shiftR = shiftR;
  } catch (e) {}
  try {
    (window as any).stkToStats = stkToStats;
  } catch (e) {}
  try {
    (window as any).toggleSnd = toggleSnd;
  } catch (e) {}
  try {
    (window as any).toggleSw = toggleSw;
  } catch (e) {}
  try {
    (window as any).undoNow = undoNow;
  } catch (e) {}
}
