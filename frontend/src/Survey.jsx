import React, { useEffect, useMemo, useState } from "react";
import "./Survey.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const PARTIES = ["BJP", "Congress", "AAP", "Shiromani Akali Dal", "Waris Punjab De"];
const ISSUES = ["Drug abuse and addiction", "Crime and public safety", "Corruption", "Unemployment among youth", "Roads and infrastructure", "Water supply and electricity", "Healthcare and education", "Agricultural and farmers' issues", "Sanitation and drainage", "Other"];
const PRIORITIES = ["Eradication of drugs and rehabilitation", "Crime prevention and public safety", "Anti-corruption initiatives", "Employment opportunities for youth", "Education and healthcare", "Farmers' welfare and agricultural development", "Industrial growth and business opportunities", "Infrastructure development", "Women's safety", "Environmental protection", "Other"];
const IMPROVEMENTS = ["Stronger grassroots and local leadership", "Improved employment opportunities", "Effective action against drugs and crime", "Transparent and accountable governance", "Better farmers' welfare policies", "Improved healthcare and education", "Industrial and economic development", "Greater public engagement", "A clear vision for Punjab's development", "Other"];
const LEADERS = ["Bhagwant Mann", "Arvind Kejriwal", "Charanjit Singh Channi", "Pargat Singh", "Kewal Singh Dhillon", "Narendra Modi", "Amit Shah", "Rahul Gandhi", "Amritpal Singh"];
const SCALE = ["Very Positive", "Positive", "Neutral", "Negative", "Very Negative", "Not Familiar"];
const PARTIES_SCALE = ["Very Favourable", "Favourable", "Neutral", "Unfavourable", "Very Unfavourable", "Not Familiar"];
const QUESTIONS = [
 {id:"district",n:1,section:"Respondent Profile",title:"District / Constituency / Village / Ward",type:"text",required:true,placeholder:"Enter district, constituency, village or ward"},
 {id:"age",n:2,section:"Respondent Profile",title:"Age",type:"number",required:true,placeholder:"Age in years (18+)"},
 {id:"occupation",n:3,section:"Respondent Profile",title:"Occupation",type:"radio",options:["Business / Entrepreneur","Government Employee","Private Sector Employee","Farmer","Student","Self-employed","Homemaker","Retired","Unemployed","Other"]},
 {id:"residence",n:4,section:"Respondent Profile",title:"How long have you been residing in this area?",type:"radio",options:["Less than 1 year","1–5 years","5–10 years","More than 10 years"]},
 {id:"local_issues",n:5,section:"Key Issues & Development in Punjab",title:"What are the three most pressing issues in your locality? (Select up to 3)",type:"multi",max:3,options:ISSUES},
 {id:"development",n:6,section:"Key Issues & Development in Punjab",title:"How would you assess the overall development of your locality?",type:"radio",options:["Excellent","Good","Average","Poor","Very Poor"]},
 {id:"seriousness",n:7,section:"Key Issues & Development in Punjab",title:"How serious are the following issues in Punjab?",type:"matrix",rows:["Drug abuse","Crime and law & order","Corruption","Youth unemployment","Youth migration","Agricultural challenges"],options:["Very Serious","Serious","Moderate","Not Serious","Not Sure"]},
 {id:"services",n:8,section:"Key Issues & Development in Punjab",title:"How effectively are government services and welfare schemes reaching the public?",type:"radio",options:["Very effectively","To some extent","Not effectively","Not sure"]},
 {id:"priorities",n:9,section:"Key Issues & Development in Punjab",title:"Which three areas should be the highest priorities for Punjab's development? (Select up to 3)",type:"multi",max:3,options:PRIORITIES},
 {id:"leader_opinion",n:10,section:"Political Leadership & Governance",title:"What is your overall opinion of the following political leaders?",type:"matrix",rows:LEADERS,options:SCALE},
 {id:"government_performance",n:11,section:"Political Leadership & Governance",title:"How would you evaluate the performance of the current Punjab government?",type:"radio",options:["Excellent","Good","Average","Poor","Very Poor","Not Sure"]},
 {id:"preferred_party",n:12,section:"Upcoming Election & Political Preferences",title:"Which political party would you currently prefer to support in the upcoming Punjab Assembly elections?",type:"radio",options:[...PARTIES,"Other","Undecided","Prefer not to say"]},
 {id:"candidate_type",n:13,section:"Upcoming Election & Political Preferences",title:"What type of candidate would you prefer to represent your constituency in the upcoming elections?",type:"radio",options:[...PARTIES.map(p=>`${p} candidate`),"Independent candidate","Other","Undecided","Prefer not to say"],extra:{id:"candidate_name",title:"Preferred candidate's name (if known)",type:"text"}},
 {id:"voting_factors",n:14,section:"Upcoming Election & Political Preferences",title:"Which factors would have the greatest influence on your voting decision?",type:"multi",options:["Candidate's reputation and public service","Party leadership","Development and infrastructure","Employment opportunities","Action against drugs","Law and order","Transparent and corruption-free governance","Farmers' welfare","Education and healthcare","Other"]},
 {id:"best_positioned",n:15,section:"Upcoming Election & Political Preferences",title:"Which political party do you believe is currently best positioned to gain public support in the next election?",type:"radio",options:[...PARTIES,"No clear preference","Not sure"]},
 {id:"party_image",n:16,section:"Public Perception of Political Parties",title:"How would you rate the current public image of the following political parties in Punjab?",type:"matrix",rows:PARTIES,options:PARTIES_SCALE},
 {id:"party_improvements",n:17,section:"Public Perception of Political Parties",title:"What initiatives or changes should the following political parties undertake to improve public trust and confidence? (Select all relevant options for each party)",type:"party_multi",rows:PARTIES,options:IMPROVEMENTS},
 {id:"candidate_qualities",n:18,section:"Public Perception of Political Parties",title:"Which qualities do you consider most important when selecting a candidate for your constituency? (Select up to 3)",type:"multi",max:3,options:["Honest and clean public image","Strong local connection and understanding of public issues","Accessibility and engagement with people","Administrative and leadership experience","Vision for development","Youth representation","Business and professional experience","Proven record of public service","Other"]},
 {id:"potential_candidate",n:19,section:"Public Perception of Political Parties",title:"Is there any particular leader or potential candidate you would like to see represent your constituency?",type:"group",fields:[{id:"name",title:"Name",type:"text"},{id:"party",title:"Party",type:"text"},{id:"reason",title:"Reason (Optional)",type:"textarea"}]},
 {id:"biggest_change",n:20,section:"Public Suggestions & Expectations",title:"What is the single biggest change you would like to see in Punjab over the next five years?",type:"textarea"},
 {id:"suggestions",n:21,section:"Public Suggestions & Expectations",title:"Do you have any suggestions, concerns, or recommendations for Punjab's political leadership?",type:"textarea"}
];
const SECTIONS = [...new Set(QUESTIONS.map(q=>q.section))];

