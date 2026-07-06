'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database, Search, Trash2, Filter, Download,
  RefreshCw, SlidersHorizontal, Eye, X, ChevronLeft,
  ChevronRight, Calendar, User, Layers, HardDrive,
  Info, AlertTriangle, Check, Loader2, ExternalLink, ArrowUpDown, CheckSquare
} from 'lucide-react';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/AdminShell';
import { odiaCharacters } from '@/lib/lipyd/odiaCharacters';

function cleanStoragePath(path: string): string {
  if (!path) return '';
  let clean = path.trim();
  if (clean.startsWith('lipi-samples/')) {
    clean = clean.substring('lipi-samples/'.length);
  }
  if (clean.startsWith('lipy-samples/')) {
    clean = clean.substring('lipy-samples/'.length);
  }
  if (clean.startsWith('/')) {
    clean = clean.substring(1);
  }
  return clean;
}

let localSupabaseClient: any = null;

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
  status: string;
  created_at: string;
  uploaded_at: string;
  metadata: any;
  signedUrl?: string;
}

const ITEMS_PER_PAGE = 72;

const SORT_OPTIONS = {
  newest: { next: 'oldest', label: 'Newest First' },
  oldest: { next: 'az', label: 'Oldest First' },
  az: { next: 'za', label: 'Alphabetical (A-Z)' },
  za: { next: 'newest', label: 'Alphabetical (Z-A)' },
} as const;

type MobilePanel = 'filters' | 'search' | null;

type MobileFilterDraft = {
  selectedCharacter: string;
  selectedType: string;
  selectedMode: string;
  selectedContributor: string;
  selectedStatus: string;
  startDate: string;
  endDate: string;
  sortBy: string;
};

