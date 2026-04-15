import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { isExpiredItem } from '../lib/items';
import { Navbar } from './Navbar';
import type { Claim, Item } from '../types/database';

type ClaimRecord = Claim & {
  items: Pick<Item, 'id' | 'name'> | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [claimsError, setClaimsError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        setLoadingClaims(true);
        setClaimsError(null);

        const { data, error } = await supabase
          .from('claims')
          .select(`
            id,
            item_id,
            claimant_type,
            first_name,
            last_name,
            child_name,
            child_grade,
            division,
            created_at,
            items:items!claims_item_id_fkey (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setClaims((data || []) as ClaimRecord[]);
      } catch (error: unknown) {
        console.error('Error fetching claims:', getErrorMessage(error));
        setClaimsError('Failed to load claim records.');
      } finally {
        setLoadingClaims(false);
      }
    };

    void fetchClaims();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        setItemsError(null);

        let query = supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(searchQuery ? 100 : 30);

        if (searchQuery.trim()) {
          const escapedQuery = searchQuery.trim().replace(/,/g, '\\,');
          query = query.or(
            `id.ilike.%${escapedQuery}%,name.ilike.%${escapedQuery}%,description.ilike.%${escapedQuery}%`
          );
        }

        const { data, error } = await query;

        if (error) throw error;
        setItems(data || []);
      } catch (error: unknown) {
        console.error('Error fetching admin items:', getErrorMessage(error));
        setItemsError('Failed to load item records.');
      } finally {
        setLoadingItems(false);
      }
    };

    void fetchItems();
  }, [searchQuery]);

  const claimRows = useMemo(() => {
    return claims.map((claim) => {
      const claimantName = [claim.first_name, claim.last_name].filter(Boolean).join(' ');
      const details =
        claim.claimant_type === 'Parent' && claim.child_name
          ? `${claimantName} for ${claim.child_name}`
          : claimantName;

      return {
        ...claim,
        claimantLabel: details || 'Unknown claimant'
      };
    });
  }, [claims]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Claims are recorded here, and items older than 60 days remain searchable only on the admin side.
              </p>
            </div>
          </div>

          {claimsError ? (
            <p className="text-sm text-red-600">{claimsError}</p>
          ) : loadingClaims ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Claimant</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Claimed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {claimRows.length > 0 ? (
                    claimRows.map((claim) => (
                      <tr key={claim.id}>
                        <td className="px-4 py-3 text-gray-900">{claim.claimantLabel}</td>
                        <td className="px-4 py-3 text-gray-600">{claim.claimant_type}</td>
                        <td className="px-4 py-3">
                          {claim.items ? (
                            <button
                              onClick={() => navigate(`/items/${claim.items?.id}`)}
                              className="text-yellow-700 hover:text-yellow-800 hover:underline"
                            >
                              {claim.items.name}
                            </button>
                          ) : (
                            <span className="text-gray-500">Deleted item</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(claim.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        No claims recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Search All Items</h2>
              <p className="text-sm text-gray-600 mt-1">
                Includes items hidden from the public site after the 60-day retention window.
              </p>
            </div>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by item name, description, or ID"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>

          {itemsError ? (
            <p className="text-sm text-red-600">{itemsError}</p>
          ) : loadingItems ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Item</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Visibility</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Found Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.length > 0 ? (
                    items.map((item) => {
                      const expired = isExpiredItem(item);

                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/items/${item.id}`)}
                              className="text-left text-yellow-700 hover:text-yellow-800 hover:underline"
                            >
                              {item.name}
                            </button>
                            <p className="text-xs text-gray-500 mt-1">{item.id}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {item.is_claimed ? 'Claimed' : 'Unclaimed'}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                expired
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {expired ? 'Admin only' : 'Public'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        No items matched the current search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
