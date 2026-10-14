'use client';

import { createContext, useContext } from 'react';

// Create context
const UserContext = createContext(null);

// Provider component
export function UserProvider({ user, children }) {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    );
}

// Hook to use the user context
export function useUser() {
    const context = useContext(UserContext);

    if (context === undefined) {
        throw new Error('useUser must be used within UserProvider');
    }

    return context;
}

// Optional: Hook with loading state
export function useUserWithLoading() {
    const user = useContext(UserContext);

    return {
        user,
        isLoading: user === null,
        isAuthenticated: user !== null
    };
}