export default function DatasetViewerPage() {
  const [supabase, setSupabase] = useState<any>(null);
  const [samples, setSamples] = useState<SampleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileTopControls, setShowMobileTopControls] = useState(true);
  const lastScrollTopRef = useRef(0);

  const [mobilePanel, setMobilePanel] = useState<MobilePanel>(null);
  const [mobileFilterDraft, setMobileFilterDraft] = useState<MobileFilterDraft>({
    selectedCharacter: '',
    selectedType: '',
    selectedMode: '',
    selectedContributor: '',
    selectedStatus: '',
    startDate: '',
    endDate: '',
    sortBy: 'newest',
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [selectedType, setSelectedType] = useState(''); // 'vowel' | 'consonant' | 'digit' | ''
  const [selectedMode, setSelectedMode] = useState(''); // 'mixed-random' | 'sequential' | ''
  const [selectedContributor, setSelectedContributor] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(''); // 'verified' | 'unverified' | ''
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'az' | 'za'

  // Dynamic filter dropdown resources
  const [contributors, setContributors] = useState<{ id: string; name: string }[]>([]);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // UI states
  const [selectedSample, setSelectedSample] = useState<SampleRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState<'verify' | 'unverify' | 'delete' | null>(null);
  const [stats, setStats] = useState({
    total: 0,
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
    if (!localSupabaseClient) {
      localSupabaseClient = createSupabaseClient(url, key);
    }
    setSupabase(localSupabaseClient);
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  useEffect(() => {
    if (!isMobileView) {
      setShowMobileTopControls(true);
      lastScrollTopRef.current = 0;
    }
  }, [isMobileView]);

  const handleMobileScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!isMobileView) return;

    const currentScrollTop = event.currentTarget.scrollTop;
    const previousScrollTop = lastScrollTopRef.current;

    if (currentScrollTop <= 8) {
      setShowMobileTopControls(true);
    } else if (currentScrollTop > previousScrollTop + 8) {
      setShowMobileTopControls(false);
    } else if (currentScrollTop < previousScrollTop - 8) {
      setShowMobileTopControls(true);
    }

    lastScrollTopRef.current = currentScrollTop;
  };

  // Fetch metrics & stats
  const fetchStats = useCallback(async (client: any) => {
    try {
      // 1. Get total counts
      const { count: total, error: err1 } = await client
        .from('lipy_samples')
        .select('*', { count: 'exact', head: true });
        
      if (err1) throw err1;

      // 2. Get distinct contributors count by querying distinct contributor_ids
      const { data: contribData, error: err2 } = await client
        .from('lipy_samples')
        .select('contributor_id, contributor_name');
      
      if (err2) throw err2;

      let uniqueContributors = 0;
      const uniqueContribsMap = new Map();

      if (contribData) {
        contribData.forEach((d: any) => {
          if (d.contributor_id) {
            uniqueContribsMap.set(d.contributor_id, d.contributor_name || d.contributor_id);
          }
        });
        uniqueContributors = uniqueContribsMap.size;
        const list = Array.from(uniqueContribsMap.entries()).map(([id, name]) => ({ id, name }));
        setContributors(list);
      }

      setStats({
        total: total || 0,
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
      let query = supabase.from('lipy_samples').select('*', { count: 'exact' });

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

      // Apply contributor filter
      if (selectedContributor) {
        query = query.eq('contributor_id', selectedContributor);
      }

      // Apply status filter
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      // Apply date filters
      if (startDate) {
        query = query.gte('created_at', `${startDate}T00:00:00Z`);
      }
      if (endDate) {
        query = query.lte('created_at', `${endDate}T23:59:59Z`);
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('created_at', { ascending: true });
      } else if (sortBy === 'az') {
        query = query.order('character_text', { ascending: true }).order('created_at', { ascending: false });
      } else if (sortBy === 'za') {
        query = query.order('character_text', { ascending: false }).order('created_at', { ascending: false });
      }

      // Pagination only on desktop; mobile loads the full filtered list for scrolling.
      const { data, count, error } = isMobileView
        ? await query
        : await query.range((currentPage - 1) * ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      const fetchedSamples: SampleRecord[] = data || [];
      setTotalCount(count || 0);

      // Generate signed URLs for the private bucket files
      if (fetchedSamples.length > 0) {
        try {
          // Group samples by bucket to handle multiple buckets dynamically
          const bucketToPaths = new Map<string, string[]>();
          fetchedSamples.forEach(sample => {
            if (sample.storage_path) {
              const bucketName = sample.storage_bucket || 'lipi-samples';
              const cleanPath = cleanStoragePath(sample.storage_path);
              if (!bucketToPaths.has(bucketName)) {
                bucketToPaths.set(bucketName, []);
              }
              bucketToPaths.get(bucketName)!.push(cleanPath);
            }
          });

          // Request signed URLs in parallel for each bucket
          const signedUrlsPromises = Array.from(bucketToPaths.entries()).map(async ([bucketName, paths]) => {
            const { data, error } = await supabase.storage
              .from(bucketName)
              .createSignedUrls(paths, 3600); // 1 hour expiry
            
            if (error) {
              console.error(`Signed URLs error for bucket ${bucketName}:`, error);
              return [];
            }
            return (data || []).map((item: any) => ({ ...item, bucketName }));
          });

          const results = await Promise.all(signedUrlsPromises);
          const flatResults = results.flat();

          // Create a composite map using bucket:path as key
          const urlMap = new Map<string, string>();
          flatResults.forEach((item: any) => {
            const sUrl = item.signedURL || item.signedUrl;
            if (sUrl) {
              const cleanPath = cleanStoragePath(item.path);
              const absoluteUrl = sUrl.startsWith('http')
                ? sUrl
                : `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ddmirzstugnmajvtvovw.supabase.co'}/storage/v1${sUrl}`;
              urlMap.set(`${item.bucketName}:${cleanPath}`, absoluteUrl);
            }
          });

          fetchedSamples.forEach(sample => {
            if (sample.storage_path) {
              const bucketName = sample.storage_bucket || 'lipi-samples';
              const cleanPath = cleanStoragePath(sample.storage_path);
              const key = `${bucketName}:${cleanPath}`;
              const signed = urlMap.get(key);
              if (signed) {
                sample.signedUrl = signed;
              } else {
                // Fallback to public URL constructor
                sample.signedUrl = supabase.storage.from(bucketName).getPublicUrl(cleanPath).data.publicUrl;
              }
            }
          });
        } catch (err) {
          console.error('Error generating signed URLs:', err);
          fetchedSamples.forEach(sample => {
            if (sample.storage_path) {
              const bucketName = sample.storage_bucket || 'lipi-samples';
              const cleanPath = cleanStoragePath(sample.storage_path);
              sample.signedUrl = supabase.storage.from(bucketName).getPublicUrl(cleanPath).data.publicUrl;
            }
          });
        }
      }

      console.log('=== DEBUG: fetchSamples ===');
      console.log('Fetched samples count:', fetchedSamples.length);
      if (fetchedSamples.length > 0) {
        console.log('First sample:', {
          id: fetchedSamples[0].id,
          char: fetchedSamples[0].character_text,
          bucket: fetchedSamples[0].storage_bucket,
          path: fetchedSamples[0].storage_path,
          signedUrl: fetchedSamples[0].signedUrl
        });
      }
      setSamples(fetchedSamples);
      setSelectedIds([]); // Clear selections on page/filter change
    } catch (error: any) {
      console.error('Error fetching samples:', error?.message || error);
    } finally {
      setLoading(false);
    }
  }, [supabase, currentPage, isMobileView, searchQuery, selectedCharacter, selectedType, selectedMode, selectedContributor, selectedStatus, startDate, endDate, sortBy]);

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

  useEffect(() => {
    if (isMobileView) {
      setCurrentPage(1);
    }
  }, [isMobileView]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCharacter('');
    setSelectedType('');
    setSelectedMode('');
    setSelectedContributor('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
    setCurrentPage(1);
    setSelectedIds([]);
    setMobilePanel(null);
    setMobileFilterDraft({
      selectedCharacter: '',
      selectedType: '',
      selectedMode: '',
      selectedContributor: '',
      selectedStatus: '',
      startDate: '',
      endDate: '',
      sortBy: 'newest',
    });
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

  const activeFilterCount = [
    selectedCharacter,
    selectedType,
    selectedMode,
    selectedContributor,
    selectedStatus,
    startDate,
    endDate,
    sortBy !== 'newest' ? sortBy : '',
  ].filter(Boolean).length;

  const openMobileFilters = () => {
    setMobileFilterDraft({
      selectedCharacter,
      selectedType,
      selectedMode,
      selectedContributor,
      selectedStatus,
      startDate,
      endDate,
      sortBy,
    });
    setMobilePanel('filters');
  };

  const applyMobileFilters = () => {
    setSelectedCharacter(mobileFilterDraft.selectedCharacter);
    setSelectedType(mobileFilterDraft.selectedCharacter ? '' : mobileFilterDraft.selectedType);
    setSelectedMode(mobileFilterDraft.selectedMode);
    setSelectedContributor(mobileFilterDraft.selectedContributor);
    setSelectedStatus(mobileFilterDraft.selectedStatus);
    setStartDate(mobileFilterDraft.startDate);
    setEndDate(mobileFilterDraft.endDate);
    setSortBy(mobileFilterDraft.sortBy);
    setCurrentPage(1);
    setMobilePanel(null);
  };

  const clearMobileFilters = () => {
    const resetFilters = {
      selectedCharacter: '',
      selectedType: '',
      selectedMode: '',
      selectedContributor: '',
      selectedStatus: '',
      startDate: '',
      endDate: '',
      sortBy: 'newest',
    };
    setMobileFilterDraft(resetFilters);
    setSelectedCharacter('');
    setSelectedType('');
    setSelectedMode('');
    setSelectedContributor('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setSortBy('newest');
    setCurrentPage(1);
    setMobilePanel(null);
  };

  // Verify/Unverify single sample
  const handleToggleVerify = async (sample: SampleRecord) => {
    if (!supabase) return;
    const newStatus = sample.status === 'verified' ? 'unverified' : 'verified';
    try {
      const { error } = await supabase
        .from('lipy_samples')
        .update({ status: newStatus })
        .eq('id', sample.id);

      if (error) throw error;

      // Update local state
      const updatedSample = { ...sample, status: newStatus };
      setSelectedSample(updatedSample);
      setSamples(prev => prev.map(s => s.id === sample.id ? updatedSample : s));
      fetchStats(supabase);
    } catch (err: any) {
      console.error('Error toggling verification:', err);
    }
  };

  // Delete a sample
  const handleDeleteSample = async (sample: SampleRecord) => {
    if (!supabase || deletingId) return;
    setDeletingId(sample.id);

    try {
      // 1. Delete from database
      const { error: dbError } = await supabase
        .from('lipy_samples')
        .delete()
        .eq('id', sample.id);

      if (dbError) throw dbError;

      // 2. Attempt to delete from Storage (soft fail if error)
      try {
        const bucketName = sample.storage_bucket || 'lipi-samples';
        await supabase.storage
          .from(bucketName)
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

  // Core Execution Logics
  const executeBulkVerify = async (verify: boolean) => {
    if (!supabase || selectedIds.length === 0 || bulkActionLoading) return;
    setBulkActionLoading(true);
    const targetStatus = verify ? 'verified' : 'unverified';
    try {
      const { error } = await supabase
        .from('lipy_samples')
        .update({ status: targetStatus })
        .in('id', selectedIds);

      if (error) throw error;

      fetchSamples();
      fetchStats(supabase);
      setSelectedIds([]);
      setConfirmModalOpen(false);
    } catch (err: any) {
      console.error('Error during bulk update:', err);
      alert('Failed to update status. Check console.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const executeBulkDelete = async () => {
    if (!supabase || selectedIds.length === 0 || bulkActionLoading) return;
    setBulkActionLoading(true);
    try {
      const selectedSamples = samples.filter(s => selectedIds.includes(s.id));
      const storagePaths = selectedSamples.map(s => s.storage_path).filter(Boolean);

      // 1. Delete from DB
      const { error: dbError } = await supabase
        .from('lipy_samples')
        .delete()
        .in('id', selectedIds);

      if (dbError) throw dbError;

      // 2. Delete from Storage
      const bucketToPaths = new Map<string, string[]>();
      selectedSamples.forEach(s => {
        if (s.storage_path) {
          const bucketName = s.storage_bucket || 'lipi-samples';
          if (!bucketToPaths.has(bucketName)) {
            bucketToPaths.set(bucketName, []);
          }
          bucketToPaths.get(bucketName)!.push(s.storage_path);
        }
      });

      for (const [bucketName, paths] of Array.from(bucketToPaths.entries())) {
        try {
          await supabase.storage
            .from(bucketName)
            .remove(paths);
        } catch (err) {
          console.warn(`Storage files delete failed for bucket ${bucketName}:`, err);
        }
      }

      fetchSamples();
      fetchStats(supabase);
      setSelectedIds([]);
      setConfirmModalOpen(false);
    } catch (err: any) {
      console.error('Error during bulk delete:', err);
      alert('Failed to delete samples. Check console.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Bulk Actions Wrapper (Triggers custom confirm modal if > 5 images selected)
  const handleBulkVerify = async (verify: boolean) => {
    const action = verify ? 'verify' : 'unverify';
    if (selectedIds.length > 5) {
      setConfirmModalAction(action);
      setConfirmModalOpen(true);
    } else {
      await executeBulkVerify(verify);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length > 5) {
      setConfirmModalAction('delete');
      setConfirmModalOpen(true);
    } else {
      await executeBulkDelete();
    }
  };

  const handleConfirmAction = () => {
    if (confirmModalAction === 'verify') {
      executeBulkVerify(true);
    } else if (confirmModalAction === 'unverify') {
      executeBulkVerify(false);
    } else if (confirmModalAction === 'delete') {
      executeBulkDelete();
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
      <div className="h-full flex flex-col overflow-hidden w-full max-w-none">
        
        {/* Fixed top filters header */}
        <div className="p-4 sm:p-6 md:p-8 pb-0 space-y-4 shrink-0">

        {/* Mobile Actions */}
        <div className={`flex items-center gap-2 md:hidden transition-all duration-200 overflow-hidden ${showMobileTopControls ? 'max-h-20 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'}`}>
          <div className="relative min-w-0 flex-1">
            <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1">
            <input
              type="text"
              placeholder="Search contributor name, ID, session or file..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-4 pr-10 text-sm text-stone-700 outline-none transition focus:border-amber-500 dark:border-stone-800 dark:bg-[#0F0F0F] dark:text-stone-200 dark:focus:border-amber-400"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 transition-colors hover:text-stone-700 dark:hover:text-stone-200"
              aria-label="Search"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            </form>
          </div>

          <button
            type="button"
            onClick={openMobileFilters}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:bg-[#0F0F0F] dark:text-stone-200 dark:hover:bg-stone-900"
            aria-label="Open filters"
            title="Filters"
          >
            <Filter className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="hidden rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-900 dark:bg-[#0F0F0F] md:block sm:p-5">
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="flex flex-wrap items-center gap-2.5 w-full">
              {/* Search text box */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search contributor name, ID, session or file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 dark:focus:ring-amber-400 focus:border-transparent h-[36px]"
                />
                <button
                  type="submit"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-750 dark:hover:text-stone-200 transition-colors flex items-center justify-center"
                  title="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Character Type Filter */}
              <div className="relative min-w-[120px] flex-grow sm:flex-initial">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <select
                  value={selectedType}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 dark:focus:ring-amber-400/50"
                >
                  <option value="">All Types</option>
                  <option value="vowel">Vowels</option>
                  <option value="consonant">Consonants</option>
                  <option value="digit">Digits</option>
                </select>
              </div>

              {/* Contributor Filter */}
              <div className="relative min-w-[140px] flex-grow sm:flex-initial">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <select
                  value={selectedContributor}
                  onChange={(e) => {
                    setSelectedContributor(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 dark:focus:ring-amber-400/50"
                >
                  <option value="">All Contributors</option>
                  {contributors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name.length > 18 ? `${c.name.slice(0, 15)}...` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus(prev => {
                    if (prev === '') return 'verified';
                    if (prev === 'verified') return 'unverified';
                    return '';
                  });
                  setCurrentPage(1);
                }}
                className={`relative p-2 flex items-center justify-center border rounded-xl transition-all h-[36px] flex-grow sm:flex-initial min-w-[40px] ${
                  selectedStatus === ''
                    ? 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'
                    : selectedStatus === 'verified'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                }`}
                title={
                  selectedStatus === ''
                    ? "Status: All (Click to show Verified only)"
                    : selectedStatus === 'verified'
                    ? "Status: Verified Only (Click to show Unverified only)"
                    : "Status: Unverified Only (Click to show All)"
                }
              >
                <Check className="w-4 h-4" />
                <span className="text-[11px] ml-1.5 hidden sm:inline select-none">
                  {selectedStatus === '' ? 'All Status' : selectedStatus === 'verified' ? 'Verified Only' : 'Unverified Only'}
                </span>
              </button>

              {/* From Date */}
              <div className="relative min-w-[130px] flex-grow sm:flex-initial">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 dark:focus:ring-amber-400/50 h-[36px]"
                />
              </div>

              {/* To Date */}
              <div className="relative min-w-[130px] flex-grow sm:flex-initial">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500/50 dark:focus:ring-amber-400/50 h-[36px]"
                />
              </div>

              {/* Sorting Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  setSortBy(prev => {
                    const current = prev as keyof typeof SORT_OPTIONS;
                    return SORT_OPTIONS[current]?.next || 'newest';
                  });
                  setCurrentPage(1);
                }}
                className="relative p-2 flex items-center justify-center border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/40 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-xl transition-all h-[36px] flex-grow sm:flex-initial min-w-[40px] text-stone-700 dark:text-stone-300"
                title={`Sort: ${SORT_OPTIONS[sortBy as keyof typeof SORT_OPTIONS]?.label || 'Newest First'} (Click to cycle)`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-[11px] ml-1.5 hidden sm:inline select-none">
                  {SORT_OPTIONS[sortBy as keyof typeof SORT_OPTIONS]?.label || 'Newest First'}
                </span>
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleResetFilters}
                className="group px-3.5 py-2 border border-stone-200 dark:border-stone-850 bg-stone-50 dark:bg-stone-900/40 hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl transition-all h-[36px] flex items-center justify-center min-w-[40px] flex-grow sm:flex-initial"
                title="Reset All Filters"
              >
                <RefreshCw className="w-4 h-4 transition-transform duration-500 ease-out group-hover:rotate-180 group-active:scale-95" />
                <span className="text-[11px] font-bold ml-1.5 hidden sm:inline select-none">
                  Reset
                </span>
              </button>
            </div>
          </form>
        </div>

        <AnimatePresence>
          {mobilePanel && (
            <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true">
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-stone-950/45 backdrop-blur-sm"
                onClick={() => setMobilePanel(null)}
                aria-label="Close mobile panel"
              />

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="absolute inset-x-0 bottom-0 max-h-[86vh] overflow-y-auto rounded-t-[1.5rem] border-t border-stone-200 bg-white shadow-2xl dark:border-stone-900 dark:bg-[#0B0B0B]"
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-stone-900 dark:bg-[#0B0B0B]/95">
                  <div className="flex items-center gap-2">
                    {mobilePanel === 'search' ? (
                      <Search className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Filter className="w-4 h-4 text-amber-500" />
                    )}
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {mobilePanel === 'search' ? 'Search Samples' : 'Filter Samples'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobilePanel(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-900 dark:hover:text-stone-100"
                    aria-label="Close panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4 px-4 py-4">
                  <div className="grid grid-cols-1 gap-3">
                      <div className="relative">
                        <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <select
                          value={mobileFilterDraft.selectedType}
                          onChange={(e) => setMobileFilterDraft((prev) => ({
                            ...prev,
                            selectedType: e.target.value,
                            selectedCharacter: e.target.value ? '' : prev.selectedCharacter,
                          }))}
                          className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:bg-white dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-200 dark:focus:bg-stone-900"
                        >
                          <option value="">All Types</option>
                          <option value="vowel">Vowels</option>
                          <option value="consonant">Consonants</option>
                          <option value="digit">Digits</option>
                        </select>
                      </div>

                      <div className="relative">
                        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <select
                          value={mobileFilterDraft.selectedContributor}
                          onChange={(e) => setMobileFilterDraft((prev) => ({ ...prev, selectedContributor: e.target.value }))}
                          className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:bg-white dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-200 dark:focus:bg-stone-900"
                        >
                          <option value="">All Contributors</option>
                          {contributors.map((contributor) => (
                            <option key={contributor.id} value={contributor.id}>
                              {contributor.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="relative">
                        <Check className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <button
                          type="button"
                          onClick={() => setMobileFilterDraft((prev) => ({
                            ...prev,
                            selectedStatus: prev.selectedStatus === '' ? 'verified' : prev.selectedStatus === 'verified' ? 'unverified' : '',
                          }))}
                          className={`flex h-11 w-full items-center rounded-xl border pl-9 pr-3 text-left text-sm font-medium transition-colors ${
                            mobileFilterDraft.selectedStatus === ''
                              ? 'border-stone-200 bg-stone-50 text-stone-600 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-300'
                              : mobileFilterDraft.selectedStatus === 'verified'
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {mobileFilterDraft.selectedStatus === '' ? 'All Status' : mobileFilterDraft.selectedStatus === 'verified' ? 'Verified Only' : 'Unverified Only'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                          <input
                            type="date"
                            value={mobileFilterDraft.startDate}
                            onChange={(e) => setMobileFilterDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                            className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:bg-white dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-200 dark:focus:bg-stone-900"
                          />
                        </div>

                        <div className="relative">
                          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                          <input
                            type="date"
                            value={mobileFilterDraft.endDate}
                            onChange={(e) => setMobileFilterDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                            className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:bg-white dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-200 dark:focus:bg-stone-900"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <select
                          value={mobileFilterDraft.sortBy}
                          onChange={(e) => setMobileFilterDraft((prev) => ({ ...prev, sortBy: e.target.value }))}
                          className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm text-stone-700 outline-none transition focus:border-amber-500 focus:bg-white dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-200 dark:focus:bg-stone-900"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="az">Alphabetical (A-Z)</option>
                          <option value="za">Alphabetical (Z-A)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={clearMobileFilters}
                        className="h-11 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 dark:border-stone-800 dark:bg-[#111111] dark:text-stone-300 dark:hover:bg-stone-900"
                      >
                        Clear Filters
                      </button>
                      <button
                        type="button"
                        onClick={applyMobileFilters}
                        className="h-11 rounded-xl bg-amber-500 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                      >
                        Apply Filters
                      </button>
                    </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Results Info Banner */}
        <div className={`flex flex-wrap items-center justify-between gap-3 transition-all duration-200 md:opacity-100 md:pointer-events-auto ${showMobileTopControls ? 'max-h-40 opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none overflow-hidden md:max-h-40 md:opacity-100 md:translate-y-0 md:pointer-events-auto'}`}>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            {selectedIds.length > 0 ? (
              <span>
                Selected <span className="font-bold text-amber-600 dark:text-amber-400">{selectedIds.length}</span> of <span className="font-bold text-stone-850 dark:text-stone-250">{samples.length}</span> loaded samples
              </span>
            ) : (
              isMobileView ? (
                <span>
                  Showing <span className="font-bold text-stone-800 dark:text-stone-200">{totalCount}</span> samples
                </span>
              ) : (
                <span>
                  Showing <span className="font-bold text-stone-800 dark:text-stone-200">{Math.min(totalCount, ITEMS_PER_PAGE * (currentPage - 1) + 1)}-{Math.min(totalCount, ITEMS_PER_PAGE * currentPage)}</span> of <span className="font-bold text-stone-800 dark:text-stone-200">{totalCount}</span> samples
                </span>
              )
            )}
          </p>
          <div className="flex items-center gap-2">
            {/* Bulk Action Controls */}
            {selectedIds.length > 0 && !isMobileView && (
              <div className="flex items-center gap-1 border border-amber-500/30 rounded-xl px-1.5 py-0.5 bg-amber-500/5 h-[32px]">
                <button
                  type="button"
                  onClick={() => handleBulkVerify(true)}
                  disabled={bulkActionLoading}
                  className="px-2.5 py-0.5 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 active:scale-95 rounded-lg disabled:opacity-40 transition-all duration-150 flex items-center gap-1 h-[24px]"
                  title="Verify Selected"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span className="font-bold select-none">Verify</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkVerify(false)}
                  disabled={bulkActionLoading}
                  className="px-2.5 py-0.5 text-[10px] sm:text-xs text-stone-550 dark:text-stone-400 hover:bg-stone-500/10 active:scale-95 rounded-lg disabled:opacity-40 transition-all duration-150 flex items-center gap-1 h-[24px]"
                  title="Unverify Selected"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="font-bold select-none">Unverify</span>
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="px-2.5 py-0.5 text-[10px] sm:text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 active:scale-95 rounded-lg disabled:opacity-40 transition-all duration-150 flex items-center gap-1 h-[24px]"
                  title="Delete Selected"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="font-bold select-none">Delete</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2.5 py-0.5 text-[10px] sm:text-xs text-stone-500 hover:text-stone-850 dark:hover:text-stone-250 hover:bg-stone-500/10 active:scale-95 rounded-lg transition-all duration-150 flex items-center gap-1 h-[24px] border-l border-stone-250 dark:border-stone-850 pl-2 ml-1"
                  title="Clear Selection"
                >
                  <X className="w-3.5 h-3.5" />
                  <span className="font-bold select-none">Deselect</span>
                </button>
              </div>
            )}

            {/* Selection Mode Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setSelectionMode(prev => !prev);
              }}
              className={`font-semibold transition-all duration-200 ease-out active:scale-95 hover:-translate-y-[1px] hover:shadow-sm border rounded-xl flex items-center justify-center select-none ${
                isMobileView ? 'px-2 py-1.5 h-[28px] text-[10px]' : 'px-2.5 py-1.5 h-[32px] text-xs'
              } ${
                selectionMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                  : 'border-stone-250 dark:border-stone-850 bg-white dark:bg-[#0F0F0F] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
              title={selectionMode ? "Selection Mode: ON (Click to toggle OFF)" : "Selection Mode: OFF (Click to toggle ON)"}
            >
              <CheckSquare className={`shrink-0 ${isMobileView ? 'w-3 h-3 mr-0.5' : 'w-3.5 h-3.5 mr-1'}`} />
              <span>SELECT MODE</span>
            </button>

            {!isMobileView && (
              <button
                onClick={() => {
                  const allLoadedIds = samples.map(s => s.id);
                  const allSelected = allLoadedIds.every(id => selectedIds.includes(id));
                  if (allSelected) {
                    setSelectedIds(prev => prev.filter(id => !allLoadedIds.includes(id)));
                  } else {
                    setSelectedIds(prev => Array.from(new Set([...prev, ...allLoadedIds])));
                  }
                }}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-all duration-200 ease-out active:scale-95 hover:-translate-y-[1px] hover:shadow-sm border border-stone-250 dark:border-stone-850 px-2.5 py-1.5 rounded-xl h-[32px] flex items-center justify-center bg-white dark:bg-[#0F0F0F] select-none"
              >
                {samples.map(s => s.id).every(id => selectedIds.includes(id)) ? 'Deselect Page' : 'Select Page'}
              </button>
            )}

            {/* Pagination Controls */}
            {!isMobileView && totalPages > 1 && (
              <div className="flex items-center gap-1.5 border border-stone-250 dark:border-stone-850 rounded-xl px-1.5 py-0.5 bg-white dark:bg-[#0F0F0F] h-[32px]">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400 px-1 select-none">
                  {currentPage}/{totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        </div>

        {isMobileView && selectedIds.length > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-stone-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur dark:border-stone-900 dark:bg-[#0B0B0B]/95">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                {selectedIds.length} selected
              </p>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] font-semibold text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline dark:text-stone-400 dark:hover:text-stone-200"
              >
                Deselect all
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleBulkVerify(true)}
                disabled={bulkActionLoading}
                className="flex h-11 flex-col items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-[10px] font-semibold text-emerald-700 transition-colors active:scale-[0.98] disabled:opacity-40 dark:text-emerald-400"
                title="Verify Selected"
              >
                <Check className="h-4 w-4" />
                <span>Verify</span>
              </button>

              <button
                type="button"
                onClick={() => handleBulkVerify(false)}
                disabled={bulkActionLoading}
                className="flex h-11 flex-col items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-[10px] font-semibold text-stone-600 transition-colors active:scale-[0.98] disabled:opacity-40 dark:border-stone-800 dark:bg-[#111111] dark:text-stone-300"
                title="Unverify Selected"
              >
                <X className="h-4 w-4" />
                <span>Unverify</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="flex h-11 flex-col items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-[10px] font-semibold text-red-700 transition-colors active:scale-[0.98] disabled:opacity-40 dark:text-red-400"
                title="Delete Selected"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="flex h-11 flex-col items-center justify-center rounded-xl border border-stone-200 bg-white text-[10px] font-semibold text-stone-600 transition-colors active:scale-[0.98] dark:border-stone-800 dark:bg-[#0F0F0F] dark:text-stone-300"
                title="Deselect Selected"
              >
                <X className="h-4 w-4" />
                <span>Deselect</span>
              </button>
            </div>
          </div>
        )}

        {/* Scrollable grid content */}
        <div onScroll={handleMobileScroll} className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pt-2 ${isMobileView && selectedIds.length > 0 ? 'pb-28' : ''}`}>

        {/* Loading Spinner / Grid */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 space-y-4 select-none">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-stone-200 dark:border-stone-800 animate-pulse" />
              <Loader2 className="w-6 h-6 animate-spin text-amber-500 absolute" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400 dark:text-stone-500 animate-pulse">
              Loading Samples
            </span>
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
            {samples.map((sample) => (
              <motion.div
                key={sample.id}
                layoutId={`card-${sample.id}`}
                className={`group relative bg-white dark:bg-[#0F0F0F] border rounded-xl p-2 flex flex-col items-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden ${
                  selectedIds.includes(sample.id)
                    ? 'border-amber-500 dark:border-amber-400 bg-amber-50/10 dark:bg-amber-400/5 shadow-sm'
                    : 'border-stone-200 dark:border-stone-900 hover:border-amber-500/50 dark:hover:border-amber-400/50'
                }`}
                onClick={() => {
                  if (selectionMode) {
                    const isSelected = selectedIds.includes(sample.id);
                    setSelectedIds(prev => 
                      isSelected ? prev.filter(id => id !== sample.id) : [...prev, sample.id]
                    );
                  } else {
                    setSelectedSample(sample);
                  }
                }}
              >

                {/* Drawing Image container */}
                <div className="w-20 h-20 bg-stone-50 dark:bg-[#121212] rounded-lg mt-1 flex items-center justify-center overflow-hidden border border-stone-100 dark:border-stone-900 relative">
                  {sample.signedUrl ? (
                    <img
                      src={sample.signedUrl}
                      alt={sample.character_text}
                      className="w-full h-full object-contain p-1 select-none pointer-events-none dark:invert"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
                  )}
                </div>

                {/* Character Indicator */}
                <div className="w-full text-center mt-2 select-none">
                  <span className={`text-base font-bold transition-colors ${
                    sample.status === 'verified'
                      ? 'text-emerald-500 dark:text-emerald-400 font-extrabold'
                      : 'text-stone-400 dark:text-stone-600'
                  }`}
                  title={sample.status === 'verified' ? 'Verified character' : 'Unverified character'}
                  >
                    {sample.character_text}
                  </span>
                </div>
              </motion.div>
            ))}
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
                        className="w-full h-full object-contain p-2 dark:invert"
                        referrerPolicy="no-referrer"
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
                        <Info className="w-3.5 h-3.5" />
                        <span className="text-xs">Verification Status</span>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        selectedSample.status === 'verified' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {selectedSample.status === 'verified' ? 'Verified' : 'Unverified'}
                      </span>
                    </div>

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

                {/* Audit Delete & Verification Controls */}
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
                          {deletingId !== null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                        onClick={() => handleToggleVerify(selectedSample)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ease-out active:scale-97 hover:-translate-y-[1px] shadow-sm ${
                          selectedSample.status === 'verified'
                            ? 'bg-stone-50 dark:bg-stone-900/40 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-850 hover:bg-stone-100 dark:hover:bg-stone-900'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        {selectedSample.status === 'verified' ? 'Mark Unverified' : 'Verify Sample'}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(selectedSample.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-950/30 transition-all duration-200 ease-out active:scale-97 hover:-translate-y-[1px] shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Reject &amp; Delete
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

        {/* Custom Confirmation Modal */}
        <AnimatePresence>
          {confirmModalOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
                onClick={() => setConfirmModalOpen(false)}
              />

              {/* Modal Box */}
              <div className="fixed inset-0 flex items-center justify-center p-4 z-[60] pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="bg-white dark:bg-[#0F0F0F] border border-stone-200 dark:border-stone-900 rounded-2xl p-6 shadow-2xl w-full max-w-sm pointer-events-auto space-y-4"
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      confirmModalAction === 'delete'
                        ? 'bg-red-500/10 text-red-500'
                        : confirmModalAction === 'verify'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-stone-500/10 text-stone-500'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 select-none">
                        Confirm Bulk Action
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed select-none">
                        Are you sure you want to {confirmModalAction === 'delete' ? 'permanently delete' : confirmModalAction === 'verify' ? 'verify' : 'unverify'} <span className="font-bold text-stone-850 dark:text-stone-250">{selectedIds.length}</span> samples at once?
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={handleConfirmAction}
                      disabled={bulkActionLoading}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-colors select-none ${
                        confirmModalAction === 'delete'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200'
                      }`}
                    >
                      {bulkActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, Proceed'}
                    </button>
                    <button
                      onClick={() => setConfirmModalOpen(false)}
                      disabled={bulkActionLoading}
                      className="px-4 py-2 border border-stone-200 dark:border-stone-850 hover:bg-stone-50 dark:hover:bg-stone-900 rounded-xl text-xs font-semibold transition-colors select-none"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AdminShell>
  );
}
