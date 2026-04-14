import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
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

function CourseCard({ course, enrolled, onEnroll, onUnenroll, enrolling, onClick }) {
    const [hovered, setHovered] = useState(false);

    function handleEnrollClick(e) {
        e.stopPropagation();
        if (enrolled) onUnenroll(course.courseId);
        else onEnroll(course.courseId);
    }

    return (
        <div
            onClick={enrolled ? onClick : undefined}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: '20px',
                backgroundColor: hovered && enrolled ? '#fafafa' : '#ffffff',
                border: hovered && enrolled ? '1.5px solid #3b3b3b' : '1px solid #e5e5e5',
                borderRadius: '14px', padding: '20px',
                cursor: enrolled ? 'pointer' : 'default',
                transition: 'all 0.18s ease',
                boxShadow: hovered && enrolled
                    ? '0 4px 16px rgba(0,0,0,0.08)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
            }}
        >
            {/* Thumbnail */}
            <div style={{
                width: '90px', height: '68px', borderRadius: '10px', flexShrink: 0,
                backgroundColor: '#e8e8e8', overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {course.thumbnail
                    ? <img src={course.thumbnail} alt={course.title}
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '28px' }}>📚</span>
                }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#111' }}>
                        {course.title}
                    </span>
                    <span style={{
                        fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '999px',
                        backgroundColor: course.inSession ? '#d4f5e9' : '#f0f0f0',
                        color: course.inSession ? '#1a7a50' : '#888', flexShrink: 0,
                    }}>
                        {course.inSession ? '● In Session' : '○ Not in Session'}
                    </span>
                </div>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#555', lineHeight: 1.4 }}>
                    {course.description}
                </p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#888', flexWrap: 'wrap' }}>
                    <span>👤 {course.instructor}</span>
                    <span>🕐 {course.times}</span>
                    {course.level && <span>📊 {course.level}</span>}
                    {course.price && <span>💰 {course.price}</span>}
                </div>
            </div>

            {/* Enroll button */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <button
                    onClick={handleEnrollClick}
                    disabled={enrolling}
                    style={{
                        padding: '8px 18px', borderRadius: '999px',
                        border: enrolled ? '1.5px solid #c0392b' : '1.5px solid #3b3b3b',
                        backgroundColor: enrolled ? 'transparent' : '#3b3b3b',
                        color: enrolled ? '#c0392b' : '#fff',
                        fontWeight: '600', fontSize: '13px',
                        cursor: enrolling ? 'not-allowed' : 'pointer',
                        opacity: enrolling ? 0.6 : 1,
                        transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}
                >
                    {enrolling ? '...' : enrolled ? 'Unenroll' : 'Enroll'}
                </button>
                {enrolled && (
                    <span style={{ fontSize: '11px', color: '#3b3b3b', fontWeight: '600' }}>
                        ✓ Enrolled — click card to open
                    </span>
                )}
            </div>
        </div>
    );
}

