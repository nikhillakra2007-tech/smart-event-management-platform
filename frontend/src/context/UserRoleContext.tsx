import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, ParticipantProfile } from '../types/api';
import { api } from '../api/client';

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  currentProfile: ParticipantProfile | null;
  users: User[];
  loading: boolean;
  getUsersByRole: (role: UserRole) => User[];
  refreshUsers: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('organizer');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [currentProfile, setCurrentProfile] = useState<ParticipantProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);

      // Select default user based on initial role
      const initialUsersForRole = data.filter((u) => u.role === 'organizer');
      if (initialUsersForRole.length > 0) {
        setCurrentUserState(initialUsersForRole[0]);
      } else if (data.length > 0) {
        setCurrentUserState(data[0]);
      }
    } catch (err) {
      console.error('Failed to load users for demo role context', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // When role changes, auto-select a suitable demo user for that role
  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    const usersForRole = users.filter((u) => u.role === newRole);
    if (usersForRole.length > 0) {
      setCurrentUserState(usersForRole[0]);
    }
  };

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    if (user.role !== role) {
      setRoleState(user.role);
    }
  };

  // Load participant profile if active user is a participant
  useEffect(() => {
    if (currentUser && currentUser.role === 'participant') {
      api.getUserProfile(currentUser.id)
        .then(setCurrentProfile)
        .catch(() => setCurrentProfile(null));
    } else {
      setCurrentProfile(null);
    }
  }, [currentUser]);

  const getUsersByRole = (r: UserRole) => users.filter((u) => u.role === r);

  return (
    <UserRoleContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser,
        currentProfile,
        users,
        loading,
        getUsersByRole,
        refreshUsers: fetchUsers,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
};

export const useUserRole = (): UserRoleContextType => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};
