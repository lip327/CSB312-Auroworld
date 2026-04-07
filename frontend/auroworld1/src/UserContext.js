import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rduempiojxizkwwbzaml.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdWVtcGlvanhpemt3d2J6YW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjA5NjIsImV4cCI6MjA4NTYzNjk2Mn0.owcc0cRZ1EhLvY7nIpqHN5tPWG81LgMLaH9dOyc6Ymo'
);

const UserContext = createContext();

export function UserProvider({ children }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');

      const { data: userData } = await supabase
        .from('users')
        .select('firstname, lastname, username')
        .eq('email', user.email)
        .single();

      if (userData) {
        const name = userData.firstname
          ? userData.firstname + (userData.lastname ? ' ' + userData.lastname : '')
          : userData.username || '';
        setDisplayName(name || user.email || '');
      } else {
        setDisplayName(user.email || '');
      }
    }
    loadUser();
  }, []);

  return (
    <UserContext.Provider value={{ displayName, setDisplayName, email, setEmail }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}