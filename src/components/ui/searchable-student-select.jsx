import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, User, X, ChevronDown, Check } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { API_ENDPOINTS } from '@/constants/api-endpoints';

export default function SearchableStudentSelect({ 
  value, 
  onChange, 
  branchId, 
  placeholder,
  label = 'Select Student',
  disabled = false,
  required = false,
  isMulti = false,
  searchByPhone = true,
}) {
  const effectivePlaceholder = placeholder || (searchByPhone ? 'Search by Name, Phone or GR No...' : 'Search by Name or GR No...');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [studentCache, setStudentCache] = useState({}); // Cache for student objects by ID
  const [activeIndex, setActiveIndex] = useState(0);
  const dropdownRef = useRef(null);
  const searchTimeout = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [dropdownStyles, setDropdownStyles] = useState({});

  const scoreStudent = (st, term) => {
    if (!term) return 0;
    const t = term.toLowerCase().trim();
    const rollNo = (st.details?.academic_info?.roll_no || st.details?.academic_info?.rollNumber || st.details?.roll_no || '').toString().toLowerCase().trim();
    const regNo = (st.registration_no || '').toLowerCase().trim();
    const firstName = (st.first_name || '').toLowerCase().trim();
    const lastName = (st.last_name || '').toLowerCase().trim();
    const fullName = `${firstName} ${lastName}`.trim();

    // 1. Exact Roll No match
    if (rollNo === t) return 100;
    // 2. Exact Registration No match or suffix match (e.g. -0052, -52)
    if (regNo === t) return 99;
    if (regNo.endsWith(`-${t.padStart(4, '0')}`)) return 98;
    if (regNo.endsWith(`-${t}`)) return 97;
    // 3. Roll No starts with term
    if (rollNo.startsWith(t)) return 90;
    // 4. Registration number last token starts with term
    const regParts = regNo.split('-');
    if (regParts.length > 0 && regParts[regParts.length - 1].startsWith(t)) return 85;
    // 5. Name exact match
    if (firstName === t || fullName === t) return 80;
    // 6. Name starts with term
    if (firstName.startsWith(t)) return 75;
    if (lastName.startsWith(t)) return 70;
    if (fullName.startsWith(t)) return 65;
    // 7. Contains in Roll or Reg
    if (rollNo.includes(t)) return 55;
    if (regNo.includes(t)) return 50;
    // 8. Contains in name
    if (fullName.includes(t)) return 40;
    return 10;
  };

  const highlightMatch = (text, query, isSelected = false) => {
    if (!text || !query || !query.trim()) return text;
    const q = query.trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = String(text).split(regex);
    if (parts.length <= 1) return text;
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          className={
            isSelected
              ? "font-extrabold text-amber-200 underline underline-offset-2 decoration-amber-300"
              : "font-extrabold text-blue-600 bg-blue-100/70 rounded px-0.5"
          }
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Normalize current value to array of IDs
  const currentIds = useMemo(() => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Derived selected students from cache + currentIds
  const selectedStudents = useMemo(() => {
    return currentIds.map(id => studentCache[id]).filter(Boolean);
  }, [currentIds, studentCache]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          (!menuRef.current || !menuRef.current.contains(e.target))) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle dropdown positioning and scrolling
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const updatePosition = () => {
        if (!dropdownRef.current) return;
        const rect = dropdownRef.current.getBoundingClientRect();
        setDropdownStyles({
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
          zIndex: 99999,
        });
      };
      
      updatePosition();
      
      const handleScroll = (e) => {
        if (menuRef.current && menuRef.current.contains(e.target)) return;
        setIsOpen(false);
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  // Fetch missing students from cache
  useEffect(() => {
    const fetchMissing = async () => {
      const missingIds = currentIds.filter(id => !studentCache[id]);
      if (missingIds.length === 0) return;

      try {
        setLoading(true);
        const fetched = await Promise.all(
          missingIds.map(id => apiClient.get(`${API_ENDPOINTS.SUPER_ADMIN.STUDENTS.LIST}/${id}`))
        );
        
        const newCacheEntries = {};
        fetched.forEach(st => {
          if (st) {
            newCacheEntries[st.id || st._id] = st;
          }
        });

        if (Object.keys(newCacheEntries).length > 0) {
          setStudentCache(prev => ({ ...prev, ...newCacheEntries }));
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMissing();
  }, [currentIds]);

  const fetchRecentStudents = async () => {
    setLoading(true);
    try {
      const params = { recent: 'true', limit: 3, status: 'active' };
      if (branchId) params.branch_id = branchId;
      const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.SEARCH, params);
      const data = Array.isArray(response) ? response : (response.data || []);

      const newCacheEntries = {};
      data.forEach(st => {
        newCacheEntries[st.id || st._id] = st;
      });
      setStudentCache(prev => ({ ...prev, ...newCacheEntries }));
      setStudents(data.slice(0, 3));
    } catch (err) {
      console.error('Error fetching recent students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term) => {
    const cleanTerm = (term || '').trim();
    if (!cleanTerm) {
      fetchRecentStudents();
      return;
    }

    setLoading(true);
    try {
      // Check if user is typing phone / digits / spaces / hyphens / plus without alphabets
      const isPhoneOrNumeric = /^[\d\s\-+()]+$/.test(cleanTerm);
      // Determine if term strictly looks like a GR number with alphabetic prefix (e.g. CAM-2025-0146 or B-1234)
      const isGrSearch = !isPhoneOrNumeric && (/^[a-zA-Z]+-/i.test(cleanTerm) || /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-/i.test(cleanTerm));
      
      let data = [];
      if (isGrSearch) {
        const params = { roll_no: cleanTerm, status: 'active' };
        if (branchId) params.branch_id = branchId;
        if (!searchByPhone) params.search_by_phone = 'false';
        const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.GR_SEARCH, params);
        data = Array.isArray(response) ? response : (response.data || []);
      } else {
        const params = { q: cleanTerm, status: 'active' };
        if (branchId) params.branch_id = branchId;
        if (!searchByPhone) params.search_by_phone = 'false';
        const response = await apiClient.get(API_ENDPOINTS.SUPER_ADMIN.STUDENTS.SEARCH, params);
        data = Array.isArray(response) ? response : (response.data || []);
      }
      
      // Relevance sort on client-side as well
      const sortedData = [...data].sort((a, b) => scoreStudent(b, cleanTerm) - scoreStudent(a, cleanTerm));

      // Update cache with search results
      const newCacheEntries = {};
      sortedData.forEach(st => {
        newCacheEntries[st.id || st._id] = st;
      });
      setStudentCache(prev => ({ ...prev, ...newCacheEntries }));
      
      setStudents(sortedData);
      setActiveIndex(0);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (students.length > 0 ? (prev + 1) % students.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (students.length > 0 ? (prev - 1 + students.length) % students.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (students.length > 0 && students[activeIndex]) {
        handleSelect(students[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setActiveIndex(0);
        if (inputRef.current) inputRef.current.focus();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (searchTerm && searchTerm.trim()) {
      searchTimeout.current = setTimeout(() => {
        handleSearch(searchTerm);
      }, 250);
    } else if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchRecentStudents();
    } else {
      setStudents([]);
    }

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm, isOpen]);

  const handleSelect = (student) => {
    const studentId = student.id || student._id;
    
    // Ensure it's in cache
    if (!studentCache[studentId]) {
      setStudentCache(prev => ({ ...prev, [studentId]: student }));
    }

    if (isMulti) {
      const isAlreadySelected = currentIds.includes(studentId);
      let newIds;
      if (isAlreadySelected) {
        newIds = currentIds.filter(id => id !== studentId);
      } else {
        newIds = [...currentIds, studentId];
      }
      onChange({ target: { value: newIds } });
    } else {
      setIsOpen(false);
      setSearchTerm('');
      onChange({ target: { value: studentId } });
    }
  };

  const handleRemove = (e, studentId) => {
    e.stopPropagation();
    if (isMulti) {
      const newIds = currentIds.filter(id => id !== studentId);
      onChange({ target: { value: newIds } });
    } else {
      onChange({ target: { value: '' } });
    }
  };

  const getStudentName = (st) => `${st.first_name || ''} ${st.last_name || ''}`.trim();
  const getGRNo = (st) => st.details?.academic_info?.roll_no || st.registration_no || 'N/A';

  return (
    <div className="w-full relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div 
        className={`group relative flex items-center min-h-[44px] bg-white border rounded-xl transition-all duration-200 cursor-pointer shadow-sm
          ${disabled ? 'bg-gray-50 cursor-not-allowed border-gray-200 opacity-70' : 'border-gray-200 hover:border-blue-400 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-wrap items-center px-4 py-1.5 gap-2 overflow-hidden">
          {selectedStudents.length === 0 && (
            <div className="flex items-center gap-3">
              <User size={18} className="text-gray-400" />
              <span className="text-sm text-gray-400">{effectivePlaceholder}</span>
            </div>
          )}

          {isMulti ? (
            selectedStudents.map(st => (
              <span key={st.id || st._id} className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-blue-100 shadow-sm animate-in zoom-in-95 duration-100">
                {getStudentName(st)}
                <button 
                  type="button"
                  onClick={(e) => handleRemove(e, st.id || st._id)}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </span>
            ))
          ) : (
            selectedStudents[0] && (
              <div className="flex items-center gap-3 overflow-hidden">
                <User size={18} className="text-blue-500" />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold text-gray-900 leading-tight">
                    {getStudentName(selectedStudents[0])}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
                    GR: {getGRNo(selectedStudents[0])} {searchByPhone && selectedStudents[0].phone ? `• ${selectedStudents[0].phone}` : ''} • {selectedStudents[0].branch?.name || ''}
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        <div className="flex items-center pr-3 gap-2 border-l border-gray-100 ml-2 py-1 h-full">
          {selectedStudents.length > 0 && !disabled && (
            <button
              type="button"
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ target: { value: isMulti ? [] : '' } });
              }}
            >
              <X size={14} strokeWidth={3} />
            </button>
          )}
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} 
          />
        </div>
      </div>

      {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
        <div ref={menuRef} style={dropdownStyles} className="bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-100 max-h-[360px] flex flex-col">
          <div className="p-3 border-b bg-gray-50/70 sticky top-0 z-10 backdrop-blur-sm">
            <div className="relative group flex items-center">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" size={17} />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-10 pr-16 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400 shadow-xs"
                placeholder={searchByPhone ? "Type name, phone or GR number..." : "Type name or GR number..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {loading && (
                  <Loader2 className="animate-spin text-blue-500" size={16} />
                )}
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm('');
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            {searchTerm.trim() && (
              <div className="flex items-center justify-between px-1 pt-2 text-[11px] text-gray-500 font-medium">
                <span>{loading ? 'Searching...' : `${students.length} student${students.length === 1 ? '' : 's'} found`}</span>
                <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                  <span>Press <kbd className="px-1 py-0.5 rounded bg-gray-200 text-gray-700 text-[9px] font-mono">↵</kbd> to select</span>
                </span>
              </div>
            )}
          </div>

          <div ref={listRef} className="max-h-72 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {/* Selected Students Section (Only in Multi Mode) */}
            {isMulti && selectedStudents.length > 0 && !searchTerm && (
              <div className="mb-4">
                <div className="flex items-center justify-between px-3 py-1 mb-1">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Selected ({selectedStudents.length})</span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange({ target: { value: [] } });
                    }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1">
                  {selectedStudents.map((st) => (
                    <div
                      key={`selected-${st.id || st._id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => handleSelect(st)}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                        {(st.first_name?.[0] || 'S').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold truncate">{getStudentName(st)}</span>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-medium opacity-80">GR: {getGRNo(st)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-px bg-gray-100 my-3 mx-2" />
                <span className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Search Results</span>
              </div>
            )}

            {students.length > 0 ? (
              students.map((st, index) => {
                const isSelected = currentIds.includes(st.id || st._id);
                const isFocused = activeIndex === index;
                const rollNoVal = st.details?.academic_info?.roll_no || st.details?.academic_info?.rollNumber || st.details?.roll_no;
                return (
                  <div
                    key={st.id || st._id}
                    data-index={index}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150
                      ${isSelected 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : isFocused
                          ? 'bg-blue-50/80 text-gray-900 border border-blue-200/80' 
                          : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                      }
                    `}
                    onClick={() => handleSelect(st)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                      ${isSelected ? 'bg-white/20 text-white' : 'bg-blue-100/80 text-blue-700'}
                    `}>
                      {(st.first_name?.[0] || 'S').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                          {highlightMatch(getStudentName(st), searchTerm, isSelected)}
                        </span>
                        {isSelected && <Check size={16} strokeWidth={3} className="shrink-0 text-white" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}>
                          GR: {highlightMatch(getGRNo(st), searchTerm, isSelected)}
                        </span>
                        {rollNoVal && String(rollNoVal) !== String(getGRNo(st)) && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            Roll: {highlightMatch(String(rollNoVal), searchTerm, isSelected)}
                          </span>
                        )}
                        {searchByPhone && st.phone && (
                          <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                            • {highlightMatch(st.phone, searchTerm, isSelected)}
                          </span>
                        )}
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                          • {st.branch?.name || 'Branch N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : searchTerm.trim().length >= 1 ? (
              <div className="py-10 flex flex-col items-center justify-center text-gray-400">
                <Search size={32} className="mb-2 opacity-20" />
                <p className="text-sm font-medium">No students found for &quot;{searchTerm}&quot;</p>
                <p className="text-xs text-gray-400 mt-1">Try searching by student name or GR number</p>
              </div>
            ) : !selectedStudents.length || searchTerm ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-400 italic">
                <p className="text-sm">Start typing name or GR number...</p>
              </div>
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
