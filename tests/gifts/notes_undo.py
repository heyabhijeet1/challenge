import json, time
from playwright.sync_api import sync_playwright
U="http://127.0.0.1:5199/"; res=[]
def ok(c,m,x=""): res.append(bool(c)); print(("PASS " if c else "FAIL ")+m+((" -> "+str(x)[:200]) if not c and x else ""))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome",args=["--no-sandbox"])
    pg=b.new_context(viewport={"width":1280,"height":800},color_scheme="dark").new_page()
    pg.goto(U); pg.evaluate("localStorage.clear();localStorage.setItem('ch',JSON.stringify({items:[],pts:0,log:[],ses:[],seen:true,notes:[],noteN:0}))"); pg.reload(); pg.wait_for_timeout(600)
    pg.get_by_role("button",name="Notes").first.click(); pg.wait_for_timeout(250); pg.locator("#nl .onext").click(); pg.wait_for_timeout(250)
    H=lambda: pg.evaluate("document.querySelector('#nbody').innerHTML")
    pg.keyboard.type("first line"); pg.keyboard.press("Enter"); pg.keyboard.type("/divider"); pg.keyboard.press("Enter"); pg.keyboard.type("below")
    ok("<hr>" in H(),"divider present"); 
    n=0
    while "<hr>" in H() and n<20: pg.keyboard.press("Control+z"); n+=1
    ok("<hr>" not in H() and "first line" in H() and "/divider" not in H(), f"undo removes the divider cleanly ({n} steps)", H())
    m=0
    while ("below" not in H()) and m<20: pg.keyboard.press("Control+y"); m+=1
    ok("<hr>" in H() and "below" in H() and "first line" in H(), f"redo brings divider + text back ({m} steps)", H())
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("task"); pg.keyboard.press("Home")
    pg.keyboard.type("/todo"); pg.keyboard.press("Enter")
    ok('class="cl"' in H(), "made a checklist", H())
    pg.keyboard.press("Control+z"); ok('class="cl"' not in H() or "<ul" not in H(), "undo of /todo conversion", H())
    pg.keyboard.press("Control+y"); ok("<ul" in H(), "redo restores the list", H()); print("   after redo:", H())
    # undo a bold + heading chain
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("abc"); pg.keyboard.press("Control+a"); pg.keyboard.press("Control+b"); pg.keyboard.press("Control+Alt+2")
    n=0
    while "<h2>" in H() and n<10: pg.keyboard.press("Control+z"); n+=1
    ok("<h2>" not in H() and "abc" in H(), f"undo unwinds the heading ({n} steps)", H())
    n=0
    while "<b>" in H() and n<10: pg.keyboard.press("Control+z"); n+=1
    ok("<b>" not in H() and "abc" in H(), "further undo unwinds the bold", H())
    n=0
    while "<h2>" not in H() and n<10: pg.keyboard.press("Control+y"); n+=1
    ok("<h2>" in H() and "<b>" in H(), "redo restores both", H())
    # toolbar state tracks caret
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("x"); pg.keyboard.press("Control+Alt+1")
    ok(pg.locator('.ntb [data-cmd="h1"]').get_attribute("aria-pressed")=="true","toolbar H1 active inside heading")
    pg.keyboard.press("Enter"); pg.keyboard.type("y"); ok(pg.locator('.ntb [data-cmd="h1"]').get_attribute("aria-pressed")=="false","toolbar H1 inactive on the paragraph after it", H())
    b.close()
print(f"{sum(res)}/{len(res)} passed")
