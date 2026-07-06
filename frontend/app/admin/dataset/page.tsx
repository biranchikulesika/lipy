'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database, Search, Trash2, Filter, Download,
  RefreshCw, SlidersHorizontal, Eye, X, ChevronLeft,
  ChevronRight, Calendar, User, Layers, HardDrive,
  Info, AlertTriangle, Check, Loader2, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { odiaCharacters } from '@/lib/lipyd/odiaCharacters';

interface SampleRecord {
  id: string;
  client_sample_id: string;
  contributor_id: string;
  contributor_name: string;
  session_id: string;
  mode: string;
  character_id: string;
  character_text: string;
  sample_number: number;
  filename: string;
  storage_bucket: string;
  storage_path: string;
  blob_bytes: number;
  mime_type: string;
  created_at: string;
  uploaded_at: string;
  metadata: any;
  signedUrl?: string;
}

const ITEMS_PER_PAGE = 24;

export default function DatasetViewerPage() {
  const [supabase, setSupabase] = useState<any>(null);
  const [samples, setSamples] = useState<SampleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfigured, setIsConfigured] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [selectedType, setSelectedType] = useState(''); // 'vowel' | 'consonant' | 'digit' | ''
  const [selectedMode, setSelectedMode] = useState(''); // 'mixed-random' | 'sequential' | ''
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  
  // UI states
  const [selectedSample, setSelectedSample] = useState<SampleRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    vowels: 0,
    consonants: 0,
    digits: 0,
    contributors: 0
  });

  // Initialize Supabase client
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      setIsConfigured(false);
      setLoading(false);
      return;
    }
    const client = createBrowserClient(url, key);
    setSupabase(client);
  }, []);

  // Fetch metrics & stats
  const fetchStats = useCallback(async (client: any) => {
    try {
      // 1. Get total counts
      const { count: total, error: err1 } = await client
        .from('lipi_samples')
        .select('*', { count: 'exact', head: true });
        
      if (err1) throw err1;

      // 2. Get distinct contributors count by querying distinct contributor_ids
      const { data: contribData, error: err2 } = await client
        .from('lipi_samples')
        .select('contributor_id, character_id');
      
      const uniqueContributors = contribData
        ? new Set(contribData.map((d: any) => d.contributor_id)).size
        : 0;

      // 3. Count by type
      const vowelIds = odiaCharacters.filter(c => c.type === 'vowel').map(c => c.id);
      const consIds = odiaCharacters.filter(c => c.type === 'consonant').map(c => c.id);
      const digitIds = odiaCharacters.filter(c => c.type === 'digit').map(c => c.id);

      let vowelsCount = 0;
      let consCount = 0;
      let digitsCount = 0;

      if (contribData) {
        contribData.forEach((d: any) => {
          const charId = d.character_id || '';
          if (vowelIds.includes(charId)) vowelsCount++;
          else if (consIds.includes(charId)) consCount++;
          else if (digitIds.includes(charId)) digitsCount++;
        });
      }

      setStats({
        total: total || 0,
        vowels: vowelsCount,
        consonants: consCount,
        digits: digitsCount,
        contributors: uniqueContributors
      });
    } catch (error: any) {
      console.error('Error fetching dataset stats:', error?.message || error);
    }
  }, []);

  // Fetch samples with filters and pagination
  const fetchSamples = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      let query = supabase.from('lipi_samples').select('*', { count: 'exact' });

      // Apply search query
      if (searchQuery.trim()) {
        const term = `%${searchQuery.trim()}%`;
        query = query.or(`contributor_name.ilike.${term},contributor_id.ilike.${term},session_id.ilike.${term},filename.ilike.${term}`);
      }

      // Apply character filter
      if (selectedCharacter) {
        query = query.eq('character_id', selectedCharacter);
      } else if (selectedType) {
        // Filter by character type
        const charIdsOfType = odiaCharacters
          .filter(c => c.type === selectedType)
          .map(c => c.id);
        query = query.in('character_id', charIdsOfType);
      }

      // Apply mode filter
      if (selectedMode) {
        query = query.eq('mode', selectedMode);
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      }

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      const fetchedSamples: SampleRecord[] = data || [];
      setTotalCount(count || 0);

      // Generate signed URLs for the private bucket files
      if (fetchedSamples.length > 0) {
        const paths = fetchedSamples.map(s => s.storage_path).filter(Boolean);
        
        const { data: signedUrls, error: signedError } = await supabase.storage
          .from('lipi-samples')
          .createSignedUrls(paths, 3600); // 1 hour expiry

        if (!signedError && signedUrls) {
          // Map signed URL back to sample records
          const urlMap = new Map(signedUrls.map((item: any) => [item.path, item.signedUrl]));
          fetchedSamples.forEach(sample => {
            if (sample.storage_path) {
              sample.signedUrl = urlMap.get(sample.storage_path);
            }
          });
        }
      }

      setSamples(fetchedSamples);
    } catch (error: any) {
      console.error('Error fetching samples:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, searchQuery, selectedCharacter, selectedType, selectedMode, sortBy]);

  // Initial loads and updates
  useEffect(() => {
    if (supabase) {
      fetchStats(supabase);
    }
  }, [supabase, fetchStats]);

  useEffect(() => {
    if (supabase) {
      fetchSamples();
    }
  }, [supabase, currentPage, fetchSamples]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCharacter('');
    setSelectedType('');
    setSelectedMode('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  // Perform search / trigger update
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchSamples();
  };

  // Trigger search on filter select changes
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'char') {
      setSelectedCharacter(value);
      if (value) setSelectedType(''); // character overrides type
    } else if (filterType === 'type') {
      setSelectedType(value);
      setSelectedCharacter(''); // type overrides character
    } else if (filterType === 'mode') {
      setSelectedMode(value);
    } else if (filterType === 'sort') {
      setSortBy(value);
    }
    setCurrentPage(1);
  };

  // Delete a sample
  const handleDeleteSample = async (sample: SampleRecord) => {
    if (!supabase || deletingId) return;
    setDeletingId(sample.id);

    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('lipi_samples')
        .delete()
        .eq('id', sample.id);

      if (dbError) throw dbError;

      // 2. Attempt to delete from Storage (soft fail if error)
      try {
        await supabase.storage
          .from('lipi-samples')
          .remove([sample.storage_path]);
      } catch (err) {
        console.warn('Failed to delete storage file, but DB record was deleted:', err);
      }

      // Close modals, reload data
      setSelectedSample(null);
      setDeleteConfirmId(null);
      fetchSamples();
      fetchStats(supabase);
    } catch (error) {
      console.error('Error deleting sample:', error);
      alert('Failed to delete sample. Check console for details.');
    } finally {
      setDeletingId(null);
    }
  };

  const getFormatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  if (!isConfigured) {
    return (
      <AdminShell title="Dataset Viewer" subtitle="Browse handwriting collection">
        <div className="p-8 max-w-4xl mx-auto">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold">Supabase Config Required</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              Please define <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in your environment or <code>frontend/.env</code> configuration file to use the administrator Dataset Viewer.
            </p>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Dataset Viewer" subtitle="Audit and manage handwritten samples">
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Stats Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Total Samples</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold">{stats.total}</span>
              <Database className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Vowels (ସ୍ଵରବର୍ଣ୍ଣ)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold">{stats.vowels}</span>
              <span className="text-xs text-stone-400">images</span>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Consonants (ବ୍ୟଞ୍ଜନବର୍ଣ୍ଣ)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold">{stats.consonants}</span>
              <span className="text-xs text-stone-400">images</span>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Digits (ସଂଖ୍ୟା)</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold">{stats.digits}</span>
              <span className="text-xs text-stone-400">images</span>
            </div>
          </div>
          <div className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Contributors</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-extrabold">{stats.contributors}</span>
              <User className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-4 sm:p-5">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search text box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search contributor name, ID, session or file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl text-sm font-semibold hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-2 border border-stone-200 dark:border-stone-850 rounded-xl text-sm font-medium hover:bg-stone-50 dark:hover:bg-stone-900/40 transition-colors"
                  title="Clear filters"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="h-px bg-stone-100 dark:bg-stone-900" />

            {/* Structured Select Dropdowns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Character Type Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="vowel">Vowels (ସ୍ଵରବର୍ଣ୍ଣ)</option>
                  <option value="consonant">Consonants (ବ୍ୟଞ୍ଜନବର୍ଣ୍ଣ)</option>
                  <option value="digit">Digits (ସଂଖ୍ୟା)</option>
                </select>
              </div>

              {/* Specific Character Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  Odia Character
                </label>
                <select
                  value={selectedCharacter}
                  onChange={(e) => handleFilterChange('char', e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">All Characters</option>
                  {odiaCharacters.map(char => (
                    <option key={char.id} value={char.id}>
                      {char.char} ({char.id.replace('CONS_', '').replace('VOW_', '').replace('DIGIT_', '')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  Collection Mode
                </label>
                <select
                  value={selectedMode}
                  onChange={(e) => handleFilterChange('mode', e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">All Modes</option>
                  <option value="mixed-random">Mixed Random</option>
                  <option value="sequential">Sequential</option>
                </select>
              </div>

              {/* Sorting Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        {/* Results Info Banner */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Showing <span className="font-bold text-stone-800 dark:text-stone-200">{Math.min(totalCount, ITEMS_PER_PAGE * (currentPage - 1) + 1)}-{Math.min(totalCount, ITEMS_PER_PAGE * currentPage)}</span> of <span className="font-bold text-stone-800 dark:text-stone-200">{totalCount}</span> samples
          </p>
        </div>

        {/* Loading Spinner / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs text-stone-400">Loading samples and generating signed URLs...</p>
          </div>
        ) : samples.length === 0 ? (
          <div className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl p-16 text-center space-y-3">
            <Database className="w-10 h-10 text-stone-300 dark:text-stone-800 mx-auto" />
            <h3 className="text-sm font-semibold">No Samples Found</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              We couldn&apos;t find any dataset samples matching your selected filters. Try broadening your criteria.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {samples.map((sample) => (
              <motion.div
                key={sample.id}
                layoutId={`card-${sample.id}`}
                onClick={() => setSelectedSample(sample)}
                className="group relative bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 hover:border-amber-500/50 dark:hover:border-amber-400/50 rounded-xl p-3 flex flex-col justify-between items-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
              >
                {/* Character label identifier top left */}
                <div className="absolute top-2 left-2 flex items-center justify-center w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-900/80 border border-stone-200/50 dark:border-stone-800 text-xs font-bold font-display shadow-sm">
                  {sample.character_text}
                </div>

                {/* Draw mode tag top right */}
                <div className="absolute top-2 right-2 text-[9px] text-stone-400 font-medium scale-90 px-1.5 py-0.5 rounded bg-stone-50 dark:bg-stone-900/60 border border-stone-200/20 dark:border-stone-850 opacity-0 group-hover:opacity-100 transition-opacity">
                  {sample.mode === 'mixed-random' ? 'Random' : 'Seq'}
                </div>

                {/* Drawing Image container */}
                <div className="w-20 h-20 bg-stone-50 dark:bg-[#121212] rounded-lg mt-5 mb-3 flex items-center justify-center overflow-hidden border border-stone-100 dark:border-stone-900 relative">
                  {sample.signedUrl ? (
                    <img
                      src={sample.signedUrl}
                      alt={sample.character_text}
                      className="w-full h-full object-contain p-1 select-none pointer-events-none invert dark:invert-0"
                      loading="lazy"
                    />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                  )}
                </div>

                {/* Meta details footer */}
                <div className="w-full text-center space-y-0.5">
                  <p className="text-[10px] font-bold text-stone-800 dark:text-stone-200 truncate" title={sample.character_id}>
                    {sample.character_id.replace('CONS_', '').replace('VOW_', '').replace('DIGIT_', '')}
                  </p>
                  <p className="text-[9px] text-stone-400 truncate">
                    ID: {sample.contributor_id.slice(0, 8)}...
                  </p>
                  <p className="text-[9px] text-stone-400">
                    S{sample.sample_number.toString().padStart(3, '0')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-xl px-4 py-3">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-250 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              Page <span className="font-bold text-stone-800 dark:text-stone-200">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-250 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Drawer for individual sample details */}
        <AnimatePresence>
          {selectedSample && (
            <>
              {/* Drawer Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => {
                  setSelectedSample(null);
                  setDeleteConfirmId(null);
                }}
              />

              {/* Drawer Side Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-white dark:bg-[#0D0D0D] border-l border-stone-200 dark:border-stone-900 z-50 p-6 flex flex-col shadow-2xl overflow-y-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-stone-150 dark:border-stone-900">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-base">Sample Details</h3>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSample(null);
                      setDeleteConfirmId(null);
                    }}
                    className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-900 transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Image and main description */}
                <div className="flex flex-col items-center py-6 bg-stone-50 dark:bg-stone-950/40 rounded-2xl border border-stone-100 dark:border-stone-900/60 my-5">
                  <div className="w-32 h-32 bg-white dark:bg-[#121212] border border-stone-250 dark:border-stone-900 rounded-xl flex items-center justify-center relative overflow-hidden shadow-sm">
                    {selectedSample.signedUrl ? (
                      <img
                        src={selectedSample.signedUrl}
                        alt=""
                        className="w-full h-full object-contain p-2 invert dark:invert-0"
                      />
                    ) : (
                      <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                    )}
                  </div>
                  <span className="text-4xl font-extrabold font-display mt-4">{selectedSample.character_text}</span>
                  <span className="text-xs font-bold text-stone-400 mt-1">{selectedSample.character_id}</span>
                </div>

                {/* Metadata Fields */}
                <div className="flex-1 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">Metadata Properties</h4>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                      <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-xs">Contributor</span>
                      </div>
                      <span className="text-xs font-semibold truncate max-w-[200px]" title={selectedSample.contributor_name}>
                        {selectedSample.contributor_name || '—'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                      <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-xs">Contributor ID</span>
                      </div>
                      <code className="text-[10px] font-mono bg-stone-100 dark:bg-stone-850 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400">
                        {selectedSample.contributor_id}
                      </code>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                      <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                        <Info className="w-3.5 h-3.5" />
                        <span className="text-xs">Session &amp; Sample</span>
                      </div>
                      <span className="text-xs font-semibold">
                        Session: {selectedSample.session_id} | Sample #{selectedSample.sample_number}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                      <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span className="text-xs">Collection Mode</span>
                      </div>
                      <span className="text-xs font-semibold capitalize">
                        {selectedSample.mode}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                      <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs">Created At</span>
                      </div>
                      <span className="text-xs font-semibold">
                        {new Date(selectedSample.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 bg-stone-50 dark:bg-stone-900/30 rounded-xl">
                      <div className="flex items-center gap-2 text-stone-400 dark:text-stone-500">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span className="text-xs">Storage Info</span>
                      </div>
                      <span className="text-xs font-semibold">
                        {getFormatBytes(selectedSample.blob_bytes)}
                      </span>
                    </div>

                    <div className="p-3 bg-stone-50 dark:bg-stone-900/30 rounded-xl space-y-1.5">
                      <div className="text-stone-400 dark:text-stone-500 text-xs">Filename</div>
                      <div className="text-[10px] font-mono break-all leading-relaxed bg-stone-100 dark:bg-stone-850/80 p-2 rounded border border-stone-200/50 dark:border-stone-800">
                        {selectedSample.filename}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Delete Controls */}
                <div className="pt-6 border-t border-stone-150 dark:border-stone-900 mt-6 space-y-3">
                  {deleteConfirmId === selectedSample.id ? (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-3.5 space-y-3">
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-semibold">
                          Are you sure you want to delete this sample? This will permanently remove the record and image file from storage.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteSample(selectedSample)}
                          disabled={deletingId !== null}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {deletingId !== null ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Yes, Delete Permanently
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(selectedSample.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-950/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Reject &amp; Delete Sample
                      </button>
                      {selectedSample.signedUrl && (
                        <a
                          href={selectedSample.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 flex items-center justify-center border border-stone-200 dark:border-stone-850 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
                          title="Open full size image"
                        >
                          <ExternalLink className="w-4 h-4 text-stone-500" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AdminShell>
  );
}
