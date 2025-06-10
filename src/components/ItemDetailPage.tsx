import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Tag, ArrowLeft, Loader2, CheckCircle, AlertCircle, Trash2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Item } from '../types/database';
import { Navbar } from './Navbar';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showClaimedModal, setShowClaimedModal] = useState(false);
  const [showUnclaimedModal, setShowUnclaimedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        let query = supabase
          .from('items')
          .select('*')
          .eq('id', id);

        // Hide items older than 45 days for non-admin users
        if (!user) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 45);
          query = query.gte('created_at', cutoff.toISOString());
        }

        const { data, error } = await query.single();

        if (error) throw error;
        setItem(data);
      } catch (err) {
        console.error('Error fetching item:', err);
        setError('Failed to load item details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Extract location from description or use the location field
  const getLocationInfo = (item: Item): string => {
    if (item.location) {
      return item.location;
    }
    
    // Try to extract location from description
    const locationMatch = item.description?.match(/Found at: (.*?)($|\.)/i);
    if (locationMatch && locationMatch[1]) {
      return locationMatch[1].trim();
    }
    
    return 'AES Campus';
  };

  const handleMarkAsUnclaimed = async () => {
    if (!id || !user) return;
    
    try {
      setActionLoading(true);
      
      // Delete associated claims
      const { error: claimsError } = await supabase
        .from('claims')
        .delete()
        .eq('item_id', id);
        
      if (claimsError) throw claimsError;
      
      // Update item status
      const { error } = await supabase
        .from('items')
        .update({ is_claimed: false })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      if (item) {
        setItem({
          ...item,
          is_claimed: false
        });
      }
      
      // Show success modal
      setShowUnclaimedModal(true);
      
    } catch (err) {
      console.error('Error marking item as unclaimed:', err);
      setError('Failed to mark item as unclaimed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsClaimed = async () => {
    if (!id || !user) return;
    
    try {
      setActionLoading(true);
      
      const { error } = await supabase
        .from('items')
        .update({ is_claimed: true })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local state
      if (item) {
        setItem({
          ...item,
          is_claimed: true
        });
      }
      
      // Show success modal
      setShowClaimedModal(true);
      
    } catch (err) {
      console.error('Error marking item as claimed:', err);
      setError('Failed to mark item as claimed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Optimized deletion function with UI-first approach
  const handleDeleteItem = async () => {
    if (!id || !user) return;
    
    try {
      setActionLoading(true);
      setShowDeleteModal(false);
      
      // Navigate to home page first for better UX
      // This ensures the user doesn't see an error if deletion happens successfully
      navigate('/');
      
      // Now perform the deletion operations in the background
      
      // 1. Delete the image from storage if it exists
      if (item && item.image_url) {
        const fileName = item.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('item-images')
            .remove([fileName])
            .then(({ error }) => {
              if (error) console.error('Error deleting image from storage:', error);
            })
            .catch(err => console.error('Error in storage deletion:', err));
        }
      }
      
      // 2. Attempt to use the RPC function if it exists
      await supabase.rpc('delete_item_rpc', { item_id: id })
        .then(({ error }) => {
          if (error) {
            console.error('RPC deletion failed, falling back to manual deletion:', error);
            return false;
          }
          return true;
        })
        .then(async (success) => {
          // 3. Fall back to manual deletion if RPC failed
          if (!success) {
            // Delete claims first
            await supabase
              .from('claims')
              .delete()
              .eq('item_id', id)
              .then(({ error }) => {
                if (error) console.error('Error deleting claims:', error);
              });
            
            // Then delete the item
            await supabase
              .from('items')
              .delete()
              .eq('id', id)
              .then(({ error }) => {
                if (error) console.error('Error deleting item manually:', error);
              });
          }
        });
      
    } catch (err) {
      console.error('Error during deletion process:', err);
      // We don't need to set error state since we've already navigated away
    }
  };

  const ClaimedSuccessModal = () => {
    if (!showClaimedModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center text-green-500 mb-4">
            <CheckCircle className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-medium">Item Marked as Claimed</h3>
          </div>
          <p className="text-gray-600 mb-4">
            This item has been marked as claimed and will now appear as claimed in the listing.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowClaimedModal(false);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UnclaimedSuccessModal = () => {
    if (!showUnclaimedModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center text-blue-500 mb-4">
            <Lock className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-medium">Item Marked as Unclaimed</h3>
          </div>
          <p className="text-gray-600 mb-4">
            This item has been marked as unclaimed and is now available for others to claim.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowUnclaimedModal(false);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-yellow-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h2>
              <p className="text-gray-600 mb-6">{error || "We couldn't find the item you're looking for."}</p>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <ClaimedSuccessModal />
      <UnclaimedSuccessModal />
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteItem}
        itemName={item.name}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to all items
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {item.is_claimed && (
            <div className="bg-green-100 text-green-800 px-4 py-2 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">This item has been claimed</span>
            </div>
          )}
          <div className="md:flex flex-col md:flex-row">
            <div className="md:w-1/2">
              <div className="h-72 md:h-full overflow-hidden bg-gray-100">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div className="md:w-1/2 p-4 md:p-6">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{item.name}</h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag, index) => (
                  <span key={index} className="inline-block px-2 py-1 text-sm font-semibold text-yellow-700 bg-yellow-100 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Description</h2>
                  <p className="text-gray-700">{item.description}</p>
                </div>
                
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Date Found</h3>
                    <p className="text-gray-600">{new Date(item.created_at).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Location Found</h3>
                    <p className="text-gray-600">{getLocationInfo(item)}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Tag className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Item ID</h3>
                    <p className="text-gray-600">{item.id}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                {!item.is_claimed && (
                  <button
                    onClick={() => navigate(`/items/${item.id}/claim`)}
                    className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-md transition-colors"
                  >
                    Claim This Item
                  </button>
                )}

                {/* Admin controls */}
                {user && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Admin Controls</h3>
                    <div className="flex flex-col space-y-2">
                      {item.is_claimed ? (
                        <button
                          onClick={handleMarkAsUnclaimed}
                          disabled={actionLoading}
                          className="flex items-center justify-center py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? (
                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          ) : (
                            <Lock className="h-5 w-5 mr-2" />
                          )}
                          Mark as Unclaimed
                        </button>
                      ) : (
                        <button
                          onClick={handleMarkAsClaimed}
                          disabled={actionLoading}
                          className="flex items-center justify-center py-2 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? (
                            <Loader2 className="animate-spin h-5 w-5 mr-2" />
                          ) : (
                            <CheckCircle className="h-5 w-5 mr-2" />
                          )}
                          Mark as Claimed
                        </button>
                      )}
                      
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        disabled={actionLoading}
                        className="flex items-center justify-center py-2 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading ? (
                          <Loader2 className="animate-spin h-5 w-5 mr-2" />
                        ) : (
                          <Trash2 className="h-5 w-5 mr-2" />
                        )}
                        Delete Item
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}