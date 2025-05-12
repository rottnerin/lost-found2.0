import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, Loader2, ArrowLeft, MapPin, Clock } from 'lucide-react';
// Remove the specific ClaimFormData import if it's causing issues or doesn't match
// import type { ClaimFormData, Item } from '../types/database'; 
import type { Item } from '../types/database'; // Keep Item type
import { Navbar } from './Navbar';

// Define a local interface for the form data state
interface LocalClaimFormData {
  claimantType: 'Student' | 'Staff' | 'Parent' | '';
  firstName: string;
  lastName: string;
  childName: string;
  childGrade: string;
  division: string;
  itemId: string;
  itemName: string;
}

export function ClaimForm() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  // Use the local interface for the state
  const [formData, setFormData] = useState<LocalClaimFormData>({
    claimantType: '',
    firstName: '',
    lastName: '',
    childName: '',
    childGrade: '',
    division: '', // Ensure division is initialized
    itemId: id || '',
    itemName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [itemLoading, setItemLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return;
      
      try {
        setItemLoading(true);
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setItem(data);
        // Update only relevant fields, preserving the rest of the state structure
        setFormData((prev) => ({
          ...prev, // Keep existing form data like claimantType etc.
          itemName: data.name,
          itemId: data.id
        }));
      } catch (err: any) { // Add type annotation for better error handling
        console.error('Error fetching item:', err);
        setError('Failed to load item details. Please try again.');
      } finally {
        setItemLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // **FIXED: Construct the payload based on claimantType**
      let claimData: any = {
        item_id: formData.itemId,
        claimant_type: formData.claimantType, // Include claimant type
        first_name: formData.firstName,
        last_name: formData.lastName,
        // Conditionally set fields to null if not applicable
        child_name: formData.claimantType === 'Parent' ? formData.childName : '',
        child_grade: (formData.claimantType === 'Student' || formData.claimantType === 'Parent') ? formData.childGrade : '',
        division: formData.claimantType === 'Staff' ? formData.division : '',
      };

      console.log('Submitting claim data:', claimData); // Log data being sent

      const { error: insertError } = await supabase
        .from('claims')
        .insert([claimData]) // Use the correctly constructed claimData
        .select();
         // .select() is optional here

      // After claim insert
      if (insertError) {
        console.error('Supabase insert error for CLAIMS table:', insertError);
        throw new Error(`Claims insert error: ${insertError.message || 'Database error'}`);
      }

      // Update item status
      const { error: updateError } = await supabase
        .from('items')
        .update({ is_claimed: true })
        .eq('id', formData.itemId);

      // After item update
      if (updateError) {
        // Log the error but proceed, as the claim was inserted
        console.error('Supabase update error for ITEMS table:', updateError);
        console.error(`Failed to mark item ${formData.itemId} as claimed, but claim was recorded.`);
      }

      setSuccess(true); // This line runs even if updateError exists
    } catch (err: any) { // Improved catch block
      console.error('Error submitting claim:', err);
      // Provide a more specific error message if possible
      setError(`Failed to submit claim: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Use the specific interface type for prev state
    setFormData((prev: LocalClaimFormData) => ({
      ...prev,
      [name]: value
    }));
  };

  if (itemLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 text-yellow-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!item && !itemLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h2>
              <p className="text-gray-600 mb-6">We couldn't find the item you're trying to claim.</p>
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted!</h2>
              <p className="text-gray-600">Your claim has been recorded successfully.</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pickup Information</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Lost & Found Locker</p>
                    <p className="text-gray-600 text-sm">Located in the Main Gym (Near Gate 5)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-500 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-gray-900">Available Hours</p>
                    <p className="text-gray-600 text-sm">Monday - Saturday: 8:00 AM - 7:00 PM</p>
                  </div>
                </div>
                
                <div className="mt-4 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src="https://xrylrgwpyiwjswwhthjv.supabase.co/storage/v1/object/public/item-images//IMG_5742%202.JPG"
                    alt="Lost & Found Office Location"
                    className="w-full h-48 object-cover"
                  />
                  <div className="bg-white p-3 text-center">
                    <p className="text-sm text-gray-600">Lost & Found Locker entrance is located at the side of the Main Gym</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
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
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate(`/items/${id}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to item details
        </button>

        <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-6">
          <h2 className="text-center text-xl font-bold text-gray-900 mb-4">
            Claim Item
          </h2>
          
          {item && (
            <div className="mb-4 flex items-center">
              <div className="w-16 h-16 overflow-hidden rounded-md mr-4 bg-gray-100">
                <img 
                  src={item.image_url} 
                  alt={item.name} 
                  className="w-full h-full object-contain" // Use object-contain
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">Item ID: {item.id}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="claimantType" className="block text-sm font-medium text-gray-700">
                I am a...
              </label>
              <div className="mt-1">
                <select
                  id="claimantType"
                  name="claimantType"
                  required
                  value={formData.claimantType}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                >
                  <option value="" disabled>Select one</option>
                  <option value="Student">Student</option>
                  <option value="Staff">Staff</option>
                  <option value="Parent">Parent</option>
                </select>
              </div>
            </div>

            {(formData.claimantType === "Student" || formData.claimantType === "Staff" || formData.claimantType === "Parent") && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.claimantType === "Student" && (
              <div>
                <label htmlFor="childGrade" className="block text-sm font-medium text-gray-700">
                  Grade
                </label>
                <div className="mt-1">
                  <input
                    id="childGrade"
                    name="childGrade"
                    type="text"
                    required
                    value={formData.childGrade}
                    onChange={handleChange}
                    placeholder="Enter grade (e.g., Grade 5)"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    list="grade-suggestions"
                  />
                  <datalist id="grade-suggestions">
                    <option value="Pre-K" />
                    <option value="Kindergarten" />
                    <option value="Grade 1" />
                    <option value="Grade 2" />
                    <option value="Grade 3" />
                    <option value="Grade 4" />
                    <option value="Grade 5" />
                    <option value="Grade 6" />
                    <option value="Grade 7" />
                    <option value="Grade 8" />
                    <option value="Grade 9" />
                    <option value="Grade 10" />
                    <option value="Grade 11" />
                    <option value="Grade 12" />
                  </datalist>
                </div>
              </div>
            )}

            {formData.claimantType === "Staff" && (
              <div>
                <label htmlFor="division" className="block text-sm font-medium text-gray-700">
                  Division
                </label>
                <div className="mt-1">
                  <input
                    id="division"
                    name="division"
                    type="text"
                    required
                    value={formData.division}
                    onChange={handleChange}
                    placeholder="Enter division"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              </div>
            )}

            {formData.claimantType === "Parent" && (
              <div>
                <label htmlFor="childName" className="block text-sm font-medium text-gray-700">
                  Child's Name
                </label>
                <div className="mt-1">
                  <input
                    id="childName"
                    name="childName"
                    type="text"
                    required
                    value={formData.childName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                // Disable button if loading or if no claimant type is selected
                disabled={loading || !formData.claimantType} 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Claim'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}