import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { 
  Activity, AlertTriangle, Clock, MessageSquare, LayoutDashboard, TrendingUp, 
  Lightbulb, CheckCircle2, User, Users, ShieldPlus, ChevronLeft, CalendarClock, BellRing
} from 'lucide-react';
import "./index.css";

// Pre-seed realistic data 
const initialHistory = [
  { day: '6 Days Ago', score: 86, memory: 5, attention: 5, reactionTime: 280, reaction: 5 },
  { day: '5 Days Ago', score: 85, memory: 4, attention: 5, reactionTime: 295, reaction: 4 },
  { day: '4 Days Ago', score: 88, memory: 5, attention: 5, reactionTime: 270, reaction: 5 },
  { day: '3 Days Ago', score: 82, memory: 4, attention: 4, reactionTime: 340, reaction: 4 },
  { day: '2 Days Ago', score: 81, memory: 3, attention: 5, reactionTime: 335, reaction: 4 },
  { day: 'Yesterday', score: 79, memory: 3, attention: 4, reactionTime: 390, reaction: 3 },
  { day: 'Today', score: 80, memory: 4, attention: 4, reactionTime: 350, reaction: 3 }
];

export default function App() {
  const [role, setRole] = useState(null); // 'patient', 'caregiver', 'doctor'
  const [history, setHistory] = useState(initialHistory);
  const [caregiverData, setCaregiverData] = useState({ name: 'Jane Smith', contact: 'jane@example.com' });
  
  // Smart Alerts
  const [alerts, setAlerts] = useState([]);

  // Determine current overall state based on latest score
  const latestTest = history[history.length - 1];
  const currentScore = latestTest.score;
  let statusType = 'good';
  let statusMessage = 'Normal';
  if (currentScore < 70) {
    statusType = 'danger'; statusMessage = 'Attention Needed';
  } else if (currentScore < 80) {
    statusType = 'warn'; statusMessage = 'Monitor Recommended';
  }

  // Generate dynamic insights
  const generateInsights = () => {
    const list = [];
    if (latestTest.memory < 4) list.push({ icon: <ClIcon />, title: "Memory", desc: "Memory recall slightly reduced.", alert: true });
    else list.push({ icon: <ClIcon />, title: "Memory", desc: "Memory recall is completely stable.", alert: false });
    
    if (latestTest.reactionTime > 400) list.push({ icon: <SpIcon />, title: "Reaction", desc: "Reaction time slower than baseline.", alert: true });
    else list.push({ icon: <SpIcon />, title: "Reaction", desc: "Reaction times within healthy limits.", alert: false });

    // Trend check
    if (history.length >= 2) {
      if (history[history.length-1].score < history[history.length-2].score) {
        list.push({ icon: <TrIcon />, title: "Overall Trend", desc: "Cognitive performance declining slightly.", alert: true });
      } else {
        list.push({ icon: <TrIcon />, title: "Overall Trend", desc: "Performance steady or improving.", alert: false });
      }
    }
    return list;
  };
  const dynamicInsights = generateInsights();

  // Check alert conditions
  useEffect(() => {
    if (history.length >= 2) {
      const last = history[history.length - 1].score;
      const prev = history[history.length - 2].score;
      // Alert logic: two < 70, or sudden drop of 15+
      fetchAlerts(last, prev);
    }
  }, [history]);

  const fetchAlerts = (last, prev) => {
    const newAlerts = [];
    if (last < 70 && prev < 70) {
      newAlerts.push("Unusual cognitive pattern detected in last 2 sessions");
    }
    if (prev - last > 15) {
      newAlerts.push("Sudden significant drop in cognitive performance detected.");
    }
    setAlerts(newAlerts);
  };

  const handleCompleteExam = (result) => {
    // result = { memory: 0..5, attention: 0..5, reactionTime: ms, reaction: 0..5 }
    // Calculate total score out of 100
    // Algorithm: Memory 40%, Attention 30%, Reaction 30%
    const memPct = (result.memory / 5) * 40;
    const attPct = (result.attention / 5) * 30;
    const rxPct = (result.reaction / 5) * 30;
    const finalScore = Math.min(100, Math.round(memPct + attPct + rxPct));

    const newRecord = {
       day: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
       score: finalScore,
       ...result
    };
    
    // Maintain max 10 records for array
    const updated = [...history, newRecord];
    if (updated.length > 10) updated.shift();
    setHistory(updated);
  };

  if (!role) {
    return <RoleSelection onSelect={setRole} />;
  }

  return (
    <div className="web-app-wrapper">
      <nav className="top-navbar">
        <div className="nav-container">
          <div className="brand-section">
            <Activity color="#1c1c1e" size={28} />
            <div className="brand-title">Cogniscan AI</div>
          </div>
          <div className="nav-links">
            <div style={{ fontWeight: 600, color: '#1c1c1e', marginRight: 16 }}>
              {role === 'patient' && 'Patient Mode'}
              {role === 'caregiver' && 'Caregiver Mode'}
              {role === 'doctor' && 'Doctor Mode'}
            </div>
            <button className="button-danger-outline" style={{ padding: '8px 16px', width: 'auto' }} onClick={() => setRole(null)}>
              Switch Role
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content fade-in">
        {role === 'patient' && (
          <PatientDashboard 
            currentScore={currentScore} 
            statusType={statusType} 
            statusMessage={statusMessage}
            history={history}
            insights={dynamicInsights}
            onCompleteExam={handleCompleteExam}
          />
        )}
        {role === 'caregiver' && (
          <CaregiverDashboard 
            history={history}
            alerts={alerts}
            caregiverData={caregiverData}
            setCaregiverData={setCaregiverData}
            statusType={statusType}
            statusMessage={statusMessage}
            insights={dynamicInsights}
          />
        )}
        {role === 'doctor' && (
          <DoctorDashboard 
            history={history}
            insights={dynamicInsights}
            currentScore={currentScore}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================
   ROLE SELECTION
========================================= */
function RoleSelection({ onSelect }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f9fa' }}>
      <div className="card" style={{ maxWidth: 800, width: '100%', padding: '64px 40px', textAlign: 'center' }}>
        <Activity size={48} color="#007aff" style={{ marginBottom: 24 }} />
        <h1 className="h1" style={{ fontSize: 36, marginBottom: 16 }}>Welcome to Cogniscan AI</h1>
        <p className="subtitle" style={{ fontSize: 18, marginBottom: 48 }}>Select your portal access level to continue. (No Auth Required)</p>
        
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          
          <button className="card flex-col" style={{ alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)' }} onClick={() => onSelect('patient')}>
            <User size={40} color="#34c759" style={{ marginBottom: 16 }} />
            <h2 className="h2" style={{ margin: 0 }}>Patient</h2>
            <p className="subtitle" style={{ fontSize: 14, marginTop: 8 }}>Take exams & view status</p>
          </button>

          <button className="card flex-col" style={{ alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)' }} onClick={() => onSelect('caregiver')}>
            <Users size={40} color="#ffcc00" style={{ marginBottom: 16 }} />
            <h2 className="h2" style={{ margin: 0 }}>Caregiver</h2>
            <p className="subtitle" style={{ fontSize: 14, marginTop: 8 }}>Monitor & receive alerts</p>
          </button>

          <button className="card flex-col" style={{ alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)' }} onClick={() => onSelect('doctor')}>
            <ShieldPlus size={40} color="#007aff" style={{ marginBottom: 16 }} />
            <h2 className="h2" style={{ margin: 0 }}>Doctor</h2>
            <p className="subtitle" style={{ fontSize: 14, marginTop: 8 }}>View clinical reports</p>
          </button>

        </div>
      </div>
    </div>
  );
}

/* =========================================
   PATIENT DASHBOARD
========================================= */
function PatientDashboard({ currentScore, statusType, statusMessage, history, insights, onCompleteExam }) {
  const [examActive, setExamActive] = useState(false);

  return (
    <>
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="h1">My Dashboard</h1>
          <p className="subtitle">Real-time cognitive wellness tracking.</p>
        </div>
        <button className="button-primary" style={{ width: 'auto', background: '#007aff', fontSize: 18, padding: '16px 32px' }} onClick={() => setExamActive(true)}>
          Start Full Cognitive Exam
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Score Card */}
        <div className="card flex-col" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div className={`status-badge badge-${statusType}`} style={{ marginTop: 8 }}>
            {statusType === 'good' ? <CheckCircle2 size={18} strokeWidth={2.5}/> : <AlertTriangle size={18} strokeWidth={2.5}/>}
            <span>{statusMessage}</span>
          </div>
          <div className={`score-circle score-${statusType}`}>
            <div style={{ textAlign: 'center' }}>
              <div className="score-value">{currentScore}</div>
              <div className="score-label">Global Score</div>
            </div>
          </div>
          <p className="subtitle" style={{ padding: '0 16px', fontSize: 15 }}>
            Regular active exams ensure an accurate baseline over time.
          </p>
        </div>

        {/* Trend Graph */}
        <div className="card flex-col">
          <h2 className="h2" style={{ marginBottom: 8 }}>Cognitive Timeline</h2>
          <p className="subtitle" style={{ marginBottom: 24 }}>Graph auto-updates upon exam completion.</p>
          
          <div className="chart-container-inner" style={{ flex: 1, marginTop: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={statusType === 'good' ? '#34c759' : '#007aff'} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={statusType === 'good' ? '#34c759' : '#007aff'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f5" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8e8e93', fontSize: 12 }} dy={10}/>
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1c1c1e', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="score" stroke={statusType === 'good' ? '#2baa47' : '#007aff'} strokeWidth={4} fillOpacity={1} fill="url(#colorScore)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live AI Insights */}
        <div className="card flex-col">
          <h2 className="h2" style={{ marginBottom: 8 }}>Live AI Insights</h2>
          <p className="subtitle" style={{ marginBottom: 24 }}>Generated dynamically from your exam performance.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, background: ins.alert ? 'rgba(255,204,0,0.1)' : 'rgba(52,199,89,0.05)', padding: 16, borderRadius: 12 }}>
                <div style={{ color: ins.alert ? '#d6a800' : '#2baa47', marginTop: 2 }}>{ins.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#1c1c1e' }}>{ins.title}</div>
                  <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>{ins.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {examActive && (
        <CognitiveExamModal 
          onClose={() => setExamActive(false)} 
          onComplete={(res) => {
            onCompleteExam(res);
            setExamActive(false);
          }} 
        />
      )}
    </>
  );
}

/* =========================================
   COGNITIVE EXAM MODAL PORTAL
========================================= */
function CognitiveExamModal({ onClose, onComplete }) {
  const [step, setStep] = useState('intro'); // intro, memory_show, memory_input, attention, reaction, report
  
  // Results
  const [memScore, setMemScore] = useState(0);
  const [attScore, setAttScore] = useState(0);
  const [rxTime, setRxTime] = useState(0);
  const [rxScore, setRxScore] = useState(0);

  // States
  const [memInput, setMemInput] = useState('');
  const [attInput, setAttInput] = useState('');
  
  // Reaction specific
  const [reactionPhase, setReactionPhase] = useState('wait'); // wait, ready, clicked, early
  const [reactionStart, setReactionStart] = useState(0);
  
  // Memory specific 
  const targetWords = ['apple', 'chair', 'river', 'window', 'train'];

  useEffect(() => {
    let t;
    if (step === 'memory_show') {
      t = setTimeout(() => {
        setStep('memory_input');
      }, 5000);
    }
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    let t;
    if (step === 'reaction' && reactionPhase === 'wait') {
      const delay = Math.floor(Math.random() * 3000) + 1500; // 1.5s to 4.5s
      t = setTimeout(() => {
        setReactionPhase('ready');
        setReactionStart(Date.now());
      }, delay);
    }
    return () => clearTimeout(t);
  }, [step, reactionPhase]);

  const handleMemorySubmit = () => {
    const inputArr = memInput.toLowerCase().split(/[ ,]+/);
    let correct = 0;
    targetWords.forEach(w => {
      if (inputArr.includes(w)) correct++;
    });
    setMemScore(correct);
    setStep('attention');
  };

  const handleAttentionSubmit = () => {
    // Expect backwards from 20 to 1
    const nums = attInput.trim().split(/[ ,]+/).map(Number);
    let pts = 0;
    const expected = [20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1];
    let correctCount = 0;
    let checkBoundary = Math.min(nums.length, 20);
    for(let i=0; i<checkBoundary; i++) {
        if (nums[i] === expected[i]) correctCount++;
    }
    
    if (correctCount >= 18) pts = 5;
    else if (correctCount >= 14) pts = 4;
    else if (correctCount >= 10) pts = 3;
    else if (correctCount >= 5) pts = 2;
    else pts = 1;

    setAttScore(pts);
    setStep('reaction');
  };

  const handleReactionClick = () => {
    if (reactionPhase === 'wait') {
       setReactionPhase('early');
       setRxTime(1500);
       setRxScore(1);
    } else if (reactionPhase === 'ready') {
       const ms = Date.now() - reactionStart;
       setRxTime(ms);
       let pt = 1;
       if (ms < 300) pt = 5;
       else if (ms < 450) pt = 4;
       else if (ms < 600) pt = 3;
       else if (ms < 850) pt = 2;
       
       setRxScore(pt);
       setReactionPhase('clicked');
    }
  };

  return (
    <div className="modal-overlay open">
      <div className="modal-content fade-in" style={{ maxWidth: 640 }}>
        
        {step === 'intro' && (
          <div>
            <h1 className="h1">Full Cognitive Exam</h1>
            <p className="subtitle" style={{ marginBottom: 32 }}>This exam consists of 3 real-time segments: Memory, Attention, and Reaction. It will take approximately 1 minute.</p>
            <button className="button-primary" onClick={() => setStep('memory_show')}>Begin Phase 1: Memory</button>
            <button className="button-danger-outline" style={{ marginTop: 12, border: 'none' }} onClick={onClose}>Cancel Exam</button>
          </div>
        )}

        {step === 'memory_show' && (
          <div>
            <h2 className="h2" style={{ marginBottom: 12 }}>Phase 1: Memorization</h2>
            <p className="subtitle" style={{ marginBottom: 40, fontSize: 18 }}>Memorize these 5 words. The screen will hide them in 5 seconds.</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 40 }}>
              {targetWords.map(w => (
                <div key={w} style={{ fontSize: 24, fontWeight: 700, background: '#f0f0f5', padding: '12px 24px', borderRadius: 12, textTransform: 'capitalize' }}>{w}</div>
              ))}
            </div>

            <div style={{ height: 6, width: '100%', background: '#f0f0f5', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: '#007aff', width: '100%', animation: 'shrink 5s linear forwards' }}></div>
            </div>
            <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
          </div>
        )}

        {step === 'memory_input' && (
          <div>
            <h2 className="h2" style={{ marginBottom: 12 }}>Phase 1: Memory Recall</h2>
            <p className="subtitle" style={{ marginBottom: 32, fontSize: 18 }}>Type the 5 words you memorized, separated by spaces.</p>
            <input 
              className="input-field" 
              autoFocus 
              value={memInput} 
              onChange={e => setMemInput(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') handleMemorySubmit(); }}
            />
            <button className="button-primary" style={{ marginTop: 16 }} onClick={handleMemorySubmit}>Submit Response</button>
          </div>
        )}

        {step === 'attention' && (
          <div>
            <h2 className="h2" style={{ marginBottom: 12 }}>Phase 2: Attention & Focus</h2>
            <p className="subtitle" style={{ marginBottom: 32, fontSize: 18 }}>Type the numbers from 20 down to 1 backwards. Separate by spaces. <br/>(e.g., 20 19 18...)</p>
            <textarea 
              className="input-field" 
              style={{ minHeight: 120, resize: 'none' }}
              value={attInput} 
              onChange={e => setAttInput(e.target.value)}
            />
            <button className="button-primary" style={{ marginTop: 16 }} onClick={handleAttentionSubmit}>Submit Attention Test</button>
          </div>
        )}

        {step === 'reaction' && (
          <div>
            <h2 className="h2" style={{ marginBottom: 12 }}>Phase 3: Reaction Speed</h2>
            <p className="subtitle" style={{ marginBottom: 32, fontSize: 18 }}>When the button turns green, click it as fast as possible.</p>
            
            {reactionPhase !== 'clicked' && reactionPhase !== 'early' && (
              <div 
                onClick={handleReactionClick}
                style={{ 
                  height: 200, 
                  borderRadius: 24, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: reactionPhase === 'wait' ? '#ff3b30' : '#34c759',
                  color: '#fff', fontSize: 32, fontWeight: 700, cursor: 'pointer',
                  userSelect: 'none', transition: 'background 0.1s'
                }}>
                {reactionPhase === 'wait' ? 'WAIT...' : 'CLICK NOW!'}
              </div>
            )}

            {reactionPhase === 'early' && (
               <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <AlertTriangle size={48} color="#ff3b30"/>
                 <h2 className="h2" style={{ marginTop: 16 }}>You clicked too early!</h2>
                 <button className="button-primary" style={{ width: 'auto', marginTop: 16 }} onClick={() => setStep('report')}>Generate Report</button>
               </div>
            )}

            {reactionPhase === 'clicked' && (
               <div style={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                 <div style={{ fontSize: 48, fontWeight: 800, color: '#1c1c1e' }}>{rxTime}ms</div>
                 <p className="subtitle">Outstanding response time.</p>
                 <button className="button-primary" style={{ width: 'auto', marginTop: 24, background: '#007aff' }} onClick={() => setStep('report')}>Finish & Process</button>
               </div>
            )}
          </div>
        )}

        {step === 'report' && (
          <div>
            <Activity size={48} className="analytical-icon" style={{ margin: '0 auto 24px' }}/>
            <h2 className="h1">Analysis Complete</h2>
            <p className="subtitle" style={{ marginBottom: 32 }}>Your cognitive blueprint has been dynamically recalculated. Click below to return to the dashboard and evaluate the results.</p>
            <button className="button-primary" style={{ background: '#1c1c1e' }} onClick={() => onComplete({ memory: memScore, attention: attScore, reactionTime: rxTime, reaction: rxScore })}>
               Sync Protocol
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

/* =========================================
   CAREGIVER DASHBOARD
========================================= */
function CaregiverDashboard({ history, alerts, caregiverData, setCaregiverData, statusType, statusMessage, insights }) {
  const [editingConfig, setEditingConfig] = useState(!caregiverData.name);
  const latest = history[history.length - 1];

  return (
    <>
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="h1">Caregiver Portal</h1>
          <p className="subtitle">Remote patient tracking and emergency alerting.</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '320px 1fr' }}>
        
        {/* Left Col: Patient & Caregiver Summaries */}
        <div className="flex-col" style={{ gap: 24 }}>
          
          <div className="card text-center flex-col" style={{ alignItems: 'center' }}>
             <h2 className="h2" style={{ marginBottom: 8 }}>Patient: John Doe</h2>
             <div className={`status-badge badge-${statusType}`} style={{ marginTop: 0, marginBottom: 24 }}>
               {statusMessage}
             </div>
             
             <div className={`score-circle score-${statusType}`} style={{ width: 140, height: 140, margin: '0 auto 16px' }}>
               <div style={{ textAlign: 'center' }}>
                 <div className="score-value" style={{ fontSize: 48 }}>{latest.score}</div>
                 <div className="score-label" style={{ fontSize: 12 }}>Score</div>
               </div>
             </div>
          </div>

          <div className="card">
            <h2 className="h2" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BellRing size={20}/> Alert System
            </h2>
            {alerts.length === 0 ? (
              <div style={{ background: 'rgba(52, 199, 89, 0.1)', color: '#2baa47', padding: 16, borderRadius: 12, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
                No alerts. Patient is stable.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {alerts.map((a, i) => (
                  <div key={i} style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#db2b22', padding: 16, borderRadius: 12, fontSize: 14, fontWeight: 500, lineHeight: 1.4 }}>
                    {a}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Timeline & Insights */}
         <div className="flex-col" style={{ gap: 24 }}>
          
          <div className="card">
             <div className="flex-between" style={{ marginBottom: 16 }}>
               <h2 className="h2" style={{ margin: 0 }}>Caregiver Contact Info</h2>
               {!editingConfig && <button className="nav-link" style={{ height: 'auto', padding: 0 }} onClick={() => setEditingConfig(true)}>Edit Info</button>}
             </div>
             {editingConfig ? (
               <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                 <input type="text" className="input-field" style={{ margin: 0, flex: 1 }} placeholder="Caregiver Name" value={caregiverData.name} onChange={e => setCaregiverData({...caregiverData, name: e.target.value})} />
                 <input type="text" className="input-field" style={{ margin: 0, flex: 1 }} placeholder="Phone / Email" value={caregiverData.contact} onChange={e => setCaregiverData({...caregiverData, contact: e.target.value})} />
                 <button className="button-primary" style={{ background: '#007aff', width: 'auto', flexShrink: 0, padding: '16px 24px' }} onClick={() => setEditingConfig(false)}>Save</button>
               </div>
             ) : (
               <div style={{ display: 'flex', gap: 40, paddingBottom: 8 }}>
                 <div>
                   <div style={{ fontSize: 13, color: '#8e8e93', fontWeight: 600, marginBottom: 4 }}>NAME</div>
                   <div style={{ fontSize: 16, fontWeight: 500, color: '#1c1c1e' }}>{caregiverData.name || 'Not Set'}</div>
                 </div>
                 <div>
                   <div style={{ fontSize: 13, color: '#8e8e93', fontWeight: 600, marginBottom: 4 }}>PHONE / EMAIL</div>
                   <div style={{ fontSize: 16, fontWeight: 500, color: '#1c1c1e' }}>{caregiverData.contact || 'Not Set'}</div>
                 </div>
               </div>
             )}
          </div>

          <div className="card flex-col">
            <h2 className="h2" style={{ marginBottom: 8 }}>Patient Cognitive Timeline</h2>
            <p className="subtitle" style={{ marginBottom: 24 }}>Dynamic scoring synced from live patient tests.</p>
            
            <div className="chart-container-inner" style={{ flex: 1, marginTop: 0, height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScoreCare" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={statusType === 'danger' ? '#ff3b30' : (statusType === 'warn' ? '#ffcc00' : '#34c759')} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={statusType === 'danger' ? '#ff3b30' : (statusType === 'warn' ? '#ffcc00' : '#34c759')} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f5" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8e8e93', fontSize: 12 }} dy={10}/>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}/>
                  <Area type="monotone" dataKey="score" stroke={statusType === 'danger' ? '#ff3b30' : (statusType === 'warn' ? '#ffcc00' : '#2baa47')} strokeWidth={4} fillOpacity={1} fill="url(#colorScoreCare)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card">
            <h2 className="h2" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Lightbulb size={20}/> Active Patient Insights
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
               {insights.map((ins, i) => (
                 <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: '#f9f9fa', padding: 16, borderRadius: 12 }}>
                   <div style={{ color: ins.alert ? '#d6a800' : '#2baa47', marginTop: 2 }}>{ins.icon}</div>
                   <div>
                     <div style={{ fontWeight: 600, fontSize: 15, color: '#1c1c1e', marginBottom: 4 }}>{ins.title}</div>
                     <div style={{ fontSize: 14, color: '#555', lineHeight: 1.4 }}>{ins.desc}</div>
                   </div>
                 </div>
               ))}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

/* =========================================
   DOCTOR DASHBOARD
========================================= */
function DoctorDashboard({ history, insights, currentScore }) {
  
  const latest = history[history.length - 1];
  
  // Format history for BarChart analysis
  const barData = history.map(h => ({
    day: h.day,
    Memory: h.memory * 20,
    Attention: h.attention * 20, 
    Reaction: h.reaction * 20
  }));

  return (
    <>
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="h1">Diagnostic Intelligence</h1>
          <p className="subtitle">Clinical breakdown of test metrics and historical variance.</p>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
           <div className="card" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 13, textTransform: 'uppercase', color: '#8e8e93', fontWeight: 600 }}>TCI Score</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{currentScore}</div>
           </div>
        </div>
      </div>

      <div className="dashboard-grid">
         {/* Detail Report View */}
         <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h2 className="h2" style={{ marginBottom: 24 }}>Component Breakdown Timeline</h2>
            <div style={{ height: 320, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f5"/>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#8e8e93', fontSize: 12 }} dy={10}/>
                  <Tooltip cursor={{ fill: '#f9f9fa' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}/>
                  <Bar dataKey="Memory" fill="#007aff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Attention" fill="#34c759" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Reaction" fill="#ffcc00" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Latest Test Deep Dive */}
         <div className="card">
            <h2 className="h2">Latest Test Analytics</h2>
            <p className="subtitle" style={{ marginBottom: 24 }}>Raw data extracted from the interactive exam.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="flex-between" style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f5' }}>
                <div style={{ fontWeight: 600 }}>Memory Retention</div>
                <div style={{ fontWeight: 700, color: '#007aff' }}>{latest.memory} / 5 words</div>
              </div>
              <div className="flex-between" style={{ paddingBottom: 16, borderBottom: '1px solid #f0f0f5' }}>
                <div style={{ fontWeight: 600 }}>Attention Accuracy</div>
                <div style={{ fontWeight: 700, color: '#34c759' }}>{latest.attention} / 5 sequence score</div>
              </div>
              <div className="flex-between">
                <div style={{ fontWeight: 600 }}>Reaction Speed</div>
                <div style={{ fontWeight: 700, color: latest.reactionTime > 600 ? '#ff3b30' : '#ffcc00' }}>{latest.reactionTime}ms latency</div>
              </div>
            </div>
         </div>

         {/* ML Generated Summaries */}
         <div className="card">
            <h2 className="h2" style={{ marginBottom: 24 }}>Algorithmic Assessment</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div style={{ color: ins.alert ? '#ff3b30' : '#8e8e93', marginTop: 2 }}><CheckCircle2 size={20} /></div>
                  <div>
                    <div style={{ fontWeight: 600, color: ins.alert ? '#ff3b30' : '#1c1c1e' }}>{ins.title} Variance</div>
                    <div style={{ fontSize: 14, color: '#555', marginTop: 4 }}>{ins.desc}</div>
                  </div>
                </div>
              ))}
            </div>
         </div>
      </div>
    </>
  );
}

// Icon Helpers
const ClIcon = () => <Clock size={22} strokeWidth={2}/>;
const SpIcon = () => <Activity size={22} strokeWidth={2}/>;
const TrIcon = () => <TrendingUp size={22} strokeWidth={2}/>;
