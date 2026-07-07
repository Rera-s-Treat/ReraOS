'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCustomers } from '@/services/customers.services';
import { Customer, CustomerFilters, CustomerSegment } from '@/types/customer';

interface FilterState {
  search: string;
  segment: CustomerSegment | '';
  lastOrderFrom: string;
  lastOrderTo: string;
}

const initialFilters: FilterState = {
  search: '',
  segment: '',
  lastOrderFrom: '',
  lastOrderTo: '',
};

const segmentOptions: CustomerSegment[] = ['new', 'repeat', 'vip', 'inactive'];

function formatNaira(amount: number): string {
  return `₦${Number(amount).toLocaleString()}`;
}

function tagBadgeStyle(tag: string): React.CSSProperties {
  let background = '#f3f4f6';
  let color = '#374151';

  if (tag === 'VIP') {
    background = '#fef6e7';
    color = '#b45309';
  } else if (tag === 'NEW') {
    background = '#eff6ff';
    color = '#1d4ed8';
  } else if (tag === 'REPEAT') {
    background = '#ecfdf3';
    color = '#027a48';
  } else if (tag === 'INACTIVE') {
    background = '#fef3f2';
    color = '#b42318';
  }

  return {
    display: 'inline-block',
    padding: '3px 9px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 600,
    background,
    color,
    whiteSpace: 'nowrap',
    marginRight: 6,
    marginBottom: 4,
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const fetchCustomers = async (activeFilters: FilterState = filters) => {
    try {
      setIsLoading(true);
      setError('');

      const params: CustomerFilters = {
        search: activeFilters.search.trim() || undefined,
        segment: activeFilters.segment || undefined,
        lastOrderFrom: activeFilters.lastOrderFrom || undefined,
        lastOrderTo: activeFilters.lastOrderTo || undefined,
      };

      const data = await getCustomers(params);
      setCustomers(data);
    } catch (err) {
      setError('Failed to load customers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(filters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    fetchCustomers(initialFilters);
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Customers</h1>
          <p style={subtitleStyle}>
            See who your customers are, how often they buy, and how much they spend.
          </p>
        </div>
      </div>

      <form onSubmit={handleApplyFilters} style={filterBarStyle}>
        <input
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Search name or phone"
          style={filterInputStyle}
        />

        <select
          name="segment"
          value={filters.segment}
          onChange={handleFilterChange}
          style={filterInputStyle}
        >
          <option value="">All customers</option>
          {segmentOptions.map((segment) => (
            <option key={segment} value={segment}>
              {segment.charAt(0).toUpperCase() + segment.slice(1)}
            </option>
          ))}
        </select>

        <input
          type="date"
          name="lastOrderFrom"
          value={filters.lastOrderFrom}
          onChange={handleFilterChange}
          style={filterInputStyle}
          title="Last order from"
        />

        <input
          type="date"
          name="lastOrderTo"
          value={filters.lastOrderTo}
          onChange={handleFilterChange}
          style={filterInputStyle}
          title="Last order to"
        />

        <button type="submit" style={applyFilterBtnStyle}>
          Search
        </button>
        <button type="button" onClick={handleClearFilters} style={clearFilterBtnStyle}>
          Clear
        </button>
      </form>

      {error && <p style={errorStyle}>{error}</p>}

      <div style={tableWrapperStyle}>
        {isLoading ? (
          <p style={{ padding: 16 }}>Loading customers...</p>
        ) : customers.length === 0 ? (
          <p style={{ padding: 16 }}>No customers found.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Orders</th>
                <th style={thStyle}>Total Spend</th>
                <th style={thStyle}>Avg Order Value</th>
                <th style={thStyle}>Last Order</th>
                <th style={thStyle}>Customer Since</th>
                <th style={thStyle}>Tags</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.phone}>
                  <td style={tdStyle}>
                    {customer.displayName}
                    <div style={subTextStyle}>{customer.phone}</div>
                  </td>
                  <td style={tdStyle}>{customer.totalOrders}</td>
                  <td style={tdStyle}>{formatNaira(customer.totalSpend)}</td>
                  <td style={tdStyle}>{formatNaira(customer.averageOrderValue)}</td>
                  <td style={tdStyle}>
                    {new Date(customer.lastOrderAt).toLocaleDateString()}
                  </td>
                  <td style={tdStyle}>
                    {new Date(customer.firstOrderAt).toLocaleDateString()}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 180 }}>
                    {customer.tags.map((tag) => (
                      <span key={tag} style={tagBadgeStyle(tag)}>
                        {tag}
                      </span>
                    ))}
                  </td>
                  <td style={tdStyle}>
                    <button
                      style={viewButtonStyle}
                      onClick={() =>
                        router.push(`/dashboard/customers/${customer.phone}`)
                      }
                    >
                      View
                    </button>
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

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginBottom: 20,
  alignItems: 'center',
};

const filterInputStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  border: '1px solid #d1d5db',
  borderRadius: 8,
  outline: 'none',
};

const applyFilterBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#1C4A1C',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
};

const clearFilterBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  background: '#fff',
  color: '#1A1A1A',
  border: '1px solid #d1d5db',
  borderRadius: 8,
  cursor: 'pointer',
};

const viewButtonStyle: React.CSSProperties = {
  background: '#fff',
  color: '#E8621A',
  border: '1px solid #E8621A',
  borderRadius: 6,
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
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

const subTextStyle: React.CSSProperties = {
  color: '#666',
  fontSize: 12,
  marginTop: 2,
};

const errorStyle: React.CSSProperties = {
  color: 'red',
  marginBottom: 16,
};
