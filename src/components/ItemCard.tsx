import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Trash2, Loader2 } from 'lucide-react';
import type { Item } from '../types/database';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCardClick = () => {
    if (user || !item.is_claimed) {
      navigate(`/items/${item.id}`);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    try {
      setDeleting(true);
      setShowDeleteModal(false);
      
      // Delete image from storage if it exists
      if (item.image_url) {
        const fileName = item.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('item-images')
            .remove([fileName]);
        }
      }
      
      // Try RPC function first
      const { error: rpcError } = await supabase.rpc('delete_item_rpc', { item_id: item.id });
      
      if (rpcError) {
        // Fall back to manual deletion
        await supabase
          .from('claims')
          .delete()
          .eq('item_id', item.id);
          
        await supabase
          .from('items')
          .delete()
          .eq('id', item.id);
      }
      
      // Refresh the page to update the list
      window.location.reload();
      
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <>
      <DeleteConfirmationModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={item.name}
      />
      
      <div 
        className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] ${
          item.is_claimed && !user ? 'opacity-75 cursor-default' : 'cursor-pointer'
        } relative`}
        onClick={handleCardClick}
      >
        
        <div className="relative h-48 overflow-hidden">
          <img 
            src={item.image_url} 
            alt={item.name}
            className="w-full h-full object-contain"
          />
          {item.is_claimed && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white text-xl font-bold tracking-wider uppercase">Claimed</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex-wrap gap-2 mb-2">
            {item.tags.map((tag, index) => (
              <span key={index} className="inline-block px-2 py-1 text-sm font-semibold text-yellow-700 bg-yellow-100 rounded-full mr-2 mb-1">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.name}</h3>
          {item.location && (
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1 text-yellow-500" />
                <span>{item.location}</span>
              </div>
              {user && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              )}
            </div>
          )}
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.description}</p>
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-xs">
              Found on {new Date(item.created_at).toLocaleDateString()}
            </p>
            {!item.is_claimed ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/items/${item.id}/claim`);
                }}
                className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full hover:bg-yellow-200 transition-colors"
              >
                Claim
              </button>
            ) : user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/items/${item.id}`);
                }}
                className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
              >
                Manage
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}