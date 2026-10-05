import json, time, sys
from playwright.sync_api import sync_playwright

URL = "http://127.0.0.1:5199/"
res = []
def ok(c, m):
    res.append(c); print(("PASS " if c else "FAIL ") + m)

def seed(ctx_page, state):
    ctx_page.add_init_script("""(s)=>{ if(!localStorage.getItem('__seeded')){ localStorage.setItem('ch', s); localStorage.setItem('__seeded','1'); } }""" .replace("(s)=>", "") if False else None) if False else None

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
    now = int(time.time()*1000)
    def key(t):
        import datetime
        d = datetime.datetime.fromtimestamp(t/1000); return f"{d.year}-{d.month}-{d.day}"
    today = key(now)
    state = {"items": [], "pts": 0, "log": [], "ses": [], "seen": True, "streak": 0, "last": ""}
    ctx = b.new_context(viewport={"width": 1280, "height": 800})
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.goto(URL)
    page.evaluate("s => { localStorage.clear(); localStorage.setItem('ch', s) }", json.dumps(state))
    page.reload(); page.wait_for_timeout(800)

    # 1. Fresh user: vault shows only locked gifts, no gift names leak
    page.get_by_role("button", name="Gift Vault").first.click()
    page.wait_for_timeout(300)
    ok(page.locator("#gv").is_visible(), "vault opens from sidebar")
    ok(page.locator(".gv-card.locked").count() == 36, f"36 sealed gifts on a fresh account ({page.locator('.gv-card.locked').count()})")
    html = page.locator("#gv").inner_html()
    leaks = [n for n in ["First Spark", "The Centurion", "Phoenix Heart", "Apex Sigil", "Legendary Core"] if n in html]
    ok(not leaks, f"no gift names in the DOM while locked {leaks}")
    ok(page.locator("#gvr").count() == 0, "no reveal overlay on a fresh account")
    page.screenshot(path="/tmp/shot_vault_desktop.png")
    page.get_by_role("button", name="Done").first.click() if False else page.locator("#gv .vhead button").click()

    # 2. Complete a challenge through the real UI
    page.fill("#ct", "Read 10 pages")
    page.click(".qadd button")
    page.wait_for_timeout(200)
    page.locator("#cact .card .ok").first.click()
    page.wait_for_timeout(200)
    page.locator("#ay").click()
    page.wait_for_timeout(500)
    ok(page.locator("#pop").is_visible(), "app's own completion popup shows")
    ok(page.locator("#gvr").count() == 0, "gift reveal is held back behind the app's popup")
    page.locator("#pb").click()           # Yay!
    page.wait_for_timeout(300)
    # undo toast still active for ~2s -> reveal should still wait
    ok(page.locator("#gvr").count() == 0, "reveal waits during the Undo window")
    page.wait_for_timeout(3000)
    ok(page.locator("#gvr").count() == 1, "reveal appears once the app is calm")
    body = page.locator("#gvr").inner_text()
    ok("First Spark" not in body, "gift name hidden before opening")
    ok("Open gift" in body, "shows Open gift button")
    page.screenshot(path="/tmp/shot_reveal_sealed.png")

    # 3. Refresh mid-reveal: it must come back, and nothing is duplicated
    page.reload(); page.wait_for_timeout(2500)
    ok(page.locator("#gvr").count() == 1, "pending reveal survives a refresh")
    raw = json.loads(page.evaluate("localStorage.getItem('ch_gifts_v1')"))
    ok(list(raw["gifts"].keys()) == ["challenge-1"], f"exactly one gift stored {list(raw['gifts'].keys())}")

    # 4. Open -> reveal -> collect
    page.get_by_role("button", name="Open gift").click()
    page.wait_for_timeout(300)
    page.screenshot(path="/tmp/shot_reveal_opening.png")
    page.wait_for_timeout(1500)
    body = page.locator("#gvr").inner_text()
    ok("First Spark" in body and "Common" in body, "name + rarity shown after the reveal")
    page.screenshot(path="/tmp/shot_reveal_open.png")
    page.get_by_role("button", name="Collect Gift").click()
    page.wait_for_timeout(500)
    ok(page.locator("#gvr").count() == 0, "overlay closes after collecting")
    raw = json.loads(page.evaluate("localStorage.getItem('ch_gifts_v1')"))
    ok("collectedAt" in raw["gifts"]["challenge-1"], "collected timestamp persisted")
    page.reload(); page.wait_for_timeout(2500)
    ok(page.locator("#gvr").count() == 0, "collected gift never re-appears after refresh")
    ok(json.loads(page.evaluate("localStorage.getItem('ch')"))["pts"] == 5, "app points untouched by gifts (5)")

    # 5. Collection view shows it; deleting the challenge doesn't remove it
    page.get_by_role("button", name="Gift Vault").first.click(); page.wait_for_timeout(300)
    page.get_by_role("tab", name="Collection (1)").click(); page.wait_for_timeout(200)
    ok(page.locator(".gv-card.collected").count() == 1, "collection lists the gift")
    t = page.locator(".gv-card.collected").inner_text()
    ok("Unlocked by: Complete your first challenge" in t and "Collected" in t, "collected card shows achievement + date")
    page.screenshot(path="/tmp/shot_collection.png")
    page.locator("#gv .vhead button").click()
    page.evaluate("""()=>{const s=JSON.parse(localStorage.getItem('ch'));s.items=[];s.streak=0;s.last='';s.pts=0;localStorage.setItem('ch',JSON.stringify(s))}""")
    page.reload(); page.wait_for_timeout(1500)
    raw = json.loads(page.evaluate("localStorage.getItem('ch_gifts_v1')"))
    ok("challenge-1" in raw["gifts"] and "collectedAt" in raw["gifts"]["challenge-1"], "gift stays collected after progress is wiped")

    # 6. Existing user with lots of progress -> queue, one at a time
    page.evaluate("""(now)=>{localStorage.clear();const L=[];for(let i=0;i<30;i++)L.push({t:now-i*3600e3,y:'c',p:5,a:0,n:''});
      localStorage.setItem('ch',JSON.stringify({items:[],pts:300,log:L,ses:[{t:now-9e6,d:3600e3*1.2}],seen:true,streak:4,last:''}))}""", now)
    page.reload(); page.wait_for_timeout(2500)
    n = len(json.loads(page.evaluate("localStorage.getItem('ch_gifts_v1')"))["gifts"])
    ok(n >= 6, f"existing user gets earned gifts once ({n})")
    ok(page.locator("#gvr").count() == 1, "only one reveal dialog at a time")
    ok(page.locator(".gv-reveal").count() == 1, "no overlapping modals")
    # Not now -> closes, stays pending, badge shows in sidebar
    page.keyboard.press("Escape"); page.wait_for_timeout(400)
    ok(page.locator("#gvr").count() == 0, "Escape closes the reveal")
    raw = json.loads(page.evaluate("localStorage.getItem('ch_gifts_v1')"))
    ok(all("collectedAt" not in v for v in raw["gifts"].values()), "closing without collecting keeps every gift pending")
    ok(page.locator(".gv-badge").count() == 1, "sidebar badge shows pending count: " + page.locator(".gv-badge").inner_text())
    page.reload(); page.wait_for_timeout(2500)
    ok(page.locator("#gvr").count() == 1, "pending gifts reappear next visit")
    # walk the queue
    page.get_by_role("button", name="Open gift").click(); page.wait_for_timeout(1700)
    page.get_by_role("button", name="Collect Gift").click(); page.wait_for_timeout(500)
    ok(page.locator("#gvr").count() == 1, "next queued gift appears after collecting")
    ok(page.locator("#gvr").inner_text().count("Open gift") == 1, "next gift starts sealed")
    page.screenshot(path="/tmp/shot_queue.png")
    page.get_by_role("button", name="Collect all", exact=False).click() if page.get_by_role("button", name="Collect all", exact=False).count() else None
    page.wait_for_timeout(300)

    # 7. Mobile
    m = b.new_context(viewport={"width": 390, "height": 800}, has_touch=True, is_mobile=True)
    mp = m.new_page(); merr = []
    mp.on("pageerror", lambda e: merr.append(str(e)))
    mp.goto(URL)
    mp.evaluate("s => { localStorage.clear(); localStorage.setItem('ch', s) }", json.dumps(state))
    mp.reload(); mp.wait_for_timeout(800)
    mp.locator("#gvbtn").tap(); mp.wait_for_timeout(300)
    ok(mp.locator("#gv").is_visible(), "vault opens from the phone header button")
    sw = mp.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1 && document.querySelector('#gv').scrollWidth <= window.innerWidth + 1")
    ok(sw, "no horizontal overflow at 390px")
    mp.screenshot(path="/tmp/shot_mobile_vault.png")
    mp.locator("#gv .vhead button").tap()

    # 8. Reduced motion
    r = b.new_context(viewport={"width": 390, "height": 800}, reduced_motion="reduce")
    rp = r.new_page()
    rp.goto(URL); rp.evaluate("s => { localStorage.clear(); localStorage.setItem('ch', s) }", json.dumps({**state, "pts": 120, "log": [{"t": now, "y": "c", "p": 5, "a": 0, "n": ""}]}))
    rp.reload(); rp.wait_for_timeout(2500)
    rp.get_by_role("button", name="Open gift").click(); rp.wait_for_timeout(600)
    ok(rp.locator(".gv-burst").count() == 0 and rp.locator(".gv-flash").count() == 0, "reduced motion: no particles or flash")
    ok(rp.get_by_role("button", name="Collect Gift").count() == 1, "reduced motion: reveal still completes")

    ok(not [e for e in errors+merr if "favicon" not in e], f"no console/page errors {errors+merr}")
    b.close()
print(f"\n{sum(res)}/{len(res)} passed"); sys.exit(0 if all(res) else 1)
