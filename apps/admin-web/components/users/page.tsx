'use client';

import React, { useEffect, useState } from 'react';
import { AddUserModal } from './addusermodal';
import { EditUserModal } from './EditUserModal';
import { getUsers } from '../../services/users.services';
import { User } from '../../types/user';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Users</h1>
          <p style={subtitleStyle}>Manage users and assign platform roles.</p>
        </div>

        <button style={addButtonStyle} onClick={() => setIsAddUserOpen(true)}>
          Add User
        </button>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>First Name</th>
                <th style={thStyle}>Last Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created At</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={tdStyle}>{user.firstName}</td>
                  <td style={tdStyle}>{user.lastName}</td>
                  <td style={tdStyle}>{user.email}</td>
                  <td style={tdStyle}>{user.role?.name || '-'}</td>
                  <td style={tdStyle}>{user.status || '-'}</td>
                  <td style={tdStyle}>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : '-'}
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={editButtonStyle}
                      onClick={() => setEditingUser(user)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSuccess={fetchUsers}
      />

      <EditUserModal
        isOpen={editingUser !== null}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
};

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#666',
};

const editButtonStyle: React.CSSProperties = {
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

const addButtonStyle: React.CSSProperties = {
  background: '#E8621A',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 600,
};

const tableWrapperStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  overflowX: 'auto',
  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '14px 16px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f9fafb',
  fontSize: 14,
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 14,
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  marginBottom: 16,
};