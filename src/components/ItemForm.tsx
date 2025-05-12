import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlertCircle, Upload, Loader2, Camera, ArrowLeft, MapPin } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { AIAnalysis } from '../types/database';
import { Navbar } from './Navbar';
import { API_URL, API_ENDPOINTS } from '../lib/config';

// Define common school locations
const COMMON_LOCATIONS = [
  "1st Floor",
  "2nd Floor",
  "3rd Floor",
  "Administration Area",
  "Amphitheater",
  "Art Room",
  "Athletic Field",
  "Auditorium",
  "Auxiliary Gym",
  "Band Room",
  "Basketball Court",
  "Bathroom",
  "Bleachers",
  "Board/Conference Room",
  "Bookstore",
  "Bus Drop Off",
  "Cafeteria",
  "Cafeteria (Elementary)",
  "Cafeteria (High)",
  "Cafeteria (Middle)",
  "Canopy",
  "Choral",
  "Classroom",
  "Clinic",
  "Computer Lab",
  "Conference Room",
  "Courtyard",
  "Custodial",
  "Custodial Closet",
  "Dining Room",
  "Drama Room",
  "Dressing Room",
  "Driveway",
  "Drop Off",
  "Electrical Room",
  "Elevator",
  "Entrance",
  "ESL Room",
  "Exit Door",
  "Exterior Staircase",
  "Faculty Lounge",
  "Floor",
  "Foyer",
  "Ground Floor",
  "Guard Shack",
  "Guidance Office",
  "Gym",
  "Gym Storage",
  "Hall",
  "Hallway/Corridor",
  "Kitchen",
  "Laboratory",
  "Library (Elementary)",
  "Library (High School)",
  "Locker Room (Boys)",
  "Locker Room (Girls)",
  "Mail Room",
  "Main Entrance",
  "Mechanical Room",
  "Multi-purpose Room",
  "Multipurpose (Middle)",
  "Music Room",
  "Nurse's Office",
  "Office",
  "Parking Lot",
  "Pipe Chase",
  "Playground",
  "Pool",
  "Restroom (Boys)",
  "Restroom (Girls)",
  "Restroom (Staff)",
  "Roof",
  "Science Lab",
  "Serving Line",
  "Showers",
  "Sidewalk",
  "Soccer Field (High)",
  "Soccer Field (Middle)",
  "Speech Room",
  "Stage",
  "Stairway",
  "Storeroom",
  "Telcom Closet",
  "Tennis Courts",
  "Theater",
  "Utility Chase",
  "Warehouse",
  "Water Treatment Room",
  "Weight Room",
  "Workshop"
];

/**
 * Resizes an image to the specified dimensions
 * @param file The image file to resize
 * @param maxWidth Maximum width of the resized image
 * @param maxHeight Maximum height of the resized image
 * @returns A Promise that resolves to a Blob of the resized image
 */
const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Create a FileReader to read the file
    const reader = new FileReader();
    
    // Set up the FileReader onload event
    reader.onload = (readerEvent) => {
      // Create an image element to load the file data
      const img = new Image();
      
      // Set up the image onload event
      img.onload = () => {
        // Create a canvas element to draw the resized image
        const canvas = document.createElement('canvas');
        
        // Calculate the new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw the resized image on the canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert the canvas to a Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          },
          file.type, // Maintain the original file type
          0.9 // Quality parameter (0.9 = 90% quality)
        );
      };
      
      // Set up image error handling
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set the image source to the FileReader result
      if (readerEvent.target?.result) {
        img.src = readerEvent.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    // Set up FileReader error handling
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read the file as a data URL
    reader.readAsDataURL(file);
  });
};

export function ItemForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit. Please choose a smaller image.');
      }

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
      }

      // Simulate upload progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      // Resize the image to 512x512 max dimensions
      const resizedImageBlob = await resizeImage(file, 512, 512);
      
      // Convert Blob to File to maintain type information
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${uuidv4()}.${fileExt}`;
      const resizedImageFile = new File(
        [resizedImageBlob], 
        fileName, 
        { type: file.type }
      );

      // Upload the resized image to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, resizedImageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('item-images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);

      // Analyze image with GPT-4 Vision
      setAnalyzing(true);
      
      try {
        const apiUrl = `${API_URL}${API_ENDPOINTS.analyzeImage}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: publicUrl })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to analyze image');
        }

        const analysis: AIAnalysis = await response.json();
        
        // Auto-fill fields based on AI analysis
        if (analysis.name) setName(analysis.name);
        if (analysis.description) setDescription(analysis.description);
        if (Array.isArray(analysis.tags)) setTags(analysis.tags);
      } catch (analysisError: any) {
        console.error('Analysis error:', analysisError);
        setError(`Image analysis failed: ${analysisError.message}. You can still manually enter item details.`);
      }
    } catch (err: any) {
      console.error('Error processing image:', err);
      setError(err.message || 'Failed to process image. Please try again.');
      
      // Clean up the uploaded image if analysis fails
      if (imageUrl) {
        try {
          const fileName = imageUrl.split('/').pop();
          if (fileName) {
            await supabase.storage
              .from('item-images')
              .remove([fileName]);
          }
        } catch (cleanupError) {
          console.error('Failed to clean up image:', cleanupError);
        }
        setImageUrl('');
      }
    } finally {
      setLoading(false);
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl) {
      setError('Please upload an image of the item');
      return;
    }

    if (!location) {
      setError('Please specify where the item was found');
      return;
    }
    
    try {
      setLoading(true);
      setError('');

      // Add location to the description
      const fullDescription = description + 
        (description.endsWith('.') ? ' ' : '. ') + 
        `Found at: ${location}`;

      const { error: insertError } = await supabase
        .from('items')
        .insert([
          {
            name,
            description: fullDescription,
            image_url: imageUrl,
            tags,
            location
          }
        ]);

      if (insertError) throw insertError;
      
      navigate('/');
    } catch (err: any) {
      console.error('Error creating item:', err);
      setError('Failed to create item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to all items
        </button>
        
        <div className="bg-white py-6 px-4 shadow sm:rounded-lg sm:px-6">
          <div className="flex items-center space-x-3 mb-4">
            <Camera className="h-7 w-7 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">Report Found Item</h2>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <div className="mb-6">
            <div 
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-yellow-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 text-center">
                Take a photo or upload an image<br />
                <span className="text-xs text-gray-500">(Max size: 5MB, Formats: JPEG, PNG, GIF, WebP)</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageCapture}
                disabled={loading}
              />
            </div>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">Uploading: {uploadProgress}%</p>
              </div>
            )}
            
            {imageUrl && (
              <div className="mt-4">
                <div className="w-full h-64 overflow-hidden rounded-lg">
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-yellow-500 animate-spin mb-2" />
              <p className="text-gray-600">Analyzing image...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Item Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="e.g., Blue Backpack"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Describe the item's characteristics and condition..."
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                  Location Found
                </label>
                <div className="mt-1">
                  <input
                    id="location"
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Where was this item found?"
                    list="location-suggestions"
                  />
                  <datalist id="location-suggestions">
                    {COMMON_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Please be as specific as possible about where the item was found
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (Auto-generated)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Tags are automatically generated based on the image analysis
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || !imageUrl}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Item'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}