// Static markup ported from the original artifact (HTML -> JSX).
// Dynamic parts are filled in by src/legacy/app.ts, so this component never re-renders.
import { memo } from 'react'
import ThemeToggle from './ThemeToggle'

const w = window as any
const run = (code: string) => (0, eval)(code)

function Markup() {
  return (
    <>
{' '}<div className="wrap">{' '}<h1><img className="logo" src="/logo.png" alt="" />Challenge</h1>{' '}<p className="sub">Slide left to complete. Earn your points.</p>{' '}<div className="top">
<div className="score" id="score" onClick={() => w.openPts()}>⭐ 0 points</div>
<div className="score st" id="streak" onClick={() => w.openStk()}>🔥 0</div>
<div style={{"marginLeft": "auto", "display": "flex", "gap": "6px"}}>
<button className="snd" id="gvbtn" aria-label="Gift Vault" title="Gift Vault" onClick={() => w.openGifts?.()}>🎁</button>
<button className="snd" id="swbtn" onClick={() => w.openSw()}>⏱️</button>
<button className="snd" onClick={() => w.openRecap()}>📊</button>
<button className="snd" id="snd" onClick={() => w.toggleSnd()}>🔔</button>
<ThemeToggle variant="inline" />
</div>
</div>{' '}<div className="lvl">
<span id="lvt">
</span>
<div className="bar">
<i id="lvb" style={{"width": "0"}}>
</i>
</div>
</div>{' '}<div className="tabs">
<button id="tc" className="on" onClick={() => w.setTab('c')}>✅ Challenges</button>
<button id="tm" onClick={() => w.setTab('m')}>🎯 Milestones</button>
<button id="tb" onClick={() => w.setTab('b')}>🌠 Bucket list</button>
</div>{' '}<div id="pc">{' '}<div className="dream" id="dream">
</div>{' '}<p className="note">For today only. Each is worth 5 points. Not done by midnight: −3 points each. 🔁 ones come back every day.</p>{' '}<div className="qadd">
<input id="ct" placeholder="Today's challenge…" maxLength={120} />
<button onClick={() => w.addC()}>Add</button>
</div>{' '}<label className="rep">
<input type="checkbox" id="crep" />{" \ud83d\udd01 Repeat every day"}</label>{' '}<h3>{"Today "}<span id="n1">
</span>
</h3>{' '}<div id="cact">
</div>{' '}<h3 id="h2">{"Done today "}<span id="n2">
</span>
</h3>{' '}<div id="cdone">
</div>{' '}</div>{' '}<div id="pbk" className="hid">{' '}<div className="prog">
<div id="ptxt">
</div>
<div className="bar">
<i id="pbar" style={{"width": "0"}}>
</i>
</div>
</div>{' '}<div className="add">
<input id="bt" placeholder="Add to your bucket list…" maxLength={120} />
<button onClick={() => w.addB()}>Add to bucket list</button>
</div>{' '}<h3>{"Dreams "}<span id="n6">
</span>
</h3>{' '}<div id="bact">
</div>{' '}<h3 id="h7">{"Achieved "}<span id="n7">
</span>
</h3>{' '}<div id="bdone">
</div>{' '}</div>{' '}<div id="pm" className="hid">{' '}<p className="note">Bigger goals that take a week or a month. Missing the deadline costs points.</p>{' '}<div className="add">{' '}<input id="mt" placeholder="New milestone…" maxLength={120} />{' '}<label className="lab" htmlFor="dl">Deadline (optional)</label>{' '}<input id="dl" type="datetime-local" />{' '}<div id="lv">
</div>{' '}<button onClick={() => w.addM()}>Add milestone</button>{' '}</div>{' '}<h3>{"Ongoing "}<span id="n3">
</span>
</h3>{' '}<div id="mact">
</div>{' '}<h3>{"Completed "}<span id="n4">
</span>
</h3>{' '}<div id="mdone">
</div>{' '}<h3 id="h5">{"Failed "}<span id="n5">
</span>
</h3>{' '}<div id="mfail">
</div>{' '}</div>{' '}<div className="reset">
<button onClick={() => w.openOnb()} style={{"color": "var(--mute)"}}>How it works</button>
</div>{' '}</div>{' '}<div id="nl">
<div className="vbox">{' '}<div className="vhead">
<b>📝 Quick notes</b>
<button onClick={() => w.closeNotes()}>Done</button>
</div>{' '}<button className="onext" style={{"width": "100%", "marginBottom": "14px"}} onClick={() => w.newNote()}>+ New note</button>{' '}<div id="nlist">
</div>{' '}</div>
</div>{' '}<div id="nt">
<div className="vbox nbox">{' '}<div className="vhead">
<button className="nback" onClick={() => w.closeNote()}>‹ Notes</button>
<div className="nact">
<button onClick={() => w.copyNote()}>Copy</button>
<button onClick={() => w.delNote()}>🗑</button>
</div>
</div>{' '}<input id="ntitle" placeholder="Quick Note 1" maxLength={60} />{' '}<div id="ned"></div>{' '}<div id="nsaved">
</div>{' '}</div>
</div>{' '}<div id="onb">
<div className="onbox">{' '}<button className="skip" onClick={() => w.finishOnb(false)}>Skip</button>{' '}<div id="onbody">
</div>{' '}<div className="dots" id="odots">
</div>{' '}<button className="onext" id="onext" onClick={() => w.nextOnb()}>Next</button>{' '}</div>
</div>{' '}<div id="sw">
<div className="vbox">{' '}<div className="vhead">
<b>⏱️ Stopwatch</b>
<button onClick={() => w.closeSw()}>Done</button>
</div>{' '}<div className="swbox">
<div id="swt">00:00:00</div>
<button id="swb" onClick={() => w.toggleSw()}>Start</button>
<div id="swtoday" className="rcmp">
</div>{' '}<div id="swhint" className="note" style={{"textAlign": "center"}}>
</div>
</div>{' '}<h3>Recent sessions</h3>{' '}<div id="swlist">
</div>{' '}</div>
</div>{' '}<div id="pts">
<div className="vbox">{' '}<div className="vhead">
<b>⭐ Points</b>
<button onClick={() => run("$('pts').style.display='none'")}>Done</button>
</div>{' '}<div className="rcard">
<div id="pgBig" style={{"fontSize": "30px", "fontWeight": "800"}}>
</div>
<div id="pgLvl" className="rcmp" style={{"margin": "6px 0 0"}}>
</div>
<div className="lvl" style={{"margin": "8px 0 0"}}>
<div className="bar">
<i id="pgBar" style={{"width": "0"}}>
</i>
</div>
</div>
</div>{' '}<div className="grid3">{' '}<div className="stat">
<b id="pgT">0</b>
<small>Today</small>
</div>{' '}<div className="stat">
<b id="pgW">0</b>
<small>This week</small>
</div>{' '}<div className="stat">
<b id="pgA">0</b>
<small>Tracked total</small>
</div>{' '}</div>{' '}<h3>Recent activity</h3>{' '}<div id="pgList">
</div>{' '}<h3>Levels</h3>{' '}<div id="pgMap">
</div>{' '}</div>
</div>{' '}<div id="stk">
<div className="vbox">{' '}<div className="vhead">
<b>🔥 Streak</b>
<button onClick={() => run("$('stk').style.display='none'")}>Done</button>
</div>{' '}<div className="rcard" style={{"textAlign": "center"}}>
<div id="stBig" style={{"fontSize": "44px", "fontWeight": "800"}}>
</div>
<div id="stSub" className="rcmp" style={{"margin": "4px 0 0"}}>
</div>
</div>{' '}<div className="grid">{' '}<div className="stat">
<b id="stBest">0</b>
<small>Best streak</small>
</div>{' '}<div className="stat">
<b id="stAct">0</b>
<small>Active days (last 30)</small>
</div>{' '}</div>{' '}<h3>Last 7 days</h3>{' '}<div className="s7" id="st7">
</div>{' '}<div className="rcmp" id="stMsg">
</div>{' '}<p className="note" style={{"marginTop": "0"}}>A day counts when you finish a challenge or milestone, complete a focus hour, or achieve a dream. Miss a full day and the streak starts again.</p>{' '}<button className="onext" style={{"width": "100%"}} onClick={() => w.stkToStats()}>Open streak tracker</button>{' '}</div>
</div>{' '}<div id="recap">
<div className="vbox">{' '}<div className="vhead">
<b>📊 Statistics</b>
<button onClick={() => w.closeRecap()}>Done</button>
</div>{' '}<div className="rcard" id="heat">{' '}<div className="hhead">
<b>🔥 Streak tracker</b>
<div className="hpills">
<button id="hm" onClick={() => w.setH('m')}>Month</button>
<button id="hy" className="on" onClick={() => w.setH('y')}>Year</button>
</div>
</div>{' '}<div className="hstats">
<span id="hs1">
</span>
<span id="hs2">
</span>
<span id="hs3">
</span>
</div>{' '}<div className="rnav" id="hnav" style={{"display": "none"}}>
<button onClick={() => w.shiftH(-1)}>‹</button>
<span id="hlabel">
</span>
<button id="hnext" onClick={() => w.shiftH(1)}>›</button>
</div>{' '}<div id="hgrid">
</div>{' '}<div id="hdet" style={{"marginTop": "8px", "fontSize": "13px", "fontWeight": "600", "color": "var(--mute)"}}>
</div>{' '}<div className="hleg">{"Less "}<i className="h0">
</i>
<i className="h1">
</i>
<i className="h2">
</i>
<i className="h3">
</i>
<i className="h4">
</i>{" More"}</div>{' '}</div>{' '}<div className="tabs">
<button id="rw" className="on" onClick={() => w.setRp('w')}>Week</button>
<button id="rm" onClick={() => w.setRp('m')}>Month</button>
</div>{' '}<div className="rnav">
<button onClick={() => w.shiftR(-1)}>‹</button>
<span id="rlabel">
</span>
<button id="rnext" onClick={() => w.shiftR(1)}>›</button>
</div>{' '}<div className="rcard">
<div className="rday" id="rday">
</div>
<div id="rbig">
</div>
<div id="rchart">
</div>
<div className="cdet" id="rdet">
</div>
<div className="rtot" id="rtot">
</div>
</div>{' '}<div className="rcard">
<div className="rday" id="fday">
</div>
<div id="fbig">
</div>
<div id="fchart">
</div>
<div className="cdet" id="fdet">
</div>
<div className="rtot" id="ftot">
</div>
</div>{' '}<div className="rcmp" id="rcmp">
</div>{' '}<div className="grid">{' '}<div className="stat">
<b id="s1">0</b>
<small>Challenges</small>
</div>{' '}<div className="stat">
<b id="s2">0</b>
<small>Milestones</small>
</div>{' '}<div className="stat">
<b id="s3">0</b>
<small>Dreams achieved</small>
</div>{' '}<div className="stat">
<b id="s4">0</b>
<small>Best streak (days)</small>
</div>{' '}</div>{' '}<div className="rcmp" id="rlvl">
</div>{' '}<div className="rq" id="rq">
</div>{' '}</div>
</div>{' '}<div id="fab">
<button className="fab2" onClick={() => w.openNotes()}>📝</button>
<button className="fab1" onClick={() => w.newNote()}>+</button>
</div>{' '}<div id="msg">
</div>{' '}<div id="toast">
<span id="tmsg">
</span>
<button onClick={() => w.undoNow()}>Undo</button>
<i className="tb" id="tbar">
</i>
</div>{' '}<div id="ask">
<div className="box">
<p id="aq">
</p>
<div className="row">
<button className="no" onClick={() => w.closeAsk()}>Not yet</button>
<button id="ay">Yes</button>
</div>
</div>
</div>{' '}<div id="lvup">
<div className="box">
<div className="e" id="le">🚀</div>
<div className="lt">LEVEL UP</div>
<div id="ln">
</div>
<p id="lp">
</p>
<div className="lq" id="lq">
</div>
<button onClick={() => run("$('lvup').style.display='none'")}>Keep going</button>
</div>
</div>{' '}<div id="pop">
<div className="box">
<div className="e" id="pe">🎉</div>
<p id="pt">
</p>
<div className="q" id="pq">
</div>
<button id="pb" onClick={() => w.closePop()}>Yay!</button>
</div>
</div>{' '}
    </>
  )
}

export default memo(Markup, () => true)
