import os
import re

new_css_block = r"""<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
/* ═══════════════════════════ DESIGN TOKENS ═══════════════════════════ */
:root {
  --g900:#030712; --g800:#0f172a; --g700:#1e293b; --g600:#334155;
  --g500:#3b82f6; --g400:#2563eb; --g300:#60a5fa; --g200:#93c5fd;
  --g100:#bfdbfe; --g50:#eff6ff;
  --amber:#6366f1; --amber-l:#818cf8; --amber-pale:#e0e7ff;
  --red:#ef4444; --blue:#06b6d4; --blue-l:#22d3ee;
  --cream:#f8fafc; --ink:#020617;
  --shadow-xs:0 1px 4px rgba(0,0,0,.12);
  --shadow-sm:0 2px 10px rgba(0,0,0,.15);
  --shadow-md:0 6px 28px rgba(0,0,0,.2);
  --shadow-lg:0 16px 56px rgba(0,0,0,.28);
  --shadow-glow:0 0 20px rgba(59, 130, 246, 0.4);
  --r-sm:8px; --r-md:14px; --r-lg:20px; --r-xl:28px;
  --tr:.22s cubic-bezier(.4,0,.2,1);
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{font-size:16px;scroll-behavior:smooth;}
body{font-family:'Inter',sans-serif;background:var(--g900);color:var(--cream);overflow:hidden;height:100vh;}
::-webkit-scrollbar{width:5px;} ::-webkit-scrollbar-track{background:var(--g800);} ::-webkit-scrollbar-thumb{background:var(--g500);border-radius:3px;}
button{font-family:'Inter',sans-serif;cursor:pointer;border:none;outline:none;}
input,select,textarea{font-family:'Inter',sans-serif;outline:none;}
h1,h2,h3,h4,h5,h6,.form-title,.tb-logo span,.stat-num,.dash-header h2,.dp-name,.auth-logo h1{font-family:'Plus Jakarta Sans',sans-serif !important;}

/* ═══════════════════════════ SCREENS ═══════════════════════════ */
.screen{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 15% 50%, rgba(37, 99, 235, 0.15), transparent 40%),
             radial-gradient(circle at 85% 30%, rgba(6, 182, 212, 0.1), transparent 40%),
             var(--g900);
  z-index:100;transition:opacity .4s ease,transform .4s ease;}
.screen.hidden{opacity:0;pointer-events:none;transform:scale(.97);}

/* ═══════════════════════════ AUTH CARD ═══════════════════════════ */
.auth-wrap{display:grid;grid-template-columns:1.1fr 1fr;max-width:900px;width:95%;
  background:rgba(15, 23, 42, 0.6); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);
  border:1px solid rgba(255,255,255,0.08);border-radius:var(--r-xl);
  box-shadow:var(--shadow-lg), inset 0 0 0 1px rgba(255,255,255,0.05);overflow:hidden;min-height:540px;}

.auth-brand{padding:3.5rem 3rem;background:linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.2));
  display:flex;flex-direction:column;justify-content:center;border-right:1px solid rgba(255,255,255,0.05);}
.auth-logo{display:flex;align-items:center;gap:10px;margin-bottom:2.5rem;}
.auth-logo .leaf{font-size:1.8rem;}
.auth-logo h1{font-weight:800;color:var(--cream);}
.auth-logo h1 span{background:linear-gradient(to right, var(--g300), var(--blue-l));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.auth-brand h2{font-size:2.2rem;font-weight:700;line-height:1.2;color:var(--cream);margin-bottom:.9rem;}
.auth-brand h2 em{font-style:normal;background:linear-gradient(to right, var(--g300), var(--blue-l));-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.auth-brand p{font-size:.9rem;color:rgba(148,163,184,.8);line-height:1.7;margin-bottom:2rem;}
.brand-pills{display:flex;flex-wrap:wrap;gap:.6rem;}
.brand-pill{background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);
  color:var(--g200);font-size:.75rem;font-weight:600;padding:6px 14px;border-radius:50px;}

.auth-form-wrap{padding:3rem;}
.role-tabs{display:flex;background:rgba(15,23,42,.6);border:1px solid rgba(255,255,255,.08);
  border-radius:50px;padding:4px;margin-bottom:2rem;}
.role-tab{flex:1;padding:10px;border-radius:50px;background:transparent;color:rgba(148,163,184,.6);
  font-size:.85rem;font-weight:600;transition:var(--tr);}
.role-tab.active{background:linear-gradient(135deg,var(--g500),var(--g400));color:var(--cream);box-shadow:var(--shadow-md);}
.auth-tab-btns{display:flex;gap:.5rem;margin-bottom:1.8rem;}
.auth-tab-btn{flex:1;padding:8px;border-radius:50px;background:transparent;
  border:1px solid rgba(255,255,255,.1);color:rgba(148,163,184,.6);font-size:.85rem;font-weight:600;transition:var(--tr);}
.auth-tab-btn.active{border-color:var(--g400);color:var(--g200);background:rgba(59,130,246,.05);}
.auth-panel{display:none;} .auth-panel.active{display:block;animation:panelIn .3s ease forwards;}
@keyframes panelIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.form-title{font-size:1.5rem;font-weight:700;color:var(--cream);margin-bottom:.4rem;}
.form-sub{font-size:.85rem;color:rgba(148,163,184,.6);margin-bottom:1.8rem;}
.fg{margin-bottom:1.2rem;}
.fg label{display:block;font-size:.7rem;font-weight:700;color:var(--g200);letter-spacing:.08em;margin-bottom:6px;text-transform:uppercase;}
.fi{position:relative;}
.fi-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:.9rem;pointer-events:none;color:var(--g400);}
.fi input,.fi select{width:100%;padding:12px 14px 12px 40px;
  background:rgba(15,23,42,.5);border:1px solid rgba(255,255,255,.1);
  border-radius:var(--r-sm);color:var(--cream);font-size:.9rem;transition:border-color .2s ease,box-shadow .2s ease;}
.fi input::placeholder{color:rgba(148,163,184,.4);}
.fi input:focus,.fi select:focus{border-color:var(--g400);box-shadow:0 0 0 3px rgba(59,130,246,.15);background:rgba(15,23,42,.8);}
.fi select option{background:var(--g800);}
.auth-submit{width:100%;padding:14px;margin-top:1rem;
  background:linear-gradient(135deg,var(--g400),var(--amber));
  border-radius:var(--r-sm);color:var(--cream);font-size:.95rem;font-weight:700;
  transition:all .3s ease;box-shadow:0 4px 14px rgba(59,130,246,.3);}
.auth-submit:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(59,130,246,.5);}
.auth-note{text-align:center;font-size:.8rem;color:rgba(148,163,184,.5);margin-top:1rem;}
.auth-note a{color:var(--g300);cursor:pointer;text-decoration:none;}
.auth-note a:hover{text-decoration:underline;}

/* ═══════════════════════════ APP SHELL ═══════════════════════════ */
#app{display:none;position:fixed;inset:0;flex-direction:column;}
#app.active{display:flex;}

/* ── TOPBAR ── */
.topbar{height:64px;display:flex;align-items:center;padding:0 1.5rem;
  background:rgba(15,23,42,.8);border-bottom:1px solid rgba(255,255,255,.08);
  backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);z-index:500;gap:1rem;flex-shrink:0;}
.tb-logo{display:flex;align-items:center;gap:8px;text-decoration:none;}
.tb-logo span{font-size:1.4rem;font-weight:800;color:var(--cream);}
.tb-logo small{color:var(--g300);}
.tb-role-badge{background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);
  color:var(--g300);font-size:.7rem;font-weight:700;letter-spacing:.05em;padding:4px 12px;border-radius:50px;text-transform:uppercase;}
.tb-role-badge.buyer{background:rgba(6,182,212,.15);border-color:rgba(6,182,212,.3);color:var(--blue-l);}
.tb-spacer{flex:1;}
.tb-user{display:flex;align-items:center;gap:1rem;}
.tb-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--g600),var(--g400));
  display:flex;align-items:center;justify-content:center;font-size:1rem;border:2px solid rgba(255,255,255,.1);box-shadow:var(--shadow-sm);}
.tb-name{font-size:.85rem;font-weight:600;color:var(--cream);display:none;}
@media(min-width:600px){.tb-name{display:block;}}
.tb-btn{padding:8px 16px;border-radius:50px;border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.05);color:var(--cream);font-size:.8rem;font-weight:600;transition:all .2s ease;}
.tb-btn:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:var(--cream);}
.tb-notify{position:relative;width:36px;height:36px;border-radius:50%;background:rgba(30,41,59,.8);
  border:1px solid rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-size:1rem;cursor:pointer;transition:all .2s ease;}
.tb-notify:hover{background:rgba(51,65,85,.8);}
.notif-badge{position:absolute;top:-4px;right:-4px;width:18px;height:18px;border-radius:50%;
  background:var(--red);font-size:.6rem;font-weight:700;display:flex;align-items:center;justify-content:center;
  border:2px solid var(--g800);box-shadow:0 0 8px rgba(239, 68, 68, 0.4);}

/* ── MAIN LAYOUT ── */
.app-body{display:flex;flex:1;overflow:hidden;}

/* ── SIDEBAR ── */
.sidebar{width:360px;min-width:300px;display:flex;flex-direction:column;
  background:rgba(15,23,42,.95);backdrop-filter:blur(16px);border-right:1px solid rgba(255,255,255,.08);
  overflow:hidden;flex-shrink:0;transition:transform .3s ease, width .3s ease;z-index:200;}
.sidebar.collapsed{width:0;min-width:0;border-right:none;}
.sb-section{padding:1.2rem 1.2rem .6rem;border-bottom:1px solid rgba(255,255,255,.08);}
.sb-section-title{font-size:.7rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:rgba(148,163,184,.6);margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;}
.sb-section-title span{font-size:.75rem;color:var(--g300);font-weight:600;letter-spacing:0;text-transform:none;cursor:pointer;transition:color .2s ease;}
.sb-section-title span:hover{color:var(--g200);}

/* Filters */
.filter-row{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-bottom:.8rem;}
.f-select{width:100%;padding:10px 12px;background:rgba(30,41,59,.6);
  border:1px solid rgba(255,255,255,.1);border-radius:var(--r-sm);
  color:var(--cream);font-size:.85rem;font-family:'Inter',sans-serif;transition:border-color .2s ease;}
.f-select:focus{border-color:var(--g500);}
.f-select option{background:var(--g800);}
.f-range-wrap{margin-bottom:.8rem;}
.f-range-wrap label{font-size:.75rem;font-weight:500;color:var(--g200);display:flex;justify-content:space-between;margin-bottom:6px;}
.f-range{width:100%;accent-color:var(--g400);cursor:pointer;}
.apply-btn{width:100%;padding:12px;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.3);
  color:var(--g200);border-radius:var(--r-sm);font-size:.85rem;font-weight:600;transition:all .2s ease;margin-top:0.5rem;}
.apply-btn:hover{background:rgba(59,130,246,.25);color:var(--g100);}

/* Buyer list */
.buyer-list{flex:1;overflow-y:auto;padding:.8rem;}
.buyer-card{background:rgba(30,41,59,.4);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.05);border-radius:var(--r-md);padding:1rem;margin-bottom:.8rem;
  cursor:pointer;transition:all .3s ease;}
.buyer-card:hover,.buyer-card.active{border-color:rgba(59,130,246,.4);background:rgba(30,41,59,.7);transform:translateY(-2px);box-shadow:var(--shadow-md);}
.buyer-card.active{border-color:var(--g400);box-shadow:var(--shadow-glow);}
.bc-head{display:flex;align-items:center;gap:.8rem;margin-bottom:.8rem;}
.bc-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--g500),var(--amber));
  display:flex;align-items:center;justify-content:center;font-size:1rem;color:white;font-weight:600;flex-shrink:0;box-shadow:var(--shadow-sm);}
.bc-name{font-weight:600;font-size:.95rem;color:var(--cream);}
.bc-dist{font-size:.75rem;color:var(--g300);display:flex;align-items:center;gap:4px;margin-top:2px;}
.bc-chips{display:flex;flex-wrap:wrap;gap:.4rem;margin-bottom:.8rem;}
.bc-chip{font-size:.7rem;font-weight:600;padding:4px 10px;border-radius:50px;}
.chip-product{background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.25);color:var(--g200);}
.chip-price{background:rgba(99,102,241,.15);border:1px solid rgba(99,102,241,.25);color:var(--amber-l);}
.chip-qty{background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.25);color:var(--blue-l);}
.bc-footer{display:flex;gap:.5rem;}
.bc-action{flex:1;padding:8px;border-radius:var(--r-sm);font-size:.8rem;font-weight:600;transition:all .2s ease;}
.bc-contact{background:rgba(59,130,246,.2);border:1px solid rgba(59,130,246,.3);color:var(--g200);}
.bc-contact:hover{background:rgba(59,130,246,.3);color:var(--g100);}
.bc-view{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:var(--cream);}
.bc-view:hover{background:rgba(255,255,255,.1);}

/* ── MAP AREA ── */
.map-area{flex:1;position:relative;overflow:hidden;}
#map{width:100%;height:100%;background:#0a0f1c;z-index:1;}

/* Map controls */
.map-controls{position:absolute;top:1.5rem;right:1.5rem;display:flex;flex-direction:column;gap:.5rem;z-index:400;}
.mc-btn{width:44px;height:44px;border-radius:12px;background:rgba(15,23,42,.8);backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.1);color:var(--cream);font-size:1.2rem;
  display:flex;align-items:center;justify-content:center;transition:all .2s ease;box-shadow:var(--shadow-sm);}
.mc-btn:hover{background:rgba(30,41,59,.9);border-color:rgba(255,255,255,.2);color:var(--g200);}

#sidebar-toggle-btn{display:none;}
@media(max-width:768px){
  #sidebar-toggle-btn{display:flex;}
}

.map-legend{position:absolute;bottom:1.5rem;left:1.5rem;
  background:rgba(15,23,42,.85);border:1px solid rgba(255,255,255,.1);
  border-radius:var(--r-md);padding:1rem 1.2rem;backdrop-filter:blur(12px);z-index:400;box-shadow:var(--shadow-md);}
.legend-row{display:flex;align-items:center;gap:.6rem;font-size:.75rem;color:rgba(148,163,184,.8);margin-bottom:.5rem;font-weight:500;}
.legend-row:last-child{margin-bottom:0;}
.leg-dot{width:12px;height:12px;border-radius:50%;box-shadow:0 0 8px currentColor;}

.my-location-btn{position:absolute;bottom:1.5rem;right:1.5rem;z-index:400;
  padding:12px 20px;background:rgba(15,23,42,.85);backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,.1);border-radius:50px;
  color:var(--g200);font-size:.85rem;font-weight:600;
  display:flex;align-items:center;gap:8px;transition:all .2s ease;box-shadow:var(--shadow-md);}
.my-location-btn:hover{background:rgba(30,41,59,.9);border-color:rgba(255,255,255,.2);color:var(--g100);}

/* ── BUYER DETAIL PANEL ── */
.detail-panel{position:absolute;top:1.5rem;left:1.5rem;width:340px;
  background:rgba(15,23,42,.85);border:1px solid rgba(255,255,255,.1);
  border-radius:var(--r-lg);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  box-shadow:var(--shadow-lg), 0 0 0 1px rgba(255,255,255,.05) inset;transform:translateX(-120%);
  transition:transform .4s cubic-bezier(.4,0,.2,1);z-index:410;overflow:hidden;}
.detail-panel.open{transform:translateX(0);}
.dp-header{padding:1.4rem 1.4rem 1rem;background:linear-gradient(135deg,rgba(30,41,59,.6),rgba(15,23,42,.8));
  border-bottom:1px solid rgba(255,255,255,.05);}
.dp-close{position:absolute;top:1rem;right:1rem;width:32px;height:32px;border-radius:50%;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);
  color:rgba(148,163,184,.8);font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s ease;}
.dp-close:hover{background:rgba(255,255,255,.1);color:var(--cream);}
.dp-avatar-row{display:flex;align-items:center;gap:1.2rem;margin-bottom:.5rem;}
.dp-avatar{width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--g500),var(--amber));
  display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:white;font-weight:600;border:2px solid rgba(255,255,255,.1);box-shadow:var(--shadow-sm);}
.dp-name{font-size:1.3rem;font-weight:700;color:var(--cream);margin-bottom:2px;}
.dp-type{font-size:.8rem;color:rgba(148,163,184,.6);font-weight:500;}
.dp-dist-badge{display:inline-flex;align-items:center;gap:6px;
  background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.25);
  color:var(--g200);font-size:.75rem;font-weight:700;padding:6px 14px;border-radius:50px;margin-top:.8rem;}
.dp-body{padding:1.4rem;}
.dp-rows{display:flex;flex-direction:column;gap:.6rem;margin-bottom:1.4rem;}
.dp-row{display:flex;align-items:center;gap:1rem;padding:.8rem 1rem;
  background:rgba(30,41,59,.4);border:1px solid rgba(255,255,255,.05);border-radius:var(--r-sm);}
.dp-row-icon{font-size:1.2rem;flex-shrink:0;width:24px;text-align:center;}
.dp-row-label{font-size:.75rem;font-weight:500;color:rgba(148,163,184,.6);flex-shrink:0;width:80px;}
.dp-row-val{font-size:.9rem;font-weight:600;color:var(--cream);margin-left:auto;text-align:right;}
.dp-actions{display:flex;flex-direction:column;gap:.6rem;}
.dp-btn{width:100%;padding:12px;border-radius:var(--r-sm);font-size:.9rem;font-weight:700;transition:all .2s ease;}
.dp-btn-primary{background:linear-gradient(135deg,var(--g400),var(--amber));color:var(--cream);box-shadow:0 4px 14px rgba(59,130,246,.25);}
.dp-btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(59,130,246,.4);}
.dp-btn-secondary{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:var(--cream);}
.dp-btn-secondary:hover{background:rgba(255,255,255,.1);}
.dp-rating{display:flex;align-items:center;gap:.6rem;padding:.8rem 1rem;
  background:rgba(30,41,59,.4);border:1px solid rgba(255,255,255,.05);border-radius:var(--r-sm);margin-bottom:.8rem;}
.dp-stars{color:var(--amber-l);font-size:1.1rem;letter-spacing:2px;}
.dp-rating-text{font-size:.8rem;color:rgba(148,163,184,.6);font-weight:500;}

/* ── BUYER DASHBOARD ── */
.buyer-dash{position:fixed;inset:64px 0 0;background:rgba(3,7,18,.98);backdrop-filter:blur(20px);z-index:600;
  display:none;flex-direction:column;overflow:hidden;}
.buyer-dash.active{display:flex;animation:fadeIn .3s ease;}
@keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
.dash-header{padding:1.5rem 2rem;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(15,23,42,.4);}
.dash-header h2{font-size:1.8rem;font-weight:700;color:var(--cream);}
.dash-header p{font-size:.9rem;color:rgba(148,163,184,.6);margin-top:4px;}
.dash-body{flex:1;overflow-y:auto;padding:2rem;display:grid;
  grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem;align-content:start;}
.stat-card{background:rgba(15,23,42,.6);backdrop-filter:blur(16px);
  border:1px solid rgba(255,255,255,.05);border-radius:var(--r-lg);padding:1.5rem;box-shadow:var(--shadow-md);}
.stat-icon{font-size:2rem;margin-bottom:1rem;background:rgba(255,255,255,.05);width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;}
.stat-num{font-size:2.8rem;font-weight:800;color:var(--blue-l);line-height:1;}
.stat-label{font-size:.85rem;font-weight:500;color:rgba(148,163,184,.6);margin-top:8px;}
.post-form-card{background:rgba(15,23,42,.6);backdrop-filter:blur(16px);
  border:1px solid rgba(255,255,255,.08);border-radius:var(--r-lg);padding:2rem;grid-column:1 / -1;}
@media(min-width:1024px){.post-form-card{grid-column:span 2;}}
.post-form-card h3{font-size:1.3rem;font-weight:600;color:var(--cream);margin-bottom:1.5rem;display:flex;align-items:center;gap:8px;}
.pf-grid{display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:1.2rem;}
.pf-field label{display:block;font-size:.75rem;font-weight:600;color:var(--g200);margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em;}
.pf-field input,.pf-field select{width:100%;padding:12px 14px;background:rgba(30,41,59,.5);
  border:1px solid rgba(255,255,255,.1);border-radius:var(--r-sm);color:var(--cream);font-size:.95rem;font-family:'Inter',sans-serif;transition:all .2s ease;}
.pf-field input:focus,.pf-field select:focus{border-color:var(--g400);background:rgba(30,41,59,.8);box-shadow:0 0 0 3px rgba(59,130,246,.15);}
.pf-field input::placeholder{color:rgba(148,163,184,.4);}
.pf-field select option{background:var(--g800);}
.post-btn{margin-top:1.5rem;padding:14px 28px;background:linear-gradient(135deg,var(--g400),var(--amber));
  border-radius:var(--r-sm);color:var(--cream);font-size:1rem;font-weight:700;transition:all .3s ease;box-shadow:0 4px 14px rgba(59,130,246,.3);display:inline-block;}
.post-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(59,130,246,.5);}
.posted-list{grid-column:1 / -1;}
@media(min-width:1024px){.posted-list{grid-column:span 2;}}
.posted-list h3{font-size:1.2rem;font-weight:600;color:var(--cream);margin-bottom:1rem;}
.posted-item{display:flex;align-items:center;gap:1.2rem;padding:1.2rem;
  background:rgba(15,23,42,.6);border:1px solid rgba(255,255,255,.05);border-radius:var(--r-md);margin-bottom:.8rem;transition:all .2s ease;}
.posted-item:hover{background:rgba(30,41,59,.6);border-color:rgba(255,255,255,.1);}
.pi-emoji{font-size:1.8rem;background:rgba(255,255,255,.05);width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:12px;flex-shrink:0;}
.pi-info{flex:1;}
.pi-title{font-weight:600;font-size:1.05rem;color:var(--cream);margin-bottom:4px;}
.pi-meta{font-size:.85rem;color:rgba(148,163,184,.6);}
.pi-badge{font-size:.75rem;font-weight:700;padding:4px 12px;border-radius:50px;
  background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.25);color:var(--g200);}
.pi-del{width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,.1);
  border:1px solid rgba(239,68,68,.2);color:#fca5a5;font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s ease;cursor:pointer;}
.pi-del:hover{background:rgba(239,68,68,.2);color:#fee2e2;transform:scale(1.05);}

/* ── NOTIFICATIONS PANEL ── */
.notif-panel{position:fixed;top:64px;right:0;width:340px;
  background:rgba(15,23,42,.95);border-left:1px solid rgba(255,255,255,.08);backdrop-filter:blur(16px);
  transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);z-index:700;
  height:calc(100vh - 64px);display:flex;flex-direction:column;box-shadow:-8px 0 24px rgba(0,0,0,.2);}
.notif-panel.open{transform:translateX(0);}
.np-head{padding:1.2rem 1.4rem;border-bottom:1px solid rgba(255,255,255,.08);
  display:flex;align-items:center;justify-content:space-between;background:rgba(30,41,59,.4);}
.np-head h4{font-size:1.1rem;font-weight:600;color:var(--cream);}
.np-close{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(148,163,184,.6);font-size:1rem;display:flex;align-items:center;justify-content:center;transition:all .2s ease;cursor:pointer;}
.np-close:hover{background:rgba(255,255,255,.1);color:var(--cream);}
.notif-list{flex:1;overflow-y:auto;padding:.8rem;}
.notif-item{padding:1rem;background:rgba(30,41,59,.3);border:1px solid rgba(255,255,255,.05);
  border-radius:var(--r-md);margin-bottom:.8rem;display:flex;gap:1rem;align-items:flex-start;transition:all .2s ease;}
.notif-icon{font-size:1.4rem;flex-shrink:0;}
.notif-text{font-size:.85rem;color:var(--cream);line-height:1.5;}
.notif-time{font-size:.75rem;color:rgba(148,163,184,.5);margin-top:6px;font-weight:500;}
.notif-item.unread{border-color:rgba(59,130,246,.3);background:rgba(59,130,246,.05);}

/* ── CHAT MODAL ── */
.chat-modal{position:fixed;bottom:1.5rem;right:1.5rem;width:340px;
  background:rgba(15,23,42,.95);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(16px);
  border-radius:var(--r-lg);box-shadow:var(--shadow-lg), 0 0 0 1px rgba(255,255,255,.05) inset;z-index:800;
  transform:translateY(20px) scale(.95);opacity:0;pointer-events:none;transition:all .3s cubic-bezier(.4,0,.2,1);}
.chat-modal.open{transform:translateY(0) scale(1);opacity:1;pointer-events:all;}
.chat-head{padding:1rem 1.2rem;background:linear-gradient(135deg,rgba(30,41,59,.8),rgba(15,23,42,.9));
  border-bottom:1px solid rgba(255,255,255,.05);border-radius:var(--r-lg) var(--r-lg) 0 0;
  display:flex;align-items:center;justify-content:space-between;}
.chat-head-info{display:flex;align-items:center;gap:.8rem;}
.chat-avatar{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--g500),var(--amber));display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:600;color:white;box-shadow:var(--shadow-sm);}
.chat-name{font-weight:600;font-size:.95rem;color:var(--cream);margin-bottom:2px;}
.chat-status{font-size:.75rem;color:var(--g300);font-weight:500;display:flex;align-items:center;gap:4px;}
.chat-status::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--g300);display:inline-block;box-shadow:0 0 6px var(--g300);}
.chat-close-btn{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(148,163,184,.6);font-size:.9rem;display:flex;align-items:center;justify-content:center;transition:all .2s ease;cursor:pointer;}
.chat-close-btn:hover{background:rgba(255,255,255,.1);color:var(--cream);}
.chat-messages{height:260px;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.8rem;background:rgba(30,41,59,.1);}
.msg{max-width:80%;padding:10px 14px;border-radius:12px;font-size:.85rem;line-height:1.5;}
.msg.them{background:rgba(30,41,59,.8);border:1px solid rgba(255,255,255,.05);color:var(--cream);align-self:flex-start;border-radius:4px 12px 12px 12px;}
.msg.me{background:linear-gradient(135deg,var(--g500),var(--g400));color:var(--cream);align-self:flex-end;border-radius:12px 4px 12px 12px;box-shadow:0 2px 8px rgba(59,130,246,.2);}
.chat-input-row{padding:1rem;border-top:1px solid rgba(255,255,255,.05);display:flex;gap:.8rem;background:rgba(15,23,42,.8);border-radius:0 0 var(--r-lg) var(--r-lg);}
.chat-input{flex:1;padding:10px 16px;background:rgba(30,41,59,.6);border:1px solid rgba(255,255,255,.1);
  border-radius:50px;color:var(--cream);font-size:.9rem;font-family:'Inter',sans-serif;transition:border-color .2s ease;}
.chat-input:focus{border-color:var(--g400);}
.chat-input::placeholder{color:rgba(148,163,184,.5);}
.chat-send{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--g400),var(--amber));
  display:flex;align-items:center;justify-content:center;font-size:1.1rem;color:white;transition:all .2s ease;flex-shrink:0;cursor:pointer;box-shadow:0 2px 10px rgba(59,130,246,.3);}
.chat-send:hover{transform:scale(1.08);box-shadow:0 4px 14px rgba(59,130,246,.4);}

/* ── TOAST ── */
.toast{position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);
  background:rgba(15,23,42,.95);border:1px solid rgba(255,255,255,.1);backdrop-filter:blur(12px);
  border-radius:50px;padding:1rem 1.8rem;font-size:.9rem;font-weight:500;color:var(--cream);
  box-shadow:var(--shadow-lg), 0 0 0 1px rgba(255,255,255,.05) inset;opacity:0;transition:all .3s cubic-bezier(.4,0,.2,1);z-index:9999;
  display:flex;align-items:center;gap:.8rem;white-space:nowrap;}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
.toast.error{border-color:rgba(239,68,68,.4);background:rgba(69,10,10,.9);}

/* ── RATING STARS ── */
.star-rating{display:flex;gap:4px;}
.star{font-size:1.3rem;cursor:pointer;color:rgba(255,255,255,.1);transition:color .2s ease;}
.star.active,.star:hover{color:var(--amber-l);text-shadow:0 0 10px rgba(129,140,248,.4);}

/* ── STATS BAR ── */
.stats-bar{display:flex;gap:.8rem;padding:0;background:transparent;border:none;}
.stats-item{display:flex;align-items:center;gap:.6rem;
  background:rgba(30,41,59,.5);border:1px solid rgba(255,255,255,.05);
  border-radius:50px;padding:6px 16px;box-shadow:var(--shadow-xs);}
.stats-item span{font-size:.75rem;font-weight:500;color:rgba(148,163,184,.6);}
.stats-item strong{font-size:.85rem;color:var(--g200);font-weight:700;}
@media(max-width:1024px){.stats-bar{display:none;}}

/* ── LOADING ── */
.map-loading{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:rgba(15,23,42,.85);backdrop-filter:blur(8px);z-index:50;gap:1rem;}
.spinner{width:48px;height:48px;border:4px solid rgba(255,255,255,.05);border-top-color:var(--g400);
  border-radius:50%;animation:spin .8s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.map-loading p{font-size:.9rem;font-weight:500;color:rgba(148,163,184,.8);}

/* RESPONSIVE */
@media(max-width:768px){
  .auth-wrap{grid-template-columns:1fr;min-height:auto;margin:1rem;border-radius:var(--r-lg);}
  .auth-brand{display:none;}
  .auth-form-wrap{padding:2rem 1.5rem;}
  .topbar{padding:0 1rem;height:60px;}
  .sidebar{position:absolute;left:0;top:0;bottom:0;z-index:450;transform:translateX(-100%);width:320px !important;
    box-shadow:none;border-right:1px solid rgba(255,255,255,.1);}
  .sidebar.mobile-open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,.5);}
  #sidebar-toggle-btn{display:flex;}
  .post-form-card{grid-column:1 / -1;padding:1.5rem;}
  .posted-list{grid-column:1 / -1;}
  .pf-grid{grid-template-columns:1fr;}
  .detail-panel{width:calc(100% - 2rem);top:auto;bottom:1rem;left:1rem;transform:translateY(120%);}
  .detail-panel.open{transform:translateY(0);}
  .map-controls{top:1rem;right:1rem;}
  .my-location-btn{bottom:1rem;right:1rem;}
  .map-legend{bottom:1rem;left:1rem;padding:.8rem;font-size:.7rem;}
  .chat-modal{width:calc(100% - 2rem);bottom:1rem;right:1rem;}
  .notif-panel{width:100%;height:calc(100vh - 60px);top:60px;}
}
</style>"""

files_to_update = [
    r"c:\Users\Shubham jain\OneDrive\Attachments\Desktop\files\agrihelp-map.html",
    r"c:\Users\Shubham jain\OneDrive\Attachments\Desktop\files\agrihelp-deploy\index.html"
]

for file_path in files_to_update:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # We need to replace from <link href="https://fonts.googleapis... to </style>
        # using regex to properly match the block
        pattern = re.compile(r'<link href="https://fonts\.googleapis\.com[^>]+>\s*<link rel="stylesheet"[^>]+>\s*<script src="https://unpkg\.com/[^>]+></script>\s*<style>.*?</style>', re.DOTALL)
        
        new_content, count = pattern.subn(new_css_block, content)
        
        if count > 0:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {file_path}")
        else:
            print(f"Pattern not found in {file_path}, maybe already updated or different format.")
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
