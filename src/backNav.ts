const PANELS = ["nt", "nl", "sw", "pts", "stk", "recap", "gv"]; // nt is topmost
const el = (id: string) => document.getElementById(id);
const isOpen = (id: string) => {
  const e = el(id);
  return !!e && getComputedStyle(e).display !== "none";
};
const count = () =>
  PANELS.filter(isOpen).length + (isOpen('nt') && !isOpen('nl') ? 1 : 0);

export function installBackNav() {
  let pushed = 0;
  let ignore = 0;
  history.replaceState({ d: 0 }, "");

  const sync = () => {
    const n = count();
    while (pushed < n) history.pushState({ d: ++pushed }, "");
    if (pushed > n) {
      ignore++;
      history.go(-(pushed - n));
      pushed = n;
    }
  };

  const obs = new MutationObserver(sync);
  PANELS.forEach((id) => {
    const e = el(id);
    if (e)
      obs.observe(e, { attributes: true, attributeFilter: ["style", "class"] });
  });

  const onPop = (ev: PopStateEvent) => {
    if (ignore > 0) {
      ignore--;
      return;
    }
    pushed = ev.state?.d ?? 0;
    const top = PANELS.find(isOpen);
    if (!top) return;
    const p = el(top)!;
    (
      p.querySelector(".nback") ?? p.querySelector(".vhead > button")
    )?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  };
  window.addEventListener("popstate", onPop);
  return () => {
    obs.disconnect();
    window.removeEventListener("popstate", onPop);
  };
}