function Question({q,value,onChange}) {
 const toggle = (v, max) => {
   const arr = Array.isArray(value) ? value : [];
   onChange(arr.includes(v) ? arr.filter(x=>x!==v) : (max && arr.length>=max ? arr : [...arr,v]));
 };
 if(q.type==="text" || q.type==="number") return <input type={q.type} min={q.type==="number"?18:undefined} max={q.type==="number"?110:undefined} placeholder={q.placeholder||"Your answer"} value={value||""} onChange={e=>onChange(e.target.value)} />;
 if(q.type==="textarea") return <textarea rows="4" value={value||""} onChange={e=>onChange(e.target.value)} placeholder="Write your response here..." />;
 if(q.type==="radio") return <div className="survey-options">{q.options.map(o=><label className="survey-option" key={o}><input type="radio" name={q.id} checked={value===o} onChange={()=>onChange(o)}/><span>{o}</span></label>)}</div>;
 if(q.type==="multi") return <><div className="survey-options">{q.options.map(o=><label className="survey-option" key={o}><input type="checkbox" checked={(value||[]).includes(o)} onChange={()=>toggle(o,q.max)}/><span>{o}</span></label>)}</div>{q.max&&<small className="survey-hint">Select up to {q.max}. Selected: {(value||[]).length}</small>}</>;
 if(q.type==="matrix") return <div className="survey-matrix-wrap"><table className="survey-matrix"><thead><tr><th>Item</th>{q.options.map(o=><th key={o}>{o}</th>)}</tr></thead><tbody>{q.rows.map(r=><tr key={r}><th>{r}</th>{q.options.map(o=><td key={o}><input aria-label={`${r}: ${o}`} type="radio" name={`${q.id}-${r}`} checked={value?.[r]===o} onChange={()=>onChange({...value,[r]:o})}/></td>)}</tr>)}</tbody></table></div>;
 if(q.type==="party_multi") return <div className="party-multi">{q.rows.map(p=><div className="party-choice" key={p}><b>{p}</b><div className="survey-options">{q.options.map(o=><label className="survey-option" key={o}><input type="checkbox" checked={(value?.[p]||[]).includes(o)} onChange={()=>onChange({...value,[p]:(value?.[p]||[]).includes(o)?value[p].filter(x=>x!==o):[...(value?.[p]||[]),o]})}/><span>{o}</span></label>)}</div></div>)}</div>;
 if(q.type==="group") return <div className="survey-group">{q.fields.map(f=><label key={f.id}>{f.title}{f.type==="textarea"?<textarea rows="3" value={value?.[f.id]||""} onChange={e=>onChange({...value,[f.id]:e.target.value})}/>:<input value={value?.[f.id]||""} onChange={e=>onChange({...value,[f.id]:e.target.value})}/>}</label>)}</div>;
 return null;
}

