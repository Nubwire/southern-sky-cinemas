import { useState, useEffect, useCallback } from "react";

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const CINEMAS = [
  { id: "dubbo", name: "Southern Sky Dubbo", address: "120 Macquarie St, Dubbo NSW 2830", screens: 4 },
  { id: "orange", name: "Southern Sky Orange", address: "45 Summer St, Orange NSW 2800", screens: 3 },
  { id: "bathurst", name: "Southern Sky Bathurst", address: "67 William St, Bathurst NSW 2795", screens: 2 },
];

const MOVIES = [
  {
    id: "m1", title: "Starfall", rating: "M", runtime: 128, genre: "Sci-Fi / Thriller",
    poster: "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=600&fit=crop",
    description: "When a dormant satellite network begins raining debris on Earth's southern hemisphere, a lone astrophysicist must race against time to avert catastrophe.",
    release_type: "new_release", tag: "NOW SHOWING"
  },
  {
    id: "m2", title: "The Quiet Country", rating: "PG", runtime: 105, genre: "Drama",
    poster: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&h=600&fit=crop",
    description: "A multigenerational story of an Australian farming family navigating drought, loss, and the unexpected grace that binds them to their land.",
    release_type: "standard", tag: "NOW SHOWING"
  },
  {
    id: "m3", title: "Mirage Protocol", rating: "MA15+", runtime: 142, genre: "Action / Espionage",
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop",
    description: "A field operative goes off-grid when her own agency marks her for elimination. Trust no one. Question everything.",
    release_type: "new_release", tag: "NOW SHOWING"
  },
  {
    id: "m4", title: "Luminara", rating: "G", runtime: 92, genre: "Animation / Family",
    poster: "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=400&h=600&fit=crop",
    description: "An enchanting animated tale of a young girl who discovers a hidden world of bioluminescent creatures beneath her grandmother's coastal farm.",
    release_type: "standard", tag: "NOW SHOWING"
  },
  {
    id: "m5", title: "Dark Meridian", rating: "R18+", runtime: 115, genre: "Horror",
    poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=600&fit=crop",
    description: "A remote outback property. A family in crisis. Something ancient has been waiting beneath the red earth.",
    release_type: "special_event", tag: "SPECIAL SCREENING"
  },
  {
    id: "m6", title: "The Last Harbour", rating: "M", runtime: 138, genre: "Romance / Drama",
    poster: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
    description: "Two strangers stranded in a remote fishing village during a cyclone find something neither expected — a reason to stay.",
    release_type: "standard", tag: "NOW SHOWING"
  },
];

const SESSIONS = [
  { id: "s1", movie_id: "m1", cinema_id: "dubbo", screen: 1, date: "2026-03-13", time: "10:30", type: "matinee", seats_available: 82 },
  { id: "s2", movie_id: "m1", cinema_id: "dubbo", screen: 1, date: "2026-03-13", time: "13:45", type: "matinee", seats_available: 60 },
  { id: "s3", movie_id: "m1", cinema_id: "dubbo", screen: 1, date: "2026-03-13", time: "18:30", type: "evening", seats_available: 24 },
  { id: "s4", movie_id: "m1", cinema_id: "dubbo", screen: 1, date: "2026-03-13", time: "21:00", type: "late", seats_available: 95 },
  { id: "s5", movie_id: "m1", cinema_id: "orange", screen: 2, date: "2026-03-13", time: "11:00", type: "matinee", seats_available: 50 },
  { id: "s6", movie_id: "m1", cinema_id: "orange", screen: 2, date: "2026-03-13", time: "19:00", type: "evening", seats_available: 8 },
  { id: "s7", movie_id: "m2", cinema_id: "dubbo", screen: 2, date: "2026-03-13", time: "11:00", type: "matinee", seats_available: 70 },
  { id: "s8", movie_id: "m2", cinema_id: "dubbo", screen: 2, date: "2026-03-13", time: "14:30", type: "matinee", seats_available: 45 },
  { id: "s9", movie_id: "m2", cinema_id: "bathurst", screen: 1, date: "2026-03-13", time: "17:00", type: "evening", seats_available: 30 },
  { id: "s10", movie_id: "m3", cinema_id: "dubbo", screen: 3, date: "2026-03-13", time: "12:00", type: "matinee", seats_available: 100 },
  { id: "s11", movie_id: "m3", cinema_id: "orange", screen: 1, date: "2026-03-13", time: "20:15", type: "evening", seats_available: 15 },
  { id: "s12", movie_id: "m4", cinema_id: "dubbo", screen: 4, date: "2026-03-13", time: "10:00", type: "matinee", seats_available: 90 },
  { id: "s13", movie_id: "m4", cinema_id: "bathurst", screen: 2, date: "2026-03-13", time: "13:00", type: "matinee", seats_available: 55 },
  { id: "s14", movie_id: "m5", cinema_id: "dubbo", screen: 1, date: "2026-03-13", time: "22:00", type: "late", seats_available: 40 },
  { id: "s15", movie_id: "m6", cinema_id: "orange", screen: 3, date: "2026-03-13", time: "16:00", type: "evening", seats_available: 65 },
  { id: "s16", movie_id: "m6", cinema_id: "bathurst", screen: 1, date: "2026-03-13", time: "19:30", type: "evening", seats_available: 28 },
];

const PRICING_RULES = {
  base: { Adult: 18.00, Child: 11.00, Concession: 13.50, Senior: 13.50, Family: 48.00 },
  modifiers: {
    tuesday_discount: { applies_if: "day === 2", label: "Half Price Tuesday", multiplier: 0.5 },
    new_release_surcharge: { applies_if: "release_type === 'new_release'", label: "New Release", add: 2.00 },
    evening_surcharge: { applies_if: "type === 'evening'", label: "Evening Session", add: 1.50 },
    special_event_surcharge: { applies_if: "release_type === 'special_event'", label: "Special Event", add: 4.00 },
  }
};

const SCREEN_LAYOUT = {
  rows: 8, cols: 12,
  unavailable: ["A1","A2","A11","A12","H1","H2","H11","H12"],
  taken: ["B5","B6","C3","C4","C7","D8","D9","E2","E10","F5","F6"]
};

const ADMIN_CREDS = { username: "admin", password: "southernsky2026" };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const calcPrice = (ticketType, session, movie) => {
  const dayOfWeek = new Date(session.date).getDay();
  let price = PRICING_RULES.base[ticketType];
  const mods = [];
  if (dayOfWeek === 2) { price *= 0.5; mods.push("Half Price Tuesday"); }
  if (movie.release_type === "new_release") { price += 2.00; mods.push("+$2 New Release"); }
  if (session.type === "evening") { price += 1.50; mods.push("+$1.50 Evening"); }
  if (movie.release_type === "special_event") { price += 4.00; mods.push("+$4 Special Event"); }
  return { price: Math.round(price * 100) / 100, mods };
};

