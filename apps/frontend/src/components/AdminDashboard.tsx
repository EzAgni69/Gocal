import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, Trash2, X, Store, Eye, Clock, CheckCircle2, XCircle, AlertTriangle, ChevronDown, Loader2, MapPin, Phone, Mail, Globe, User as UserIcon, Search, Shield, BadgeInfo, LayoutGrid, RotateCcw } from 'lucide-react';
import { Report, ContactCardRequest, CardRequestRejectionReason, Vendor } from '../types';
import { apiClient } from '@/services/apiClient';
import { User, fetchUsers, updateUserRole } from '../services/userServices';
import { fetchVendors, removeVendor, restoreVendor, deleteAdminVendor } from '../services/vendorService';
import debounce from "lodash.debounce";
import { useCallback } from 'react';

type TabType = 'reports' | 'card-requests' | 'users' | 'active-cards';
type CardRequestFilter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

interface PendingRoleChange {
  userId: string;
  userName: string;
  originalRole: string;
  newRole: string;
}

interface AdminDashboardProps {
  reports: Report[];
}

const REJECTION_REASONS: { value: CardRequestRejectionReason; label: string }[] = [
  { value: 'INCOMPLETE_INFO', label: 'Incomplete Information' },
  { value: 'DUPLICATE', label: 'Duplicate Listing' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate Content' },
  { value: 'INVALID_BUSINESS', label: 'Invalid Business' },
  { value: 'OTHER', label: 'Other' },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ reports }) => {
  const [localReports, setLocalReports] = useState(reports);
  const [activeTab, setActiveTab] = useState<TabType>('card-requests');

  // Card requests state
  const [cardRequests, setCardRequests] = useState<ContactCardRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [filter, setFilter] = useState<CardRequestFilter>('PENDING');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<CardRequestRejectionReason>('INCOMPLETE_INFO');
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // User management state
  const [users, setUsers] = useState<User[]>([]);
  const [usersPagination, setUsersPagination] = useState<{ total: number; page: number; totalPages: number; limit: number } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionError, setUserActionError] = useState<string | null>(null);
  const [userActionSuccess, setUserActionSuccess] = useState<string | null>(null);
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const [pendingRoleChanges, setPendingRoleChanges] = useState<Record<string, PendingRoleChange>>({});
  const [committingRoleChanges, setCommittingRoleChanges] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");

  // Vendor management state
  const [activeVendors, setActiveVendors] = useState<Vendor[]>([]);
  const [vendorsPagination, setVendorsPagination] = useState<{ total: number; page: number; totalPages: number; limit: number } | null>(null);
  const [vendorSearchQuery, setVendorSearchQuery] = useState("");
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [vendorsCurrentPage, setVendorsCurrentPage] = useState(1);
  const [vendorToRemove, setVendorToRemove] = useState<Vendor | null>(null);
  const [undoableVendor, setUndoableVendor] = useState<{ id: string, name: string } | null>(null);
  const [undoTimer, setUndoTimer] = useState<number | null>(null);

  useEffect(() => {
    if (activeTab === 'card-requests') {
      fetchCardRequests();
    } else if (activeTab === 'users') {
      loadUsers(usersCurrentPage, userSearchQuery, userRoleFilter, userStatusFilter);
    } else if (activeTab === 'active-cards') {
      loadVendors(vendorsCurrentPage, vendorSearchQuery);
    }
  }, [activeTab, filter, usersCurrentPage, vendorsCurrentPage, userRoleFilter, userStatusFilter]);

  const fetchCardRequests = async () => {
    setLoadingRequests(true);
    try {
      const statusParam = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await apiClient(`/api/card-requests${statusParam}`);
      if (res.ok) {
        const data = await res.json();
        setCardRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch card requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadUsers = async (page: number, search: string, role = '', status = '') => {
    setLoadingUsers(true);
    setUserActionError(null);
    try {
      const isActive = status === 'true' ? true : (status === 'false' ? false : undefined);
      const data = await fetchUsers(page, 20, search, role, isActive);
      setUsers(data.users);
      setUsersPagination(data.pagination);
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserRoleFilter(e.target.value);
    setUsersCurrentPage(1);
  };

  const handleUserStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUserStatusFilter(e.target.value);
    setUsersCurrentPage(1);
  };

  const debouncedUserSearch = useCallback(
    debounce((query: string, role: string, status: string) => {
      setUsersCurrentPage(1);
      loadUsers(1, query, role, status);
    }, 500),
    []
  );

  const handleUserSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserSearchQuery(e.target.value);
    debouncedUserSearch(e.target.value, userRoleFilter, userStatusFilter);
  };

  const handleUserRoleChange = (userId: string, userName: string, originalRole: string, newRole: string) => {
    setUserActionError(null);
    setUserActionSuccess(null);

    // If changing back to original, remove from pending
    if (newRole === originalRole) {
      setPendingRoleChanges(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      return;
    }

    setPendingRoleChanges(prev => ({
      ...prev,
      [userId]: { userId, userName, originalRole, newRole }
    }));
  };

  const handleUndoSingleChange = (userId: string) => {
    setPendingRoleChanges(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const handleDiscardAllChanges = () => {
    setPendingRoleChanges({});
  };

  const handleConfirmAllRoleChanges = async () => {
    setCommittingRoleChanges(true);
    setUserActionError(null);
    const changes = Object.values(pendingRoleChanges);
    let successCount = 0;
    let failCount = 0;

    try {
      // Process updates. Ideal if backend supported batching, but we'll do sequential for now based on available service.
      for (const change of changes) {
        try {
          await updateUserRole(change.userId, change.newRole);
          successCount++;
          // Update local users state for this specific user
          setUsers(prev => prev.map(u => u.id === change.userId ? { ...u, role: change.newRole } : u));
        } catch (err) {
          console.error(`Failed to update role for ${change.userName}:`, err);
          failCount++;
        }
      }

      if (failCount === 0) {
        setUserActionSuccess(`Successfully updated roles for ${successCount} user(s).`);
        setPendingRoleChanges({});
      } else {
        setUserActionError(`Updated ${successCount} users, but ${failCount} failed. Check logs.`);
        // Remove successful ones from pending
        setPendingRoleChanges(prev => {
          const next = { ...prev };
          changes.forEach(c => {
            // This is a bit simplistic, we'd need to track which ones succeeded exactly
            // For now, let's assume we want to keep all to let user retry or discard if any failed
          });
          return next;
        });
      }

      setTimeout(() => {
        setUserActionSuccess(null);
        setUserActionError(null);
      }, 5000);
    } finally {
      setCommittingRoleChanges(false);
    }
  };

  const loadVendors = async (page: number, search: string) => {
    setLoadingVendors(true);
    setUserActionError(null);
    try {
      const data = await fetchVendors(page, 20, search);
      setActiveVendors(data.vendors);
      setVendorsPagination({ ...data.pagination, limit: 20 });
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to fetch vendors');
    } finally {
      setLoadingVendors(false);
    }
  };

  const debouncedVendorSearch = useCallback(
    debounce((query: string) => {
      setVendorsCurrentPage(1);
      loadVendors(1, query);
    }, 500),
    []
  );

  const handleVendorSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVendorSearchQuery(e.target.value);
    debouncedVendorSearch(e.target.value);
  };

  const handleRemoveVendorInitiate = (vendor: Vendor) => {
    setVendorToRemove(vendor);
  };

  const handleRemoveVendorConfirm = async () => {
    if (!vendorToRemove) return;
    
    setActionLoading(true);
    try {
      const result = await deleteAdminVendor(vendorToRemove.id);
      
      const removedVendorInfo = { id: vendorToRemove.id, name: vendorToRemove.name };
      
      // Update local state by removing the vendor
      setActiveVendors(prev => prev.filter(v => v.id !== removedVendorInfo.id));
      
      // Setup undo functionality
      setUndoableVendor(removedVendorInfo);
      setUndoTimer(5);
      
      // Start countdown
      const interval = setInterval(() => {
        setUndoTimer(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      // Clear interval after 5 seconds to remove the undo option
      setTimeout(() => {
        setUndoableVendor(prev => prev?.id === removedVendorInfo.id ? null : prev);
        clearInterval(interval);
      }, 5000);
      
      setVendorToRemove(null);

      if (result.roleDowngraded) {
        setUserActionSuccess(`Successfully removed ${removedVendorInfo.name}. The owner's role has been downgraded to Consumer.`);
      } else {
        setUserActionSuccess(`Successfully removed ${removedVendorInfo.name}.`);
      }
      
      setTimeout(() => {
        setUserActionSuccess(null);
      }, 5000);
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to remove vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUndoRemoval = async () => {
    if (!undoableVendor) return;
    
    setActionLoading(true);
    try {
      await restoreVendor(undoableVendor.id);
      
      // Refresh vendor list
      loadVendors(vendorsCurrentPage, vendorSearchQuery);
      
      setUserActionSuccess(`Successfully restored ${undoableVendor.name}.`);
      setUndoableVendor(null);
      setUndoTimer(null);
      
      setTimeout(() => {
        setUserActionSuccess(null);
      }, 3000);
    } catch (err: any) {
      setUserActionError(err.message || 'Failed to restore vendor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setActionLoading(true);
    setReviewingId(requestId);
    try {
      const res = await apiClient(`/api/card-requests/${requestId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (res.ok) {
        setCardRequests(prev =>
          prev.map(r => r.id === requestId ? { ...r, status: 'APPROVED' as const } : r)
        );
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to approve request');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('Network error while approving');
    } finally {
      setActionLoading(false);
      setReviewingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalId) return;
    setActionLoading(true);
    try {
      const res = await apiClient(`/api/card-requests/${rejectModalId}/review`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: rejectReason,
          rejectionNote: rejectNote || undefined,
        }),
      });
      if (res.ok) {
        setCardRequests(prev =>
          prev.map(r => r.id === rejectModalId ? { ...r, status: 'REJECTED' as const, rejectionReason: rejectReason, rejectionNote: rejectNote } : r)
        );
        setRejectModalId(null);
        setRejectNote('');
        setRejectReason('INCOMPLETE_INFO');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to reject request');
      }
    } catch (err) {
      console.error('Reject error:', err);
      alert('Network error while rejecting');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportAction = (id: string, action: 'Resolved' | 'Dismissed') => {
    setLocalReports(localReports.map(r => r.id === id ? { ...r, status: action } : r));
  };

  const getStatusClasses = (status: string) => {
    if (status === 'Pending' || status === 'PENDING') return 'bg-yellow-100 text-yellow-800';
    if (status === 'Resolved' || status === 'APPROVED') return 'bg-green-100 text-green-800';
    if (status === 'REJECTED') return 'bg-red-100 text-red-800';
    return 'bg-gray-200 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'PENDING') return <Clock className="w-3.5 h-3.5" />;
    if (status === 'APPROVED') return <CheckCircle2 className="w-3.5 h-3.5" />;
    if (status === 'REJECTED') return <XCircle className="w-3.5 h-3.5" />;
    return null;
  };

  return (
    <div className="min-h-screen pt-32 bg-gray-100 px-4 sm:px-6 md:px-8 pb-4 sm:pb-6 md:pb-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-black">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-900">Platform Management & Moderation</p>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 bg-white rounded-lg p-1 w-fit border border-gray-200 shadow-sm">
        <button
          onClick={() => setActiveTab('card-requests')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'card-requests'
              ? 'bg-gold-50 text-gold-700 shadow-sm border border-gold-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Store className="w-4 h-4" />
          Card Requests
          {cardRequests.filter(r => r.status === 'PENDING').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
              {cardRequests.filter(r => r.status === 'PENDING').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'reports'
              ? 'bg-red-50 text-red-700 shadow-sm border border-red-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Reported Cards
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'users'
              ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('active-cards')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            activeTab === 'active-cards'
              ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          Active Cards
          {activeVendors.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full">
              {vendorsPagination?.total || activeVendors.length}
            </span>
          )}
        </button>
      </div>

      {/* Card Requests Tab */}
      {activeTab === 'card-requests' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center">
              <Store className="w-5 h-5 text-gold-500 mr-2 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-black">Contact Card Requests</h2>
            </div>
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as CardRequestFilter)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none focus:border-gold-500 bg-white"
              >
                <option value="ALL">All Requests</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {loadingRequests ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
            </div>
          ) : cardRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Store className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No {filter !== 'ALL' ? filter.toLowerCase() : ''} requests found.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {cardRequests.map((request) => (
                <div key={request.id} className="p-4 sm:p-5 hover:bg-gray-50/50 transition-colors">
                  {/* Main Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-base">{request.businessName}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${getStatusClasses(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full uppercase">
                          {request.planType === 'card_website' ? 'Card + Website' : 'Card Only'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5" />
                          {request.fullName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {request.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5" />
                          {request.category}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Rejection info */}
                      {request.status === 'REJECTED' && request.rejectionReason && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg p-2">
                          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium">{REJECTION_REASONS.find(r => r.value === request.rejectionReason)?.label}</span>
                            {request.rejectionNote && <span className="text-red-500 block mt-0.5">"{request.rejectionNote}"</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {request.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(request.id)}
                            disabled={actionLoading && reviewingId === request.id}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium transition-colors"
                            title="Approve"
                          >
                            {actionLoading && reviewingId === request.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectModalId(request.id); setRejectReason('INCOMPLETE_INFO'); setRejectNote(''); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === request.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Contact Person</span>
                        <p className="text-gray-900 font-medium">{request.fullName}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Phone</span>
                        <p className="text-gray-900 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {request.phone}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Email</span>
                        <p className="text-gray-900 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> {request.email || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Business Name</span>
                        <p className="text-gray-900 font-medium">{request.businessName}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Category</span>
                        <p className="text-gray-900">{request.category}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">City</span>
                        <p className="text-gray-900">{request.city}</p>
                      </div>
                      {request.address && (
                        <div className="sm:col-span-2">
                          <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Full Address</span>
                          <p className="text-gray-900">{request.address}</p>
                        </div>
                      )}
                      {request.shortDescription && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Short Description</span>
                          <p className="text-gray-700">{request.shortDescription}</p>
                        </div>
                      )}
                      {request.fullDescription && (
                        <div className="sm:col-span-2 lg:col-span-3">
                          <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Full Description</span>
                          <p className="text-gray-700">{request.fullDescription}</p>
                        </div>
                      )}
                      {request.subscriptionPlan && (
                        <div>
                          <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Subscription</span>
                          <p className="text-gray-900 font-medium">{request.subscriptionPlan.replace('_', ' ').replace(/^\w/, (c: string) => c.toUpperCase())}</p>
                        </div>
                      )}
                      {request.requester && (
                        <div className="sm:col-span-2 lg:col-span-3 border-t border-gray-200 pt-3 mt-1">
                          <span className="text-gray-400 text-xs uppercase font-semibold block mb-1">Requester Account</span>
                          <p className="text-gray-700 text-xs">
                            {request.requester.name} ({request.requester.email})
                            {request.requester.phone && ` • ${request.requester.phone}`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reports Tab (existing) */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center">
            <ShieldAlert className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-black">Reported Contact Cards</h2>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-900 text-sm uppercase font-bold">
                <tr>
                  <th className="px-6 py-4">Vendor</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {localReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-bold text-gray-900">{report.vendorName}</td>
                    <td className="px-6 py-4">
                      <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">{report.reason}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusClasses(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {report.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleReportAction(report.id, 'Resolved')}
                            className="p-2 bg-green-500 text-white rounded hover:bg-green-600" title="Approve/Keep"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'Dismissed')}
                            className="p-2 bg-red-500 text-white rounded hover:bg-red-600" title="Delete/Ban"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-100">
            {localReports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-black">{report.vendorName}</h3>
                    <span className="inline-block mt-1 bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                      {report.reason}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusClasses(report.status)}`}>
                    {report.status}
                  </span>
                </div>

                {report.status === 'Pending' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReportAction(report.id, 'Resolved')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReportAction(report.id, 'Dismissed')}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {localReports.length === 0 && (
            <div className="p-6 sm:p-8 text-center text-gray-600">All clean. No reports.</div>
          )}
        </div>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/30">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-indigo-600 mr-2 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-black">User Management</h2>
            </div>
            
            {usersPagination && (
              <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                {usersPagination.total} Total Users
              </div>
            )}
          </div>

          {/* Search Header */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative group flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="Search name, phone, or vendor..."
                  value={userSearchQuery}
                  onChange={handleUserSearchChange}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Role:</span>
                  <select
                    value={userRoleFilter}
                    onChange={handleUserRoleFilterChange}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-indigo-500 bg-gray-50 font-medium min-w-[120px]"
                  >
                    <option value="">All Roles</option>
                    <option value="CONSUMER">Consumer</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold whitespace-nowrap">Status:</span>
                  <select
                    value={userStatusFilter}
                    onChange={handleUserStatusFilterChange}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:border-indigo-500 bg-gray-50 font-medium min-w-[120px]"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {userActionError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs">
                <BadgeInfo className="w-4 h-4 flex-shrink-0" />
                <p className="font-medium">{userActionError}</p>
              </div>
            )}
            
            {userActionSuccess && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs animate-fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <p className="font-medium">{userActionSuccess}</p>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Vendor Info</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Role / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                        <p className="text-xs font-semibold animate-pulse">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Shield className="w-10 h-10 text-gray-200" />
                        <p className="text-xs font-medium">No users found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{user.name}</span>
                          <span className="text-[11px] text-gray-500 truncate max-w-[180px]" title={user.email}>{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium">{user.phone || '-'}</td>
                      <td className="px-6 py-4">
                        {user.vendorName ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                            {user.vendorName}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-[10px]">No vendor</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative group">
                            <select
                              value={pendingRoleChanges[user.id]?.newRole || (user.role === 'SUPER_ADMIN' ? 'ADMIN' : user.role)}
                              onChange={(e) => handleUserRoleChange(user.id, user.name, user.role, e.target.value)}
                              className={`
                                px-3 py-1.5 rounded-lg border text-[10px] font-bold bg-white
                                focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer shadow-sm
                                ${pendingRoleChanges[user.id] ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}
                                ${(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') ? 'border-blue-200 text-blue-700 bg-blue-50' : 
                                  user.role === 'VENDOR' ? 'border-orange-200 text-orange-700 bg-orange-50' : 
                                  'border-gray-200 text-gray-700'}
                              `}
                            >
                              <option value="CONSUMER">Consumer</option>
                              <option value="VENDOR">Vendor</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            
                            {pendingRoleChanges[user.id] && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-10 animate-fade-in">
                                {pendingRoleChanges[user.id].originalRole} → {pendingRoleChanges[user.id].newRole}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45"></div>
                              </div>
                            )}
                          </div>

                          {pendingRoleChanges[user.id] && (
                            <button
                              onClick={() => handleUndoSingleChange(user.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                              title="Undo role change"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {usersPagination && usersPagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
              <span className="text-[11px] text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{(usersPagination.page - 1) * usersPagination.limit + 1}</span> to <span className="font-bold text-gray-900">{Math.min(usersPagination.page * usersPagination.limit, usersPagination.total)}</span> of <span className="font-bold text-gray-900">{usersPagination.total}</span> entries
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setUsersCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={usersCurrentPage === 1 || loadingUsers}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setUsersCurrentPage(prev => Math.min(prev + 1, usersPagination.totalPages))}
                  disabled={usersCurrentPage === usersPagination.totalPages || loadingUsers}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Cards Tab */}
      {activeTab === 'active-cards' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/30">
            <div className="flex items-center">
              <LayoutGrid className="w-5 h-5 text-emerald-600 mr-2 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl font-bold text-black">Active Contact Cards</h2>
            </div>
            
            {vendorsPagination && (
              <div className="text-xs font-bold text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                {vendorsPagination.total} Total active cards
              </div>
            )}
          </div>

          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative group max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, city, or contact..."
                value={vendorSearchQuery}
                onChange={handleVendorSearchChange}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
              />
            </div>

            {userActionError && activeTab === 'active-cards' && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs">
                <BadgeInfo className="w-4 h-4 flex-shrink-0" />
                <p className="font-medium">{userActionError}</p>
              </div>
            )}
            
            {userActionSuccess && activeTab === 'active-cards' && (
              <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg flex items-center gap-2 text-xs animate-fade-in justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p className="font-medium">{userActionSuccess}</p>
                </div>
                {undoableVendor && (
                  <button
                    onClick={handleUndoRemoval}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-700 rounded-md hover:bg-emerald-50 text-[11px] font-bold transition-colors ml-4 shadow-sm active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    UNDO ({undoTimer}s)
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Category / City</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {loadingVendors ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                        <p className="text-xs font-semibold animate-pulse">Loading active cards...</p>
                      </div>
                    </td>
                  </tr>
                ) : activeVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <LayoutGrid className="w-10 h-10 text-gray-200" />
                        <p className="text-xs font-medium">No active cards found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{vendor.name}</span>
                          <span className="text-[11px] text-gray-500 truncate max-w-[180px]" title={vendor.address}>{vendor.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold">
                            {vendor.category}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {vendor.city}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-xs font-medium">
                          <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {vendor.phone}</span>
                          {vendor.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> {vendor.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            vendor.verified ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {vendor.verified ? 'Verified' : 'Standard'}
                          </span>
                          {vendor.isPremium && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-700">
                              Premium
                            </span>
                          )}
                          {vendor.planType === 'card_website' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <Globe className="w-2.5 h-2.5" /> Mini Website
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.open(`/vendor/${vendor.id}`, '_blank')}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                            title="View as customer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveVendorInitiate(vendor)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Remove Card / Mini Website"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {vendorsPagination && vendorsPagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/50">
              <span className="text-[11px] text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900">{(vendorsPagination.page - 1) * vendorsPagination.limit + 1}</span> to <span className="font-bold text-gray-900">{Math.min(vendorsPagination.page * vendorsPagination.limit, vendorsPagination.total)}</span> of <span className="font-bold text-gray-900">{vendorsPagination.total}</span> entries
              </span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setVendorsCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={vendorsCurrentPage === 1 || loadingVendors}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setVendorsCurrentPage(prev => Math.min(prev + 1, vendorsPagination.totalPages))}
                  disabled={vendorsCurrentPage === vendorsPagination.totalPages || loadingVendors}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remove Vendor Confirmation Modal */}
      {vendorToRemove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setVendorToRemove(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Remove Contact Card</h3>
                <p className="text-sm text-gray-500">Are you sure you want to remove this vendor?</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                {vendorToRemove.coverImage && (
                  <img src={vendorToRemove.coverImage} className="w-12 h-12 rounded-lg object-cover" alt="" />
                )}
                <div>
                  <h4 className="font-bold text-gray-900">{vendorToRemove.name}</h4>
                  <p className="text-xs text-gray-500">{vendorToRemove.city} • {vendorToRemove.category}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <ul className="text-xs space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Vendor profile and mini-website will be hidden from consumers.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>Existing products and store config will be preserved (soft delete).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>You can undo this action within 5 seconds.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setVendorToRemove(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveVendorConfirm}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRejectModalId(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Reject Request</h3>
                <p className="text-sm text-gray-500">Please select a reason for rejection.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value as CardRequestRejectionReason)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                >
                  {REJECTION_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes (Optional)</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Explain what the applicant needs to fix..."
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-gray-900 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[80px] resize-y"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setRejectModalId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 font-medium text-sm transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sticky Action Footer for Pending Role Changes */}
      {Object.keys(pendingRoleChanges).length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-fit bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center gap-6 z-40 border border-gray-700 animate-slide-up">
          <div className="flex items-center gap-3 border-b md:border-b-0 md:border-r border-gray-700 pb-3 md:pb-0 md:pr-6 w-full md:w-auto">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-bold">{Object.keys(pendingRoleChanges).length} Pending Changes</p>
              <p className="text-[10px] text-gray-400">Review role updates before committing</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={handleDiscardAllChanges}
              disabled={committingRoleChanges}
              className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Discard All
            </button>
            <button
              onClick={handleConfirmAllRoleChanges}
              disabled={committingRoleChanges}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50 min-w-[140px]"
            >
              {committingRoleChanges ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};