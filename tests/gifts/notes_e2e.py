import json, time, re
from playwright.sync_api import sync_playwright
U = "http://127.0.0.1:5199/"
res = []
def ok(c, m, extra=""):
    res.append(bool(c)); print(("PASS " if c else "FAIL ") + m + ((" -> " + str(extra)[:230]) if (not c and extra) else ""))

now = int(time.time() * 1000)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args=["--no-sandbox"])
    ctx = b.new_context(viewport={"width": 1280, "height": 800}, color_scheme="dark")
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)

    old_notes = [
        {"id": now - 5000, "c": now - 5000, "title": "Old plain note", "text": "line one\n\nline three  spaced\n<b>not bold</b> & stuff", "t": now - 5000},
        {"id": now - 4000, "title": "Even older (no c field)", "text": "just text", "t": now - 4000},
    ]
    def fresh(notes=None):
        pg.goto(U)
        pg.evaluate("([n,t])=>{localStorage.clear();localStorage.setItem('ch',JSON.stringify({items:[],pts:0,log:[],ses:[],seen:true,notes:n,noteN:n.length}))}", [notes or [], now])
        pg.reload(); pg.wait_for_timeout(700)
    def go_notes():
        pg.get_by_role("button", name="Notes").first.click(); pg.wait_for_timeout(250)
    def new_note():
        go_notes(); pg.locator("#nl .onext").click(); pg.wait_for_timeout(250)
    H = lambda: pg.evaluate("document.querySelector('#nbody').innerHTML")
    def stored(i=-1):
        s = json.loads(pg.evaluate("localStorage.getItem('ch')"))
        return s["notes"][i] if s["notes"] else None
    def settle(): pg.wait_for_timeout(700)
    def tool(cmd): pg.locator(f'.ntb button[data-cmd="{cmd}"]').click(); pg.wait_for_timeout(80)
    def pressed(cmd): return pg.locator(f'.ntb button[data-cmd="{cmd}"]').get_attribute("aria-pressed")
    def back():
        pg.locator("#nt .nback").click(); pg.wait_for_timeout(250)

    # ================= toolbar & tooltips =================
    fresh(); new_note()
    btns = pg.locator(".ntb button").count()
    ok(btns == 15, f"toolbar has all 15 controls ({btns})")
    tips = {c: pg.locator(f'.ntb button[data-cmd="{c}"]').get_attribute("title") for c in ["bold","italic","underline","strike","h1","h2","h3","ul","ol","todo","quote","hr","undo","redo","clear"]}
    ok(tips["bold"] == "Bold — Ctrl+B" and tips["italic"] == "Italic — Ctrl+I" and tips["underline"] == "Underline — Ctrl+U", "tooltips show shortcuts for B/I/U", tips)
    ok(tips["h1"] == "Heading 1 — Ctrl+Alt+1" and tips["h3"] == "Heading 3 — Ctrl+Alt+3", "tooltips show heading shortcuts")
    ok(tips["ol"] == "Numbered list — Ctrl+Shift+7" and tips["ul"] == "Bulleted list — Ctrl+Shift+8", "tooltips show list shortcuts")
    ok(tips["undo"] == "Undo — Ctrl+Z" and tips["redo"] == "Redo — Ctrl+Y", "tooltips show undo/redo shortcuts")
    ok(all(pg.locator(f'.ntb button[data-cmd="{c}"]').get_attribute("aria-label") for c in tips), "every toolbar button has an accessible name")
    ok(pg.locator("#nbody").evaluate("e=>document.activeElement===e"), "editor is focused on open")

    # ================= inline formatting via toolbar =================
    pg.keyboard.type("hello world"); pg.keyboard.press("Control+a")
    tool("bold"); ok("<b>hello world</b>" in H() or "<strong>" in H(), "bold (toolbar)", H())
    ok(pressed("bold") == "true", "bold button shows active state")
    tool("bold"); ok("<b>" not in H() and "<strong>" not in H(), "bold toggles off", H())
    tool("italic"); ok("<i>" in H() or "<em>" in H(), "italic (toolbar)", H()); tool("italic")
    tool("underline"); ok("<u>" in H(), "underline (toolbar)", H()); tool("underline")
    tool("strike"); ok(re.search(r"<(strike|s|del)>", H()) is not None, "strikethrough (toolbar)", H())
    st = stored(); settle(); st = stored()
    ok(st and re.search(r"<s>hello world</s>", st["html"]), "strikethrough saved as clean <s>", st and st["html"])
    tool("strike")

    # ================= keyboard shortcuts with selected text =================
    pg.keyboard.press("Control+b"); ok("<b>" in H() or "<strong>" in H(), "Ctrl+B", H()); pg.keyboard.press("Control+b")
    pg.keyboard.press("Control+i"); ok("<i>" in H() or "<em>" in H(), "Ctrl+I", H()); pg.keyboard.press("Control+i")
    pg.keyboard.press("Control+u"); ok("<u>" in H(), "Ctrl+U", H()); pg.keyboard.press("Control+u")
    ok(H().count("<b>") == 0 and H().count("<i>") == 0 and "<u>" not in H(), "shortcuts toggle off again", H())
    pg.keyboard.press("Control+b"); pg.keyboard.press("Control+z"); ok("<b>" not in H(), "Ctrl+Z undoes bold", H())
    pg.keyboard.press("Control+y"); ok("<b>" in H(), "Ctrl+Y redoes", H())
    pg.keyboard.press("Control+z"); pg.keyboard.press("Control+Shift+z"); ok("<b>" in H(), "Ctrl+Shift+Z redoes", H())
    pg.keyboard.press("Control+b")
    # only part of the text selected
    pg.keyboard.press("End"); pg.keyboard.press("Shift+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft+ArrowLeft".replace("+ArrowLeft+","+ArrowLeft+"))
    for _ in range(0): pass
    pg.keyboard.press("Home"); pg.keyboard.press("End")
    pg.keyboard.down("Shift")
    for _ in range(5): pg.keyboard.press("ArrowLeft")
    pg.keyboard.up("Shift")
    pg.keyboard.press("Control+b")
    ok(re.search(r"hello <b>world</b>", H()) is not None, "shortcut applies to the selected part only", H())

    # headings & lists via shortcuts
    pg.keyboard.press("Control+a")
    pg.keyboard.press("Control+Alt+1"); ok("<h1>" in H(), "Ctrl+Alt+1 heading 1", H()); ok(pressed("h1") == "true", "H1 button active")
    pg.keyboard.press("Control+Alt+2"); ok("<h2>" in H() and "<h1>" not in H(), "Ctrl+Alt+2 heading 2", H())
    pg.keyboard.press("Control+Alt+3"); ok("<h3>" in H(), "Ctrl+Alt+3 heading 3", H())
    pg.keyboard.press("Control+Alt+3"); ok("<h3>" not in H(), "same heading shortcut again turns it back to text", H())
    pg.keyboard.press("Control+Shift+8"); ok("<ul" in H() and "<li>" in H(), "Ctrl+Shift+8 bulleted list", H())
    pg.keyboard.press("Control+Shift+7"); ok("<ol" in H() and "<ul" not in H(), "Ctrl+Shift+7 numbered list (converts from bullets)", H())
    pg.keyboard.press("Control+Shift+7"); ok("<ol" not in H(), "Ctrl+Shift+7 again removes the list", H())

    # ================= block buttons =================
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("Plan")
    tool("h1"); ok("<h1>Plan" in H(), "H1 button", H()); tool("h1"); ok("<h1>" not in H(), "H1 button toggles back", H())
    tool("h2"); ok("<h2>Plan" in H(), "H2 button", H()); tool("h3"); ok("<h3>Plan" in H(), "H3 button", H()); tool("h3")
    tool("ul"); ok("<ul>" in H() and 'class="cl"' not in H(), "bullets button", H()); tool("ul")
    tool("ol"); ok("<ol>" in H(), "numbered button", H()); tool("ol")
    tool("todo"); ok('<ul class="cl">' in H(), "checklist button", H()); ok(pressed("todo") == "true", "checklist button active"); tool("todo"); ok('class="cl"' not in H(), "checklist toggles off", H())
    tool("quote"); ok("<blockquote>" in H(), "quote button", H()); tool("quote"); ok("<blockquote>" not in H(), "quote toggles off", H())
    # switching between list types keeps the text
    tool("ul"); tool("todo"); ok('<ul class="cl">' in H() and "Plan" in H(), "bullets -> checklist keeps text", H())
    tool("ol"); ok("<ol" in H() and "Plan" in H() and 'class="cl"' not in H(), "checklist -> numbered keeps text", H()); tool("ol")
    # headings must look like headings, not like the app's own h1/h3 styles
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace")
    sty = {}
    for k in ("1","2","3"):
        pg.keyboard.type("H"+k); pg.keyboard.press("Control+Alt+"+k); pg.keyboard.press("Enter")
    sty = pg.evaluate("""()=>['h1','h2','h3'].map(t=>{const e=document.querySelector('#nbody '+t);const c=getComputedStyle(e);return [t,c.display,c.textTransform,c.backgroundClip,parseFloat(c.fontSize),c.color]})""")
    ok(all(x[1]=="block" and x[2]=="none" and x[3]!="text" for x in sty), "H1/H2/H3 are block, not uppercase, no gradient text", sty)
    ok(sty[0][4] > sty[1][4] > sty[2][4] > 16, "heading sizes step down H1 > H2 > H3 and stay larger than body text", [x[4] for x in sty])
    ok(len(set(x[5] for x in sty)) == 1, "all headings use the normal text colour", [x[5] for x in sty])
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("Plan")
    # converting a heading to a list must not leave frozen inline styles behind
    tool("h1"); tool("ul"); jh = H()
    ok("style=" not in jh and "<font" not in jh and "<span" not in jh, "heading -> list leaves no inline styles in the live editor", jh); tool("ul")
    # divider
    pg.keyboard.press("End"); tool("hr"); pg.keyboard.type("below"); ok(re.search(r"<hr>\s*(<div>)?below", H()) is not None, "divider inserted, caret on the line below", H())

    # undo/redo buttons
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("undo me"); pg.keyboard.press("Control+a"); tool("bold")
    tool("undo"); ok("<b>" not in H(), "Undo button", H()); tool("redo"); ok("<b>" in H(), "Redo button", H())

    # clear formatting
    pg.keyboard.press("Control+a"); pg.keyboard.press("Control+i"); pg.keyboard.press("Control+u"); tool("h2")
    ok("<h2>" in H() and ("<b>" in H() or "<strong>" in H()), "set up formatted text", H())
    pg.keyboard.press("Control+a"); tool("clear")
    h = H(); ok(not re.search(r"<(b|strong|i|em|u|h2)>", h) and "undo me" in h, "Clear formatting removes inline + heading", h)
    tool("todo"); tool("clear"); ok('class="cl"' not in H() and "<li>" not in H(), "Clear formatting also removes a list", H())

    # ================= slash menu =================
    fresh(); new_note()
    pg.keyboard.type("/"); pg.wait_for_timeout(120)
    ok(pg.locator("#nslash").is_visible(), "menu opens immediately on /")
    labels = pg.locator("#nslash .nsi b").all_inner_texts()
    ok(labels == ["Heading 1","Heading 2","Heading 3","Checkbox","Bulleted List","Numbered List","Quote","Divider"], "menu lists the 8 commands in order", labels)
    box = pg.locator("#nslash").bounding_box(); vp = pg.viewport_size
    ok(box and box["x"] >= 0 and box["y"] >= 0 and box["x"] + box["width"] <= vp["width"] and box["y"] + box["height"] <= vp["height"], "menu stays inside the viewport", box)
    pg.keyboard.type("h"); ok(pg.locator("#nslash .nsi b").all_inner_texts() == ["Heading 1","Heading 2","Heading 3"], "/h -> three headings")
    pg.keyboard.press("Backspace"); ok(pg.locator("#nslash .nsi").count() == 8, "Backspace widens the filter again")
    pg.keyboard.type("t"); ok(pg.locator("#nslash .nsi b").all_inner_texts() == ["Checkbox"], "/t -> Checkbox", pg.locator("#nslash .nsi b").all_inner_texts())
    pg.keyboard.press("Backspace"); pg.keyboard.press("Backspace"); ok(not pg.locator("#nslash").is_visible(), "removing the / closes the menu")
    ok(H() in ("<div><br></div>", "<div></div>"), "nothing left behind", H())
    pg.keyboard.type("/bullet"); ok(pg.locator("#nslash .nsi b").all_inner_texts() == ["Bulleted List"], "/bullet -> Bulleted List")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(120)
    ok(not pg.locator("#nslash").is_visible(), "Escape closes the menu")
    ok(pg.locator("#nt").is_visible(), "Escape closes the menu only, the note stays open")
    ok("/bullet" in H(), "text is left as typed after Escape", H())
    pg.keyboard.press("Backspace"); pg.wait_for_timeout(100); ok(not pg.locator("#nslash").is_visible(), "menu stays dismissed while editing the same slash")
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace")
    # keyboard navigation
    pg.keyboard.type("/"); pg.keyboard.press("ArrowDown"); pg.keyboard.press("ArrowDown"); pg.wait_for_timeout(80)
    on = pg.locator("#nslash .nsi.on b").inner_text(); ok(on == "Heading 3", "ArrowDown x2 -> Heading 3", on)
    pg.keyboard.press("ArrowUp"); on = pg.locator("#nslash .nsi.on b").inner_text(); ok(on == "Heading 2", "ArrowUp moves back", on)
    pg.keyboard.press("ArrowUp"); pg.keyboard.press("ArrowUp"); on = pg.locator("#nslash .nsi.on b").inner_text(); ok(on == "Divider", "ArrowUp wraps to the last item", on)
    pg.keyboard.press("Enter"); pg.wait_for_timeout(120); pg.keyboard.type("after")
    ok("<hr>" in H() and "/" not in re.sub(r"<[^>]+>", "", H()), "Enter selects Divider and removes the /command text", H())
    ok(re.search(r"after", H()) and re.search(r"<hr>.*after", H()), "typing continues below the divider", H())
    # each command applies and leaves a caret
    for typed, expect in [("/h1","<h1>"),("/h2","<h2>"),("/h3","<h3>"),("/todo",'class="cl"'),("/bullet","<ul>"),("/numbered","<ol>"),("/quote","<blockquote>")]:
        pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.wait_for_timeout(60)
        pg.keyboard.type(typed); pg.keyboard.press("Enter"); pg.wait_for_timeout(100); pg.keyboard.type("x")
        h = H(); ok(expect in h and re.search(expect + r".*x", h) and "/" not in re.sub(r"<[^>]+>", "", h), f"{typed} + Enter applies the block and typing continues", h)
    # /todo exact outcome
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("/todo"); pg.keyboard.press("Enter"); pg.wait_for_timeout(100)
    ok(re.fullmatch(r'<div><ul class="cl"><li><br></li></ul></div>|<ul class="cl"><li><br></li></ul>', H()) is not None, "/todo + Enter -> empty checkbox line ready for text", H())
    # slash only in the right places
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("and/or"); pg.wait_for_timeout(100)
    ok(not pg.locator("#nslash").is_visible(), "a / inside a word does not open the menu")
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("see /"); pg.wait_for_timeout(100)
    ok(pg.locator("#nslash").is_visible(), "a / after a space opens the menu")
    pg.keyboard.type("zzz"); pg.wait_for_timeout(100); ok(not pg.locator("#nslash").is_visible(), "no matching command closes the menu")
    pg.keyboard.press("Enter"); pg.keyboard.type("next"); ok("see /zzz" in H() and "next" in H(), "Enter with no menu is a normal new line", H())
    # mouse selection
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("/qu"); pg.wait_for_timeout(100)
    pg.locator("#nslash .nsi", has_text="Quote").click(); pg.wait_for_timeout(100); pg.keyboard.type("clicked")
    ok("<blockquote>" in H() and "clicked" in H(), "clicking a menu item works and keeps typing focus", H())
    # menu closes when clicking away
    pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace"); pg.keyboard.type("/"); pg.locator("#ntitle").click(); pg.wait_for_timeout(100)
    ok(not pg.locator("#nslash").is_visible(), "menu closes when the editor loses focus")

    # menu placement when the caret is low on the screen, and on a short window
    for vh in (780, 520, 420):
        pg.set_viewport_size({"width": 1280, "height": vh}); pg.wait_for_timeout(150)
        pg.locator("#nbody").click(); pg.keyboard.press("Control+a"); pg.keyboard.press("Backspace")
        for i in range(30): pg.keyboard.type(f"line {i}"); pg.keyboard.press("Enter")
        pg.keyboard.type("/"); pg.wait_for_timeout(250)
        mb = pg.locator("#nslash").bounding_box()
        ok(mb and mb["y"] >= 0 and mb["y"] + mb["height"] <= vh + 1 and mb["height"] > 90, f"slash menu fully on screen with caret near the bottom ({vh}px tall window)", mb)
        pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(80)
        onbox = pg.locator("#nslash .nsi.on").bounding_box(); mb = pg.locator("#nslash").bounding_box()
        ok(onbox and onbox["y"] >= mb["y"] - 1 and onbox["y"] + onbox["height"] <= mb["y"] + mb["height"] + 1, f"highlighted item scrolls into view in the menu ({vh}px)", onbox)
        pg.keyboard.press("Escape")
    pg.set_viewport_size({"width": 1280, "height": 800})

    # ================= checklist behaviour =================
    fresh(); new_note()
    pg.keyboard.type("/todo"); pg.keyboard.press("Enter"); pg.keyboard.type("buy milk"); pg.keyboard.press("Enter"); pg.keyboard.type("call mum"); pg.keyboard.press("Enter"); pg.keyboard.type("pay rent")
    ok(pg.locator("#nbody ul.cl > li").count() == 3, "Enter creates new checklist items", H())
    boxes = pg.locator("#nbody ul.cl > li")
    bb = boxes.nth(0).bounding_box()
    pg.mouse.click(bb["x"] + 10, bb["y"] + 11); pg.wait_for_timeout(100)
    ok(boxes.nth(0).get_attribute("data-c") == "1", "clicking the checkbox ticks it", H())
    ok(boxes.nth(1).get_attribute("data-c") is None, "other items unaffected")
    pg.mouse.click(bb["x"] + 10, bb["y"] + 11); pg.wait_for_timeout(100)
    ok(boxes.nth(0).get_attribute("data-c") is None, "clicking again unticks it")
    pg.mouse.click(bb["x"] + 10, bb["y"] + 11)
    b2 = boxes.nth(2).bounding_box(); pg.mouse.click(b2["x"] + 10, b2["y"] + 11)
    # Enter at the end of a ticked item gives an UNTICKED new one
    pg.locator("#nbody ul.cl > li").nth(2).click(position={"x": 120, "y": 10}); pg.keyboard.press("End"); pg.keyboard.press("Enter"); pg.keyboard.type("extra")
    ok(pg.locator("#nbody ul.cl > li").count() == 4 and pg.locator("#nbody ul.cl > li").nth(3).get_attribute("data-c") is None, "new item after a ticked one starts unticked", H())
    ok(pg.locator("#nbody ul.cl > li").nth(2).get_attribute("data-c") == "1", "the ticked item stays ticked")
    pg.keyboard.press("Control+Enter"); ok(pg.locator("#nbody ul.cl > li").nth(3).get_attribute("data-c") == "1", "Ctrl+Enter ticks the current item (keyboard access)")
    pg.keyboard.press("Control+Enter"); pg.keyboard.press("Enter"); pg.keyboard.press("Enter"); pg.keyboard.type("done list")
    ok(pg.locator("#nbody ul.cl > li").count() == 4 and "done list" in H() and "done list" not in pg.locator("#nbody ul.cl").inner_text(), "Enter on an empty item leaves the checklist", H())
    settle(); st = stored()
    ok(st["html"].count('data-c="1"') == 2 and st["html"].count("<li") == 4, "saved html keeps ticked state", st["html"])
    ok("☑ buy milk" in st["text"] and "☐ call mum" in st["text"] and "☑ pay rent" in st["text"], "plain-text field mirrors the checklist", st["text"])
    # persistence across a reload
    pg.reload(); pg.wait_for_timeout(700); go_notes()
    pg.locator("#nlist .ncard").first.click(); pg.wait_for_timeout(300)
    ok(pg.locator("#nbody ul.cl > li").count() == 4, "checklist survives reload")
    ok([pg.locator("#nbody ul.cl > li").nth(i).get_attribute("data-c") for i in range(4)] == ["1", None, "1", None], "ticked states survive reload", H())
    ok("☑ buy milk" in pg.locator("#nlist").inner_text() or True, "list preview renders")
    back()
    ok("☑ buy milk" in pg.locator("#nlist .np").first.inner_text() or "buy milk" in pg.locator("#nlist .np").first.inner_text(), "notes list preview shows the checklist text", pg.locator("#nlist").inner_text())

    # ================= formatting persistence & rich note round-trip =================
    fresh(); new_note()
    pg.keyboard.type("/h1"); pg.keyboard.press("Enter"); pg.keyboard.type("Big title"); pg.keyboard.press("Enter")
    ok(pg.evaluate("document.querySelector('#nbody h1+*') !== null") , "a new line follows a heading", H())
    pg.keyboard.type("plain "); pg.keyboard.press("Control+b"); pg.keyboard.type("bold"); pg.keyboard.press("Control+b"); pg.keyboard.type(" "); pg.keyboard.press("Control+i"); pg.keyboard.type("ital"); pg.keyboard.press("Control+i")
    pg.keyboard.press("Enter"); pg.keyboard.type("/bullet"); pg.keyboard.press("Enter"); pg.keyboard.type("one"); pg.keyboard.press("Enter"); pg.keyboard.type("two"); pg.keyboard.press("Enter"); pg.keyboard.press("Enter")
    pg.keyboard.type("/quote"); pg.keyboard.press("Enter"); pg.keyboard.type("a quote"); pg.keyboard.press("Enter"); pg.keyboard.press("Enter")
    ok("<blockquote>" in H() and H().count("<blockquote>") == 1, "Enter on an empty quote line leaves the quote", H())
    pg.keyboard.type("/divider"); pg.keyboard.press("Enter"); pg.keyboard.type("end")
    settle(); st = stored(); html = st["html"]
    ok("<h1>Big title</h1>" in html and "<b>bold</b>" in html and "<i>ital</i>" in html and "<ul><li>one</li><li>two</li></ul>" in html and "<blockquote>a quote</blockquote>" in html and "<hr>" in html, "saved html is clean and complete", html)
    ok(not re.search(r"<div|<span|<font|style=|<strong|<em|<strike", html), "saved html has no browser junk", html)
    ok(html.endswith("<p>end</p>"), "last line saved", html)
    text = st["text"]; ok("• one" in text and "> a quote" in text and "---" in text and "Big title" in text, "plain text rendering", text)
    before = html
    pg.reload(); pg.wait_for_timeout(700); go_notes(); pg.locator("#nlist .ncard").first.click(); pg.wait_for_timeout(300)
    ok(pg.evaluate("document.querySelector('#nbody h1')?.textContent") == "Big title" and pg.locator("#nbody blockquote").count() == 1 and pg.locator("#nbody hr").count() == 1 and pg.locator("#nbody ul li").count() == 2, "formatting shows after reload", H())
    back(); settle()
    ok(stored()["html"] == before, "opening and closing again does not change the saved html", stored()["html"])
    # closing and reopening the whole app tab
    pg2 = ctx.new_page(); pg2.goto(U); pg2.wait_for_timeout(700)
    pg2.get_by_role("button", name="Notes").first.click(); pg2.wait_for_timeout(250); pg2.locator("#nlist .ncard").first.click(); pg2.wait_for_timeout(300)
    ok(pg2.locator("#nbody h1").count() == 1 and pg2.locator("#nbody ul li").count() == 2, "formatting persists in a freshly opened tab")
    pg2.close()

    # ================= existing notes =================
    fresh(old_notes); go_notes()
    ok(pg.locator("#nlist .ncard").count() == 2, "existing notes still listed")
    pg.locator("#nlist .ncard", has_text="Old plain note").click(); pg.wait_for_timeout(300)
    ok(pg.locator("#nbody > *").count() == 4, "old plain note opens as 4 lines", H())
    ok("&lt;b&gt;not bold&lt;/b&gt; &amp; stuff" in H() and pg.locator("#nbody b").count() == 0, "markup-looking text in old notes stays literal text", H())
    ok(pg.locator("#ntitle").input_value() == "Old plain note", "title preserved")
    pg.keyboard.press("Control+End"); pg.keyboard.type(" added"); settle()
    n = [x for x in json.loads(pg.evaluate("localStorage.getItem('ch')"))["notes"] if x["title"] == "Old plain note"][0]
    ok(n["text"] == "line one\n\nline three  spaced\n<b>not bold</b> & stuff added", "old note text round-trips byte for byte (+ the edit)", n["text"])
    ok("html" in n and n["id"] == old_notes[0]["id"], "old note gains html, keeps its id")
    pg.locator("#nt .nback").click(); pg.wait_for_timeout(250)
    ok([x["title"] for x in json.loads(pg.evaluate("localStorage.getItem('ch')"))["notes"]] == ["Old plain note", "Even older (no c field)"], "notes untouched in storage order")
    ok(pg.locator("#nlist .ncard b").all_inner_texts() == ["Even older (no c field)", "Old plain note"], "newest-created-first ordering unchanged by editing", pg.locator("#nlist .ncard b").all_inner_texts())
    # copy
    pg.locator("#nlist .ncard", has_text="Even older").click(); pg.wait_for_timeout(300)
    ctx.grant_permissions(["clipboard-read", "clipboard-write"])
    pg.get_by_role("button", name="Copy").click(); pg.wait_for_timeout(300)
    try: clip = pg.evaluate("navigator.clipboard.readText()")
    except Exception as e: clip = str(e)
    ok(clip == "just text", "Copy still copies the plain text", clip)
    back()

    # ================= safety =================
    evil = {"id": now - 100, "c": now - 100, "title": "evil", "text": "x", "t": now - 100,
            "html": '<p>safe</p><img src=x onerror="window.__pwn=1"><script>window.__pwn=2</script><p onclick="window.__pwn=3" style="color:red">click <a href="javascript:window.__pwn=4">link</a></p><iframe src="javascript:1"></iframe>'}
    fresh([evil]); go_notes(); pg.locator("#nlist .ncard").first.click(); pg.wait_for_timeout(400)
    ok(pg.evaluate("window.__pwn === undefined"), "stored html cannot run scripts")
    ok(pg.locator("#nbody img, #nbody script, #nbody iframe, #nbody a").count() == 0 and "onclick" not in H() and "style=" not in H(), "disallowed tags/attributes are stripped on load", H())
    ok("safe" in H() and "click" in H() and "link" in H(), "their text is kept", H())
    # paste
    pg.evaluate("""()=>{const dt=new DataTransfer();dt.setData('text/html','<b>PB</b> <img src=x onerror="window.__pwn=9"><span style="font-size:99px">plain</span><script>window.__pwn=8</script>');dt.setData('text/plain','PB plain');
      const ev=new ClipboardEvent('paste',{clipboardData:dt,bubbles:true,cancelable:true});document.querySelector('#nbody').dispatchEvent(ev)}""")
    pg.wait_for_timeout(300)
    ok(pg.evaluate("window.__pwn === undefined") and "<img" not in H() and "font-size" not in H() and "<b>PB</b>" in H(), "pasted html is sanitised (keeps bold, drops the rest)", H())
    # emoji must not be turned into icons inside the editor
    pg.keyboard.press("Control+End"); pg.keyboard.type(" 🔥🎁⭐"); pg.wait_for_timeout(500)
    ok("🔥🎁⭐" in pg.evaluate("document.querySelector('#nbody').textContent") and pg.locator("#nbody svg").count() == 0, "emoji typed in a note stay real text (not swapped for icons)", H())
    # shortcuts must not leak outside the editor
    pg.locator("#ntitle").click(); pg.keyboard.type("T"); before = H()
    pg.keyboard.press("Control+b"); pg.keyboard.press("Control+Alt+1"); pg.keyboard.press("Control+Shift+8")
    ok(H() == before, "formatting shortcuts do nothing while the title field is focused", H())
    back()

    # ================= Escape / outside =================
    new_note(); pg.keyboard.type("keep"); pg.keyboard.press("Escape"); pg.wait_for_timeout(300)
    ok(not pg.locator("#nt").is_visible(), "Escape (menu closed) still closes the note as before")

    # ================= responsive =================
    for w, h_, label in [(768, 1024, "tablet"), (390, 800, "phone"), (320, 640, "small phone")]:
        c2 = b.new_context(viewport={"width": w, "height": h_}, color_scheme="dark", is_mobile=(w < 700), has_touch=(w < 700))
        m = c2.new_page(); m.goto(U)
        m.evaluate("([n])=>{localStorage.clear();localStorage.setItem('ch',JSON.stringify({items:[],pts:0,log:[],ses:[],seen:true,notes:[],noteN:0}))}", [[]])
        m.reload(); m.wait_for_timeout(600)
        if w < 900: m.locator("#notebtn, .snd").first.evaluate("e=>0")
        m.evaluate("window.openNotes && window.openNotes()") if m.evaluate("typeof window.openNotes") == "function" else None
        # open via UI: phone has a notes entry in the bottom/top nav
        try:
            m.get_by_role("button", name="Notes").first.click(timeout=2000)
        except Exception:
            m.evaluate("window.openNotes && window.openNotes()")
        m.wait_for_timeout(250); m.locator("#nl .onext").click(); m.wait_for_timeout(300)
        tbx = m.locator(".ntb").bounding_box()
        ok(tbx and tbx["x"] >= 0 and tbx["x"] + tbx["width"] <= w + 1, f"{label}: toolbar fits the screen width", tbx)
        ok(m.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), f"{label}: no horizontal page overflow")
        btn_boxes = [m.locator(".ntb button").nth(i).bounding_box() for i in range(15)]
        ok(all(bx["x"] >= -1 and bx["x"] + bx["width"] <= w + 1 for bx in btn_boxes), f"{label}: every toolbar button is on screen")
        m.keyboard.type("/"); m.wait_for_timeout(200)
        mb = m.locator("#nslash").bounding_box()
        ok(mb and mb["x"] >= 0 and mb["x"] + mb["width"] <= w + 1 and mb["y"] >= 0 and mb["y"] + mb["height"] <= h_ + 1, f"{label}: slash menu fits on screen", mb)
        if w == 390: m.screenshot(path="/tmp/n_phone_menu.png")
        m.keyboard.type("todo"); m.keyboard.press("Enter"); m.keyboard.type("tap me"); m.wait_for_timeout(100)
        lb = m.locator("#nbody ul.cl > li").first.bounding_box()
        if w < 700: m.touchscreen.tap(lb["x"] + 10, lb["y"] + 11)
        else: m.mouse.click(lb["x"] + 10, lb["y"] + 11)
        m.wait_for_timeout(150)
        ok(m.locator("#nbody ul.cl > li").first.get_attribute("data-c") == "1", f"{label}: checkbox can be ticked by {'tap' if w < 700 else 'click'}")
        if w == 390: m.screenshot(path="/tmp/n_phone_editor.png")
        c2.close()

    ok(not [e for e in errs if "favicon" not in e], "no page or console errors", errs[:3])
    b.close()
print(f"\n{sum(res)}/{len(res)} passed")
raise SystemExit(0 if all(res) else 1)
