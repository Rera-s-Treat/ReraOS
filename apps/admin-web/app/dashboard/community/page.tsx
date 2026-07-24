'use client';

import React, { useEffect, useState } from 'react';

import { getCommunityMembers } from '@/services/community.services';
import { CommunityMember } from '@/types/community';

const TOWN_LABEL: Record<string, string> = {
  OGIJO: 'Ogijo',
  ITAOLUWO: 'Itaoluwo',
  SHIMAWA: 'Shimawa',
  ODONGUYAN: 'Odonguyan',
  LUKOSI: 'Lukosi',
};

const MENU_INTEREST_LABEL: Record<string, string> = {
  SMALL_CHOPS: 'Small chops',
  FINGER_FOODS: 'Finger foods',
  PASTA: 'Pasta',
  DRINKS: 'Drinks',
};

export default function CommunityPage() {
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await getCommunityMembers();
      setMembers(data);
    } catch (err) {
      setError('Failed to load community members');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Community</h1>
          <p style={subtitleStyle}>
            Everyone who signed up on the website to join the Rera&apos;s Treat community.
          </p>
        </div>
      </div>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <p style={{ padding: 16 }}>Loading community members...</p>
        ) : members.length === 0 ? (
          <p style={{ padding: 16 }}>No one has joined the community yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Contact</th>
                <th style={thStyle}>Town</th>
                <th style={thStyle}>Most Excited For</th>
                <th style={thStyle}>Welcome Message</th>
                <th style={thStyle}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td style={tdStyle}>{member.name}</td>
                  <td style={tdStyle}>{member.phone || member.email}</td>
                  <td style={tdStyle}>{TOWN_LABEL[member.town] ?? member.town}</td>
                  <td style={tdStyle}>
                    {member.menuInterest
                      ? MENU_INTEREST_LABEL[member.menuInterest] ?? member.menuInterest
                      : '—'}
                  </td>
                  <td style={tdStyle}>
                    {member.welcomeSendError ? (
                      <span style={{ color: '#b42318' }}>Failed</span>
                    ) : member.welcomeSentAt ? (
                      <span style={{ color: '#027a48' }}>Sent</span>
                    ) : (
                      <span style={{ color: '#999' }}>Pending</span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
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
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
};

const subtitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#666',
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
  whiteSpace: 'nowrap',
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