const fmt = (n) => `$${n.toFixed(2)}`;
const formatTime = (t) => { const [h,m] = t.split(":"); const hr = +h; return `${hr > 12 ? hr-12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`; };
const formatDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-AU", { weekday:"long", day:"numeric", month:"long" });
const genQR = (code) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(code)}&bgcolor=0a0a1a&color=d4a847`;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const StarField = () => (
  <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
    {Array.from({length:80}).map((_,i) => (
      <div key={i} style={{
        position:"absolute",
        width: Math.random() > 0.8 ? "2px" : "1px",
        height: Math.random() > 0.8 ? "2px" : "1px",
        background: "#fff",
        borderRadius:"50%",
        top: `${Math.random()*100}%`,
        left: `${Math.random()*100}%`,
        opacity: 0.1 + Math.random()*0.5,
        animation: `twinkle ${2+Math.random()*4}s ${Math.random()*4}s infinite alternate`,
      }}/>
    ))}
  </div>
);

const Badge = ({ children, color="#d4a847" }) => (
  <span style={{ background: color+"22", border:`1px solid ${color}55`, color, fontSize:10, fontWeight:700, letterSpacing:2, padding:"2px 8px", borderRadius:3, textTransform:"uppercase" }}>
    {children}
  </span>
);

const SeatBtn = ({ id, status, selected, onClick }) => {
  const colors = { unavailable:"#1a1a2e", taken:"#3d1515", available:"#1e2a4a", selected:"#d4a847" };
  const bg = colors[status] || colors.available;
  return (
    <button onClick={onClick} disabled={status==="unavailable"||status==="taken"}
      title={id}
      style={{
        width:28, height:22, margin:"2px", borderRadius:4,
        background: selected ? "#d4a847" : bg,
        border: selected ? "2px solid #f0c040" : status==="taken" ? "1px solid #5a2020" : "1px solid #2a3a6a",
        cursor: status==="unavailable"||status==="taken" ? "not-allowed" : "pointer",
        transition:"all 0.15s", fontSize:8, color: selected?"#0a0a1a":"#4a5a8a",
        transform: selected ? "scale(1.1)" : "scale(1)",
      }}
    />
  );
};

const ProgressBar = ({ step, total=5 }) => (
  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:24 }}>
    {Array.from({length:total}).map((_,i) => (
      <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<step ? "#d4a847" : "#1e2a4a", transition:"background 0.3s" }}/>
    ))}
  </div>
);

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("home");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedCinema, setSelectedCinema] = useState("dubbo");
  const [selectedDate, setSelectedDate] = useState("2026-03-13");
  const [seats, setSeats] = useState([]);
  const [tickets, setTickets] = useState({ Adult:0, Child:0, Concession:0, Senior:0, Family:0 });
  const [booking, setBooking] = useState(null);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminView, setAdminView] = useState("dashboard");
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [csvData, setCsvData] = useState(null);

  const notify = (msg, type="success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const totalTickets = Object.values(tickets).reduce((a,b)=>a+b,0);
  const totalPrice = selectedSession && selectedMovie
    ? Object.entries(tickets).reduce((sum,[type,qty]) => sum + qty * calcPrice(type, selectedSession, selectedMovie).price, 0)
    : 0;

  const filteredMovies = MOVIES.filter(m => {
    const matchQ = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.genre.toLowerCase().includes(searchQuery.toLowerCase());
    const matchG = genreFilter === "all" || m.genre.toLowerCase().includes(genreFilter.toLowerCase());
    return matchQ && matchG;
  });

  const cinemaSessionsForMovie = (movieId) =>
    SESSIONS.filter(s => s.movie_id === movieId && s.cinema_id === selectedCinema && s.date === selectedDate);

  const seatStatus = (seatId) => {
    if (SCREEN_LAYOUT.unavailable.includes(seatId)) return "unavailable";
    if (SCREEN_LAYOUT.taken.includes(seatId)) return "taken";
    if (seats.includes(seatId)) return "selected";
    return "available";
  };

  const toggleSeat = (seatId) => {
    if (seatStatus(seatId) === "available") {
      if (seats.includes(seatId)) setSeats(seats.filter(s=>s!==seatId));
      else if (seats.length < totalTickets) setSeats([...seats, seatId]);
      else notify("Remove a seat first to change selection", "warn");
    }
  };

  const confirmBooking = () => {
    const ref = "SSC-" + Math.random().toString(36).toUpperCase().slice(2,8);
    const movie = MOVIES.find(m=>m.id===selectedMovie);
    const session = selectedSession;
    const cinema = CINEMAS.find(c=>c.id===session.cinema_id);
    setBooking({ ref, movie, session, cinema, tickets, seats, total: totalPrice });
    setView("confirmation");
  };

  const resetBooking = () => {
    setSelectedMovie(null); setSelectedSession(null); setSeats([]); setTickets({ Adult:0, Child:0, Concession:0, Senior:0, Family:0 }); setBooking(null);
    setView("home");
  };

  // ── Styles ──
  const s = {
    app: { minHeight:"100vh", background:"#06060f", color:"#e8e0d0", fontFamily:"'Crimson Text', Georgia, serif", position:"relative" },
    nav: { background:"linear-gradient(180deg,#0a0a1a 0%,#06060f 100%)", borderBottom:"1px solid #1e2a4a", padding:"0 24px", display:"flex", alignItems:"center", gap:24, height:64, position:"sticky", top:0, zIndex:100 },
    navLogo: { fontSize:20, fontWeight:700, color:"#d4a847", letterSpacing:3, textTransform:"uppercase", fontFamily:"'Playfair Display', Georgia, serif", cursor:"pointer" },
    navLink: { color:"#8a9ab5", fontSize:13, letterSpacing:1.5, textTransform:"uppercase", cursor:"pointer", padding:"4px 0", borderBottom:"2px solid transparent", transition:"all 0.2s" },
    hero: { background:"linear-gradient(160deg,#0a0a1a 0%,#0f0f2a 50%,#0a0a1a 100%)", padding:"60px 24px 40px", textAlign:"center", borderBottom:"1px solid #1a1a3a" },
    heroTitle: { fontSize:48, fontWeight:700, color:"#d4a847", letterSpacing:6, textTransform:"uppercase", fontFamily:"'Playfair Display', Georgia, serif", marginBottom:8, textShadow:"0 0 60px #d4a84740" },
    heroSub: { fontSize:18, color:"#8a9ab5", fontStyle:"italic", letterSpacing:1 },
    container: { maxWidth:1200, margin:"0 auto", padding:"0 24px" },
    grid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:24, padding:"32px 0" },
    card: { background:"#0d0d22", border:"1px solid #1e2a4a", borderRadius:8, overflow:"hidden", cursor:"pointer", transition:"all 0.25s", position:"relative" },
    cardImg: { width:"100%", height:320, objectFit:"cover", display:"block" },
    cardBody: { padding:16 },
    cardTitle: { fontSize:18, fontWeight:700, color:"#e8e0d0", marginBottom:4, fontFamily:"'Playfair Display', Georgia, serif" },
    cardMeta: { fontSize:13, color:"#5a6a85", marginBottom:8 },
    btn: { background:"linear-gradient(135deg,#8b1a1a,#cc2200)", color:"#fff", border:"none", padding:"12px 28px", borderRadius:6, fontSize:14, fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s" },
    btnGold: { background:"linear-gradient(135deg,#b8860b,#d4a847)", color:"#0a0a1a", border:"none", padding:"12px 28px", borderRadius:6, fontSize:14, fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s" },
    btnOutline: { background:"transparent", color:"#d4a847", border:"2px solid #d4a847", padding:"10px 24px", borderRadius:6, fontSize:13, fontWeight:700, letterSpacing:2, textTransform:"uppercase", cursor:"pointer", transition:"all 0.2s" },
    section: { padding:"24px 0" },
    h2: { fontSize:28, fontWeight:700, color:"#d4a847", fontFamily:"'Playfair Display', Georgia, serif", marginBottom:4 },
    h3: { fontSize:20, fontWeight:700, color:"#e8e0d0", fontFamily:"'Playfair Display', Georgia, serif", marginBottom:12 },
    panel: { background:"#0d0d22", border:"1px solid #1e2a4a", borderRadius:8, padding:24, marginBottom:16 },
    input: { background:"#08081a", border:"1px solid #2a3a6a", borderRadius:6, color:"#e8e0d0", padding:"10px 16px", fontSize:14, width:"100%", boxSizing:"border-box", outline:"none" },
    select: { background:"#08081a", border:"1px solid #2a3a6a", borderRadius:6, color:"#e8e0d0", padding:"10px 16px", fontSize:14, width:"100%", boxSizing:"border-box", outline:"none" },
    sessionBtn: (avail) => ({
      padding:"14px 20px", borderRadius:6, border:`1px solid ${avail>20?"#1e3a6a":avail>5?"#3a2a0a":"#3a0a0a"}`,
      background: avail>20?"#0d1a3a":avail>5?"#1a1000":"#1a0505",
      color: avail>20?"#8ab0e0":avail>5?"#c8a030":"#e06060",
      cursor:"pointer", transition:"all 0.2s", textAlign:"center", minWidth:100,
    }),
    tag: { background:"#0d0d22", border:"1px solid #2a3a6a", borderRadius:4, padding:"4px 12px", fontSize:12, color:"#6a7a95", cursor:"pointer", marginRight:8, marginBottom:8, transition:"all 0.2s" },
    tagActive: { background:"#1e2a4a", border:"1px solid #d4a847", borderRadius:4, padding:"4px 12px", fontSize:12, color:"#d4a847", cursor:"pointer", marginRight:8, marginBottom:8 },
    divider: { borderColor:"#1e2a4a", margin:"24px 0" },
    label: { fontSize:12, color:"#5a6a85", letterSpacing:1.5, textTransform:"uppercase", display:"block", marginBottom:6 },
    adminSidebar: { width:220, background:"#08081a", borderRight:"1px solid #1e2a4a", minHeight:"calc(100vh - 64px)", padding:"24px 0" },
    adminLink: (active) => ({ padding:"12px 24px", display:"block", color: active?"#d4a847":"#6a7a95", background: active?"#1e2a4a":"transparent", cursor:"pointer", fontSize:14, letterSpacing:1, transition:"all 0.2s", borderLeft: active?"3px solid #d4a847":"3px solid transparent" }),
  };

  // ── Views ──

  const HomeView = () => (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        @keyframes twinkle { from{opacity:0.1} to{opacity:0.7} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        .movie-card:hover { transform:translateY(-6px); box-shadow:0 20px 60px #d4a84720; border-color:#d4a84740 !important; }
        .movie-card:hover .card-overlay { opacity:1 !important; }
        .session-btn:hover { background:#1e2a4a !important; border-color:#d4a847 !important; color:#d4a847 !important; transform:scale(1.03); }
        .btn-red:hover { background:linear-gradient(135deg,#cc2200,#ff3300) !important; transform:translateY(-1px); box-shadow:0 8px 24px #cc220040; }
        .btn-gold:hover { background:linear-gradient(135deg,#d4a847,#f0c040) !important; transform:translateY(-1px); box-shadow:0 8px 24px #d4a84740; }
        .nav-link:hover { color:#d4a847 !important; border-bottom-color:#d4a847 !important; }
        input:focus, select:focus { border-color:#d4a847 !important; box-shadow:0 0 0 2px #d4a84720; }
        ::-webkit-scrollbar { width:6px } ::-webkit-scrollbar-track { background:#06060f } ::-webkit-scrollbar-thumb { background:#1e2a4a; border-radius:3px }
      `}</style>
      <StarField />
      <div style={s.hero}>
        <div style={{ fontSize:12, letterSpacing:6, color:"#5a6a85", marginBottom:16, textTransform:"uppercase" }}>★ &nbsp; Southern Sky Cinemas &nbsp; ★</div>
        <h1 style={s.heroTitle}>Now Showing</h1>
        <p style={s.heroSub}>Big Screen Magic Under the Southern Sky</p>
        <div style={{ marginTop:24, display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" }}>
          {["dubbo","orange","bathurst"].map(c => (
            <button key={c} onClick={()=>setSelectedCinema(c)} style={selectedCinema===c?s.btnGold:{...s.btnOutline}}>
              {c.charAt(0).toUpperCase()+c.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div style={s.container}>
        {/* Filters */}
        <div style={{ padding:"24px 0 0", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:200, position:"relative" }}>
            <input style={s.input} placeholder="Search movies or genres..." value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)} />
          </div>
          <select style={{...s.select, width:"auto"}} value={genreFilter} onChange={e=>setGenreFilter(e.target.value)}>
            <option value="all">All Genres</option>
            <option value="sci-fi">Sci-Fi</option>
            <option value="drama">Drama</option>
            <option value="action">Action</option>
            <option value="animation">Animation</option>
            <option value="horror">Horror</option>
            <option value="romance">Romance</option>
          </select>
          <input type="date" style={{...s.input, width:"auto"}} value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} />
        </div>
        {/* Movie grid */}
        <div style={s.grid}>
          {filteredMovies.map(movie => {
            const sessions = cinemaSessionsForMovie(movie.id);
            return (
              <div key={movie.id} className="movie-card" style={s.card} onClick={()=>{ setSelectedMovie(movie.id); setView("movie"); }}>
                <div style={{ position:"relative", overflow:"hidden" }}>
                  <img src={movie.poster} alt={movie.title} style={s.cardImg} onError={e=>{ e.target.style.background="#0d0d22"; e.target.style.height="320px"; }} />
                  <div className="card-overlay" style={{ position:"absolute",inset:0,background:"linear-gradient(0deg,#06060f 0%,transparent 50%)",opacity:0,transition:"opacity 0.3s" }}>
                    <div style={{ position:"absolute",bottom:16,left:16,right:16 }}>
                      <p style={{ fontSize:13, color:"#c8c0b0", lineHeight:1.5, margin:0 }}>{movie.description.slice(0,120)}…</p>
                    </div>
                  </div>
                  <div style={{ position:"absolute",top:12,left:12, display:"flex",gap:6 }}>
                    <Badge color={movie.release_type==="special_event"?"#9b59b6":movie.release_type==="new_release"?"#d4a847":"#4a8a5a"}>{movie.tag}</Badge>
                  </div>
                  <div style={{ position:"absolute",top:12,right:12 }}>
                    <Badge color="#5a6a85">{movie.rating}</Badge>
                  </div>
                </div>
                <div style={s.cardBody}>
                  <h3 style={{ ...s.cardTitle, marginBottom:4 }}>{movie.title}</h3>
                  <p style={s.cardMeta}>{movie.genre} &middot; {movie.runtime} min</p>
                  {sessions.length > 0 ? (
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                      {sessions.slice(0,3).map(sess => (
                        <button key={sess.id} className="session-btn" style={s.sessionBtn(sess.seats_available)}
                          onClick={e=>{ e.stopPropagation(); setSelectedMovie(movie.id); setSelectedSession(sess); setView("seats"); }}>
                          <div style={{ fontWeight:700, fontSize:14 }}>{formatTime(sess.time)}</div>
                          <div style={{ fontSize:10, opacity:0.7, marginTop:2 }}>{sess.seats_available} left</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize:12, color:"#3a4a65", marginTop:8, fontStyle:"italic" }}>No sessions at this location</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const MovieView = () => {
    const movie = MOVIES.find(m=>m.id===selectedMovie);
    if (!movie) return null;
    const allSessions = SESSIONS.filter(s=>s.movie_id===movie.id && s.date===selectedDate);
    return (
      <div style={s.container}>
        <style>{`.session-btn:hover{background:#1e2a4a!important;border-color:#d4a847!important;color:#d4a847!important;} .btn-red:hover{box-shadow:0 8px 24px #cc220040;} `}</style>
        <button onClick={()=>setView("home")} style={{ ...s.btnOutline, margin:"24px 0", padding:"8px 16px", fontSize:12 }}>← Back to Movies</button>
        <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:32, paddingBottom:48 }}>
          <div>
            <img src={movie.poster} alt={movie.title} style={{ width:"100%", borderRadius:8, border:"1px solid #1e2a4a" }} />
          </div>
          <div>
            <div style={{ display:"flex",gap:8,marginBottom:12 }}>
              <Badge color={movie.release_type==="special_event"?"#9b59b6":movie.release_type==="new_release"?"#d4a847":"#4a8a5a"}>{movie.tag}</Badge>
              <Badge color="#5a6a85">{movie.rating}</Badge>
            </div>
            <h1 style={{ ...s.heroTitle, textAlign:"left", fontSize:36, marginBottom:8 }}>{movie.title}</h1>
            <p style={{ color:"#6a7a95", fontSize:15, marginBottom:16 }}>{movie.genre} &middot; {movie.runtime} min</p>
            <p style={{ color:"#b8b0a0", lineHeight:1.8, fontSize:16, marginBottom:24 }}>{movie.description}</p>
            <hr style={s.divider} />
            <h3 style={s.h3}>Select Location & Session</h3>
            <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
              {CINEMAS.map(c=>(
                <button key={c.id} onClick={()=>setSelectedCinema(c.id)} style={selectedCinema===c.id?s.btnGold:{...s.btnOutline, padding:"8px 16px"}}>
                  {c.name.replace("Southern Sky ","")}
                </button>
              ))}
            </div>
            {CINEMAS.map(cinema => {
              const cinSessions = allSessions.filter(s=>s.cinema_id===cinema.id);
              if (cinSessions.length===0 || cinema.id!==selectedCinema) return null;
              return (
                <div key={cinema.id} style={s.panel}>
                  <p style={{ color:"#5a6a85", fontSize:13, marginBottom:12 }}>{cinema.address}</p>
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {cinSessions.map(sess=>(
                      <button key={sess.id} className="session-btn" style={{ ...s.sessionBtn(sess.seats_available), padding:"16px 20px" }}
                        onClick={()=>{ setSelectedSession(sess); setView("seats"); }}>
                        <div style={{ fontWeight:700, fontSize:16 }}>{formatTime(sess.time)}</div>
                        <div style={{ fontSize:11, opacity:0.7, marginTop:3, textTransform:"uppercase", letterSpacing:1 }}>{sess.type}</div>
                        <div style={{ fontSize:11, opacity:0.6, marginTop:2 }}>{sess.seats_available} seats left</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const SeatsView = () => {
    const movie = MOVIES.find(m=>m.id===selectedMovie);
    const sess = selectedSession;
    if (!movie || !sess) return null;
    const cinema = CINEMAS.find(c=>c.id===sess.cinema_id);
    const rows = "ABCDEFGH".split("");
    return (
      <div style={s.container}>
        <style>{`.btn-red:hover{box-shadow:0 8px 24px #cc220040;} .btn-gold:hover{box-shadow:0 8px 24px #d4a84740;}`}</style>
        <button onClick={()=>setView("movie")} style={{ ...s.btnOutline, margin:"24px 0 12px", padding:"8px 16px", fontSize:12 }}>← Back</button>
        <ProgressBar step={2} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:24 }}>
          <div>
            <div style={s.panel}>
              <h2 style={{ ...s.h2, fontSize:22, marginBottom:4 }}>{movie.title}</h2>
              <p style={{ color:"#5a6a85", fontSize:14, marginBottom:16 }}>{cinema.name} &middot; Screen {sess.screen} &middot; {formatTime(sess.time)} &middot; {formatDate(sess.date)}</p>
              {/* Ticket selector */}
              <div style={{ marginBottom:24 }}>
                <h3 style={{ ...s.h3, fontSize:16 }}>Select Tickets</h3>
                {Object.keys(PRICING_RULES.base).map(type=>{
                  const {price, mods} = calcPrice(type, sess, movie);
                  return (
                    <div key={type} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #1a1a3a" }}>
                      <div style={{ flex:1 }}>
                        <span style={{ color:"#e8e0d0", fontWeight:600 }}>{type}</span>
                        {mods.length>0 && <span style={{ fontSize:11, color:"#5a6a85", marginLeft:8 }}>{mods.join(", ")}</span>}
                      </div>
                      <span style={{ color:"#d4a847", fontWeight:700, minWidth:60, textAlign:"right" }}>{fmt(price)}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <button onClick={()=>setTickets(t=>({...t,[type]:Math.max(0,t[type]-1)}))} style={{ width:28,height:28,borderRadius:4,background:"#1e2a4a",border:"1px solid #2a3a6a",color:"#e8e0d0",cursor:"pointer",fontSize:16 }}>−</button>
                        <span style={{ minWidth:20, textAlign:"center", color:"#e8e0d0", fontWeight:700 }}>{tickets[type]}</span>
                        <button onClick={()=>setTickets(t=>({...t,[type]:t[type]+1}))} style={{ width:28,height:28,borderRadius:4,background:"#1e2a4a",border:"1px solid #2a3a6a",color:"#e8e0d0",cursor:"pointer",fontSize:16 }}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Seat map */}
              {totalTickets > 0 && (
                <div>
                  <h3 style={{ ...s.h3, fontSize:16 }}>Choose Seats ({seats.length}/{totalTickets} selected)</h3>
                  <div style={{ background:"#04040e", borderRadius:8, padding:"16px 8px", textAlign:"center" }}>
                    <div style={{ background:"linear-gradient(90deg,#0a0a1a,#d4a847,#0a0a1a)", height:4, borderRadius:2, marginBottom:24, maxWidth:300, margin:"0 auto 24px" }}/>
                    <div style={{ fontSize:10, color:"#3a4a65", letterSpacing:3, marginBottom:16, textTransform:"uppercase" }}>Screen</div>
                    {rows.map(row=>(
                      <div key={row} style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:0 }}>
                        <span style={{ width:20, fontSize:10, color:"#3a4a65", textAlign:"right", marginRight:4 }}>{row}</span>
                        {Array.from({length:SCREEN_LAYOUT.cols}).map((_,i)=>{
                          const id = `${row}${i+1}`;
                          return <SeatBtn key={id} id={id} status={seatStatus(id)} selected={seats.includes(id)} onClick={()=>toggleSeat(id)} />;
                        })}
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:20, justifyContent:"center", marginTop:16, flexWrap:"wrap" }}>
                      {[["available","#1e2a4a","Available"],["selected","#d4a847","Selected"],["taken","#3d1515","Taken"]].map(([k,c,l])=>(
                        <div key={k} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#5a6a85" }}>
                          <div style={{ width:16, height:14, background:c, borderRadius:3, border:`1px solid ${c}` }}/>
                          {l}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Order summary */}
          <div>
            <div style={{ ...s.panel, position:"sticky", top:80 }}>
              <h3 style={s.h3}>Order Summary</h3>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:14, color:"#8a9ab5", marginBottom:4 }}>{movie.title}</div>
                <div style={{ fontSize:13, color:"#5a6a85" }}>{formatTime(sess.time)} &middot; {formatDate(sess.date)}</div>
                <div style={{ fontSize:13, color:"#5a6a85" }}>{cinema.name}</div>
              </div>
              <hr style={s.divider} />
              {Object.entries(tickets).filter(([,q])=>q>0).map(([type,qty])=>{
                const {price} = calcPrice(type, sess, movie);
                return (
                  <div key={type} style={{ display:"flex",justifyContent:"space-between",fontSize:14,color:"#b8b0a0",marginBottom:6 }}>
                    <span>{qty}x {type}</span>
                    <span>{fmt(price*qty)}</span>
                  </div>
                );
              })}
              {seats.length > 0 && (
                <div style={{ fontSize:13, color:"#5a6a85", marginTop:8 }}>Seats: {seats.join(", ")}</div>
              )}
              <hr style={s.divider} />
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:700,color:"#d4a847",marginBottom:20 }}>
                <span>Total</span><span>{fmt(totalPrice)}</span>
              </div>
              <button className="btn-red" style={{ ...s.btn, width:"100%", marginBottom:10 }}
                disabled={totalTickets===0||seats.length<totalTickets}
                onClick={()=>setView("checkout")}
                title={totalTickets===0?"Select tickets first":seats.length<totalTickets?"Select your seats first":"Proceed to checkout"}>
                {totalTickets===0?"Select Tickets":seats.length<totalTickets?`Select ${totalTickets-seats.length} More Seat(s)`:"Proceed to Checkout"}
              </button>
              {totalTickets>0&&seats.length<totalTickets&&(
                <p style={{ fontSize:11, color:"#5a6a85", textAlign:"center" }}>Please select all your seats</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CheckoutView = () => {
    const movie = MOVIES.find(m=>m.id===selectedMovie);
    const sess = selectedSession;
    const cinema = CINEMAS.find(c=>c.id===sess.cinema_id);
    const [form, setForm] = useState({ name:"", email:"", card:"", expiry:"", cvv:"" });
    const [processing, setProcessing] = useState(false);
    const handleField = (k,v) => setForm(f=>({...f,[k]:v}));
    const handlePay = () => {
      if (!form.name||!form.email||!form.card||!form.expiry||!form.cvv) { notify("Please fill in all fields","warn"); return; }
      setProcessing(true);
      setTimeout(()=>{ setProcessing(false); confirmBooking(); }, 2200);
    };
    return (
      <div style={s.container}>
        <button onClick={()=>setView("seats")} style={{ ...s.btnOutline, margin:"24px 0 12px", padding:"8px 16px", fontSize:12 }}>← Back to Seats</button>
        <ProgressBar step={4} />
        <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:24, paddingBottom:48 }}>
          <div>
            <div style={s.panel}>
              <h2 style={{ ...s.h2, fontSize:22, marginBottom:20 }}>Your Details</h2>
              <label style={s.label}>Full Name</label>
              <input style={{ ...s.input, marginBottom:16 }} placeholder="Jane Smith" value={form.name} onChange={e=>handleField("name",e.target.value)} />
              <label style={s.label}>Email Address</label>
              <input style={{ ...s.input, marginBottom:24 }} placeholder="jane@example.com" type="email" value={form.email} onChange={e=>handleField("email",e.target.value)} />
              <h2 style={{ ...s.h2, fontSize:22, marginBottom:20 }}>Payment</h2>
              <div style={{ background:"#04040e", border:"1px solid #1e2a4a", borderRadius:8, padding:"16px", marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                  <div style={{ background:"#1e2a4a", borderRadius:4, padding:"4px 10px", fontSize:11, color:"#5a9ad4", fontWeight:700 }}>STRIPE SECURE</div>
                  <div style={{ fontSize:11, color:"#3a4a65" }}>256-bit SSL encryption · No card data stored</div>
                </div>
                <label style={s.label}>Card Number</label>
                <input style={{ ...s.input, marginBottom:12, letterSpacing:2 }} placeholder="4242 4242 4242 4242" value={form.card}
                  onChange={e=>handleField("card",e.target.value.replace(/\D/g,"").slice(0,16).replace(/(.{4})/g,"$1 ").trim())} maxLength={19} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={s.label}>Expiry</label>
                    <input style={s.input} placeholder="MM/YY" value={form.expiry} onChange={e=>handleField("expiry",e.target.value)} maxLength={5} />
                  </div>
                  <div>
                    <label style={s.label}>CVV</label>
                    <input style={s.input} placeholder="123" value={form.cvv} onChange={e=>handleField("cvv",e.target.value.replace(/\D/g,""))} maxLength={3} />
                  </div>
                </div>
              </div>
              <button className="btn-red" style={{ ...s.btn, width:"100%", fontSize:16, padding:16, opacity: processing?0.7:1 }} onClick={handlePay} disabled={processing}>
                {processing ? "Processing Payment..." : `Pay ${fmt(totalPrice)} Securely`}
              </button>
              <p style={{ fontSize:11, color:"#3a4a65", textAlign:"center", marginTop:10 }}>
                By completing your purchase you agree to our Terms of Service. Tickets are non-refundable within 24 hours of the session.
              </p>
            </div>
          </div>
          <div>
            <div style={{ ...s.panel, position:"sticky", top:80 }}>
              <h3 style={s.h3}>Order Summary</h3>
              <img src={movie.poster} style={{ width:"100%", borderRadius:6, marginBottom:12 }} />
              <div style={{ fontSize:16, fontWeight:700, color:"#e8e0d0", fontFamily:"'Playfair Display',Georgia,serif", marginBottom:4 }}>{movie.title}</div>
              <div style={{ fontSize:13, color:"#5a6a85", marginBottom:4 }}>{formatDate(sess.date)}</div>
              <div style={{ fontSize:13, color:"#5a6a85", marginBottom:4 }}>{formatTime(sess.time)} &middot; Screen {sess.screen}</div>
              <div style={{ fontSize:13, color:"#5a6a85", marginBottom:12 }}>{cinema.name}</div>
              <div style={{ fontSize:13, color:"#6a7a95", marginBottom:4 }}>Seats: {seats.join(", ")}</div>
              <hr style={s.divider} />
              {Object.entries(tickets).filter(([,q])=>q>0).map(([type,qty])=>{
                const {price} = calcPrice(type, sess, movie);
                return <div key={type} style={{ display:"flex",justifyContent:"space-between",fontSize:13,color:"#b8b0a0",marginBottom:4 }}><span>{qty}x {type}</span><span>{fmt(price*qty)}</span></div>;
              })}
              <hr style={s.divider} />
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:20,fontWeight:700,color:"#d4a847" }}><span>Total</span><span>{fmt(totalPrice)}</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmationView = () => {
    if (!booking) return null;
    const qrData = `SSC:${booking.ref}:${booking.movie.title}:${formatTime(booking.session.time)}`;
    return (
      <div style={{ ...s.container, textAlign:"center", padding:"48px 24px" }}>
        <div style={{ fontSize:40, marginBottom:16 }}>🎬</div>
        <h1 style={{ ...s.heroTitle, fontSize:32, marginBottom:8 }}>Booking Confirmed!</h1>
        <p style={{ color:"#8a9ab5", marginBottom:32 }}>Your tickets have been sent to your email address.</p>
        <div style={{ maxWidth:480, margin:"0 auto" }}>
          <div style={{ ...s.panel, border:"1px solid #d4a84740" }}>
            <div style={{ fontSize:12, letterSpacing:3, color:"#5a6a85", marginBottom:8, textTransform:"uppercase" }}>Booking Reference</div>
            <div style={{ fontSize:28, fontWeight:900, color:"#d4a847", fontFamily:"'Playfair Display',Georgia,serif", letterSpacing:4, marginBottom:24 }}>{booking.ref}</div>
            <img src={genQR(qrData)} alt="QR Code" style={{ width:160, height:160, borderRadius:8, border:"2px solid #d4a84740", marginBottom:20 }} onError={e=>{ e.target.style.display="none"; }} />
            <div style={{ textAlign:"left", borderTop:"1px solid #1e2a4a", paddingTop:16 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[["Movie",booking.movie.title],["Cinema",booking.cinema.name],["Date",formatDate(booking.session.date)],["Time",formatTime(booking.session.time)],["Screen",`Screen ${booking.session.screen}`],["Seats",booking.seats.join(", ")]].map(([k,v])=>(
                  <div key={k}>
                    <div style={{ fontSize:11, color:"#5a6a85", letterSpacing:1, textTransform:"uppercase", marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:14, color:"#e8e0d0", fontWeight:600 }}>{v}</div>
                  </div>
                ))}
              </div>
              <hr style={s.divider} />
              {Object.entries(booking.tickets).filter(([,q])=>q>0).map(([type,qty])=>{
                const {price} = calcPrice(type, booking.session, booking.movie);
                return <div key={type} style={{ display:"flex",justifyContent:"space-between",fontSize:14,color:"#b8b0a0",marginBottom:4 }}><span>{qty}x {type}</span><span>{fmt(price*qty)}</span></div>;
              })}
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:700,color:"#d4a847",marginTop:8 }}><span>Total Paid</span><span>{fmt(booking.total)}</span></div>
            </div>
          </div>
          <button className="btn-gold" style={s.btnGold} onClick={resetBooking}>Browse More Movies</button>
        </div>
      </div>
    );
  };

  // ── Admin ──

  const AdminLogin = () => {
    const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
    const login = () => {
      if (u===ADMIN_CREDS.username && p===ADMIN_CREDS.password) { setAdminLoggedIn(true); setErr(""); }
      else setErr("Invalid credentials");
    };
    return (
      <div style={{ display:"flex", justifyContent:"center", alignItems:"center", minHeight:"80vh" }}>
        <div style={{ ...s.panel, width:360, border:"1px solid #d4a84740" }}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <div style={{ fontSize:12, letterSpacing:4, color:"#5a6a85", textTransform:"uppercase", marginBottom:8 }}>Southern Sky Cinemas</div>
            <h2 style={{ ...s.h2, fontSize:24 }}>Admin Portal</h2>
          </div>
          <label style={s.label}>Username</label>
          <input style={{ ...s.input, marginBottom:12 }} value={u} onChange={e=>setU(e.target.value)} placeholder="admin" />
          <label style={s.label}>Password</label>
          <input style={{ ...s.input, marginBottom:16, type:"password" }} type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&login()} />
          {err && <p style={{ color:"#cc4444", fontSize:13, marginBottom:12 }}>{err}</p>}
          <button className="btn-gold" style={{ ...s.btnGold, width:"100%" }} onClick={login}>Sign In</button>
          <p style={{ fontSize:11, color:"#3a4a65", textAlign:"center", marginTop:12 }}>Demo: admin / southernsky2026</p>
        </div>
      </div>
    );
  };

  const AdminDashboard = () => {
    const [pricingRules, setPricingRules] = useState(JSON.parse(JSON.stringify(PRICING_RULES)));
    const [newSession, setNewSession] = useState({ movie_id:"m1", cinema_id:"dubbo", screen:1, date:"2026-03-14", time:"18:00", type:"evening" });

    const stats = [
      { label:"Total Bookings", value:"1,247", sub:"This month" },
      { label:"Revenue", value:"$38,421", sub:"This month" },
      { label:"Avg. Occupancy", value:"73%", sub:"Across all screens" },
      { label:"Active Movies", value:MOVIES.length, sub:"Now showing" },
    ];

    const sideLinks = [
      { id:"dashboard", label:"Dashboard" },
      { id:"movies", label:"Movies & CSV" },
      { id:"sessions", label:"Sessions" },
      { id:"pricing", label:"Pricing Rules" },
      { id:"cinemas", label:"Cinemas" },
      { id:"reports", label:"Sales Reports" },
    ];

    return (
      <div style={{ display:"flex", minHeight:"calc(100vh - 64px)" }}>
        <div style={s.adminSidebar}>
          <div style={{ padding:"0 24px 16px", borderBottom:"1px solid #1e2a4a", marginBottom:8 }}>
            <div style={{ fontSize:11, letterSpacing:2, color:"#3a4a65", textTransform:"uppercase" }}>Admin Panel</div>
          </div>
          {sideLinks.map(l=>(
            <div key={l.id} style={s.adminLink(adminView===l.id)} onClick={()=>setAdminView(l.id)}>{l.label}</div>
          ))}
          <div style={{ marginTop:"auto", padding:"16px 24px", borderTop:"1px solid #1e2a4a", marginTop:40 }}>
            <button onClick={()=>setAdminLoggedIn(false)} style={{ ...s.btnOutline, width:"100%", padding:"8px 16px", fontSize:12 }}>Sign Out</button>
          </div>
        </div>
        <div style={{ flex:1, padding:32, overflowY:"auto" }}>
          {adminView==="dashboard" && (
            <div>
              <h2 style={s.h2}>Dashboard</h2>
              <p style={{ color:"#5a6a85", marginBottom:24 }}>Welcome back. Here's your cinema overview.</p>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:32 }}>
                {stats.map(stat=>(
                  <div key={stat.label} style={{ ...s.panel, textAlign:"center" }}>
                    <div style={{ fontSize:32, fontWeight:700, color:"#d4a847", fontFamily:"'Playfair Display',Georgia,serif" }}>{stat.value}</div>
                    <div style={{ fontSize:14, color:"#e8e0d0", marginBottom:4 }}>{stat.label}</div>
                    <div style={{ fontSize:12, color:"#5a6a85" }}>{stat.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16 }}>
                <div style={s.panel}>
                  <h3 style={s.h3}>Recent Bookings</h3>
                  {[{ref:"SSC-X4F2A",movie:"Starfall",cinema:"Dubbo",time:"7:00 PM",total:"$54.00",status:"confirmed"},{ref:"SSC-B7G3K",movie:"Luminara",cinema:"Orange",time:"2:30 PM",total:"$48.00",status:"confirmed"},{ref:"SSC-C2H9P",movie:"Mirage Protocol",cinema:"Bathurst",time:"8:15 PM",total:"$36.00",status:"confirmed"}].map(b=>(
                    <div key={b.ref} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1a1a3a" }}>
                      <div>
                        <div style={{ fontSize:14, color:"#e8e0d0", fontWeight:600 }}>{b.ref}</div>
                        <div style={{ fontSize:12, color:"#5a6a85" }}>{b.movie} · {b.cinema} · {b.time}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:14, color:"#d4a847", fontWeight:700 }}>{b.total}</div>
                        <Badge color="#4a8a5a">{b.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={s.panel}>
                  <h3 style={s.h3}>Locations</h3>
                  {CINEMAS.map(c=>(
                    <div key={c.id} style={{ marginBottom:12, padding:"10px 12px", background:"#08081a", borderRadius:6, border:"1px solid #1e2a4a" }}>
                      <div style={{ fontSize:13, color:"#e8e0d0", fontWeight:600 }}>{c.name.replace("Southern Sky ","")}</div>
                      <div style={{ fontSize:12, color:"#5a6a85" }}>{c.screens} screens</div>
                      <div style={{ fontSize:12, color:"#4a8a5a", marginTop:4 }}>● Online</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {adminView==="movies" && (
            <div>
              <h2 style={s.h2}>Movies & CSV Import</h2>
              <p style={{ color:"#5a6a85", marginBottom:24 }}>Upload a CSV to update movie listings automatically.</p>
              <div style={s.panel}>
                <h3 style={s.h3}>Upload Movie CSV</h3>
                <div style={{ border:"2px dashed #2a3a6a", borderRadius:8, padding:40, textAlign:"center", marginBottom:16, cursor:"pointer" }}
                  onClick={()=>document.getElementById("csv-input").click()}>
                  <div style={{ fontSize:32, marginBottom:8 }}>📄</div>
                  <p style={{ color:"#5a6a85" }}>Drop CSV file here or click to browse</p>
                  <p style={{ fontSize:12, color:"#3a4a65" }}>Required columns: movie_id, title, rating, runtime, genre, poster_url, description, release_type</p>
                  <input id="csv-input" type="file" accept=".csv" style={{ display:"none" }} onChange={e=>{ if(e.target.files[0]){ setCsvData(e.target.files[0].name); notify(`Loaded: ${e.target.files[0].name}`); }}} />
                </div>
                {csvData && <p style={{ color:"#4a8a5a" }}>✓ Loaded: {csvData}</p>}
                <button className="btn-gold" style={s.btnGold} onClick={()=>notify("Movies updated successfully from CSV")}>Process & Import CSV</button>
              </div>
              <div style={s.panel}>
                <h3 style={s.h3}>Current Movies ({MOVIES.length})</h3>
                {MOVIES.map(m=>(
                  <div key={m.id} style={{ display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1a1a3a" }}>
                    <img src={m.poster} style={{ width:40,height:56,objectFit:"cover",borderRadius:4 }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, color:"#e8e0d0", fontWeight:600 }}>{m.title}</div>
                      <div style={{ fontSize:12, color:"#5a6a85" }}>{m.rating} · {m.runtime}m · {m.genre}</div>
                    </div>
                    <Badge color={m.release_type==="new_release"?"#d4a847":"#4a8a5a"}>{m.release_type}</Badge>
                    <button style={{ ...s.btnOutline, padding:"4px 12px", fontSize:11 }} onClick={()=>notify(`Editing ${m.title}`)}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminView==="sessions" && (
            <div>
              <h2 style={s.h2}>Session Management</h2>
              <div style={s.panel}>
                <h3 style={s.h3}>Add New Session</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                  <div><label style={s.label}>Movie</label>
                    <select style={s.select} value={newSession.movie_id} onChange={e=>setNewSession(n=>({...n,movie_id:e.target.value}))}>
                      {MOVIES.map(m=><option key={m.id} value={m.id}>{m.title}</option>)}
                    </select></div>
                  <div><label style={s.label}>Cinema</label>
                    <select style={s.select} value={newSession.cinema_id} onChange={e=>setNewSession(n=>({...n,cinema_id:e.target.value}))}>
                      {CINEMAS.map(c=><option key={c.id} value={c.id}>{c.name.replace("Southern Sky ","")}</option>)}
                    </select></div>
                  <div><label style={s.label}>Screen</label>
                    <input style={s.input} type="number" min={1} max={4} value={newSession.screen} onChange={e=>setNewSession(n=>({...n,screen:+e.target.value}))} /></div>
                  <div><label style={s.label}>Date</label><input style={s.input} type="date" value={newSession.date} onChange={e=>setNewSession(n=>({...n,date:e.target.value}))} /></div>
                  <div><label style={s.label}>Time</label><input style={s.input} type="time" value={newSession.time} onChange={e=>setNewSession(n=>({...n,time:e.target.value}))} /></div>
                  <div><label style={s.label}>Type</label>
                    <select style={s.select} value={newSession.type} onChange={e=>setNewSession(n=>({...n,type:e.target.value}))}>
                      <option value="matinee">Matinee</option><option value="evening">Evening</option><option value="late">Late</option>
                    </select></div>
                </div>
                <button className="btn-gold" style={s.btnGold} onClick={()=>notify("Session created successfully!")}>Create Session</button>
              </div>
              <div style={s.panel}>
                <h3 style={s.h3}>Upcoming Sessions</h3>
                {SESSIONS.map(sess=>{
                  const movie = MOVIES.find(m=>m.id===sess.movie_id);
                  const cinema = CINEMAS.find(c=>c.id===sess.cinema_id);
                  return (
                    <div key={sess.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #1a1a3a" }}>
                      <div>
                        <div style={{ fontSize:14, color:"#e8e0d0", fontWeight:600 }}>{movie?.title}</div>
                        <div style={{ fontSize:12, color:"#5a6a85" }}>{cinema?.name.replace("Southern Sky ","")} · Screen {sess.screen} · {formatDate(sess.date)} · {formatTime(sess.time)}</div>
                      </div>
                      <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                        <span style={{ fontSize:13, color: sess.seats_available<20?"#e06060":"#4a8a5a" }}>{sess.seats_available} seats</span>
                        <button style={{ ...s.btnOutline, padding:"4px 10px", fontSize:11 }} onClick={()=>notify("Edit session opened")}>Edit</button>
                        <button style={{ background:"#2a0a0a",border:"1px solid #5a1a1a",color:"#e06060",padding:"4px 10px",fontSize:11,borderRadius:4,cursor:"pointer" }} onClick={()=>notify("Session cancelled","warn")}>Cancel</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {adminView==="pricing" && (
            <div>
              <h2 style={s.h2}>Pricing Rules</h2>
              <p style={{ color:"#5a6a85", marginBottom:24 }}>Adjust base prices and modifiers without coding.</p>
              <div style={s.panel}>
                <h3 style={s.h3}>Base Ticket Prices</h3>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12 }}>
                  {Object.entries(pricingRules.base).map(([type,price])=>(
                    <div key={type}>
                      <label style={s.label}>{type}</label>
                      <input style={s.input} type="number" step="0.50" min="0" value={price}
                        onChange={e=>setPricingRules(r=>({...r,base:{...r.base,[type]:+e.target.value}}))} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={s.panel}>
                <h3 style={s.h3}>Pricing Modifiers</h3>
                {Object.entries(pricingRules.modifiers).map(([key,rule])=>(
                  <div key={key} style={{ padding:"12px 0", borderBottom:"1px solid #1a1a3a" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:14, color:"#e8e0d0", fontWeight:600 }}>{rule.label}</div>
                        <div style={{ fontSize:12, color:"#5a6a85", fontFamily:"monospace", marginTop:2 }}>if {rule.applies_if}</div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                        {rule.multiplier && <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <label style={{ ...s.label, margin:0 }}>Multiplier</label>
                          <input style={{ ...s.input, width:80 }} type="number" step="0.1" value={rule.multiplier} onChange={()=>{}} />
                        </div>}
                        {rule.add !== undefined && <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <label style={{ ...s.label, margin:0 }}>Add $</label>
                          <input style={{ ...s.input, width:80 }} type="number" step="0.50" value={rule.add} onChange={()=>{}} />
                        </div>}
                        <Badge color="#4a8a5a">Active</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn-gold" style={s.btnGold} onClick={()=>notify("Pricing rules saved!")}>Save Pricing Rules</button>
            </div>
          )}

          {adminView==="cinemas" && (
            <div>
              <h2 style={s.h2}>Cinema Locations</h2>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                {CINEMAS.map(c=>(
                  <div key={c.id} style={{ ...s.panel, border:"1px solid #d4a84720" }}>
                    <h3 style={s.h3}>{c.name.replace("Southern Sky ","")}</h3>
                    <p style={{ fontSize:13, color:"#5a6a85", marginBottom:12 }}>{c.address}</p>
                    <div style={{ fontSize:12, color:"#4a8a5a", marginBottom:16 }}>● Online · {c.screens} Screens</div>
                    <div style={{ marginBottom:12 }}>
                      {Array.from({length:c.screens}).map((_,i)=>(
                        <div key={i} style={{ display:"flex",justifyContent:"space-between",fontSize:13,padding:"6px 0",borderBottom:"1px solid #1a1a3a" }}>
                          <span style={{ color:"#8a9ab5" }}>Screen {i+1}</span>
                          <span style={{ color:"#5a6a85" }}>96 seats</span>
                        </div>
                      ))}
                    </div>
                    <button style={{ ...s.btnOutline, width:"100%", padding:"8px", fontSize:12 }} onClick={()=>notify(`Editing ${c.name}`)}>Configure Screens</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminView==="reports" && (
            <div>
              <h2 style={s.h2}>Sales Reports</h2>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:24 }}>
                {[["Dubbo","$18,240","483 tickets","74% occupancy"],["Orange","$12,850","341 tickets","68% occupancy"],["Bathurst","$7,331","194 tickets","81% occupancy"]].map(([loc,rev,tix,occ])=>(
                  <div key={loc} style={s.panel}>
                    <h3 style={{ ...s.h3, marginBottom:8 }}>{loc}</h3>
                    <div style={{ fontSize:28, fontWeight:700, color:"#d4a847", fontFamily:"'Playfair Display',Georgia,serif" }}>{rev}</div>
                    <div style={{ fontSize:13, color:"#5a6a85" }}>{tix} · {occ}</div>
                  </div>
                ))}
                <div style={{ ...s.panel, background:"linear-gradient(135deg,#0d1a3a,#1a0d3a)" }}>
                  <h3 style={{ ...s.h3, color:"#d4a847" }}>Top Performer</h3>
                  <div style={{ fontSize:22, color:"#e8e0d0", fontWeight:700, fontFamily:"'Playfair Display',Georgia,serif" }}>Starfall</div>
                  <div style={{ fontSize:13, color:"#5a6a85" }}>437 tickets · $8,912 revenue</div>
                </div>
              </div>
              <div style={s.panel}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                  <h3 style={{ ...s.h3, margin:0 }}>Export Reports</h3>
                </div>
                <div style={{ display:"flex",gap:12 }}>
                  {["Sales by Movie","Sales by Location","Ticket Type Breakdown","Daily Revenue"].map(r=>(
                    <button key={r} style={{ ...s.btnOutline, padding:"8px 16px", fontSize:12 }} onClick={()=>notify(`Exporting: ${r}`)}>⬇ {r}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={s.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        @keyframes twinkle{from{opacity:0.1}to{opacity:0.7}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        * { box-sizing: border-box; margin:0; padding:0; }
        body { background:#06060f; }
        .btn-gold:hover{background:linear-gradient(135deg,#d4a847,#f0c040)!important;transform:translateY(-1px);box-shadow:0 8px 24px #d4a84740;}
        .btn-red:hover{background:linear-gradient(135deg,#cc2200,#ff3300)!important;transform:translateY(-1px);box-shadow:0 8px 24px #cc220040;}
      `}</style>

      {/* Notification */}
      {notification && (
        <div style={{ position:"fixed",top:72,right:20,background: notification.type==="warn"?"#1a1000":"#0a1a0a",border:`1px solid ${notification.type==="warn"?"#c8a030":"#4a8a5a"}`,borderRadius:6,padding:"12px 20px",color: notification.type==="warn"?"#c8a030":"#4a8a5a",fontSize:14,zIndex:9999,animation:"fadeIn 0.3s ease",boxShadow:"0 8px 32px #00000060" }}>
          {notification.type==="warn"?"⚠️":"✓"} {notification.msg}
        </div>
      )}

      {/* Navbar */}
      <nav style={s.nav}>
        <div style={s.navLogo} onClick={()=>{ setView("home"); }}>
          ★ Southern Sky
        </div>
        <div style={{ flex:1 }}/>
        {["home","now-showing"].map(v=>(
          <span key={v} className="nav-link" style={s.navLink} onClick={()=>setView("home")}>
            {v==="home"?"Home":"Now Showing"}
          </span>
        ))}
        <span className="nav-link" style={s.navLink} onClick={()=>{ setView("admin"); }}>Admin</span>
        <button className="btn-red" style={{ ...s.btn, padding:"8px 20px", fontSize:12 }} onClick={()=>{ setView("home"); }}>Buy Tickets</button>
      </nav>

      {/* Main content */}
      <main style={{ position:"relative", zIndex:1 }}>
        {view==="home" && <HomeView />}
        {view==="movie" && <MovieView />}
        {view==="seats" && <SeatsView />}
        {view==="checkout" && <CheckoutView />}
        {view==="confirmation" && <ConfirmationView />}
        {view==="admin" && (adminLoggedIn ? <AdminDashboard /> : <AdminLogin />)}
      </main>

      {/* Footer */}
      {view !== "admin" && (
        <footer style={{ borderTop:"1px solid #1e2a4a", padding:"32px 24px", marginTop:48, textAlign:"center" }}>
          <div style={{ fontSize:16, fontWeight:700, color:"#d4a847", letterSpacing:4, fontFamily:"'Playfair Display',Georgia,serif", marginBottom:8 }}>★ SOUTHERN SKY CINEMAS ★</div>
          <p style={{ fontSize:13, color:"#3a4a65" }}>Dubbo · Orange · Bathurst · Coming Soon</p>
          <p style={{ fontSize:11, color:"#2a3a55", marginTop:12 }}>© 2026 Southern Sky Cinemas. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
}
