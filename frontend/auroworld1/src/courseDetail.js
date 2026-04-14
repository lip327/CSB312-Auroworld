import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL      || 'https://rduempiojxizkwwbzaml.supabase.co',
    process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo'
);

const API =
    window.location.hostname === "localhost"
        ? "http://localhost:8080"
        : "https://auroworld.onrender.com";

// ── Tab button ───────────────────────────────────────────────────────────────

function TabButton({ label, active, onClick }) {
    return (
        <button onClick={onClick} style={{
            padding: '10px 24px', borderRadius: '999px', border: 'none',
            cursor: 'pointer', fontSize: '14px', fontWeight: '600',
            backgroundColor: active ? '#3b3b3b' : 'transparent',
            color: active ? '#fff' : '#666',
            transition: 'all 0.18s',
        }}>
            {label}
        </button>
    );
}

// ── Video tab ────────────────────────────────────────────────────────────────

function VideoTab({ course }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', minHeight: '340px', gap: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '56px' }}>🎥</div>
            <div>
                <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800' }}>{course.title}</h2>
                <p style={{ margin: '0 0 4px', color: '#666', fontSize: '14px' }}>Instructor: {course.instructor}</p>
                <p style={{ margin: '0 0 20px', color: '#666', fontSize: '14px' }}>Times: {course.times}</p>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    fontSize: '13px', fontWeight: '600', padding: '6px 14px',
                    borderRadius: '999px', marginBottom: '24px',
                    backgroundColor: course.inSession ? '#d4f5e9' : '#f0f0f0',
                    color: course.inSession ? '#1a7a50' : '#888',
                }}>
                    <span style={{ fontSize: '10px' }}>{course.inSession ? '●' : '○'}</span>
                    {course.inSession ? 'Class is Live Now!' : 'Not Currently in Session'}
                </div>
            </div>

            <a
                href={course.liveUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'inline-block', padding: '13px 36px', borderRadius: '999px',
                    backgroundColor: course.inSession ? '#1a7a50' : '#3b3b3b',
                    color: '#fff', fontWeight: '700', fontSize: '15px',
                    textDecoration: 'none', transition: 'opacity 0.15s',
                    opacity: course.inSession ? 1 : 0.55,
                    cursor: course.inSession ? 'pointer' : 'not-allowed',
                    pointerEvents: course.inSession ? 'auto' : 'none',
                }}
            >
                {course.inSession ? '▶ Join Live Class' : 'Join Class (opens when live)'}
            </a>

            {!course.inSession && (
                <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>
                    The button becomes active when your instructor starts the session.
                </p>
            )}
        </div>
    );
}

// ── Course tab ───────────────────────────────────────────────────────────────

function CourseTab({ course }) {
    return (
        <div style={{ maxWidth: '640px' }}>
            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800' }}>{course.title}</h2>
            <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#666' }}>Instructor: {course.instructor}</p>
            {course.startDate && (
                <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#666' }}>Starting {course.startDate}</p>
            )}
            <p style={{ margin: '0 0 28px', fontSize: '15px', color: '#333', lineHeight: 1.6 }}>
                {course.description}
            </p>
            {course.level && (
                <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#555' }}>
                    <strong>Level:</strong> {course.level}
                </p>
            )}
            {course.price && (
                <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                    <strong>Price:</strong> {course.price}
                </p>
            )}
        </div>
    );
}

// ── Materials tab — units are collapsible, each has multiple videos ──────────