export function PublicSurvey() {
 const [answers,setAnswers]=useState({});
 const [config,setConfig]=useState({enabled:true,title:"PUNJAB PUBLIC OPINION & DEVELOPMENT SURVEY",intro:"Understanding Public Issues, Governance, Political Perceptions & Future Expectations"});
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[receipt,setReceipt]=useState("");
 useEffect(()=>{fetch(`${API}/api/survey/config`).then(r=>r.ok?r.json():null).then(x=>x&&setConfig(x)).catch(()=>{});},[]);
 const update=(id,v)=>setAnswers(a=>({...a,[id]:v}));
 async function submit(e){
  e.preventDefault();setError("");
  if(!answers.consent){setError("Please confirm your consent before submitting.");return;}
  if(!answers.district?.trim() || !answers.age){setError("Please fill in district/area and age.");return;}
  setBusy(true);
  try{
   const payload={answers:Object.fromEntries(Object.entries(answers).filter(([k])=>k!=="consent")),consent:true};
   const r=await fetch(`${API}/api/survey/responses`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const d=await r.json();if(!r.ok)throw new Error(d.detail||"Submission failed");
   setReceipt(d.receipt_code);setAnswers({});
  }catch(err){setError(err.message||"Could not submit. Please try again.");}
  finally{setBusy(false);}
 }
 if(receipt)return <main className="survey-page"><div className="survey-success"><div className="survey-success-icon">✓</div><h1>Thank you for participating!</h1><p>Your response has been submitted successfully.</p><div className="receipt-code"><small>Anonymous receipt code</small><b>{receipt}</b></div><p className="survey-hint">Keep this code only as a submission receipt. It does not identify you.</p><button className="survey-primary" onClick={()=>setReceipt("")}>Start another response</button></div></main>;
 if(!config.enabled)return <main className="survey-page"><div className="survey-success"><h1>Survey currently closed</h1><p>Thank you for your interest. Please check again later.</p></div></main>;
 return <main className="survey-page"><div className="survey-shell">
  <header className="survey-hero"><div className="survey-brand">PUNJAB • PUBLIC VOICE</div><h1>{config.title}</h1><p>{config.intro}</p><div className="survey-privacy">🔒 Anonymous participation · Adults 18+ · No name, phone number or email collected</div></header>
  <form onSubmit={submit}>
   {SECTIONS.map((section,si)=><section className="survey-section" key={section}><div className="survey-section-head"><span>SECTION {si+1}</span><h2>{section}</h2></div>
    {QUESTIONS.filter(q=>q.section===section).map(q=><div className="survey-question" key={q.id}><label className="survey-question-title">{q.n}. {q.title}{[1,2].includes(q.n)&&<em> *</em>}</label><Question q={q} value={answers[q.id]} onChange={v=>update(q.id,v)}/>{q.extra&&<div className="survey-extra"><label>{q.extra.title}</label><Question q={q.extra} value={answers[q.extra.id]} onChange={v=>update(q.extra.id,v)}/></div>}</div>)}
   </section>)}
   <label className="survey-consent"><input type="checkbox" checked={!!answers.consent} onChange={e=>update("consent",e.target.checked)}/><span>I confirm that I am 18 years or older and voluntarily agree to submit these anonymous survey responses. I understand that political opinions are sensitive information and will be used for the stated survey analysis.</span></label>
   {error&&<div className="survey-error">{error}</div>}
   <button className="survey-primary survey-submit" disabled={busy}>{busy?"Submitting...":"Submit Survey →"}</button>
   <p className="survey-foot">Thank you for your participation. Please do not include identifying or confidential personal information in open-text answers.</p>
  </form>
 </div></main>;
}

export function SurveyAdmin() {
 const [key,setKey]=useState(()=>sessionStorage.getItem("surveyAdminKey")||"");
 const [data,setData]=useState({responses:[],total:0,config:{enabled:true,title:"PUNJAB PUBLIC OPINION & DEVELOPMENT SURVEY",intro:"Understanding Public Issues, Governance, Political Perceptions & Future Expectations"}});
 const [filter,setFilter]=useState(""),[selected,setSelected]=useState(null),[msg,setMsg]=useState(""),[loading,setLoading]=useState(false);
 const headers={"X-Admin-Key":key};
 async function load(){if(!key)return;setLoading(true);try{const r=await fetch(`${API}/api/survey/admin`,{headers});if(!r.ok)throw new Error("Admin key incorrect or access denied");const d=await r.json();setData(d);sessionStorage.setItem("surveyAdminKey",key);setMsg("");}catch(e){setMsg(e.message);}finally{setLoading(false);}}
 useEffect(()=>{if(key)load();},[]);
 const filtered=data.responses.filter(x=>(x.answers?.district||"").toLowerCase().includes(filter.toLowerCase()));
 async function saveConfig(patch){try{const r=await fetch(`${API}/api/survey/admin/config`,{method:"PUT",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({...data.config,...patch})});if(!r.ok)throw new Error("Could not save settings");setData(d=>({...d,config:{...d.config,...patch}}));setMsg("Survey settings saved.");}catch(e){setMsg(e.message);}}
 function exportCsv(){const rows=[["Receipt","Submitted at",...QUESTIONS.map(q=>q.title)]];filtered.forEach(x=>rows.push([x.receipt_code,x.created_at,...QUESTIONS.map(q=>{const v=x.answers?.[q.id];return typeof v==="object"?JSON.stringify(v):v??"";})]));const csv=rows.map(row=>row.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(",")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));a.download="punjab-survey-responses.csv";a.click();URL.revokeObjectURL(a.href);}
 const districtCount=Object.entries(filtered.reduce((a,x)=>{const d=x.answers?.district||"Not provided";a[d]=(a[d]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
 if(!key)return <section className="survey-admin"><h1>Public Survey Administration</h1><p>Enter the backend survey admin key to view responses.</p><input type="password" value={key} onChange={e=>setKey(e.target.value)} placeholder="Survey admin key"/><button className="survey-primary" onClick={load}>Unlock survey data</button>{msg&&<p className="survey-error">{msg}</p>}<small>Set SURVEY_ADMIN_KEY in your backend environment before using this page.</small></section>;
 return <section className="survey-admin"><div className="survey-admin-head"><div><span className="survey-brand">PUBLIC OPINION RESEARCH</span><h1>Survey responses</h1><p>Anonymous submissions and aggregated results</p></div><div className="survey-admin-actions"><button onClick={load}>↻ Refresh</button><button onClick={exportCsv}>↓ Export CSV</button></div></div>
  {msg&&<p className="survey-admin-msg">{msg}</p>}
  <div className="survey-admin-stats"><div><b>{data.total}</b><span>Total responses</span></div><div><b>{districtCount.length}</b><span>Areas represented</span></div><div><b>{data.responses.filter(x=>new Date(x.created_at).toDateString()===new Date().toDateString()).length}</b><span>Today</span></div></div>
  <div className="survey-admin-settings"><div><div><b>Survey availability</b><small>Turn public submissions on or off</small></div><label className="survey-switch"><input type="checkbox" checked={!!data.config.enabled} onChange={e=>saveConfig({enabled:e.target.checked})}/><span>{data.config.enabled?"Open":"Closed"}</span></label></div><label>Survey title<input value={data.config.title||""} onChange={e=>setData(d=>({...d,config:{...d.config,title:e.target.value}}))}/></label><label>Subtitle / introduction<input value={data.config.intro||""} onChange={e=>setData(d=>({...d,config:{...d.config,intro:e.target.value}}))}/></label><button onClick={()=>saveConfig({title:data.config.title,intro:data.config.intro})}>Save survey settings</button></div>
  <div className="survey-admin-panel"><div className="survey-admin-panel-head"><h2>Responses</h2><input placeholder="Filter by district / area" value={filter} onChange={e=>setFilter(e.target.value)}/></div>
   <div className="survey-admin-table-wrap"><table><thead><tr><th>Receipt</th><th>Area</th><th>Age</th><th>Occupation</th><th>Preferred party</th><th>Submitted</th><th></th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td>{x.receipt_code}</td><td>{x.answers?.district||"—"}</td><td>{x.answers?.age||"—"}</td><td>{x.answers?.occupation||"—"}</td><td>{x.answers?.preferred_party||"—"}</td><td>{new Date(x.created_at).toLocaleString()}</td><td><button onClick={()=>setSelected(x)}>View</button></td></tr>)}</tbody></table>{!filtered.length&&<p className="survey-empty">{loading?"Loading...":"No responses found yet."}</p>}</div>
  </div>
  <div className="survey-admin-panel"><h2>Responses by area</h2>{districtCount.map(([name,count])=><div className="survey-bar-row" key={name}><span>{name}</span><div><i style={{width:`${Math.max(3,count/Math.max(1,...districtCount.map(x=>x[1]))*100)}%`}}/></div><b>{count}</b></div>)}</div>
  {selected&&<div className="survey-modal-backdrop" onClick={()=>setSelected(null)}><div className="survey-response-modal" onClick={e=>e.stopPropagation()}><button className="survey-modal-close" onClick={()=>setSelected(null)}>×</button><h2>Response {selected.receipt_code}</h2><p>{new Date(selected.created_at).toLocaleString()}</p>{QUESTIONS.map(q=><div className="survey-answer" key={q.id}><b>{q.n}. {q.title}</b><pre>{JSON.stringify(selected.answers?.[q.id]??"—",null,2).replace(/^"|"$/g,"")}</pre></div>)}</div></div>}
 </section>;
}
