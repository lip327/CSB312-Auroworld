import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { useAccessibility } from './AccessibilityContext.js';
import { useUser } from './UserContext.js';

const supabase = createClient(
  'https://rduempiojxizkwwbzaml.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo'
);

function Profile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [username, setUsername] = useState('');

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editBirthdate, setEditBirthdate] = useState('');

  const { contrast, setContrast, textSize, setTextSize, boldText, setBoldText } = useAccessibility();
  const { setDisplayName } = useUser();

  useEffect(() => {
    async function loadProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate('/login'); return; }
        setEmail(user.email || '');

        const { data: userData } = await supabase
        .from('users')
        .select('firstname, lastname, username')
        .eq('email', user.email);

        console.log('userData:', userData);

        if (userData && userData.length > 0) {
        setFirstName(userData[0].firstname || '');
        setLastName(userData[0].lastname || '');
        setUsername(userData[0].username || '');
        setEditFirstName(userData[0].firstname || '');
        setEditLastName(userData[0].lastname || '');
        }

        const { data: profileData } = await supabase
        .from('profile_attributes')
        .select('birthday')
        .eq('email', user.email);

        console.log('profileData:', profileData);

        if (profileData && profileData.length > 0 && profileData[0].birthday) {
        setBirthdate(profileData[0].birthday);
        setEditBirthdate(profileData[0].birthday);
        }
    }
    loadProfile();
    }, [navigate]);

    async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', user.email);

    if (existingUser && existingUser.length > 0) {
        const { error } = await supabase
        .from('users')
        .update({ firstname: editFirstName, lastname: editLastName })
        .eq('email', user.email);
        console.log('update users error:', error);
    } else {
        const { error } = await supabase
        .from('users')
        .insert({ email: user.email, firstname: editFirstName, lastname: editLastName, username: username || user.email.split('@')[0], role: 'user' });
        console.log('insert users error:', error);
    }

    const { data: existingProfile } = await supabase
        .from('profile_attributes')
        .select('email')
        .eq('email', user.email);

    if (existingProfile && existingProfile.length > 0) {
        const { error } = await supabase
        .from('profile_attributes')
        .update({ birthday: editBirthdate })
        .eq('email', user.email);
        console.log('update profile error:', error);
    } else {
        const { error } = await supabase
        .from('profile_attributes')
        .insert({ email: user.email, username: username || user.email.split('@')[0], birthday: editBirthdate });
        console.log('insert profile error:', error);
    }

    setFirstName(editFirstName);
    setLastName(editLastName);
    setBirthdate(editBirthdate);

    const newName = editFirstName
        ? editFirstName + (editLastName ? ' ' + editLastName : '')
        : username || user.email || '';
    setDisplayName(newName);

    setIsEditing(false);
    }

  const fieldStyle = { borderBottom: '1px solid #e0e0e0', paddingBottom: '20px', marginBottom: '20px' };
  const labelStyle = { fontSize: '13px', color: '#888', marginBottom: '6px' };
  const valueStyle = { fontSize: '16px', fontWeight: '600', color: '#111' };
  const inputStyle = { fontSize: '15px', padding: '8px 10px', border: '1px solid #ccc', borderRadius: '6px', width: '100%', boxSizing: 'border-box' };

  const contrastOptions = [
    { key: 'readable', label: 'Aa+', sub: 'Readable' },
    { key: 'good', label: 'AaAa', sub: 'Good contrast' },
    { key: 'high', label: 'AaAaAa', sub: 'High Contrast' },
  ];

  return (
    <div style={{
      display: 'flex', height: '100vh', backgroundColor: '#f0f2f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      fontSize: '16px', color: '#111',
    }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header />

        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 60px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', margin: 0 }}>Settings</h1>
            <div style={{ display: 'flex', backgroundColor: '#e0e0e0', borderRadius: '10px', padding: '4px' }}>
              {['profile', 'accessibility'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontWeight: '600', fontSize: '14px',
                    backgroundColor: activeTab === tab ? '#444' : 'transparent',
                    color: activeTab === tab ? '#fff' : '#555',
                  }}
                >
                  {tab === 'profile' ? 'My Profile' : 'Accessibility'}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'profile' && (
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', backgroundColor: '#d9d9d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', flexShrink: 0 }}>
                    👤
                  </div>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '700' }}>{username || 'Profile Photo'}</div>
                    <div style={{ fontSize: '14px', color: '#888', marginTop: '4px' }}>{email}</div>
                  </div>
                </div>

                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '10px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>
                    ✏️ Edit
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#333', color: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Save</button>
                    <button onClick={() => { setIsEditing(false); setEditFirstName(firstName); setEditLastName(lastName); setEditBirthdate(birthdate); }} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Cancel</button>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 60px' }}>
                <div style={fieldStyle}>
                  <div style={labelStyle}>First Name</div>
                  {isEditing ? <input style={inputStyle} value={editFirstName} onChange={e => setEditFirstName(e.target.value)} /> : <div style={valueStyle}>{firstName || '—'}</div>}
                </div>
                <div style={fieldStyle}>
                  <div style={labelStyle}>Last Name</div>
                  {isEditing ? <input style={inputStyle} value={editLastName} onChange={e => setEditLastName(e.target.value)} /> : <div style={valueStyle}>{lastName || '—'}</div>}
                </div>
              </div>

              <div style={fieldStyle}>
                <div style={labelStyle}>Birthdate</div>
                {isEditing ? <input type="date" style={inputStyle} value={editBirthdate} onChange={e => setEditBirthdate(e.target.value)} /> : <div style={valueStyle}>{birthdate || '—'}</div>}
              </div>

              <div style={fieldStyle}>
                <div style={labelStyle}>Email</div>
                <div style={valueStyle}>{email || '—'}</div>
              </div>

              <div style={{ ...fieldStyle, borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                <div style={labelStyle}>Password</div>
                <div style={valueStyle}>••••••••••••</div>
              </div>

            </div>
          )}

          {activeTab === 'accessibility' && (
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '40px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>

              <div style={{ paddingBottom: '36px', borderBottom: '1px solid #e0e0e0', marginBottom: '36px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Contrast</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  {contrastOptions.map(opt => (
                    <div
                      key={opt.key}
                      onClick={() => setContrast(opt.key)}
                      style={{
                        padding: '20px 32px', borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                        backgroundColor: contrast === opt.key ? '#444' : '#e0e0e0',
                        color: contrast === opt.key ? '#fff' : '#333',
                        minWidth: '120px',
                      }}
                    >
                      <div style={{ fontSize: '22px', fontWeight: '700' }}>{opt.label}</div>
                      <div style={{ fontSize: '13px', marginTop: '6px', opacity: 0.8 }}>{opt.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ paddingBottom: '36px', borderBottom: '1px solid #e0e0e0', marginBottom: '36px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Text Size</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '13px', color: '#888' }}>Small</span>
                  <input
                    type="range" min="1" max="5" value={textSize}
                    onChange={e => setTextSize(Number(e.target.value))}
                    style={{ width: '320px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '20px', fontWeight: '700', color: '#333' }}>Big</span>
                </div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '8px' }}>Current size</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Bold Text</div>
                <div style={{ fontSize: '28px', marginBottom: '20px', letterSpacing: '2px' }}>
                  A {'>'} A
                </div>
                <div style={{ display: 'inline-flex', backgroundColor: '#e0e0e0', borderRadius: '10px', padding: '4px' }}>
                  {[true, false].map(val => (
                    <button
                      key={String(val)}
                      onClick={() => setBoldText(val)}
                      style={{
                        padding: '8px 28px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                        fontWeight: '600', fontSize: '14px',
                        backgroundColor: boldText === val ? '#444' : 'transparent',
                        color: boldText === val ? '#fff' : '#555',
                      }}
                    >
                      {val ? 'On' : 'Off'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Profile;