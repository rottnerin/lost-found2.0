import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Search, PlusCircle, LogIn, Filter, X, LogOut, Trash2, AlertTriangle, Calendar, Sliders, Tag, RefreshCw, MapPin, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuth } from './lib/auth';
import { signOut } from './lib/auth';
import { LoginForm } from './components/LoginForm';
import { ItemForm } from './components/ItemForm';
import { ClaimForm } from './components/ClaimForm';
import { ItemDetailPage } from './components/ItemDetailPage';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import type { Item } from './types/database';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginForm />} />
        <Route path="/items/new" element={user ? <ItemForm /> : <Navigate to="/login" replace />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route path="/items/:id/claim" element={<ClaimForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;