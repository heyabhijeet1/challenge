import json, time
from playwright.sync_api import sync_playwright
U="http://127.0.0.1:5199/"; res=[]
def ok(c,m): res.append(c); print(("PASS " if c else "FAIL ")+m)
now=int(time.time()*1000)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport={"width":1280,"height":800},color_scheme="dark").new_page()
    errs=[]; pg.on("pageerror",lambda e:errs.append(str(e)))
    notes=[{"id":now-3000,"title":"Oldest","text":"a","t":now-3000},{"id":now-2000,"title":"Middle","text":"b","t":now-2000},{"id":now-1000,"title":"Newest","text":"c","t":now-1000}]
    items=[{"id":1,"t":"Visit Japan","type":"b","lv":"h","d":False},{"id":2,"t":"Run a marathon","type":"b","lv":"g","d":True}]
    pg.goto(U)
    pg.evaluate("([n,i,now])=>{localStorage.clear();localStorage.setItem('ch',JSON.stringify({items:i,pts:0,log:[],ses:[],seen:true,notes:n,noteN:3}));localStorage.setItem('ch_gifts_v1',JSON.stringify({v:1,initialized:true,gifts:{'bucket-1':{unlockedAt:now-9e6,collectedAt:now-8e6}}}))}",[notes,items,now])
    pg.reload(); pg.wait_for_timeout(800)

    # bucket list
    pg.get_by_role("button",name="Bucket list").first.click(); pg.wait_for_timeout(300)
    ok(pg.locator("#blv").count()==0, "bucket list: category picker removed")
    ok(pg.locator("#pbk .add button").count()==1 and pg.locator("#pbk .add").inner_text().count("Easy")==0, "bucket list form has no Easy/Medium/Hard/Extreme")
    txt=pg.locator("#pbk").inner_text()
    ok("Slide right" not in txt and "Click" not in txt, "no 'Slide right/Click to complete' on bucket items")
    ok(all(w not in txt for w in ["Easy","Medium","Hard","Extreme"]), "no category tags on bucket items")
    ok("Visit Japan" in txt and "Run a marathon" in txt and "Achieved ✓" in txt, "items still show, achieved ones marked")
    pg.fill("#bt","Learn guitar"); pg.locator("#pbk .add button").click(); pg.wait_for_timeout(300)
    s=json.loads(pg.evaluate("localStorage.getItem('ch')"))
    ok(any(x["t"]=="Learn guitar" and x["type"]=="b" for x in s["items"]), "adding a dream still works without a category")
    pg.locator("#bact .ok").first.click(); pg.wait_for_timeout(200); pg.locator("#ay").click(); pg.wait_for_timeout(500)
    ok(pg.locator("#pop").is_visible(), "achieving a dream still celebrates")
    pg.locator("#pb").click(); pg.wait_for_timeout(200)

    # notes
    def order():
        pg.get_by_role("button",name="Notes").first.click(); pg.wait_for_timeout(300)
        o=pg.locator("#nlist .ncard b").all_inner_texts(); return o
    o=order(); ok(o==["Newest","Middle","Oldest"], f"notes newest-first by creation date {o}")
    pg.locator("#nlist .ncard", has_text="Oldest").click(); pg.wait_for_timeout(200)
    pg.fill("#nbody","edited text for the oldest note"); pg.wait_for_timeout(700)
    pg.locator("#nt .nback").click(); pg.wait_for_timeout(300)
    o=pg.locator("#nlist .ncard b").all_inner_texts(); ok(o==["Newest","Middle","Oldest"], f"editing the oldest note does not move it {o}")
    pg.reload(); pg.wait_for_timeout(800); o=order(); ok(o==["Newest","Middle","Oldest"], "order still the same after refresh")
    pg.locator("#nl .onext").click(); pg.wait_for_timeout(200); pg.fill("#nbody","brand new"); pg.wait_for_timeout(700); pg.locator("#nt .nback").click(); pg.wait_for_timeout(300)
    o=pg.locator("#nlist .ncard b").all_inner_texts(); ok(len(o)==4 and o[1:]==["Newest","Middle","Oldest"], f"a new note goes on top {o}")
    pg.locator("#nl .vhead button").click()

    # gift glow
    ok(pg.locator("aside .gv-glow").count()==0, "no glow when nothing is waiting")
    pg.evaluate("(now)=>{localStorage.setItem('ch_gifts_v1',JSON.stringify({v:1,initialized:true,gifts:{'bucket-1':{unlockedAt:now-9e6,collectedAt:now-8e6},'challenge-1':{unlockedAt:now}}}))}",now)
    pg.reload(); pg.wait_for_timeout(2500)
    pg.keyboard.press("Escape"); pg.wait_for_timeout(400)   # "Not now": keep it for later
    ok(pg.locator("#gvr").count()==0, "gift kept for later (reveal closed)")
    ok(pg.locator("aside .gv-glow").count()==1, "sidebar Gift Vault icon glows while a gift is waiting")
    pg.screenshot(path="/tmp/f_sidebar_glow.png",clip={"x":0,"y":0,"width":300,"height":420})
    pg.get_by_role("button",name="Gift Vault").first.click(); pg.wait_for_timeout(300)
    pg.locator(".gv-card.ready").click(); pg.wait_for_timeout(300)
    pg.get_by_role("button",name="Open gift").click(); pg.wait_for_timeout(1700); pg.get_by_role("button",name="Collect Gift").click(); pg.wait_for_timeout(500)
    ok(pg.locator("aside .gv-glow").count()==0, "glow stops once the gift is collected")
    m=b.new_context(viewport={"width":390,"height":800},is_mobile=True,has_touch=True,color_scheme="dark").new_page()
    m.goto(U); m.evaluate("(now)=>{localStorage.clear();localStorage.setItem('ch',JSON.stringify({items:[],pts:0,log:[],ses:[],seen:true}));localStorage.setItem('ch_gifts_v1',JSON.stringify({v:1,initialized:true,gifts:{'challenge-1':{unlockedAt:now}}}))}",now)
    m.reload(); m.wait_for_timeout(2500); m.keyboard.press("Escape"); m.wait_for_timeout(400)
    m.get_by_role("button",name="Not now").click() if m.locator("#gvr").count() else None; m.wait_for_timeout(300)
    ok("has-gift" in (m.locator("#gvbtn").get_attribute("class") or ""), "phone header Gift button glows while a gift is waiting")
    m.screenshot(path="/tmp/f_mobile_header.png",clip={"x":0,"y":0,"width":390,"height":140})
    ok(not errs, f"no page errors {errs}")
    b.close()
print(f"{sum(res)}/{len(res)} passed")
