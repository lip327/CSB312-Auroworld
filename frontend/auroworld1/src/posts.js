import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from '@supabase/supabase-js';
import Button from './components/Button';
import Card from './components/Card';

const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL      || 'https://rduempiojxizkwwbzaml.supabase.co',
    process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo'
);

const API = 'https://auroworld.onrender.com';

// Inject spinner keyframe once
if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
}

function Spinner() {
    return (
        <span style={{
            display: 'inline-block', width: '12px', height: '12px',
            border: '2px solid currentColor', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.6s linear infinite',
            marginRight: '6px', verticalAlign: 'middle',
        }} />
    );
}

// Styled file picker — hides the ugly default input
function FilePicker({ onFile, file }) {
    const ref = useRef();
    return (
        <div style={{ marginBottom: '10px' }}>
            <input
                ref={ref}
                type="file"
                accept="image/*"
                onChange={e => onFile(e.target.files[0] || null)}
                style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                    type="button"
                    onClick={() => ref.current.click()}
                    style={{
                        padding: '7px 16px', borderRadius: '999px', border: '1.5px solid #3b3b3b',
                        background: 'transparent', color: '#3b3b3b', fontSize: '13px',
                        fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                >
                    📎 {file ? 'Change Image' : 'Attach Image'}
                </button>
                {file && (
                    <span style={{ fontSize: '13px', color: '#555', maxWidth: '200px',
                                   overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                    </span>
                )}
            </div>
        </div>
    );
}

function Posts() {
    const navigate = useNavigate();

    const getCurrentUserId = useCallback(async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) { console.error('getUser:', error.message); return null; }
        return user ? user.id : null;
    }, []);

    // ── nav ───────────────────────────────────────────────────────────────────
    function mainpageButton() { navigate('/posts'); }
    function coursesButton()  { navigate('/courses'); }
    async function signoutButton() {
        const { error } = await supabase.auth.signOut();
        if (!error) navigate('/login');
    }

    // ── state ─────────────────────────────────────────────────────────────────
    const [posts,          setPosts]          = useState([]);
    const [commentsByPost, setCommentsByPost] = useState({});
    const [imageUrls,      setImageUrls]      = useState({});
    const [currentUserId,  setCurrentUserId]  = useState(null);
    const [fileUpload,     setFileUpload]      = useState(null);
    const [previewUrl,     setPreviewUrl]      = useState(null);

    const [loading,  setLoading]  = useState({});
    const setLoad   = (key, val) => setLoading(prev => ({ ...prev, [key]: val }));
    const isLoading = (key) => !!loading[key];

    const [showAddPost,    setShowAddPost]    = useState(false);
    const [showEditPost,   setShowEditPost]   = useState({});
    const [showAddComment, setShowAddComment] = useState({});

    const [newTitle,      setNewTitle]      = useState('');
    const [newPost,       setNewPost]       = useState('');
    const [editInputs,    setEditInputs]    = useState({});
    const [commentInputs, setCommentInputs] = useState({});

    // ── data loading ──────────────────────────────────────────────────────────
    const loadPosts = useCallback(async () => {
        try {
            const res  = await fetch(`${API}/messages`);
            const data = await res.json();
            const msgs = data.mData || [];
            setPosts(msgs);

            await Promise.all(msgs.map(async (post) => {
                // comments
                try {
                    const cRes  = await fetch(`${API}/messages/${post.msgId}/comments`);
                    const cData = await cRes.json();
                    setCommentsByPost(prev => ({ ...prev, [post.msgId]: cData.mData || [] }));
                } catch (e) { console.error('comments fetch error:', e); }

                // FIX: use filepath ("posts/40/img.png") not just filename ("img.png")
                // The file is stored at posts/{msgId}/{filename} in Supabase storage
                try {
                    const fRes  = await fetch(`${API}/messages/${post.msgId}/files`);
                    const fData = await fRes.json();
                    if (fData.mData && fData.mData.length > 0) {
                        const filepath = fData.mData[0].filepath;
                        const { data: urlData } = supabase.storage
                            .from('community_feed_file_upload')
                            .getPublicUrl(filepath);
                        setImageUrls(prev => ({ ...prev, [post.msgId]: urlData.publicUrl }));
                    }
                } catch (e) { console.error('files fetch error:', e); }
            }));
        } catch (e) {
            console.error('loadPosts error:', e);
        }
    }, []);

    useEffect(() => {
        async function init() {
            const id = await getCurrentUserId();
            setCurrentUserId(id);
            await loadPosts();
        }
        init();
    }, [getCurrentUserId, loadPosts]);

    // ── file picker ───────────────────────────────────────────────────────────
    function handleFileChange(file) {
        setFileUpload(file);
        setPreviewUrl(file ? URL.createObjectURL(file) : null);
    }

    // ── add post ──────────────────────────────────────────────────────────────
    async function addPostButton() {
        if (isLoading('addPost')) return;
        setLoad('addPost', true);
        try {
            const uuid = await getCurrentUserId();
            const res  = await fetch(`${API}/messages`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ subject: newTitle, message: newPost, user_uuid: uuid }),
            });
            const data = await res.json();
            if (data.mStatus !== 'ok') { alert('Post failed: ' + data.mMessage); return; }

            if (fileUpload) {
                const msgId    = data.mData.msgId;
                const filepath = `posts/${msgId}/${fileUpload.name}`;
                // FIX: upload to the correct path that matches what DB stores
                await supabase.storage
                    .from('community_feed_file_upload')
                    .upload(filepath, fileUpload);
                await fetch(`${API}/files`, {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ filename: fileUpload.name, msgId, user_uuid: uuid }),
                });
            }

            setNewTitle(''); setNewPost('');
            setFileUpload(null); setPreviewUrl(null);
            setShowAddPost(false);
            await loadPosts();
        } catch (e) {
            console.error(e);
        } finally {
            setLoad('addPost', false);
        }
    }

    // ── delete post ───────────────────────────────────────────────────────────
    async function deletePostButton(msgId) {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        const key = `delete-post-${msgId}`;
        if (isLoading(key)) return;
        setLoad(key, true);
        try {
            const res  = await fetch(`${API}/messages/${msgId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.mStatus !== 'ok') { alert('Delete failed: ' + data.mMessage); return; }
            await loadPosts();
        } catch (e) {
            console.error(e);
        } finally {
            setLoad(key, false);
        }
    }

    // ── edit post ─────────────────────────────────────────────────────────────
    function openEditPost(post) {
        setEditInputs(prev => ({ ...prev, [post.msgId]: { subject: post.subject, message: post.message } }));
        setShowEditPost(prev => ({ ...prev, [post.msgId]: true }));
    }

    async function sendEditPostButton(msgId) {
        const key = `edit-${msgId}`;
        if (isLoading(key)) return;
        setLoad(key, true);
        try {
            const inputs = editInputs[msgId] || {};
            const res  = await fetch(`${API}/messages/${msgId}`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ subject: inputs.subject, message: inputs.message }),
            });
            const data = await res.json();
            if (data.mStatus !== 'ok') { alert('Edit failed: ' + data.mMessage); return; }
            setShowEditPost(prev => ({ ...prev, [msgId]: false }));
            await loadPosts();
        } catch (e) {
            console.error(e);
        } finally {
            setLoad(key, false);
        }
    }

    // ── add comment ───────────────────────────────────────────────────────────
    async function addCommentButton(msgId) {
        const key = `comment-${msgId}`;
        if (isLoading(key)) return;
        setLoad(key, true);
        try {
            const uuid    = await getCurrentUserId();
            const comment = commentInputs[msgId] || '';
            const res  = await fetch(`${API}/comments/${msgId}`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ user_uuid: uuid, comment }),
            });
            const data = await res.json();
            if (data.mStatus !== 'ok') { alert('Comment failed: ' + data.mMessage); return; }
            setCommentInputs(prev => ({ ...prev, [msgId]: '' }));
            setShowAddComment(prev => ({ ...prev, [msgId]: false }));
            await loadPosts();
        } catch (e) {
            console.error(e);
        } finally {
            setLoad(key, false);
        }
    }

    // ── delete comment ────────────────────────────────────────────────────────
    async function deleteCommentButton(commentId) {
        if (!window.confirm('Delete this comment?')) return;
        const key = `delete-comment-${commentId}`;
        if (isLoading(key)) return;
        setLoad(key, true);
        try {
            const res  = await fetch(`${API}/comments/${commentId}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.mStatus !== 'ok') { alert('Delete failed: ' + data.mMessage); return; }
            await loadPosts();
        } catch (e) {
            console.error(e);
        } finally {
            setLoad(key, false);
        }
    }

    // ── upvoting ──────────────────────────────────────────────────────────────
    async function upvotePostButton(msgId) {
        const key = `upvote-post-${msgId}`;
        if (isLoading(key)) return;
        setLoad(key, true);
        try {
            const uuid = await getCurrentUserId();
            await fetch(`${API}/messages/${msgId}/upvote`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ user_uuid: uuid }),
            });
            await loadPosts();
        } catch (e) {
            console.error(e);
        } finally {
            setLoad(key, false);
        }
    }

    async function upvoteCommentButton(commentId) {
        const key = `upvote-comment-${commentId}`;
        if (isLoading(key)) return;
        setLoad(key, true);
        try {
            const uuid = await getCurrentUserId();
            await fetch(`${API}/comments/${commentId}/upvote`, {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ user_uuid: uuid }),
            });
            await loadPosts();
        } catch (e) {
            console.error(e);
        } finally {
            setLoad(key, false);
        }
    }

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div id="homepage" style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>

            {/* Nav */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <Button onClick={mainpageButton}>Mainpage</Button>
                <Button onClick={coursesButton}>Courses</Button>
                <Button variant="secondary" onClick={signoutButton}>Sign Out</Button>
                <Button onClick={() => setShowAddPost(v => !v)}>
                    {showAddPost ? 'Cancel' : 'Post'}
                </Button>
            </div>

            {/* New post form */}
            {showAddPost && (
                <Card style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0 }}>Add a New Entry</h3>
                    <FilePicker file={fileUpload} onFile={handleFileChange} />
                    {previewUrl && (
                        <img src={previewUrl} alt="Preview"
                             style={{ width: '120px', height: '120px', objectFit: 'cover',
                                      borderRadius: '8px', display: 'block', marginBottom: '10px' }} />
                    )}
                    <input
                        type="text" placeholder="Title" value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        style={{ width: '100%', marginBottom: '10px', padding: '10px',
                                 borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    />
                    <textarea
                        placeholder="What's on your mind?" value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                        style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px',
                                 border: '1px solid #ccc', marginBottom: '10px', boxSizing: 'border-box' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button onClick={addPostButton} disabled={isLoading('addPost')}>
                            {isLoading('addPost') && <Spinner />} Send
                        </Button>
                        <Button variant="secondary" onClick={() => setShowAddPost(false)}>Cancel</Button>
                    </div>
                </Card>
            )}

            {/* Post list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {posts.map((post) => (
                    <Card key={post.msgId}>
                        {imageUrls[post.msgId] && (
                            <img src={imageUrls[post.msgId]} alt="Post"
                                 style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
                        )}

                        <h2 style={{ marginTop: 0 }}>{post.subject}</h2>
                        <label style={{ display: 'block', marginBottom: '10px' }}>{post.message}</label>
                        <p style={{ fontSize: '14px', color: '#555', margin: '0 0 6px' }}>
                            Posted by <strong>{post.username || 'Anonymous'}</strong>
                        </p>
                        <p style={{ margin: '0 0 12px' }}><b>{post.upvote} Upvotes</b></p>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <Button variant="secondary"
                                    disabled={isLoading(`upvote-post-${post.msgId}`)}
                                    onClick={() => upvotePostButton(post.msgId)}>
                                {isLoading(`upvote-post-${post.msgId}`) && <Spinner />} ⬆️ Upvote
                            </Button>
                            <Button variant="secondary"
                                    onClick={() => setShowAddComment(prev => ({ ...prev, [post.msgId]: true }))}>
                                Comment
                            </Button>
                            {currentUserId === post.uuid && (
                                <>
                                    <Button variant="secondary" onClick={() => openEditPost(post)}>
                                        Edit
                                    </Button>
                                    <Button variant="secondary"
                                            disabled={isLoading(`delete-post-${post.msgId}`)}
                                            onClick={() => deletePostButton(post.msgId)}
                                            style={{ color: '#c0392b' }}>
                                        {isLoading(`delete-post-${post.msgId}`) && <Spinner />} 🗑 Delete
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Edit form */}
                        {showEditPost[post.msgId] && (
                            <Card variant="dark" style={{ marginTop: '15px' }}>
                                <h3 style={{ marginTop: 0 }}>Edit Entry</h3>
                                <input type="text"
                                       value={editInputs[post.msgId]?.subject || ''}
                                       onChange={e => setEditInputs(prev => ({
                                           ...prev, [post.msgId]: { ...prev[post.msgId], subject: e.target.value }
                                       }))}
                                       style={{ width: '100%', padding: '8px', borderRadius: '4px',
                                                border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                <textarea
                                    value={editInputs[post.msgId]?.message || ''}
                                    onChange={e => setEditInputs(prev => ({
                                        ...prev, [post.msgId]: { ...prev[post.msgId], message: e.target.value }
                                    }))}
                                    style={{ width: '100%', marginTop: '10px', minHeight: '60px', padding: '8px',
                                             borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                    <Button disabled={isLoading(`edit-${post.msgId}`)}
                                            onClick={() => sendEditPostButton(post.msgId)}>
                                        {isLoading(`edit-${post.msgId}`) && <Spinner />} Save
                                    </Button>
                                    <Button variant="secondary"
                                            onClick={() => setShowEditPost(prev => ({ ...prev, [post.msgId]: false }))}>
                                        Cancel
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Add comment form */}
                        {showAddComment[post.msgId] && (
                            <Card variant="dark" style={{ marginTop: '15px' }}>
                                <textarea
                                    placeholder="Write a comment..."
                                    value={commentInputs[post.msgId] || ''}
                                    onChange={e => setCommentInputs(prev => ({ ...prev, [post.msgId]: e.target.value }))}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px',
                                             border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                                    <Button disabled={isLoading(`comment-${post.msgId}`)}
                                            onClick={() => addCommentButton(post.msgId)}>
                                        {isLoading(`comment-${post.msgId}`) && <Spinner />} Send
                                    </Button>
                                    <Button variant="secondary"
                                            onClick={() => setShowAddComment(prev => ({ ...prev, [post.msgId]: false }))}>
                                        Cancel
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Comments */}
                        {commentsByPost[post.msgId]?.length > 0 && (
                            <div style={{ marginTop: '15px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                                {commentsByPost[post.msgId].map((comment) => (
                                    <div key={comment.commentId}
                                         style={{ backgroundColor: '#f9f9f9', padding: '10px',
                                                  borderRadius: '8px', marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>
                                            {comment.comment}
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                            <small>Upvotes: {comment.upvote}</small>
                                            <Button variant="secondary"
                                                    disabled={isLoading(`upvote-comment-${comment.commentId}`)}
                                                    onClick={() => upvoteCommentButton(comment.commentId)}>
                                                {isLoading(`upvote-comment-${comment.commentId}`) && <Spinner />} ⬆️
                                            </Button>
                                            {currentUserId === comment.uuid && (
                                                <Button variant="secondary"
                                                        disabled={isLoading(`delete-comment-${comment.commentId}`)}
                                                        onClick={() => deleteCommentButton(comment.commentId)}
                                                        style={{ color: '#c0392b', fontSize: '12px' }}>
                                                    {isLoading(`delete-comment-${comment.commentId}`) && <Spinner />} 🗑
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default Posts;