function Courses() {
    const navigate = useNavigate();
    const [currentUserName, setCurrentUserName] = useState('Loading...');
    const [currentUserId,   setCurrentUserId]   = useState(null);
    const [tab,             setTab]             = useState('enrolled');
    const [allCourses,      setAllCourses]      = useState([]);
    const [enrolledIds,     setEnrolledIds]     = useState(new Set());
    const [enrolling,       setEnrolling]       = useState({});

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setCurrentUserName('Guest'); return; }
            setCurrentUserId(user.id);
            try {
                const { data } = await supabase
                    .from('users').select('firstname, lastname')
                    .eq('email', user.email).single();
                setCurrentUserName(data
                    ? `${data.firstname} ${data.lastname}`
                    : user.email?.split('@')[0] || 'User');
            } catch {
                setCurrentUserName(user.email?.split('@')[0] || 'User');
            }
        }
        fetchUser();
    }, []);

    const loadCourses = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/courses`);
            const data = await res.json();
            setAllCourses(data.mData || []);
        } catch (e) { console.error('loadCourses:', e); }
    }, []);

    const loadEnrolled = useCallback(async (uuid) => {
        if (!uuid) return;
        try {
            const res  = await fetch(`${API}/courses/enrolled/${uuid}`);
            const data = await res.json();
            setEnrolledIds(new Set((data.mData || []).map(c => c.courseId)));
        } catch (e) { console.error('loadEnrolled:', e); }
    }, []);

    useEffect(() => { loadCourses(); }, [loadCourses]);
    useEffect(() => { if (currentUserId) loadEnrolled(currentUserId); }, [currentUserId, loadEnrolled]);

    async function handleEnroll(courseId) {
        if (!currentUserId) { alert('Please log in to enroll.'); return; }
        setEnrolling(prev => ({ ...prev, [courseId]: true }));
        try {
            const res  = await fetch(`${API}/courses/${courseId}/enroll`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_uuid: currentUserId }),
            });
            const data = await res.json();
            if (data.mStatus === 'ok') setEnrolledIds(prev => new Set([...prev, courseId]));
            else alert('Enroll failed: ' + data.mMessage);
        } catch (e) { console.error(e); }
        finally { setEnrolling(prev => ({ ...prev, [courseId]: false })); }
    }

    async function handleUnenroll(courseId) {
        if (!window.confirm('Unenroll from this course?')) return;
        setEnrolling(prev => ({ ...prev, [courseId]: true }));
        try {
            const res  = await fetch(`${API}/courses/${courseId}/enroll`, {
                method: 'DELETE', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_uuid: currentUserId }),
            });
            const data = await res.json();
            if (data.mStatus === 'ok') {
                setEnrolledIds(prev => { const n = new Set(prev); n.delete(courseId); return n; });
            } else alert('Unenroll failed: ' + data.mMessage);
        } catch (e) { console.error(e); }
        finally { setEnrolling(prev => ({ ...prev, [courseId]: false })); }
    }

    async function courseButton(){
        console.log("hitting coures button");
        document.getElementById("addCourse").style.display="block";
    }
    async function cancelNewCourse(){
        console.log("cancel new course")
        document.getElementById("addCourse").style.display="none"
    }
    async function submitNewCourse(){
        console.log("submitting new course")
        try{
            if(!document.getElementById("title").value || !document.getElementById("description").value
            || !document.getElementById("instructor").value || !document.getElementById("times").value
            || !document.getElementById("start_date").value || !document.getElementById("level").value
            || !document.getElementById("price").value || !document.getElementById("live_url").value){
                alert("Please fill out all info")
                return
            }
            const courseBody={
                title:document.getElementById("title").value,
                description:document.getElementById("description").value,
                instructor:document.getElementById("instructor").value,
                times:document.getElementById("times").value,
                startDate:document.getElementById("start_date").value,
                level:document.getElementById("level").value,
                price:document.getElementById("price").value,
                live_url:document.getElementById("live_url").value
            }
            const response=await fetch("http://localhost:8080/courses",{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(courseBody)
            })
            const data = await response.json();
            console.log("New Course response:",data)
            if(data.mStatus!=="ok"){
                alert("Adding course failed: "+data.mMessage);
                return;
            }
            console.log("new course Id= "+data.mData)
            return
        }catch(error){
            console.log(error.message)
            return
        }
    }

    const enrolledCourses = allCourses.filter(c => enrolledIds.has(c.courseId));
    const displayList     = tab === 'enrolled' ? enrolledCourses : allCourses;

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
                    <div style={{ maxWidth: '820px', margin: '0 auto' }}>

                        <div style={{ display: 'flex', alignItems: 'center',
                                      justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#111' }}>Courses</h1>

                            <button onClick = {courseButton}>Create Course</button>
                            <div id="addCourse" style={{display: 'none'}}>
                                <h3 style={{ marginTop: 0 }}>Add a New Course</h3>

                                <label style={{ marginTop: 0 }}>*Course Title</label>
                                <input type="text" id="title" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />

                                <label style={{ marginTop: 0 }}>*Course Description</label>
                                <textarea id="description" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', minHeight: '80px', boxSizing: 'border-box' }}></textarea>

                                <label style={{ marginTop: 0 }}>*Instructor</label>
                                <input type="text" id="instructor" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />

                                <label style={{ marginTop: 0 }}>*Times</label>
                                <input type="text" id="times" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />

                                <label style={{ marginTop: 0 }}>*Start Date</label>
                                <input type="text" id="start_date" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />

                                <label style={{ marginTop: 0 }}>*Level</label>
                                <select defaultValue="Beginner" id="level" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }}>
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </select>

                                <label style={{ marginTop: 0 }}>*Price</label>
                                <select defaultValue="Free" id="price" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }}>
                                    <option>Free</option>
                                    <option>Priced</option>
                                </select>

                                <label style={{ marginTop: 0 }}>*Link to Meeting</label>
                                <input type="text" id="live_url" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px', width: '100%', boxSizing: 'border-box' }} />

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={submitNewCourse}>Send</button>
                                    <button variant="secondary" onClick={cancelNewCourse}>Cancel</button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', backgroundColor: '#e0e0e0',
                                          borderRadius: '999px', padding: '4px', gap: '2px' }}>
                                {['enrolled', 'all'].map(t => (
                                    <button key={t} onClick={() => setTab(t)} style={{
                                        padding: '7px 18px', borderRadius: '999px', border: 'none',
                                        cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                                        backgroundColor: tab === t ? '#3b3b3b' : 'transparent',
                                        color: tab === t ? '#fff' : '#666', transition: 'all 0.18s',
                                    }}>
                                        {t === 'enrolled' ? `Enrolled (${enrolledCourses.length})` : 'All Courses'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {displayList.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#999', marginTop: '60px', fontSize: '15px' }}>
                                {tab === 'enrolled'
                                    ? 'You\'re not enrolled in any courses yet. Switch to "All Courses" to browse.'
                                    : 'No courses available yet.'}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                {displayList.map(course => (
                                    <CourseCard
                                        key={course.courseId}
                                        course={course}
                                        enrolled={enrolledIds.has(course.courseId)}
                                        onEnroll={handleEnroll}
                                        onUnenroll={handleUnenroll}
                                        enrolling={!!enrolling[course.courseId]}
                                        onClick={() => navigate(`/courses/${course.courseId}`)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Courses;