function UnitSection({ unit }) {
    const [open,        setOpen]        = useState(false);
    const [activeVideo, setActiveVideo] = useState(null); // video id

    return (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: '12px', overflow: 'hidden',
                      backgroundColor: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* Unit header / toggle */}
            <div
                onClick={() => setOpen(o => !o)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', cursor: 'pointer',
                    backgroundColor: open ? '#f5f5f5' : '#fff',
                    transition: 'background-color 0.15s',
                    userSelect: 'none',
                }}
            >
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                        backgroundColor: open ? '#3b3b3b' : '#e8e8e8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background-color 0.15s',
                    }}>
                        <span style={{ fontSize: '14px', color: open ? '#fff' : '#555' }}>📁</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#111' }}>{unit.title}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                            {unit.videos?.length || 0} video{unit.videos?.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
                <span style={{
                    fontSize: '20px', color: '#bbb',
                    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                }}>
                    ›
                </span>
            </div>

            {/* Expanded video list */}
            {open && (
                <div style={{ borderTop: '1px solid #eee' }}>
                    {(!unit.videos || unit.videos.length === 0) ? (
                        <div style={{ padding: '20px', color: '#aaa', fontSize: '14px', textAlign: 'center' }}>
                            No videos in this unit yet.
                        </div>
                    ) : (
                        unit.videos.map((video, idx) => (
                            <div key={video.videoId} style={{ borderBottom: idx < unit.videos.length - 1 ? '1px solid #f0f0f0' : 'none' }}>

                                {/* Video row */}
                                <div
                                    onClick={() => setActiveVideo(activeVideo === video.videoId ? null : video.videoId)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '14px 20px 14px 28px', cursor: 'pointer',
                                        backgroundColor: activeVideo === video.videoId ? '#f9f9f9' : '#fff',
                                        transition: 'background-color 0.12s',
                                    }}
                                >
                                    <div style={{
                                        width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                                        backgroundColor: activeVideo === video.videoId ? '#3b3b3b' : '#ebebeb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '12px', transition: 'all 0.15s',
                                    }}>
                                        <span style={{ color: activeVideo === video.videoId ? '#fff' : '#666' }}>▶</span>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#222' }}>{video.title}</div>
                                        {video.duration && (
                                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{video.duration}</div>
                                        )}
                                    </div>
                                    <span style={{
                                        fontSize: '16px', color: '#ccc',
                                        transform: activeVideo === video.videoId ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.15s', display: 'inline-block',
                                    }}>›</span>
                                </div>

                                {/* Embedded video */}
                                {activeVideo === video.videoId && (
                                    <div style={{ backgroundColor: '#000' }}>
                                        {video.driveUrl && !video.driveUrl.includes('FILE_ID') ? (
                                            <iframe
                                                src={video.driveUrl}
                                                width="100%"
                                                height="420"
                                                allow="autoplay"
                                                style={{ border: 'none', display: 'block' }}
                                                title={video.title}
                                            />
                                        ) : (
                                            <div style={{
                                                height: '220px', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: '#1a1a1a', color: '#666', gap: '10px',
                                            }}>
                                                <span style={{ fontSize: '32px' }}>🎬</span>
                                                <span style={{ fontSize: '13px' }}>
                                                    Update the drive_url for this video in the database
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

async function newUnitButton(){
    console.log("hitting new unit button");
    document.getElementById("addUnit").style.display="block"
}
async function cancelNewUnit(){
    console.log("cancelling new unit")
    document.getElementById("addUnit").style.display="none"
}
async function submitNewUnit(courseId){
    console.log("submitting new unit")
    try{
        if(!document.getElementById("unitName").value){
            alert("Please enter a unit name")
            return
        }
        const unitBody={
            unitName:document.getElementById("unitName").value,
        }
        const response=await fetch(`http://localhost:8080/course_units/${courseId}`,{
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(unitBody)
        })
        const data = await response.json();
        console.log("New Unit response:",data)
        if(data.mStatus!=="ok"){
            alert("Adding unitfailed: "+data.mMessage);
            return;
        }
        console.log("new unit Id= "+data.mData)
        return

    }catch(error){
        console.log(error.message)
        return
    }
}

function MaterialsTab({ course }) {
    if (!course.units || course.units.length === 0) {
        return (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '40px', fontSize: '15px' }}>
                No materials available yet.
                <div style={{ textAlign: 'center', color: '#999', marginTop: '40px', fontSize: '15px' }}>
                    <button onClick = {newUnitButton}>Add a New Unit</button>
                    <div id="addUnit" style={{display: 'none'}}>
                         <label style={{ marginTop: 0 }}>Unit name</label>
                         <input type="text" id="unitName" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />

                         <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={()=>submitNewUnit(course.courseId)}>Create</button>
                            <button variant="secondary" onClick={cancelNewUnit}>Cancel</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {course.units.map(unit => (
                <UnitSection key={unit.unitId} unit={unit} />
            ))}
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────

function CourseDetail() {
    const { courseId } = useParams();
    const navigate     = useNavigate();

    const [currentUserName, setCurrentUserName] = useState('Loading...');
    //const [currentUserId,   setCurrentUserId]   = useState(null);
    const [course,          setCourse]          = useState(null);
    const [loading,         setLoading]         = useState(true);
    const [activeTab,       setActiveTab]       = useState('video');

    // ── guard: only enrolled users can see this page ────────────
    const [enrollChecked, setEnrollChecked] = useState(false);

    useEffect(() => {
        async function init() {
            // 1. get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { navigate('/login'); return; }
            else{
                console.log(user)
            }
            //setCurrentUserId(user.id);

            try {
                const { data } = await supabase
                    .from('users').select('firstname, lastname')
                    .eq('email', user.email).single();
                setCurrentUserName(data
                    ? `${data.firstname} ${data.lastname}`
                    : user.email?.split('@')[0] || 'User');
            } catch { /* ignore */ }

            // 2. check enrollment
            const enrollRes  = await fetch(`${API}/courses/enrolled/${user.id}`);
            const enrollData = await enrollRes.json();
            const enrolledIds = new Set((enrollData.mData || []).map(c => c.courseId));
            if (!enrolledIds.has(parseInt(courseId))) {
                // not enrolled — send back to courses list
                navigate('/courses');
                return;
            }
            setEnrollChecked(true);

            // 3. load course data
            const res  = await fetch(`${API}/courses/${courseId}`);
            const data = await res.json();
            if (data.mStatus === 'ok') setCourse(data.mData);
            setLoading(false);
        }
        init();
    }, [courseId, navigate]);

    if (!enrollChecked || loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'sans-serif', color: '#999', fontSize: '15px' }}>
                Loading…
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'sans-serif', color: '#666' }}>
                Course not found.{' '}
                <span style={{ cursor: 'pointer', color: '#3b3b3b', textDecoration: 'underline', marginLeft: '6px' }}
                      onClick={() => navigate('/courses')}>
                    Go back
                </span>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
            backgroundColor: '#f0f2f5',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Header username={currentUserName} />

                <div style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                    <div style={{ maxWidth: '860px', margin: '0 auto' }}>

                        {/* Back */}
                        <button
                            onClick={() => navigate('/courses')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                fontSize: '14px', fontWeight: '600', color: '#555',
                                marginBottom: '20px', padding: 0,
                            }}
                        >
                            ← Back
                        </button>

                        {/* Tabs */}
                        <div style={{
                            display: 'flex', justifyContent: 'center',
                            backgroundColor: '#e0e0e0', borderRadius: '999px',
                            padding: '4px', gap: '2px', marginBottom: '28px',
                        }}>
                            <TabButton label="Video"     active={activeTab === 'video'}     onClick={() => setActiveTab('video')} />
                            <TabButton label="Course"    active={activeTab === 'course'}    onClick={() => setActiveTab('course')} />
                            <TabButton label="Materials" active={activeTab === 'materials'} onClick={() => setActiveTab('materials')} />
                        </div>

                        {/* Tab content */}
                        <div style={{
                            backgroundColor: '#fff', borderRadius: '16px', padding: '32px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: '400px',
                        }}>
                            {activeTab === 'video'     && <VideoTab     course={course} />}
                            {activeTab === 'course'    && <CourseTab    course={course} />}
                            {activeTab === 'materials' && <MaterialsTab course={course} />}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default CourseDetail;